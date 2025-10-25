export const statsCard = {
    id: 'stats',
    icon: '📊',
    render: (state, $, metaCache, graphIndex, getBacklinks, CONFIG, t) => {
        const docCount = metaCache.size;
        const totalLinks = Array.from(graphIndex.values()).reduce((acc, node) => acc + node.out.size, 0);

        return `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="value">${docCount}</span>
                    <span class="label">${t('common.documents')}</span>
                </div>
                <div class="stat-item">
                    <span class="value">${totalLinks}</span>
                    <span class="label">${t('common.links')}</span>
                </div>
            </div>
        `;
    }
};