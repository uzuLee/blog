export const statsCard = {
    id: 'stats',
    title: 'Content Stats',
    icon: '📊',
    render: (state, $, metaCache, graphIndex) => {
        const docCount = metaCache.size;
        const totalLinks = Array.from(graphIndex.values()).reduce((acc, node) => acc + node.out.size, 0);

        return `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="value">${docCount}</span>
                    <span class="label">Documents</span>
                </div>
                <div class="stat-item">
                    <span class="value">${totalLinks}</span>
                    <span class="label">Links</span>
                </div>
            </div>
        `;
    }
};