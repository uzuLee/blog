export const clearRecentCommand = {
    label: 'Clear Recent Files',
    icon: '🗑️',
    action: () => {
        if (confirm('Clear all recent files history?')) {
            localStorage.removeItem('recentFiles');
            alert('Recent files cleared!');
            // Refresh if on home page
            if (window.location.hash === '' || window.location.hash === '#') {
                window.location.reload();
            }
        }
    }
};
