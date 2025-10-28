export const notepadCard = {
    id: 'notepad',
    icon: '📝',
    render: (state, $, metaCache, graphIndex, getBacklinks, CONFIG, t) => {
        const content = localStorage.getItem('notepadContent') || '';
        return `<textarea class="notepad-textarea">${content}</textarea>`;
    },
    bindEvents: (cardElement) => {
        const textarea = cardElement.querySelector('.notepad-textarea');
        textarea.addEventListener('input', (e) => {
            localStorage.setItem('notepadContent', e.target.value);
        });
    }
};