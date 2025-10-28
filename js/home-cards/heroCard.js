function getMostReferencedDoc(metaCache, getBacklinks) {
    return Array.from(metaCache.values()).reduce((mostRefd, doc) => {
        const refCount = getBacklinks(doc.path).length;
        return refCount > (mostRefd.refCount || -1) ? { ...doc, refCount } : mostRefd;
    }, { refCount: -1 });
}

function getStats(metaCache, graphIndex, getBacklinks, t) {
    const docCount = metaCache.size;
    const totalLinks = Array.from(graphIndex.values()).reduce((acc, node) => acc + node.out.size, 0);
    const allTags = Array.from(metaCache.values()).flatMap(doc => doc.tags || []);
    const uniqueTags = [...new Set(allTags)];
    const avgLinks = (totalLinks / docCount || 0).toFixed(1);

    // Find most connected document (outgoing links)
    let mostConnectedDoc = null;
    let maxOutgoing = 0;
    graphIndex.forEach((node, path) => {
        if (node.out.size > maxOutgoing) {
            maxOutgoing = node.out.size;
            mostConnectedDoc = metaCache.get(path);
        }
    });

    // Count orphan documents (no backlinks)
    const orphanCount = Array.from(metaCache.keys()).filter(path => getBacklinks(path).length === 0).length;

    // Count hub documents (5+ outgoing links)
    const hubCount = Array.from(graphIndex.values()).filter(node => node.out.size >= 5).length;

    // Count isolated documents (no incoming or outgoing links)
    const isolatedCount = Array.from(metaCache.keys()).filter(path => {
        const node = graphIndex.get(path);
        return getBacklinks(path).length === 0 && (!node || node.out.size === 0);
    }).length;

    // Calculate network density
    const maxPossibleLinks = docCount * (docCount - 1);
    const density = maxPossibleLinks > 0 ? ((totalLinks / maxPossibleLinks) * 100).toFixed(1) : '0.0';

    return [
        () => t('card.hero.stats')
            .replace('{docCount}', docCount)
            .replace('{linkCount}', totalLinks)
            .replace('{avgLinks}', avgLinks),
        () => {
            const mostRefd = getMostReferencedDoc(metaCache, getBacklinks);
            return mostRefd
                ? t('card.hero.most_referenced').replace('{title}', mostRefd.title)
                : t('card.hero.growing');
        },
        () => t('card.hero.unique_tags').replace('{count}', uniqueTags.length),
        () => mostConnectedDoc && maxOutgoing > 0
            ? t('card.hero.most_connected')
                .replace('{title}', mostConnectedDoc.title)
                .replace('{count}', maxOutgoing)
            : t('card.hero.growing'),
        () => orphanCount > 0
            ? t('card.hero.orphan_docs').replace('{count}', orphanCount)
            : t('card.hero.growing'),
        () => hubCount > 0
            ? t('card.hero.hub_docs').replace('{count}', hubCount)
            : t('card.hero.growing'),
        () => isolatedCount > 0
            ? t('card.hero.isolated_docs').replace('{count}', isolatedCount)
            : t('card.hero.growing'),
        () => t('card.hero.network_density').replace('{density}', density),
    ];
}

export function cleanupHeroCard() {
    // The hero card subtitle rotation has been disabled as per user request.
}

export const heroCard = {
    id: 'hero',
    render: (state, $, metaCache, graphIndex, getBacklinks, CONFIG, t) => {
        const statsFunctions = getStats(metaCache, graphIndex, getBacklinks, t);
        const meaningfulSubtitle = statsFunctions[Math.floor(Math.random() * statsFunctions.length)]();

        return `
            <h1>${t('card.hero.title')}</h1>
            <p class="hero-subtitle">${meaningfulSubtitle}</p>
        `;
    },
    init: () => {
        // The hero card subtitle rotation has been disabled as per user request.
    }
};
