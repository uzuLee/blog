function getRecentFiles() {
    const recentFiles = JSON.parse(localStorage.getItem('recentFiles') || '[]');
    return recentFiles;
}

function getTimeAgo(timestamp, t) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return t('time.just_now');
    if (seconds < 3600) return `${Math.floor(seconds / 60)} ${t('time.minutes_ago')}`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ${t('time.hours_ago')}`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} ${t('time.days_ago')}`;
    return `${Math.floor(seconds / 604800)} ${t('time.weeks_ago')}`;
}

export const recentFilesCard = {
    id: 'recent-files',
    icon: '📖',
    render: (state, $, metaCache, graphIndex, getBacklinks, CONFIG, t) => {
        const recentFiles = getRecentFiles()
            .map(item => {
                const meta = metaCache.get(item.path);
                return meta ? { ...item, meta } : null;
            })
            .filter(item => item !== null)
            .slice(0, 8);

        if (recentFiles.length === 0) {
            return `<p style="color: var(--c-text-tertiary); text-align: center; padding: var(--sp-4);">${t('common.no_recent_files')}</p>`;
        }

        const filesHTML = recentFiles.map(item => `
            <div class="recent-file-item" data-path="${item.path}">
                <span class="recent-file-icon">📄</span>
                <div class="recent-file-info">
                    <div class="recent-file-title">${item.meta.title}</div>
                    <div class="recent-file-time">${getTimeAgo(item.timestamp, t)}</div>
                </div>
            </div>
        `).join('');

        return `<div class="recent-files-list">${filesHTML}</div>`;
    },
    bindEvents: (cardElement, metaCache, renderTagResultsPage, openDocument) => {
        cardElement.querySelectorAll('.recent-file-item').forEach(item => {
            item.addEventListener('click', () => {
                openDocument(item.dataset.path);
            });
        });
    }
};