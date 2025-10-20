// ============================================ 
// UZU Notes - Main Application (v3)
// ============================================ 

import { CONFIG } from './config.js';
import { fetchGitHubTree, fetchRaw, prefetchDocuments } from './net.js';
import { initCache } from './cache.js';
import {
    indexFiles,
    metaCache,
    fileCache,
    titleIndex,
    graphIndex,
    buildGraph,
    getBacklinks,
    resolveByTitle,
} from './indexer.js';

// ============================================ 
// Library Check
// ============================================ 
const checkLibraries = () => {
    return typeof showdown !== 'undefined' &&
           typeof FlexSearch !== 'undefined' &&
           typeof THREE !== 'undefined' &&
           typeof ForceGraph3D !== 'undefined' &&
           typeof SpriteText !== 'undefined' &&
           typeof cytoscape !== 'undefined';
};

// ============================================ 
// State
// ============================================ 
const state = {
    allFiles: [],
    currentPath: null,
    currentFolder: null,
    searchIndex: null,
    cy: null,
    forceGraph: null,
    graphViewMode: '3d', // '2d' or '3d'
    converter: null,
    showQuickViewTimeout: null,
    hideQuickViewTimeout: null,
    isQuickViewVisible: false,
    currentGraphData: null,
    timeUpdater: null
};

// ============================================ 
// DOM Elements
// ============================================ 
const $ = {
    commandInput: document.getElementById('command-input'),
    commandResults: document.getElementById('command-results'),
    fileTree: document.getElementById('file-tree'),
    placeholder: document.getElementById('placeholder'),
    document: document.getElementById('document'),
    folderView: document.getElementById('folder-view'),
    docTitle: document.getElementById('doc-title'),
    docContent: document.getElementById('doc-content'),
    docTags: document.getElementById('doc-tags'),
    breadcrumbs: document.getElementById('breadcrumbs'),
    backlinks: document.getElementById('backlinks'),
    toc: document.getElementById('toc'),
    status: document.getElementById('status'),
    btnTheme: document.getElementById('btn-theme'),
    btnGraph: document.getElementById('btn-graph'),
    graphModal: document.getElementById('graph-modal'),
    graphContainer: document.getElementById('graph-container'),
    graphSearch: document.getElementById('graph-search'),
    closeGraph: document.getElementById('close-graph'),
    homeLink: document.getElementById('home-link'),
    quickView: document.getElementById('quick-view-popup'),
    quickViewTitle: document.getElementById('quick-view-title'),
    quickViewBody: document.getElementById('quick-view-body'),
    contentArea: document.getElementById('content-area'),
    homePageContent: document.getElementById('home-page-content'),
    resultsPage: document.getElementById('results-page')
};

// ============================================ 
// Showdown Setup with Wiki Link Extension
// ============================================ 
function initShowdown() {
    showdown.extension('wikilinks', function() {
        return [{
            type: 'lang',
            regex: /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
            replace: function(match, target, display) {
                const text = display || target;
                const meta = metaCache.get(state.currentPath);
                const currentFolder = meta ? meta.folder : '';

                let resolved = null;

                // Check if target is a relative/absolute path
                if (target.includes('/') || target.startsWith('.')) {
                    // Resolve relative path
                    const resolvedPath = resolveRelativePath(state.currentPath || '', target);

                    // Try with current extension
                    if (metaCache.has(resolvedPath)) {
                        resolved = resolvedPath;
                    }
                    // Try adding .md
                    else if (metaCache.has(resolvedPath + '.md')) {
                        resolved = resolvedPath + '.md';
                    }
                    // Try adding .mdx
                    else if (metaCache.has(resolvedPath + '.mdx')) {
                        resolved = resolvedPath + '.mdx';
                    }
                }

                // If not resolved as path, try resolving by title
                if (!resolved) {
                    resolved = resolveByTitle(currentFolder, target);
                }

                if (resolved) {
                    const targetMeta = metaCache.get(resolved);
                    const linkText = display || (targetMeta ? targetMeta.title : target);
                    return `<a href="#${encodeURIComponent(resolved)}" class="wiki-link" data-path="${resolved}">${linkText}</a>`;
                }

                return `<span class="unresolved-link" title="Unresolved: ${target}">${text}</span>`;
            }
        }];
    });

    state.converter = new showdown.Converter({
        ghCompatibleHeaderId: true,
        simpleLineBreaks: true,
        strikethrough: true,
        tables: true,
        tasklists: true,
        extensions: ['wikilinks']
    });
}

// ============================================
// Utilities
// ============================================
function updateStatus(msg) {
    if ($.status) $.status.textContent = msg;
}

function resolveRelativePath(basePath, relativePath) {
    // If relativePath is absolute, return as is
    if (relativePath.startsWith('/')) {
        return relativePath.slice(1);
    }

    // Get directory of base path
    const baseDir = basePath.includes('/') ? basePath.substring(0, basePath.lastIndexOf('/')) : '';

    // Split relative path into segments
    const segments = relativePath.split('/');
    const baseSegments = baseDir ? baseDir.split('/') : [];

    for (const segment of segments) {
        if (segment === '..') {
            baseSegments.pop();
        } else if (segment !== '.' && segment !== '') {
            baseSegments.push(segment);
        }
    }

    return baseSegments.join('/');
}

// ============================================ 
// Home Page & Folder Page
// ============================================ 
const THEMED_QUOTES = {
    morning: [ "A new light for old thoughts.", "Clarity wakes slowly." ],
    afternoon: [ "Precision is poetry.", "Logic breathes through lines." ],
    evening: [ "Shadows are another way of seeing.", "The syntax of twilight." ],
    night: [ "A constellation of ideas.", "Thought has no shadow." ]
};

function getThemedQuote() {
    const hour = new Date().getHours();
    let period;
    if (hour >= 5 && hour < 12) period = 'morning';
    else if (hour >= 12 && hour < 17) period = 'afternoon';
    else if (hour >= 17 && hour < 22) period = 'evening';
    else period = 'night';
    const quotes = THEMED_QUOTES[period];
    return quotes[Math.floor(Math.random() * quotes.length)];
}

function getMostReferencedDoc() {
    let maxRefCount = -1;
    let mostRefdDoc = null;
    for (const doc of metaCache.values()) {
        const refCount = getBacklinks(doc.path).length;
        if (refCount > maxRefCount) {
            maxRefCount = refCount;
            mostRefdDoc = doc;
        }
    }
    return mostRefdDoc;
}

function generateCalendarGrid(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '<div class="calendar-grid">';
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
        html += `<div class="calendar-weekday">${day}</div>`;
    });

    for (let i = 0; i < firstDay; i++) {
        html += '<div></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
        html += `<div class="calendar-day ${isToday ? 'is-today' : ''}">${day}</div>`;
    }

    html += '</div>';
    return html;
}

function renderHomePage() {
    const allDocs = Array.from(metaCache.values());
    const docCount = allDocs.length;
    const totalLinks = Array.from(graphIndex.values()).reduce((acc, node) => acc + node.out.size, 0);
    const allTags = allDocs.flatMap(doc => doc.tags || []);
    const uniqueTags = [...new Set(allTags)];
    const avgLinks = (totalLinks / docCount || 0).toFixed(1);

    const quote = getThemedQuote();
    const calendarGrid = generateCalendarGrid();

    // Get recent files
    const recentFiles = getRecentFiles()
        .map(item => {
            const meta = metaCache.get(item.path);
            return meta ? { ...item, meta } : null;
        })
        .filter(item => item !== null)
        .slice(0, 8);

    const statsFunctions = [
        () => `Currently tracking ${docCount} nodes connected by ${totalLinks} edges.`,
        () => {
            const mostRefd = getMostReferencedDoc();
            return mostRefd ? `The most referenced node is "${mostRefd.title}".` : `Your knowledge base is growing.`;
        },
        () => `A total of ${uniqueTags.length} unique tags are being used.`,
        () => `The average number of links per node is ${avgLinks}.`
    ];
    const meaningfulSubtitle = statsFunctions[Math.floor(Math.random() * statsFunctions.length)]();

    const html = `
        <div class="home-dashboard">
            <!-- Hero Section -->
            <div class="home-card hero-card">
                <h1>UZU Notes</h1>
                <p>${meaningfulSubtitle}</p>
            </div>

            <!-- Stats Section -->
            <div class="home-card stats-card">
                <div class="home-card-header">
                    <span class="icon">🛰️</span>
                    <h3>Network Stats</h3>
                </div>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="value">${docCount}</span>
                        <span class="label">Documents</span>
                    </div>
                    <div class="stat-item">
                        <span class="value">${totalLinks}</span>
                        <span class="label">Connections</span>
                    </div>
                </div>
            </div>

            <!-- Quote Section -->
            <div class="home-card quote-card">
                <div class="home-card-header">
                    <span class="icon">📜</span>
                    <h3>Quote of the Moment</h3>
                </div>
                <p>"${quote}"</p>
            </div>

            <!-- Time Section (Left Top) -->
            <div class="home-card time-card">
                <div class="home-card-header">
                    <span class="icon">⏱️</span>
                    <h3>Local Time</h3>
                </div>
                <div id="home-time"></div>
            </div>

            <!-- Calendar Section (Right, 2 rows) -->
            <div class="home-card calendar-card">
                <div class="home-card-header">
                    <span class="icon">📅</span>
                    <h3>Calendar</h3>
                </div>
                <div class="calendar-grid-container">
                    ${calendarGrid}
                </div>
            </div>

            <!-- Recent Files Section -->
            <div class="home-card recent-card">
                <div class="home-card-header">
                    <span class="icon">📖</span>
                    <h3>Recent Files</h3>
                </div>
                <div class="recent-files-list">
                    ${recentFiles.length > 0 ? recentFiles.map(item => `
                        <div class="recent-file-item" data-path="${item.path}">
                            <span class="recent-file-icon">📄</span>
                            <div class="recent-file-info">
                                <div class="recent-file-title">${item.meta.title}</div>
                                <div class="recent-file-time">${getTimeAgo(item.timestamp)}</div>
                            </div>
                        </div>
                    `).join('') : '<p style="color: var(--c-text-tertiary); text-align: center; padding: var(--sp-4);">No recent files</p>'}
                </div>
            </div>

            <!-- Tags Section (Left Bottom, 2 rows) -->
            <div class="home-card tags-card">
                <div class="home-card-header">
                    <span class="icon">🏷️</span>
                    <h3>Tags</h3>
                </div>
                <div class="tag-cloud-container">
                    ${uniqueTags.length > 0 ? uniqueTags.map(tag => `<a class="tag-cloud-item">${tag}</a>`).join('') : '<p style="color: var(--c-text-tertiary);">No tags found</p>'}
                </div>
            </div>
        </div>
    `;

    $.homePageContent.innerHTML = html;

    // Bind tag click events
    $.homePageContent.querySelectorAll('.tag-cloud-item').forEach(item => {
        item.addEventListener('click', () => {
            const tag = item.textContent;
            const results = Array.from(metaCache.values())
                .filter(meta => meta.tags && meta.tags.some(t => t.toLowerCase() === tag.toLowerCase()))
                .map(meta => ({ doc: meta }));
            renderTagResultsPage(tag, results);
        });
    });

    // Bind recent file click events
    $.homePageContent.querySelectorAll('.recent-file-item').forEach(item => {
        item.addEventListener('click', () => {
            openDocument(item.dataset.path);
        });
    });
}

function showHome() {
    state.currentPath = null;
    state.currentFolder = null;
    if(state.timeUpdater) {
        clearInterval(state.timeUpdater);
        state.timeUpdater = null;
    }

    $.placeholder.style.display = 'none';
    $.document.style.display = 'none';
    $.folderView.style.display = 'none';
    $.homePageContent.style.display = 'block';
    $.resultsPage.style.display = 'none';

    renderHomePage();
    state.timeUpdater = setInterval(updateTime, 1000);
    updateTime();

    updateActiveFileInList();
    $.toc.innerHTML = '<div class="toc-placeholder">Select a document to see its table of contents.</div>';

    window.location.hash = '';
    updateStatus('Ready');
}

function updateTime() {
    const now = new Date();
    const timeEl = document.getElementById('home-time');
    if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }
}

function renderFolderPage(folderPath) {
    const filesInFolder = Array.from(metaCache.values()).filter(doc => 
        doc.path.startsWith(folderPath + '/') && !doc.path.substring(folderPath.length + 1).includes('/')
    );
    const folderName = folderPath.split('/').pop();

    const filesHTML = filesInFolder.length > 0
        ? filesInFolder.map(doc => `
            <div class="recent-file-item" data-path="${doc.path}">
                <span class="recent-file-icon">📄</span>
                <div class="recent-file-info">
                    <div class="recent-file-title">${doc.title}</div>
                    <div class="recent-file-time">${doc.path}</div>
                </div>
            </div>
        `).join('')
        : '<p style="color: var(--c-text-tertiary); text-align: center; padding: var(--sp-4);">No documents in this folder.</p>';

    const html = `
        <div class="home-dashboard">
            <div class="home-card hero-card">
                <h1><span class="icon" style="font-size: 2.5rem; vertical-align: middle;">📁</span> ${folderName}</h1>
                <p>${filesInFolder.length} documents in this folder.</p>
            </div>
            <div class="home-card recent-card" style="grid-column: 1 / -1;">
                <div class="home-card-header">
                    <span class="icon">📄</span>
                    <h3>Documents</h3>
                </div>
                <div class="recent-files-list">
                    ${filesHTML}
                </div>
            </div>
        </div>
    `;
    $.folderView.innerHTML = html;

    $.folderView.querySelectorAll('.recent-file-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            openDocument(item.dataset.path);
        });
    });
}

function showFolderPage(folderPath) {
    state.currentPath = null;
    state.currentFolder = folderPath;
    if(state.timeUpdater) {
        clearInterval(state.timeUpdater);
        state.timeUpdater = null;
    }

    $.document.style.display = 'none';
    $.placeholder.style.display = 'none';
    $.homePageContent.style.display = 'none';
    $.folderView.style.display = 'block';
    $.resultsPage.style.display = 'none';

    renderFolderPage(folderPath);
    updateActiveFileInList();
    $.toc.innerHTML = '<div class="toc-placeholder">Select a document to see its table of contents.</div>';

    updateStatus(`Viewing folder: ${folderPath}`);
}

// ============================================
// Search & Tag Results Page
// ============================================
function renderSearchResultsPage(results, query) {
    const resultsHTML = results.length > 0 ? results.map(item => {
        const meta = item.doc || item;
        return `
            <div class="recent-file-item" data-path="${meta.path}">
                <span class="recent-file-icon">📄</span>
                <div class="recent-file-info">
                    <div class="recent-file-title">${meta.title}</div>
                    <div class="recent-file-time">${meta.path}</div>
                </div>
            </div>
        `;
    }).join('') : '<p style="color: var(--c-text-tertiary); text-align: center; padding: var(--sp-4);">No documents found.</p>';

    const html = `
        <div class="home-dashboard">
            <div class="home-card hero-card">
                <h1>Search Results</h1>
                <p>Found ${results.length} documents for "${query}"</p>
            </div>
            <div class="home-card recent-card" style="grid-column: 1 / -1;">
                <div class="home-card-header">
                    <span class="icon">📄</span>
                    <h3>Documents</h3>
                </div>
                <div class="recent-files-list">
                    ${resultsHTML}
                </div>
            </div>
        </div>
    `;

    $.resultsPage.innerHTML = html;

    $.resultsPage.querySelectorAll('.recent-file-item').forEach(item => {
        item.addEventListener('click', () => {
            openDocument(item.dataset.path);
        });
    });

    showResultsPage();
}

function renderTagResultsPage(tag, results) {
    const resultsHTML = results.length > 0 ? results.map(item => {
        const meta = item.doc || item;
        const matchTypeLabel = item.matchType === 'exact' ? 'Exact Match' : 'Partial Match';
        const matchedTagInfo = `<div class="cmd-matched-tag">${matchTypeLabel}: #${item.matchedTag}</div>`;

        return `
            <div class="recent-file-item" data-path="${meta.path}">
                <span class="recent-file-icon">📄</span>
                <div class="recent-file-info">
                    <div class="recent-file-title">${meta.title}</div>
                    ${matchedTagInfo}
                    <div class="recent-file-time">${meta.path}</div>
                </div>
            </div>
        `;
    }).join('') : '<p style="color: var(--c-text-tertiary); text-align: center; padding: var(--sp-4);">No documents found.</p>';

    const html = `
        <div class="home-dashboard">
            <div class="home-card hero-card">
                <h1>#${tag}</h1>
                <p>Found ${results.length} documents with this tag</p>
            </div>
            <div class="home-card recent-card" style="grid-column: 1 / -1;">
                <div class="home-card-header">
                    <span class="icon">📄</span>
                    <h3>Documents</h3>
                </div>
                <div class="recent-files-list">
                    ${resultsHTML}
                </div>
            </div>
        </div>
    `;
    $.resultsPage.innerHTML = html;

    $.resultsPage.querySelectorAll('.recent-file-item').forEach(item => {
        item.addEventListener('click', () => {
            openDocument(item.dataset.path);
        });
    });

    showResultsPage();
}

function showResultsPage() {
    state.currentPath = null;
    state.currentFolder = null;
    if(state.timeUpdater) {
        clearInterval(state.timeUpdater);
        state.timeUpdater = null;
    }

    $.placeholder.style.display = 'none';
    $.document.style.display = 'none';
    $.folderView.style.display = 'none';
    $.homePageContent.style.display = 'none';
    $.resultsPage.style.display = 'block';

    updateActiveFileInList();
    $.toc.innerHTML = '<div class="toc-placeholder"></div>';
    updateStatus('Viewing search results');
}

// ============================================ 
// File Tree Rendering
// ============================================ 
function renderFileTree() {
    const tree = buildTree(Array.from(metaCache.values()));
    $.fileTree.innerHTML = renderTreeHTML(tree);

    $.fileTree.querySelectorAll('.file-item').forEach(item => {
        const path = item.dataset.path;
        item.addEventListener('click', () => openDocument(path));
        item.addEventListener('mouseenter', (e) => handleQuickViewShow(e, path));
        item.addEventListener('mouseleave', handleQuickViewHide);
    });

    $.fileTree.querySelectorAll('.btn-folder-graph').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openFolderGraph(e.currentTarget.dataset.folderPath);
        });
    });

    $.fileTree.querySelectorAll('.folder-name-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showFolderPage(e.currentTarget.dataset.folderPath);
        });
    });
}

function buildTree(files) {
    const root = { name: '', path: '', children: {}, files: [] };
    for (const file of files) {
        const parts = file.path.split('/');
        let current = root;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current.children[part]) {
                const folderPath = parts.slice(0, i + 1).join('/');
                current.children[part] = { name: part, path: folderPath, children: {}, files: [] };
            }
            current = current.children[part];
        }
        current.files.push(file);
    }
    return root;
}

function renderTreeHTML(node, level = 0) {
    let html = '';
    const sortedChildren = Object.entries(node.children).sort((a, b) => a[0].localeCompare(b[0]));

    for (const [name, child] of sortedChildren) {
        html += `
            <details class="folder" ${level === 0 ? 'open' : ''}>
                <summary style="padding-left: calc(var(--sp-3) + ${level * 20}px)">
                    <span class="folder-icon">📁</span>
                    <a href="#" class="folder-name-link" data-folder-path="${child.path}">${name}</a>
                    <button class="btn ghost btn-folder-graph" data-folder-path="${child.path}" title="Open graph for ${name}">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="5" cy="5" r="2.5" fill="currentColor"/><circle cx="15" cy="5" r="2.5" fill="currentColor"/><circle cx="5" cy="15" r="2.5" fill="currentColor"/><circle cx="15" cy="15" r="2.5" fill="currentColor"/><path d="M7.5 5h5M7.5 15h5M5 7.5v5M15 7.5v5" stroke="currentColor" stroke-width="2"/></svg>
                    </button>
                </summary>
                ${renderTreeHTML(child, level + 1)}
            </details>
        `;
    }

    const sortedFiles = node.files.sort((a, b) => a.title.localeCompare(b.title));
    for (const file of sortedFiles) {
        html += `
            <div class="file-item" data-path="${file.path}" style="padding-left: calc(var(--sp-5) + ${level * 20}px)">
                <span class="file-icon">📄</span>
                <span>${file.title}</span>
            </div>
        `;
    }
    return html;
}

function updateActiveFileInList() {
    // Update file items
    $.fileTree.querySelectorAll('.file-item').forEach(el => {
        el.classList.remove('active');
        if (el.dataset.path === state.currentPath) {
            el.classList.add('active');
        }
    });

    // Update folder items
    $.fileTree.querySelectorAll('.folder-name-link').forEach(el => {
        el.classList.remove('active');
        el.closest('summary')?.classList.remove('active');
        if (el.dataset.folderPath === state.currentFolder) {
            el.classList.add('active');
            el.closest('summary')?.classList.add('active');
        }
    });
}

// ============================================
// Recent Files Tracking (LocalStorage)
// ============================================
function addToRecentFiles(path) {
    const MAX_RECENT = 10;
    let recentFiles = JSON.parse(localStorage.getItem('recentFiles') || '[]');

    // Remove if already exists
    recentFiles = recentFiles.filter(item => item.path !== path);

    // Add to beginning with timestamp
    recentFiles.unshift({
        path: path,
        timestamp: Date.now()
    });

    // Keep only MAX_RECENT items
    recentFiles = recentFiles.slice(0, MAX_RECENT);

    localStorage.setItem('recentFiles', JSON.stringify(recentFiles));
}

function getRecentFiles() {
    const recentFiles = JSON.parse(localStorage.getItem('recentFiles') || '[]');
    return recentFiles;
}

function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
}

// ============================================
// Quick View
// ============================================
function handleQuickViewShow(event, path) {
    if (path === state.currentPath) return;
    clearTimeout(state.hideQuickViewTimeout);
    clearTimeout(state.showQuickViewTimeout);

    state.showQuickViewTimeout = setTimeout(async () => {
        const meta = metaCache.get(path);
        if (!meta) return;

        $.quickView.classList.add('visible');
        state.isQuickViewVisible = true;

        $.quickViewTitle.querySelector('.text').textContent = meta.title;
        $.quickViewBody.innerHTML = '<div class="quick-view-loading">...</div>';

        let content = fileCache.get(path);
        if (!content) {
            content = await fetchRaw(path, meta.sha);
            fileCache.set(path, content);
        }

        const displayContent = content.replace(/^---[\s\S]*?---/, '').trim();
        const previewHtml = state.converter.makeHtml(displayContent.substring(0, 3000) + (displayContent.length > 3000 ? '...' : ''));
        $.quickViewBody.innerHTML = previewHtml;

        $.quickView.onclick = () => {
            openDocument(path);
            handleQuickViewHide(true);
        };
    }, 500);
}

function handleQuickViewHide(immediate = false) {
    clearTimeout(state.showQuickViewTimeout);
    const delay = immediate ? 0 : 300;
    state.hideQuickViewTimeout = setTimeout(() => {
        if (state.isQuickViewVisible) {
            $.quickView.classList.remove('visible');
            state.isQuickViewVisible = false;
            $.quickView.onclick = null;
        }
    }, delay);
}

// ============================================ 
// Document Rendering
// ============================================ 
async function openDocument(path) {
    handleQuickViewHide();
    if (state.currentPath === path) return;

    const meta = metaCache.get(path);
    if (!meta) {
        console.error(`Document not found: ${path}`);
        return;
    }

    $.contentArea.classList.add('fade-out');

    setTimeout(async () => {
        state.currentPath = path;
        state.currentFolder = null;
        $.placeholder.style.display = 'none';
        $.folderView.style.display = 'none';
        $.homePageContent.style.display = 'none';
        $.resultsPage.style.display = 'none';
        $.document.style.display = 'block';
        updateActiveFileInList();

        // Add to recent files
        addToRecentFiles(path);

        let content = fileCache.get(path);
        if (!content) {
            updateStatus(`Loading ${meta.title}...`);
            content = await fetchRaw(path, meta.sha);
            fileCache.set(path, content);
        }

        const displayContent = content.replace(/^---[\s\S]*?---/, '').trim();
        $.docTitle.textContent = meta.title;
        $.docContent.innerHTML = state.converter.makeHtml(displayContent);

        $.docContent.querySelectorAll('a[data-path]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                openDocument(link.dataset.path);
            });
            link.addEventListener('mouseenter', (e) => handleQuickViewShow(e, link.dataset.path));
            link.addEventListener('mouseleave', handleQuickViewHide);
        });

        $.docTags.innerHTML = meta.tags && meta.tags.length > 0
            ? meta.tags.map(tag => `<span class="tag" data-tag="${tag}">${tag}</span>`).join('')
            : '';

        // Add click events to tags
        $.docTags.querySelectorAll('.tag').forEach(tagEl => {
            tagEl.addEventListener('click', () => {
                const tag = tagEl.dataset.tag;
                const results = Array.from(metaCache.values())
                    .filter(meta => meta.tags && meta.tags.some(t => t.toLowerCase() === tag.toLowerCase()))
                    .map(meta => ({ doc: meta }));
                renderTagResultsPage(tag, results);
            });
        });

        renderBreadcrumbs(path);
        renderBacklinks(path);
        renderTOC();
        
        // Initial highlight for short documents
        requestAnimationFrame(updateTocHighlight);

        if (typeof Prism !== 'undefined') {
            Prism.highlightAllUnder($.docContent);
        }

        window.location.hash = encodeURIComponent(path);
        updateStatus(`Viewing: ${meta.title}`);

        const outlinks = Array.from(graphIndex.get(path)?.out || []);
        if (outlinks.length > 0) {
            prefetchDocuments(outlinks, 5);
        }

        $.contentArea.classList.remove('fade-out');
        $.contentArea.scrollTop = 0;
    }, 200);
}

function renderBreadcrumbs(path) {
    const parts = path.replace(/\.mdx?$/, '').split('/');
    let cumulativePath = '';
    const homeCrumb = '<a href="#" class="crumb" data-path="home">Home</a>';
    
    const pathCrumbs = parts.map((part, i) => {
        const isLast = i === parts.length - 1;
        if (isLast) {
            return `<span class="crumb current">${part}</span>`;
        } else {
            cumulativePath += (cumulativePath ? '/' : '') + part;
            return `<a href="#" class="crumb" data-path="folder/${cumulativePath}">${part}</a>`;
        }
    });

    $.breadcrumbs.innerHTML = [homeCrumb, ...pathCrumbs].join(' <span class="crumb-sep">/</span> ');
    
    $.breadcrumbs.querySelectorAll('a.crumb').forEach(crumb => {
        crumb.addEventListener('click', e => {
            e.preventDefault();
            const target = e.target.dataset.path;
            if (target === 'home') {
                showHome();
            } else if (target.startsWith('folder/')) {
                showFolderPage(target.replace('folder/', ''));
            }
        });
    });
}


function renderBacklinks(path) {
    const backlinks = getBacklinks(path);
    if (backlinks.length === 0) {
        $.backlinks.innerHTML = '';
        return;
    }

    let html = '<h3>Backlinks</h3><ul class="backlinks-list">';
    for (const inPath of backlinks) {
        const meta = metaCache.get(inPath);
        if (meta) {
            html += `<li><a href="#${encodeURIComponent(inPath)}" class="backlink" data-doc-path="${inPath}">${meta.title}</a></li>`;
        }
    }
    html += '</ul>';
    $.backlinks.innerHTML = html;

    $.backlinks.querySelectorAll('a[data-doc-path]').forEach(link => {
        const docPath = link.getAttribute('data-doc-path');
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openDocument(docPath);
        });
        link.addEventListener('mouseenter', (e) => handleQuickViewShow(e, docPath));
        link.addEventListener('mouseleave', handleQuickViewHide);
    });
}

function renderTOC() {
    const headings = $.docContent.querySelectorAll('h1, h2, h3, h4');
    if (headings.length === 0) {
        $.toc.innerHTML = '<div class="toc-placeholder">No table of contents for this document.</div>';
        return;
    }

    let html = '<ul class="toc-list">';
    headings.forEach(h => {
        const level = parseInt(h.tagName[1]);
        const text = h.textContent;
        const id = h.id || text.toLowerCase().replace(/[^\w]+/g, '-');
        h.id = id;
        html += `<li class="toc-item toc-level-${level}"><a href="#${id}" data-scroll-to="${id}">${text}</a></li>`;
    });
    html += '</ul>';
    $.toc.innerHTML = html;

    $.toc.querySelectorAll('a[data-scroll-to]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetEl = document.getElementById(link.dataset.scrollTo);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function updateTocHighlight() {
    const headings = Array.from($.docContent.querySelectorAll('h1, h2, h3, h4'));
    const tocLinks = Array.from($.toc.querySelectorAll('a'));
    const contentEl = $.contentArea;

    const isScrollable = contentEl.scrollHeight > contentEl.clientHeight;
    if (!isScrollable) {
        tocLinks.forEach(link => link.classList.remove('active'));
        return;
    }

    if (!headings.length) return;

    const scrollBottom = contentEl.scrollTop + contentEl.clientHeight;
    const scrollHeight = contentEl.scrollHeight;

    // If scrolled to the very top, always highlight the first item.
    if (contentEl.scrollTop < 5) { 
        tocLinks.forEach((link, index) => {
            link.classList.toggle('active', index === 0);
        });
        return;
    }

    // If scrolled to the very bottom, highlight the last item.
    if (scrollHeight - scrollBottom < 5) {
        const lastHeading = headings[headings.length - 1];
        const activeId = lastHeading ? lastHeading.id : null;
        tocLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`);
        });
        return;
    }

    // Standard highlighting for scrolling in the middle.
    const threshold = contentEl.getBoundingClientRect().top + 150;
    let activeHeading = null;

    for (let i = headings.length - 1; i >= 0; i--) {
        if (headings[i].getBoundingClientRect().top < threshold) {
            activeHeading = headings[i];
            break;
        }
    }

    const activeId = activeHeading ? activeHeading.id : null;
    tocLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`);
    });
}

// ============================================ 
// Search & Commands
// ============================================ 
function initSearch() {
    state.searchIndex = new FlexSearch.Document({
        document: { id: 'path', index: ['title', 'content'], store: ['title', 'path'] },
        tokenize: 'forward',
        enrich: true
    });
    for (const [path, meta] of metaCache) {
        const content = fileCache.get(path) || '';
        state.searchIndex.add({
            path,
            title: meta.title,
            content: content.replace(/^---n[\s\S]*?n---/, '').trim()
        });
    }
}

async function search(query) {
    if (!state.searchIndex || !query.trim()) return [];
    const titleResults = await state.searchIndex.search(query, { field: 'title', limit: 10, enrich: true });
    const contentResults = await state.searchIndex.search(query, { field: 'content', limit: 10, enrich: true });
    const combined = new Map();
    const processResults = (results) => {
        results.forEach(fieldResult => {
            fieldResult.result.forEach(doc => {
                if (!combined.has(doc.id)) {
                    combined.set(doc.id, { ...metaCache.get(doc.id), ...doc });
                }
            });
        });
    };
    processResults(titleResults);
    processResults(contentResults);
    return Array.from(combined.values());
}

import { COMMANDS } from './commands/index.js';
window.wikiApp = {
    openGraph,
    openRandomDoc,
    clearCache,
    toggleTheme,
    getCurrentPath: () => state.currentPath
};

function handleCommandInput(event) {
    const query = event.target.value.trim();
    if (!query) {
        $.commandResults.style.display = 'none';
        return;
    }
    if (query.startsWith('>')) {
        const cmdQuery = query.slice(1).trim().toLowerCase();
        const matches = COMMANDS.filter(cmd => cmd.label.toLowerCase().includes(cmdQuery));
        renderCommandResults(matches, true, cmdQuery);
    } else if (query.startsWith('#')) {
        const tagQuery = query.slice(1).trim().toLowerCase();
        if (!tagQuery) {
            $.commandResults.style.display = 'none';
            return;
        }

        const exactMatches = [];
        const partialMatches = [];
        const matchedPaths = new Set();

        for (const meta of metaCache.values()) {
            if (!meta.tags || meta.tags.length === 0) continue;

            const lowerCaseTags = meta.tags.map(t => t.toLowerCase());
            
            // Exact matches
            if (lowerCaseTags.includes(tagQuery)) {
                if (!matchedPaths.has(meta.path)) {
                    exactMatches.push({ doc: meta, matchedTag: meta.tags.find(t => t.toLowerCase() === tagQuery), matchType: 'exact' });
                    matchedPaths.add(meta.path);
                }
            } 
            // Partial matches
            else {
                const partial = meta.tags.find(t => t.toLowerCase().includes(tagQuery));
                if (partial && !matchedPaths.has(meta.path)) {
                    partialMatches.push({ doc: meta, matchedTag: partial, matchType: 'partial' });
                    matchedPaths.add(meta.path);
                }
            }
        }

        const results = [...exactMatches, ...partialMatches];
        renderCommandResults(results, false, tagQuery, true);

    } else {
        search(query).then(results => renderCommandResults(results, false, query));
    }
}

function renderCommandResults(items, isCommand, query, isTagSearch = false) {
    if (items.length === 0) {
        $.commandResults.style.display = 'none';
        return;
    }
    const queryRegex = new RegExp(`(${query.replace(/[-\/\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    $.commandResults.innerHTML = items.map((item, index) => {
        const animationStyle = `animation-delay: ${index * 40}ms;`;
        if (isCommand) {
            return `<div class="command-item animate-stagger" style="${animationStyle}" data-action="${item.label}"><span class="cmd-icon">${item.icon}</span><span class="cmd-label">${item.label}</span></div>`;
        } else {
            const meta = item.doc || item;
            const titleHighlight = meta.title.replace(queryRegex, '<mark>$1</mark>');
            let contextSnippet = '';
            let matchedTagInfo = '';

            if (isTagSearch && item.matchedTag) {
                contextSnippet = meta.description || '';
                const matchTypeLabel = item.matchType === 'exact' ? 'Exact Match' : 'Partial Match';
                matchedTagInfo = `<div class="cmd-matched-tag">${matchTypeLabel}: #${item.matchedTag}</div>`;
            } else {
                const content = (fileCache.get(meta.path) || '').replace(/^---[\s\S]*?---/, '').trim();
                const strippedContent = content.replace(/<[^>]*>/g, "").replace(/[[.*]]/g, ' ');
                const match = queryRegex.exec(strippedContent);
                if (match) {
                    const startIndex = Math.max(0, match.index - 40);
                    const endIndex = Math.min(strippedContent.length, match.index + 60);
                    contextSnippet = '...' + strippedContent.substring(startIndex, endIndex).replace(queryRegex, '<mark>$1</mark>') + '...';
                } else {
                    contextSnippet = meta.description || '';
                }
            }

            return `<div class="command-item animate-stagger" style="${animationStyle}" data-path="${meta.path}"><span class="cmd-icon">📄</span><div><div class="cmd-label">${titleHighlight}</div>${matchedTagInfo}<div class="cmd-context">${contextSnippet}</div><div class="cmd-path">${meta.path}</div></div></div>`;
        }
    }).join('');
    $.commandResults.style.display = 'block';

    $.commandResults.querySelectorAll('.command-item').forEach(item => {
        item.addEventListener('click', () => {
            if (item.dataset.path) {
                openDocument(item.dataset.path);
            }
            else if (item.dataset.action) {
                const command = COMMANDS.find(cmd => cmd.label === item.dataset.action);
                if (command) command.action();
            }
            $.commandInput.value = '';
            $.commandResults.style.display = 'none';
        });
    });
}

function openRandomDoc() {
    const paths = Array.from(metaCache.keys());
    const randomPath = paths[Math.floor(Math.random() * paths.length)];
    openDocument(randomPath);
}

// ============================================ 
// Graph
// ============================================ 
function openFolderGraph(folderPath) {
    const filesInFolder = Array.from(metaCache.keys()).filter(path => path.startsWith(folderPath + '/'));
    if (metaCache.has(folderPath + '.md')) filesInFolder.push(folderPath + '.md');

    const nodes = filesInFolder.map(path => ({ id: path, name: metaCache.get(path).title }));
    const nodeIdsInFolder = new Set(filesInFolder);
    const links = [];
    for (const path of filesInFolder) {
        const node = graphIndex.get(path);
        if (node) {
            for (const target of node.out) {
                if (nodeIdsInFolder.has(target)) links.push({ source: path, target });
            }
        }
    }
    const folderGraphData = { nodes, links };
    $.graphModal.querySelector('.graph-title').textContent = `Graph: ${folderPath}`;
    openGraph(folderGraphData);
}

function openGraph(graphData = null) {
    state.currentGraphData = graphData;
    $.graphModal.showModal();
    document.body.classList.add('modal-open');

    if (!graphData) $.graphModal.querySelector('.graph-title').textContent = 'Document Graph';

    const btn3D = $.graphModal.querySelector('#btn-toggle-3d');
    btn3D.classList.toggle('active', state.graphViewMode === '3d');
    if (state.graphViewMode === '3d') render3DGraph(graphData);
    else renderGraph(graphData);
}

function closeGraph() {
    state.currentGraphData = null;
    if (state.cy) { state.cy.destroy(); state.cy = null; }
    if (state.forceGraph && state.forceGraph.pauseAnimation) state.forceGraph.pauseAnimation();
    state.forceGraph = null;
    $.graphContainer.innerHTML = '';
    $.graphModal.close();
    document.body.classList.remove('modal-open');
}

function renderGraph(graphData = null) { // Signature corrected



    try {



        let gData;

        if (graphData) {

            gData = graphData;

        } else {

            buildGraph({ type: 'global' });

            const nodes = Array.from(metaCache.keys()).map(path => ({

                id: path,

                name: metaCache.get(path).title

            }));

            const links = [];

            for (const [path, node] of graphIndex) {

                for (const target of node.out) {

                    if (graphIndex.has(target)) {

                        links.push({ source: path, target: target });

                    }

                }

            }

            gData = { nodes, links };

        }



        const elements = [];

        gData.nodes.forEach(node => {

            elements.push({ data: { id: node.id, label: node.name, path: node.id } });

        });

        gData.links.forEach(link => {

            elements.push({ data: { source: link.source, target: link.target } });

        });







        if (elements.length === 0) {



            $.graphContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--c-text-secondary);">No documents to display in graph</div>';



            return;



        }







        if (state.cy) {



            state.cy.destroy();



        }







        $.graphContainer.innerHTML = '';







        const styles = getComputedStyle(document.documentElement);



        const textColor = styles.getPropertyValue('--c-text-primary').trim();



        const primaryColor = styles.getPropertyValue('--c-primary').trim();



        const edgeColor = styles.getPropertyValue('--c-border-strong').trim();







        const layoutOptions = {



            name: 'cose-bilkent',



            animate: 'end',



            animationDuration: 500,



            nodeRepulsion: 4500,



            idealEdgeLength: 80,



            fit: false, // We fit manually on stop



            padding: 80,



                        stop: () => {



                            state.cy.animate({ fit: { padding: 80 } }, { duration: 400 });



                        }



                    };



            



                    state.cy = cytoscape({



                        container: $.graphContainer,



                        elements: elements,



                        layout: { name: 'preset' }, // Use a preset layout to prevent initial render issues



                        style: [



                            {



                                selector: 'node',



                                style: {



                                    'label': 'data(label)',



                                    'font-size': '12px',



                                    'color': textColor,



                                    'background-color': edgeColor, // Solid color default



                                    'border-width': 0,



                                    'text-valign': 'bottom',



                                    'text-halign': 'center',



                                    'text-margin-y': 8,



                                    'shape': 'ellipse',



                                    'width': '40px',



                                    'height': '40px',



                                    'transition-property': 'background-color, border-color, opacity, width, height',



                                    'transition-duration': '0.3s'



                                }



                            },



                            {



                                selector: 'edge',



                                style: {



                                    'width': 1,



                                    'line-color': edgeColor,



                                    'target-arrow-color': edgeColor,



                                    'target-arrow-shape': 'triangle',



                                    'curve-style': 'bezier',



                                    'transition-property': 'line-color, target-arrow-color, opacity',



                                    'transition-duration': '0.3s',



                                    'opacity': 0.5



                                }



                            },



                            {



                                selector: '.faded',



                                style: { 'opacity': 0.15 }



                            },



                            {



                                selector: 'node.highlight',



                                style: {



                                    'background-color': primaryColor,



                                    'border-color': primaryColor,



                                    'width': '40px',



                                    'height': '40px',



                                    'opacity': 1



                                }



                            },



                            {



                                selector: 'edge.highlight',



                                style: {



                                    'line-color': primaryColor,



                                    'target-arrow-color': primaryColor,



                                    'width': 2,



                                    'opacity': 1



                                }



                            }



                        ]



                    });



            



                    // Run the layout



                    state.cy.layout(layoutOptions).run();



            



                    if (state.currentPath) {



                        state.cy.$(`node[id="${state.currentPath}"]`).addClass('highlight');



                    }



            



                    state.cy.on('tap', 'node', (evt) => {



                        const path = evt.target.data('path');



                        openDocument(path);



                                                closeGraph();



                        



                                            });



            



                    // Tooltip handling



                    const graphTooltip = document.getElementById('graph-2d-tooltip') || document.createElement('div');



                    if (!graphTooltip.id) {



                        graphTooltip.id = 'graph-2d-tooltip';



                        graphTooltip.className = 'graph-tooltip';



                        document.body.appendChild(graphTooltip);



                    }



            



                    let hoveredNode = null;



                    state.cy.on('mouseover', 'node', (e) => {



                        hoveredNode = e.target;



                        state.cy.elements().removeClass('faded highlight');



                        const neighborhood = hoveredNode.closedNeighborhood();



                        state.cy.elements().not(neighborhood).addClass('faded');



                        neighborhood.addClass('highlight');



            



                        graphTooltip.innerHTML = `



                            <div class="tooltip-title">${hoveredNode.data('label')}</div>



                            <div class="tooltip-path">${hoveredNode.data('path')}</div>



                        `;



                        graphTooltip.classList.add('visible');



                    });



            



                    state.cy.on('mouseout', 'node', (e) => {



                        if (hoveredNode === e.target) {



                            state.cy.elements().removeClass('faded highlight');



                             if (state.currentPath) {



                                state.cy.$(`node[id="${state.currentPath}"]`).addClass('highlight');



                            }



                            graphTooltip.classList.remove('visible');



                        }



                    });



            



                    state.cy.on('mousemove', 'node', (e) => {



                        const node = e.target;



                        graphTooltip.style.left = `${e.originalEvent.clientX + 15}px`;



                        graphTooltip.style.top = `${e.originalEvent.clientY + 15}px`;



                    });



            



                } catch (error) {



                }



            }



            



            function render3DGraph(graphData = null) { // Signature corrected



                let gData;

                if (graphData) {

                    gData = graphData;

                } else {

                    buildGraph({ type: 'global' });

                    gData = {

                        nodes: Array.from(metaCache.keys()).map(path => ({

                            id: path,

                            name: metaCache.get(path).title

                        })),

                        links: []

                    };



                    for (const [path, node] of graphIndex) {

                        for (const target of node.out) {

                            gData.links.push({ source: path, target });

                        }

                    }

                }



            



                let hoverNode = null;



            



                state.forceGraph = ForceGraph3D()



                    ($.graphContainer)



                    .graphData(gData)



                    .nodeLabel('id')



                    .nodeThreeObject(node => {



                        const group = new THREE.Group();



            



                        // Sphere



                        const sphereMaterial = new THREE.MeshPhysicalMaterial({



                            color: node.id === state.currentPath ? '#3b82f6' : '#ffffff',



                            transparent: true,



                            transmission: 0.9,



                            roughness: 0.1,



                            ior: 1.5,



                            emissive: '#ffffff',



                            emissiveIntensity: 0.1



                        });



                        const sphereGeometry = new THREE.SphereGeometry(node.id === state.currentPath ? 6 : 4, 16, 16);



                        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);



                        group.add(sphere);



            



                        // Text



                        const sprite = new SpriteText(node.name);



                        sprite.material.depthWrite = false;



                        sprite.color = 'white';



                        sprite.textHeight = 3.5;



                        sprite.position.y = 10;



                        group.add(sprite);



            



                        // Connector Line



                        const lineMaterial = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.2 });



                        const points = [];



                        points.push(new THREE.Vector3(0, 0, 0)); // Sphere center



                        points.push(new THREE.Vector3(0, 8, 0));   // Point just below text



                        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);



                        const line = new THREE.Line(lineGeometry, lineMaterial);



                        group.add(line);



            



                        return group;



                    })



                    .linkColor(link => {



                        if (hoverNode && (link.source === hoverNode || link.target === hoverNode)) {



                            return 'rgba(168, 85, 247, 1)';



                        }



                        return 'rgba(255,255,255,0.75)';



                    })



                    .linkWidth(link => {



                        if (hoverNode && (link.source === hoverNode || link.target === hoverNode)) {



                            return 1.5;



                        }



                        return 1;



                    })



                    .onNodeHover(node => {



                        hoverNode = node;



                        $.graphContainer.style.cursor = node ? 'pointer' : null;



                    })



                    .onNodeClick(node => {



                        openDocument(node.id);



                        closeGraph();



                    });





            



                state.forceGraph.controls().rotateSpeed = 1.5;



                state.forceGraph.controls().panSpeed = 0.2; // Lowered pan speed



            



                // Initial zoom



                setTimeout(() => {



                    state.forceGraph.zoomToFit(500, 100);



                }, 1000);



            



                // Node filter



                $.graphSearch.addEventListener('input', (e) => {



                    const query = e.target.value.toLowerCase();



                    const filteredNodes = gData.nodes.filter(node => node.name.toLowerCase().includes(query));



                    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));



                    const filteredLinks = gData.links.filter(link => filteredNodeIds.has(link.source.id) && filteredNodeIds.has(link.target.id));



                    state.forceGraph.graphData({ nodes: filteredNodes, links: filteredLinks });



                });





                // Handle WebGL context loss

                const graphCanvas = $.graphContainer.querySelector('canvas');

                if (graphCanvas && !graphCanvas.dataset.contextListenersAdded) {

                    graphCanvas.dataset.contextListenersAdded = 'true';



                    

                }

}

// ============================================

// Theme & Events

// ============================================

function initTheme() {

    const savedTheme = localStorage.getItem('theme') || 'dark';

    document.documentElement.setAttribute('data-theme', savedTheme);

    $.btnTheme.addEventListener('click', toggleTheme);

}



function toggleTheme() {

    const current = document.documentElement.getAttribute('data-theme');

    const next = current === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', next);

    localStorage.setItem('theme', next);

}



async function clearCache() {

    const { clearCache: clearDB } = await import('./cache.js');

    await clearDB();

    alert('Cache cleared');

}



function bindEvents() {



    $.commandInput?.addEventListener('input', handleCommandInput);



    $.commandInput?.addEventListener('click', handleCommandInput);



    $.commandInput?.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = e.target.value.trim();
            if (!query || query.startsWith('>')) return;

            $.commandResults.style.display = 'none';

            if (query.startsWith('#')) {
                const tagQuery = query.slice(1).trim().toLowerCase();
                if (!tagQuery) return;

                const exactMatches = [];
                const partialMatches = [];
                const matchedPaths = new Set();

                for (const meta of metaCache.values()) {
                    if (!meta.tags || meta.tags.length === 0) continue;

                    const lowerCaseTags = meta.tags.map(t => t.toLowerCase());

                    if (lowerCaseTags.includes(tagQuery)) {
                        if (!matchedPaths.has(meta.path)) {
                            exactMatches.push({ doc: meta, matchedTag: meta.tags.find(t => t.toLowerCase() === tagQuery), matchType: 'exact' });
                            matchedPaths.add(meta.path);
                        }
                    } else {
                        const partial = meta.tags.find(t => t.toLowerCase().includes(tagQuery));
                        if (partial && !matchedPaths.has(meta.path)) {
                            partialMatches.push({ doc: meta, matchedTag: partial, matchType: 'partial' });
                            matchedPaths.add(meta.path);
                        }
                    }
                }
                const results = [...exactMatches, ...partialMatches];
                renderTagResultsPage(tagQuery, results);
            } else {
                const results = await search(query);
                renderSearchResultsPage(results, query);
            }
        }
    });







    document.addEventListener('click', (e) => {



        if (!$.commandInput?.contains(e.target) && !$.commandResults?.contains(e.target)) {



            $.commandResults.style.display = 'none';



        }



    });







    $.btnGraph?.addEventListener('click', () => openGraph());



    $.closeGraph?.addEventListener('click', closeGraph);



    $.homeLink?.addEventListener('click', (e) => { e.preventDefault(); showHome(); });







    window.addEventListener('hashchange', () => {



        const decodedHash = decodeURIComponent(window.location.hash.slice(1));



        if (decodedHash && metaCache.has(decodedHash)) openDocument(decodedHash);



        else showHome();



    });







    document.addEventListener('keydown', (e) => {



        if (e.key === 'Escape' && $.graphModal.open) closeGraph();



    });







    $.quickView.addEventListener('mouseenter', () => clearTimeout(state.hideQuickViewTimeout));



    $.quickView.addEventListener('mouseleave', () => handleQuickViewHide());







    $.graphModal.querySelector('#btn-toggle-3d')?.addEventListener('click', () => {



        state.graphViewMode = state.graphViewMode === '3d' ? '2d' : '3d';



        if (state.cy) { state.cy.destroy(); state.cy = null; }



        if (state.forceGraph && state.forceGraph.pauseAnimation) state.forceGraph.pauseAnimation();



        state.forceGraph = null;



        $.graphContainer.innerHTML = '';



        openGraph(state.currentGraphData);



    });







    $.graphModal.querySelector('#btn-fullscreen')?.addEventListener('click', () => {



        $.graphModal.classList.toggle('fullscreen');



        setTimeout(() => {



            if (state.forceGraph) state.forceGraph.width($.graphContainer.offsetWidth).height($.graphContainer.offsetHeight);



            if (state.cy) { state.cy.resize(); state.cy.fit(null, 80); }



        }, 300);



    });







    let isTicking = false;



    $.contentArea.addEventListener('scroll', () => {



        if (!isTicking) {



            window.requestAnimationFrame(() => {



                updateTocHighlight();



                isTicking = false;



            });



            isTicking = true;



        }



    });



}







// ============================================



// Initialization



// ============================================



async function init() {



    if (!checkLibraries()) {



        setTimeout(init, 100);



        return;



    }







    try {



        updateStatus('Initializing...');



        await initCache();



        initTheme();



        initShowdown();







        updateStatus('Fetching file list...');



        state.allFiles = await fetchGitHubTree();







        updateStatus('Indexing documents...');



        await indexFiles(state.allFiles, fetchRaw);







        updateStatus('Building graph...');



        buildGraph({ type: 'global' });







        updateStatus('Building search index...');



        initSearch();







        renderFileTree();



        bindEvents();







        const decodedInitialHash = decodeURIComponent(window.location.hash.slice(1));



        if (decodedInitialHash && metaCache.has(decodedInitialHash)) {



            openDocument(decodedInitialHash);



        } else {



            showHome();



        }







        updateStatus('Ready');



    } catch (err) {



        updateStatus(`Error: ${err.message}`);



    }



}







init();
