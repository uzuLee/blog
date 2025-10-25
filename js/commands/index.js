import { openGraphCommand } from './openGraph.js';
import { randomDocumentCommand } from './randomDocument.js';
import { clearCacheCommand } from './clearCache.js';
import { toggleThemeCommand } from './toggleTheme.js';
import { goHomeCommand } from './goHome.js';
import { clearRecentCommand } from './clearRecent.js';
import { showBacklinksCommand } from './showBacklinks.js';
import { searchTagsCommand } from './searchTags.js';
import { copyCurrentPathCommand } from './copyCurrentPath.js';
import { resetSettingsCommand } from './resetSettings.js';

export const COMMANDS = [
    goHomeCommand,
    openGraphCommand,
    randomDocumentCommand,
    searchTagsCommand,
    showBacklinksCommand,
    copyCurrentPathCommand,
    toggleThemeCommand,
    clearRecentCommand,
    clearCacheCommand,
    resetSettingsCommand
];