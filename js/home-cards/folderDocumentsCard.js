export const folderDocumentsCard = {
    id: 'folder-documents',
    icon: '📄',
    render: (state, $, metaCache, graphIndex, getBacklinks, CONFIG, t, filesInFolder) => {
        return filesInFolder.length > 0
            ? `<div class="recent-files-list">
                ${filesInFolder.map(doc => `
                    <div class="recent-file-item" data-path="${doc.path}">
                        <span class="recent-file-icon">📄</span>
                        <div class="recent-file-info">
                            <div class="recent-file-title">${doc.title}</div>
                            <div class="recent-file-time">${doc.path}</div>
                        </div>
                    </div>
                `).join('')}
            </div>`
            : '<p style="color: var(--c-text-tertiary); text-align: center; padding: var(--sp-4);">No documents in this folder.</p>';
    },
    bindEvents: (cardElement, metaCache, renderTagResultsPage, openDocument) => {
        cardElement.querySelectorAll('.recent-file-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                openDocument(item.dataset.path);
            });
        });
    }
};
