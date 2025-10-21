const THEMED_QUOTES = {
    morning: [ "A new light for old thoughts.", "Clarity wakes slowly." ],
    afternoon: [ "Precision is poetry.", "Logic breathes through lines." ],
    evening: [ "Shadows are another way of seeing.", "The syntax of twilight." ],
    night: [ "A constellation of ideas.", "Thought has no shadow." ]
};

function getThemedQuote() {
    const hour = new Date().getHours();
    let period;
    if (hour >= 5 && hour < 12) period = 'morning';
    else if (hour >= 12 && hour < 17) period = 'afternoon';
    else if (hour >= 17 && hour < 22) period = 'evening';
    else period = 'night';
    const quotes = THEMED_QUOTES[period];
    return quotes[Math.floor(Math.random() * quotes.length)];
}

export const quoteCard = {
    id: 'quote',
    title: 'Quote of the Moment',
    icon: '📜',
    render: (state, $) => {
        const quote = getThemedQuote();
        return `<p>"${quote}"</p>`;
    }
};