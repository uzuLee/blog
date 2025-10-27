import { heroCard, cleanupHeroCard } from './heroCard.js';
import { statsCard } from './statsCard.js';
import { quoteCard } from './quoteCard.js';
import { timeCard } from './timeCard.js';
import { calendarCard } from './calendarCard.js';
import { recentFilesCard } from './recentFilesCard.js';
import { tagsCard } from './tagsCard.js';
import { notepadCard } from './notepadCard.js';
import { folderStatsCard } from './folderStatsCard.js';
import { folderTagsCard } from './folderTagsCard.js';
import { folderDocumentsCard } from './folderDocumentsCard.js';

export { cleanupHeroCard, statsCard, tagsCard };

export const HOME_CARDS = [
    heroCard,
    statsCard,
    quoteCard,
    notepadCard,
    timeCard,
    calendarCard,
    recentFilesCard,
    tagsCard
];

export const FOLDER_CARDS = [
    folderDocumentsCard,
    folderStatsCard,
    folderTagsCard
];