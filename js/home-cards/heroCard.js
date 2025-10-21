function getMostReferencedDoc(metaCache, getBacklinks) {
    let maxRefCount = -1;
    let mostRefdDoc = null;
    for (const doc of metaCache.values()) {
        const refCount = getBacklinks(doc.path).length;
        if (refCount > maxRefCount) {
            maxRefCount = refCount;
            mostRefdDoc = doc;
        }
    }
    return mostRefdDoc;
}

export const heroCard = {
    id: 'hero',
    render: (state, $, metaCache, graphIndex, getBacklinks, CONFIG) => {
        const docCount = metaCache.size;
        const totalLinks = Array.from(graphIndex.values()).reduce((acc, node) => acc + node.out.size, 0);
        const allTags = Array.from(metaCache.values()).flatMap(doc => doc.tags || []);
        const uniqueTags = [...new Set(allTags)];
        const avgLinks = (totalLinks / docCount || 0).toFixed(1);

        const statsFunctions = [
            () => `Currently tracking ${docCount} nodes connected by ${totalLinks} edges.`, 
            () => {
                const mostRefd = getMostReferencedDoc(metaCache, getBacklinks);
                return mostRefd ? `The most referenced node is "${mostRefd.title}".` : `Your knowledge base is growing.`;
            },
            () => `A total of ${uniqueTags.length} unique tags are being used.`, 
            () => `The average number of links per node is ${avgLinks}.`
        ];
        const meaningfulSubtitle = statsFunctions[Math.floor(Math.random() * statsFunctions.length)]();

        return `
            <h1>${CONFIG.blogName}</h1>
            <p>${meaningfulSubtitle}</p>
        `;
    }
};
