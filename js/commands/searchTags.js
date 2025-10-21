export const searchTagsCommand = {
    label: 'Search by Tags',
    icon: '🏷️',
    action: () => {
        const input = document.getElementById('command-input');
        if (input) {
            input.value = '#';
            input.focus();
            // Trigger input event to show tag suggestions
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
};
