export const timeCard = {
    id: 'time',
    title: 'Local Time',
    icon: '⏱️',
    render: (state, $) => {
        return '<div id="home-time"></div>';
    },
    init: (state, $) => {
        const updateTime = () => {
            const now = new Date();
            const timeEl = document.getElementById('home-time');
            if (timeEl) {
                timeEl.textContent = now.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });
            }
        };

        if (state.timeUpdater) {
            clearInterval(state.timeUpdater);
        }
        state.timeUpdater = setInterval(updateTime, 1000);
        updateTime();
    }
};