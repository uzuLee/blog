export const tagsCard = {
    id: 'tags',
    title: 'Tags',
    icon: '🏷️',
    render: (state, $, metaCache) => {
        const allTags = Array.from(metaCache.values()).flatMap(doc => doc.tags || []);
        const uniqueTags = [...new Set(allTags)];

        if (uniqueTags.length === 0) {
            return '<p style="color: var(--c-text-tertiary);">No tags found</p>';
        }

        const tagsHTML = uniqueTags.map(tag => `<a class="tag-cloud-item">${tag}</a>`).join('');
        return `<div class="tag-cloud-container">${tagsHTML}</div>`;
    },
    bindEvents: (cardElement, metaCache, renderTagResultsPage) => {
        cardElement.querySelectorAll('.tag-cloud-item').forEach(item => {
            item.addEventListener('click', () => {
                const tag = item.textContent;
                const results = Array.from(metaCache.values())
                    .filter(meta => meta.tags && meta.tags.some(t => t.toLowerCase() === tag.toLowerCase()))
                    .map(meta => ({ doc: meta, matchedTag: tag, matchType: 'exact' }));
                renderTagResultsPage(tag, results);
            });
        });
    }
};