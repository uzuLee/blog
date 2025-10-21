export const notepadCard = {
    id: 'notepad',
    title: 'Notepad',
    icon: '📝',
    render: () => {
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