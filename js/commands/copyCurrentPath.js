export const copyCurrentPathCommand = {
    label: 'Copy Current Path',
    icon: '📋',
    action: () => {
        const currentPath = window.wikiApp.getCurrentPath?.() || window.location.hash.slice(1);
        if (currentPath) {
            navigator.clipboard.writeText(decodeURIComponent(currentPath))
                .then(() => alert('Path copied to clipboard!'))
                .catch(() => alert('Failed to copy path'));
        } else {
            alert('No document is currently open');
        }
    }
};
