// ============================================
// Network - GitHub API and raw content fetching
// ============================================

import { CONFIG } from './config.js';
import { getCached, setCached } from './cache.js';

const RAW_BASE = `https://raw.githubusercontent.com/${CONFIG.githubUser}/${CONFIG.githubRepo}/${CONFIG.githubBranch}/`;

/**
 * Fetch raw content from GitHub with caching
 * Uses SHA-based cache invalidation
 */
export async function fetchRaw(path, sha = null) {
    // Try cache first
    const cached = await getCached(path, sha);
    if (cached) {
        console.log(`Cache hit: ${path}`);
        return cached;
    }

    // Fetch from GitHub
    console.log(`Fetching: ${path}`);
    const url = RAW_BASE + path;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
    }

    const content = await response.text();

    // Store in cache
    if (sha) {
        await setCached(path, content, sha);
    }

    return content;
}

/**
 * Fetch GitHub tree (file list) with recursive option
 */
export async function fetchGitHubTree() {
    const url = `https://api.github.com/repos/${CONFIG.githubUser}/${CONFIG.githubRepo}/git/trees/${CONFIG.githubBranch}?recursive=1`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Filter for markdown files only
    const files = data.tree.filter(node =>
        node.type === 'blob' &&
        (node.path.endsWith('.md') || node.path.endsWith('.mdx'))
    );

    return files;
}

/**
 * Prefetch multiple documents in parallel
 * Useful for preloading linked documents
 */
export async function prefetchDocuments(paths, limit = 5) {
    const batch = paths.slice(0, limit);

    const promises = batch.map(async (path) => {
        try {
            await fetchRaw(path);
        } catch (err) {
            console.warn(`Prefetch failed for ${path}:`, err.message);
        }
    });

    await Promise.all(promises);
    console.log(`Prefetched ${batch.length} documents`);
}

/**
 * Check GitHub API rate limit
 */
export async function checkRateLimit() {
    const url = 'https://api.github.com/rate_limit';

    try {
        const response = await fetch(url);
        const data = await response.json();

        return {
            limit: data.rate.limit,
            remaining: data.rate.remaining,
            reset: new Date(data.rate.reset * 1000),
            used: data.rate.limit - data.rate.remaining
        };
    } catch (err) {
        console.warn('Failed to check rate limit:', err);
        return null;
    }
}
