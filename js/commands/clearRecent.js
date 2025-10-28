export const clearRecentCommand = {
    label: 'Clear Recent Files',
    icon: '🗑️',
    action: () => {
        if (confirm('Clear all recent files history?')) {
            localStorage.removeItem('recentFiles');
            alert('Recent files cleared!');
            // Trigger storage event to update home page without reload
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'recentFiles',
                oldValue: localStorage.getItem('recentFiles'),
                newValue: null,
                url: window.location.href,
                storageArea: localStorage
            }));
        }
    }
};
