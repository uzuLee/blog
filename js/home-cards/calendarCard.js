function generateCalendarGrid(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '<div class="calendar-grid">';
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
        html += `<div class="calendar-weekday">${day}</div>`;
    });

    for (let i = 0; i < firstDay; i++) {
        html += '<div></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
        html += `<div class="calendar-day ${isToday ? 'is-today' : ''}">${day}</div>`;
    }

    html += '</div>';
    return html;
}

export const calendarCard = {
    id: 'calendar',
    icon: '📅',
    render: (state, $, metaCache, graphIndex, getBacklinks, CONFIG, t) => {
        const calendarGrid = generateCalendarGrid();
        return `
            <div class="calendar-grid-container">
                ${calendarGrid}
            </div>
        `;
    }
};