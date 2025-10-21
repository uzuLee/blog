export const showBacklinksCommand = {
    label: 'Show Backlinks',
    icon: '🔗',
    action: () => {
        const backlinkSection = document.getElementById('backlinks');
        if (backlinkSection) {
            backlinkSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            alert('Open a document to see its backlinks');
        }
    }
};
