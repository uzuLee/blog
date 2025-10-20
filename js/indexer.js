// ============================================
// Indexer - Meta/Link/Graph Indexing System
// ============================================

export const fileCache = new Map();      // path → raw content string
export const metaCache = new Map();      // path → FileMeta object
export const titleIndex = new Map();     // title/alias/slug → path
export const graphIndex = new Map();     // path → { out:Set<path>, in:Set<path> }

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---/;              // frontmatter block (supports both CRLF and LF)
const WIKI_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;      // [[Title]] or [[Title|Text]]
const MDLINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g;             // [text](target)

/**
 * Extract folder from file path
 */
export function ensureFolder(path) {
    const i = path.lastIndexOf('/');
    return i === -1 ? '' : path.slice(0, i);
}

/**
 * Get slug from filename (remove extension)
 */
export function slugify(name) {
    return name.replace(/\.[^/.]+$/, '');
}

/**
 * Normalize internal href to repo path
 * Returns null for external links (http/https/mailto/#)
 */
export function normalizeInternalHref(baseFolder, href) {
    if (/^(https?:|mailto:|#)/i.test(href)) return null;

    // Remove leading slash
    let p = href.startsWith('/') ? href.slice(1) : href;

    // Handle relative paths
    const stack = baseFolder ? baseFolder.split('/') : [];
    const parts = p.split('/');

    for (const seg of parts) {
        if (!seg || seg === '.') continue;
        if (seg === '..') stack.pop();
        else stack.push(seg);
    }

    return stack.join('/');
}

/**
 * Simple YAML parser for frontmatter
 * Handles basic key:value and arrays
 */
export function parseYAML(src) {
    try {
        const obj = {};
        const lines = src.split(/\r?\n/);
        let currentKey = null;

        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith('#')) continue;

            const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
            if (match) {
                currentKey = match[1];
                const value = match[2].trim();

                if (value.startsWith('[') && value.endsWith(']')) {
                    const arrayContent = value.slice(1, -1).trim();
                    obj[currentKey] = arrayContent ? arrayContent.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')) : [];
                } else if (value !== '') {
                    obj[currentKey] = value.replace(/^["']|["']$/g, '');
                } else {
                    // Key with empty value. Could be a list.
                    // We'll create the array only when we see the first list item.
                    obj[currentKey] = null; // Placeholder
                }
            }
            else if (line.startsWith('- ') && currentKey) {
                const item = line.substring(2).trim().replace(/^["']|["']$/g, '');
                if (item) {
                    // If the current key was a placeholder or not an array, initialize it.
                    if (!Array.isArray(obj[currentKey])) {
                        obj[currentKey] = [];
                    }
                    obj[currentKey].push(item);
                }
            }
        }
        
        // Replace any null placeholders that were not converted to arrays
        for(const key in obj) {
            if(obj[key] === null) {
                obj[key] = '';
            }
        }

        return obj;
    } catch (e) {
        console.error('YAML parse error:', e);
        return null;
    }
}

/**
 * Index all markdown files
 * Phase 1: Extract basic meta from filenames
 * Phase 2: Parse frontmatter for title/aliases/tags
 */
export async function indexFiles(allFiles, fetchRawFn) {
    // Phase 1: Basic metadata from filenames
    for (const f of allFiles) {
        if (!f.path.endsWith('.md') && !f.path.endsWith('.mdx')) continue;

        const folder = ensureFolder(f.path);
        const name = f.path.split('/').pop();
        const slug = slugify(name);

        const meta = {
            path: f.path,
            name,
            folder,
            slug,
            title: slug,
            aliases: [],
            tags: [],
            description: '',
            sha: f.sha || null
        };

        metaCache.set(f.path, meta);
    }

    // Phase 2: Parse frontmatter (parallel)
    const parsePromises = Array.from(metaCache.values()).map(async (meta) => {
        try {
            const raw = await fetchRawFn(meta.path);
            fileCache.set(meta.path, raw);

            // Extract frontmatter
            const fmMatch = FM_RE.exec(raw);
            if (fmMatch) {
                const fm = parseYAML(fmMatch[1]);
                if (fm) {
                    if (fm.title) meta.title = String(fm.title);
                    if (Array.isArray(fm.aliases)) meta.aliases = fm.aliases.map(String);
                    if (Array.isArray(fm.tags)) {
                        meta.tags = fm.tags.map(String);
                    } else if (fm.tags) {
                    }
                    if (fm.description) meta.description = String(fm.description);
                } else {
                }
            } else {
            }

            // If no description, extract first paragraph
            if (!meta.description) {
                const content = raw.replace(FM_RE, '').trim();
                const firstPara = content.split('\n\n')[0];
                meta.description = firstPara.slice(0, 200);
            }

            // Build title index
            titleIndex.set(meta.title.toLowerCase(), meta.path);
            titleIndex.set(meta.slug.toLowerCase(), meta.path);
            for (const alias of meta.aliases) {
                titleIndex.set(alias.toLowerCase(), meta.path);
            }
        } catch (err) {
        }
    });

    await Promise.all(parsePromises);

    return metaCache;
}

/**
 * Resolve wiki link target by title/alias/slug
 * Priority: exact match → same folder match
 */
export function resolveByTitle(currentFolder, titleOrAlias) {
    const key = titleOrAlias.toLowerCase().trim();

    // Global exact match
    if (titleIndex.has(key)) {
        return titleIndex.get(key);
    }

    // Same folder priority search
    for (const meta of metaCache.values()) {
        if (meta.folder !== currentFolder) continue;

        const titleMatch = meta.title.toLowerCase() === key;
        const slugMatch = meta.slug.toLowerCase() === key;
        const aliasMatch = meta.aliases.some(a => a.toLowerCase() === key);

        if (titleMatch || slugMatch || aliasMatch) {
            return meta.path;
        }
    }

    return null;
}

/**
 * Parse all links from a document
 * Returns Set of resolved target paths
 */
export function parseLinksFrom(path) {
    const meta = metaCache.get(path);
    if (!meta) return new Set();

    let raw = fileCache.get(path);
    if (!raw) return new Set();

    // Remove frontmatter
    raw = raw.replace(FM_RE, '');

    const outLinks = new Set();

    // 1) Wiki links [[Title]] or [[Title|Display]]
    for (const match of raw.matchAll(WIKI_RE)) {
        const targetTitle = match[1].trim();
        const resolved = resolveByTitle(meta.folder, targetTitle);
        if (resolved) {
            outLinks.add(resolved);
        }
    }

    // 2) Markdown links [text](path.md)
    for (const match of raw.matchAll(MDLINK_RE)) {
        const href = match[2].trim();
        const normalized = normalizeInternalHref(meta.folder, href);

        if (!normalized) continue; // External link

        // Try exact match
        if (metaCache.has(normalized)) {
            outLinks.add(normalized);
        } else {
            // Try adding .md extension
            const withExt = normalized.endsWith('.md') || normalized.endsWith('.mdx')
                ? normalized
                : `${normalized}.md`;
            if (metaCache.has(withExt)) {
                outLinks.add(withExt);
            }
        }
    }

    return outLinks;
}

/**
 * Build graph index with optional scope
 * scope: { type: 'global' } | { type: 'folder', folder: 'path' }
 */
export function buildGraph(scope = { type: 'global' }) {
    graphIndex.clear();

    // Initialize nodes within scope
    for (const meta of metaCache.values()) {
        const inScope = scope.type === 'global'
            || meta.folder === scope.folder
            || meta.folder.startsWith(scope.folder + '/');

        if (inScope) {
            graphIndex.set(meta.path, { out: new Set(), in: new Set() });
        }
    }

    // Build edges
    for (const path of graphIndex.keys()) {
        const outLinks = parseLinksFrom(path);

        for (const target of outLinks) {
            // Only create edge if target is in scope
            if (!graphIndex.has(target)) continue;

            graphIndex.get(path).out.add(target);
            graphIndex.get(target).in.add(path);
        }
            }
        
            return graphIndex;}

/**
 * Get backlinks for a document
 */
export function getBacklinks(path) {
    const node = graphIndex.get(path);
    return node ? Array.from(node.in) : [];
}

/**
 * Get outgoing links for a document
 */
export function getOutlinks(path) {
    const node = graphIndex.get(path);
    return node ? Array.from(node.out) : [];
}
