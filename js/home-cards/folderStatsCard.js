export const folderStatsCard = {
    id: 'folder-stats',
    icon: '📊',
    render: (state, $, metaCache, graphIndex, getBacklinks, CONFIG, t, filesInFolder) => {
        const docCount = filesInFolder.length;
        
        const filePathsInFolder = new Set(filesInFolder.map(f => f.path));

        const totalLinks = filesInFolder.reduce((acc, file) => {
            const node = graphIndex.get(file.path);
            if (!node) return acc;

            // Count only links that point to other files within the same folder
            const internalLinks = Array.from(node.out).filter(targetPath => filePathsInFolder.has(targetPath));
            return acc + internalLinks.length;
        }, 0);

        return `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="value">${docCount}</span>
                    <span class="label">${t('common.documents')}</span>
                </div>
                <div class="stat-item">
                    <span class="value">${totalLinks}</span>
                    <span class="label">Local Links</span>
                </div>
            </div>
        `;
    }
};
