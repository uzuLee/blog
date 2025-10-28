export const folderTagsCard = {
    id: 'folder-tags',
    icon: '🏷️',
    render: (state, $, metaCache, graphIndex, getBacklinks, CONFIG, t, filesInFolder) => {
        const tagCounts = new Map();
        filesInFolder.forEach(file => {
            if (file.tags) {
                file.tags.forEach(tag => {
                    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                });
            }
        });

        if (tagCounts.size === 0) {
            return '<div class="placeholder-text">No tags found in this folder.</div>';
        }

        const sortedTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);

        const tagsHTML = sortedTags.map(([tag, count]) => 
            `<a class="tag-cloud-item" data-tag="${tag}">
                ${tag}
            </a>`
        ).join('');

        return `<div class="tag-cloud-container">${tagsHTML}</div>`;
    },
    bindEvents: (cardElement, metaCache, renderTagResultsPage, openDocument, filesInFolder) => {
        cardElement.querySelectorAll('.tag-cloud-item').forEach(tagEl => {
            tagEl.addEventListener('click', () => {
                const tag = tagEl.dataset.tag;
                // Filter results to only include files from the current folder
                const results = filesInFolder
                    .filter(meta => meta.tags && meta.tags.some(t => t.toLowerCase() === tag.toLowerCase()))
                    .map(meta => ({ doc: meta, matchedTag: tag, matchType: 'exact' }));
                renderTagResultsPage(tag, results);
            });
        });
    }
};
