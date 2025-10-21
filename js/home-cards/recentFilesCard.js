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

export const recentFilesCard = {
    id: 'recent-files',
    title: 'Recent Files',
    icon: '📖',
    render: (state, $, metaCache) => {
        const recentFiles = getRecentFiles()
            .map(item => {
                const meta = metaCache.get(item.path);
                return meta ? { ...item, meta } : null;
            })
            .filter(item => item !== null)
            .slice(0, 8);

        if (recentFiles.length === 0) {
            return '<p style="color: var(--c-text-tertiary); text-align: center; padding: var(--sp-4);">No recent files</p>';
        }

        const filesHTML = recentFiles.map(item => `
            <div class="recent-file-item" data-path="${item.path}">
                <span class="recent-file-icon">📄</span>
                <div class="recent-file-info">
                    <div class="recent-file-title">${item.meta.title}</div>
                    <div class="recent-file-time">${getTimeAgo(item.timestamp)}</div>
                </div>
            </div>
        `).join('');

        return `<div class="recent-files-list">${filesHTML}</div>`;
    },
    bindEvents: (cardElement, openDocument) => {
        cardElement.querySelectorAll('.recent-file-item').forEach(item => {
            item.addEventListener('click', () => {
                openDocument(item.dataset.path);
            });
        });
    }
};