export const goHomeCommand = {
    label: 'Go Home',
    icon: '🏠',
    action: () => {
        window.location.hash = '';
    }
};
