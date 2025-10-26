// ============================================ 
// UZU Notes - Main Application (v3)
// ============================================ 

import { CONFIG } from "./config.js";
import { fetchGitHubTree, fetchRaw, prefetchDocuments } from "./net.js";
import {
  initCache,
  addBookmark,
  removeBookmark,
  isBookmarked,
  getAllBookmarks,
} from "./cache.js";
import {
  indexFiles,
  metaCache,
  fileCache,
  titleIndex,
  graphIndex,
  buildGraph,
  getBacklinks,
  resolveByTitle,
} from "./indexer.js";
import { COMMANDS } from "./commands/index.js";
import { HOME_CARDS, FOLDER_CARDS, cleanupHeroCard, statsCard, tagsCard } from "./home-cards/index.js";
import { VanillaGraph } from "./graph.js";
import { languages } from "./i18n/index.js";

// ============================================ 
// Library Check
// ============================================ 
const checkLibraries = () => {
  return (
    typeof showdown !== "undefined" &&
    typeof FlexSearch !== "undefined" &&
    typeof THREE !== "undefined" &&
    typeof ForceGraph3D !== "undefined" &&
    typeof SpriteText !== "undefined"
  );
};

// ============================================ 
// State
// ============================================ 
const state = {
  allFiles: [],
  currentPath: null,
  currentFolder: null,
  searchIndex: null,
  cy: null,
  graphViewMode: "2d", // '2d' or '3d'
  graphInstance: null,
  converter: null,
  showQuickViewTimeout: null,
  hideQuickViewTimeout: null,
  isQuickViewVisible: false,
  currentGraphData: null,
  timeUpdater: null,
  isSidebarOpen: false,
  isAuxPanelOpen: false,
  isSearchMobileOpen: false,
  isSearchDesktopOpen: false,
  isSettingsPanelOpen: false,
  currentLanguage: "en",
  translations: {},
};

// ============================================ 
// DOM Elements
// ============================================ 
const $ = {
  commandInput: document.getElementById("command-input"),
  commandResults: document.getElementById("command-results"),
  fileTree: document.getElementById("file-tree"),
  placeholder: document.getElementById("placeholder"),
  document: document.getElementById("document"),
  folderView: document.getElementById("folder-view"),
  docTitle: document.getElementById("doc-title"),
  docContent: document.getElementById("doc-content"),
  docTags: document.getElementById("doc-tags"),
  docMetaInfo: document.getElementById("doc-meta-info"),
  btnBookmark: document.getElementById("btn-bookmark"),
  breadcrumbs: document.getElementById("breadcrumbs"),
  backlinks: document.getElementById("backlinks"),
  toc: document.getElementById("toc"),
  status: document.getElementById("status"),
  btnTheme: document.getElementById("btn-theme"),
  btnGraph: document.getElementById("btn-graph"),
  btnPanels: document.getElementById("btn-panels"),
  btnAuxPanelToggle: document.getElementById("btn-auxpanel-toggle"),
  auxPanel: document.getElementById("aux-panel"),
  panelsModal: document.getElementById("panels-modal"),
  panelsModalBody: document.getElementById("panels-modal-body"),
  closePanels: document.getElementById("close-panels"),
  btnSidebarToggle: document.getElementById("btn-sidebar-toggle"),
  mobileOverlay: document.getElementById("mobile-overlay"),
  sidebar: document.getElementById("sidebar"),
  graphModal: document.getElementById("graph-modal"),
  graphContainer: document.getElementById("graph-container"),
  graphSearch: document.getElementById("graph-search"),
  closeGraph: document.getElementById("close-graph"),
  homeLink: document.getElementById("home-link"),
  quickView: document.getElementById("quick-view-popup"),
  quickViewTitle: document.getElementById("quick-view-title"),
  quickViewBody: document.getElementById("quick-view-body"),
  contentArea: document.getElementById("content-area"),
  homePageContent: document.getElementById("home-page-content"),
  resultsPage: document.getElementById("results-page"),
  panelsRight: document.getElementById("panels-right"),
  blogTitle: document.getElementById("blog-title"),
  btnSearchMobile: document.getElementById("btn-search-mobile"),
  btnSearchDesktop: document.getElementById("btn-search-desktop"),
  settingsBackdrop: document.getElementById("settings-backdrop"),
  settingsPanel: document.getElementById("settings-panel"),
  btnSettings: document.getElementById("btn-settings"),
  btnSettingsClose: document.getElementById("btn-settings-close"),
  btnResetSettings: document.getElementById("btn-reset-settings"),
  fontSizeSlider: document.getElementById("font-size-slider"),
  fontSizeValue: document.getElementById("font-size-value"),
  fontFamilySelect: document.getElementById("font-family-select"),
  languageSelect: document.getElementById("language-select"),
  placeholderTitle: document.getElementById("placeholder-title"),
  placeholderDescription: document.getElementById("placeholder-description"),

  // Comments
  commentsSection: document.getElementById("comments-section"),
};

// ============================================ 
// Showdown Setup with Wiki Link Extension
// ============================================ 
function initShowdown() {
  showdown.extension("wikilinks", function () {
    return [
      {
        type: "lang",
        regex: /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
        replace: function (match, target, display) {
          const text = display || target;
          const meta = metaCache.get(state.currentPath);
          const currentFolder = meta ? meta.folder : "";

          let resolved = null;

          // Check if target is a relative/absolute path
          const isRelative =
            target.startsWith("./") || target.startsWith("../");

          if (target.includes("/")) {
            let resolvedPath;
            if (isRelative) {
              // Resolve relative path from current file
              resolvedPath = resolveRelativePath(
                state.currentPath || "",
                target
              );
            } else {
              // Treat as path from root
              resolvedPath = target;
            }

            // Try with current extension
            if (metaCache.has(resolvedPath)) {
              resolved = resolvedPath;
            }
            // Try adding .md
            else if (metaCache.has(resolvedPath + ".md")) {
              resolved = resolvedPath + ".md";
            }
            // Try adding .mdx
            else if (metaCache.has(resolvedPath + ".mdx")) {
              resolved = resolvedPath + ".mdx";
            }
          }

          // If not resolved as path, try resolving by title
          if (!resolved) {
            resolved = resolveByTitle(currentFolder, target);
          }

          if (resolved) {
            const targetMeta = metaCache.get(resolved);
            const linkText =
              display || (targetMeta ? targetMeta.title : target);
            return `<a href="#${encodeURIComponent(
              resolved
            )}" class="wiki-link" data-path="${resolved}">${linkText}</a>`;
          }

          return `<span class="unresolved-link" title="Unresolved: ${target}">${text}</span>`;
        },
      },
    ];
  });

  state.converter = new showdown.Converter({
    ghCompatibleHeaderId: true,
    simpleLineBreaks: true,
    strikethrough: true,
    tables: true,
    tasklists: true,
    extensions: ["wikilinks"],
  });
}

// ============================================
// Utilities
// ============================================
function updateStatus(msg) {
  if ($.status) $.status.textContent = msg;
}

// ============================================
// Custom Dropdown
// ============================================
function createCustomDropdown(selectElement) {
  const container = document.createElement('div');
  container.className = 'custom-dropdown';

  const trigger = document.createElement('div');
  trigger.className = 'custom-dropdown-trigger';

  const selectedText = document.createElement('span');
  selectedText.textContent = selectElement.options[selectElement.selectedIndex].text;

  const arrow = document.createElement('svg');
  arrow.className = 'custom-dropdown-arrow';
  arrow.setAttribute('width', '16');
  arrow.setAttribute('height', '16');
  arrow.setAttribute('viewBox', '0 0 16 16');
  arrow.setAttribute('fill', 'none');
  arrow.setAttribute('stroke', 'currentColor');
  arrow.setAttribute('stroke-width', '2');
  arrow.setAttribute('stroke-linecap', 'round');
  arrow.setAttribute('stroke-linejoin', 'round');
  arrow.innerHTML = '<path d="M4 6l4 4 4-4"/>';

  trigger.appendChild(selectedText);
  trigger.appendChild(arrow);

  const menu = document.createElement('div');
  menu.className = 'custom-dropdown-menu';

  // Create options
  Array.from(selectElement.options).forEach((option, index) => {
    const optionEl = document.createElement('div');
    optionEl.className = 'custom-dropdown-option';
    if (option.selected) optionEl.classList.add('selected');
    optionEl.textContent = option.text;
    optionEl.dataset.value = option.value;
    optionEl.dataset.index = index;

    optionEl.addEventListener('click', () => {
      // Update select element
      selectElement.selectedIndex = index;
      selectElement.dispatchEvent(new Event('change'));

      // Update UI
      menu.querySelectorAll('.custom-dropdown-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      optionEl.classList.add('selected');
      selectedText.textContent = option.text;

      // Close menu
      trigger.classList.remove('open');
      menu.classList.remove('open');
    });

    menu.appendChild(optionEl);
  });

  // Toggle menu
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = trigger.classList.contains('open');

    // Close all other dropdowns
    document.querySelectorAll('.custom-dropdown-trigger.open').forEach(t => {
      if (t !== trigger) {
        t.classList.remove('open');
        t.nextElementSibling.classList.remove('open');
      }
    });

    trigger.classList.toggle('open', !isOpen);
    menu.classList.toggle('open', !isOpen);
  });

  // Close on outside click
  document.addEventListener('click', () => {
    trigger.classList.remove('open');
    menu.classList.remove('open');
  });

  container.appendChild(trigger);
  container.appendChild(menu);

  // Replace select element
  selectElement.style.display = 'none';
  selectElement.parentNode.insertBefore(container, selectElement);

  return container;
}

async function toggleBookmark(path) {
  const bookmarked = await isBookmarked(path);
  if (bookmarked) {
    await removeBookmark(path);
  } else {
    await addBookmark(path);
  }
  updateBookmarkButtonState(path);
  updatePanels(); // Re-render panels to show the change
}

async function updateBookmarkButtonState(path) {
  const bookmarked = await isBookmarked(path);
  $.btnBookmark.classList.toggle("bookmarked", bookmarked);
  $.btnBookmark.title = bookmarked ? "Remove bookmark" : "Add bookmark";
}

function updateBlogName() {
  document.title = t("header.title");
  if ($.blogTitle) {
    $.blogTitle.innerHTML = t("header.title");
  }
  if ($.commandInput) {
    $.commandInput.placeholder = t("header.search_placeholder");
  }
  // Update sidebar title
  const sidebarTitle = document.getElementById("sidebar-title");
  if (sidebarTitle) {
    sidebarTitle.textContent = t("sidebar.documents");
  }
}

function setLanguage(lang) {
  state.currentLanguage = lang;
  state.translations = languages[lang];
  localStorage.setItem("language", lang);
  updateBlogName();
  // We need to re-render any visible UI elements that have text
  if (state.currentPath) {
    openDocument(state.currentPath, true);
  } else if (state.currentFolder) {
    showFolderPage(state.currentFolder);
  } else {
    showHome();
  }
  renderPanels(metaCache.get(state.currentPath));
}

function t(key) {
  return state.translations[key] || key;
}

function resolveRelativePath(basePath, relativePath) {
  // If relativePath is absolute, return as is
  if (relativePath.startsWith("/")) {
    return relativePath.slice(1);
  }

  // Get directory of base path
  const baseDir = basePath.includes("/")
    ? basePath.substring(0, basePath.lastIndexOf("/"))
    : "";

  // Split relative path into segments
  const segments = relativePath.split("/");
  const baseSegments = baseDir ? baseDir.split("/") : [];

  for (const segment of segments) {
    if (segment === "..") {
      baseSegments.pop();
    } else if (segment !== "." && segment !== "") {
      baseSegments.push(segment);
    }
  }

  return baseSegments.join("/");
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============================================ 
// Panels
// ============================================ 

// Panel Definitions - Moved from js/panels/
const renderTocPanel = (panelEl, appState, app) => {
  const docContent = app.getDocContentEl();
  if (!docContent) return;

  const headings = docContent.querySelectorAll("h1, h2, h3, h4");
  if (headings.length === 0) {
    panelEl.innerHTML =
      `<div class="toc-placeholder">${t("panel.no_toc")}</div>`;
    return;
  }

  let html = '<ul class="toc-list">';
  headings.forEach((h) => {
    const level = parseInt(h.tagName[1]);
    const text = h.textContent;
    const id = h.id || text.toLowerCase().replace(/[^\w]+/g, "-");
    h.id = id;
    html += `<li class="toc-item toc-level-${level}"><a href="#${id}" data-scroll-to="${id}">${text}</a></li>`;
  });
  html += "</ul>";
  panelEl.innerHTML = html;

  panelEl.querySelectorAll("a[data-scroll-to]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetEl = document.getElementById(link.dataset.scrollTo);
      const contentArea = app.getContentAreaEl();
      if (targetEl && contentArea) {
        // Calculate target position relative to content area
        const contentAreaRect = contentArea.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const offset = 20; // Add some padding from top

        // Calculate scroll position within content area
        const targetScrollPosition =
          contentArea.scrollTop +
          (targetRect.top - contentAreaRect.top) -
          offset;

        // Smooth scroll to position within content area
        contentArea.scrollTo({
          top: targetScrollPosition,
          behavior: "smooth",
        });
      }
    });
  });
};

const updateTocPanel = (panelEl, appState, app) => {
  const docContent = app.getDocContentEl();
  const contentArea = app.getContentAreaEl();
  if (!docContent || !contentArea) return;

  const headings = Array.from(docContent.querySelectorAll("h1, h2, h3, h4"));
  const tocLinks = Array.from(panelEl.querySelectorAll("a"));

  const isScrollable = contentArea.scrollHeight > contentArea.clientHeight;
  if (!isScrollable) {
    tocLinks.forEach((link) => link.classList.remove("active"));
    return;
  }

  if (!headings.length) return;

  const scrollBottom = contentArea.scrollTop + contentArea.clientHeight;
  const scrollHeight = contentArea.scrollHeight;

  if (contentArea.scrollTop < 5) {
    tocLinks.forEach((link, index) => {
      link.classList.toggle("active", index === 0);
    });
    return;
  }

  if (scrollHeight - scrollBottom < 5) {
    const lastHeading = headings[headings.length - 1];
    const activeId = lastHeading ? lastHeading.id : null;
    tocLinks.forEach((link) => {
      link.classList.toggle(
        "active",
        link.getAttribute("href") === `#${activeId}`
      );
    });
    return;
  }

  const threshold = contentArea.getBoundingClientRect().top + 150;
  let activeHeading = null;

  for (let i = headings.length - 1; i >= 0; i--) {
    if (headings[i].getBoundingClientRect().top < threshold) {
      activeHeading = headings[i];
      break;
    }
  }

  const activeId = activeHeading ? activeHeading.id : null;
  tocLinks.forEach((link) => {
    link.classList.toggle(
      "active",
      link.getAttribute("href") === `#${activeId}`
    );
  });
};

const updateBookmarksPanel = async (panelEl, appState, app) => {
  const bookmarks = await getAllBookmarks();

  if (bookmarks.length === 0) {
    panelEl.innerHTML = `<div class="toc-placeholder">${t("panel.no_bookmarks")}</div>`;
    return;
  }

  const bookmarksHTML = bookmarks
    .map((bookmark) => {
      const meta = metaCache.get(bookmark.path);
      if (!meta) return "";
      return `
            <div class="file-item" data-path="${meta.path}">
                <span class="file-icon">📄</span>
                <span>${meta.title}</span>
            </div>
        `;
    })
    .join("");

  panelEl.innerHTML = `<div class="file-tree">${bookmarksHTML}</div>`;

  panelEl.querySelectorAll(".file-item").forEach((item) => {
    item.addEventListener("click", () => {
      app.openDocument(item.dataset.path);
    });
  });
};

const renderBookmarksPanel = async (panelEl, appState, app) => {
  // Don't show loading state to prevent flickering
  await updateBookmarksPanel(panelEl, appState, app);
};

const renderBacklinksPanel = (panelEl, appState, app) => {
  if (!appState.currentPath) {
    panelEl.innerHTML =
      `<div class="toc-placeholder">${t("panel.no_document_selected")}</div>`;
    return;
  }
  updateBacklinksPanel(panelEl, appState, app);
};

const updateBacklinksPanel = (panelEl, appState, app) => {
  if (!appState.currentPath) {
    panelEl.innerHTML =
      `<div class="toc-placeholder">${t("panel.no_document_selected")}</div>`;
    return;
  }

  const backlinks = getBacklinks(appState.currentPath);

  if (backlinks.length === 0) {
    panelEl.innerHTML = `<div class="toc-placeholder">${t("panel.no_backlinks")}</div>`;
    return;
  }

  let html = '<ul class="backlinks-list">';
  for (const inPath of backlinks) {
    const meta = metaCache.get(inPath);
    if (meta) {
      html += `<li><a href="#${encodeURIComponent(
        inPath
      )}" class="backlink" data-doc-path="${inPath}">${meta.title}</a></li>`;
    }
  }
  html += "</ul>";
  panelEl.innerHTML = html;

  // Bind events
  panelEl.querySelectorAll("a[data-doc-path]").forEach((link) => {
    const docPath = link.getAttribute("data-doc-path");
    link.addEventListener("click", (e) => {
      e.preventDefault();
      openDocument(docPath);
    });
    link.addEventListener("mouseenter", (e) => handleQuickViewShow(e, docPath));
    link.addEventListener("mouseleave", handleQuickViewHide);
  });
};

const PANELS_MAP = new Map([
  [
    "toc",
    {
      id: "toc",
      title: t("panel.toc"),
      render: renderTocPanel,
      update: updateTocPanel,
      requiresDocument: true,
    },
  ],
  [
    "bookmarks",
    {
      id: "bookmarks",
      title: t("panel.bookmarks"),
      render: renderBookmarksPanel,
      update: updateBookmarksPanel,
      requiresDocument: false,
    },
  ],
  [
    "backlinks",
    {
      id: "backlinks",
      title: t("panel.backlinks"),
      render: renderBacklinksPanel,
      update: updateBacklinksPanel,
      requiresDocument: true,
    },
  ],
]);

const PANEL_LAYOUT = {
  left: [],
  right: ["bookmarks", "toc", "backlinks"],
  bottom: [],
};

function renderPanels(doc) {
  PANELS_MAP.get("toc").title = t("panel.toc");
  PANELS_MAP.get("bookmarks").title = t("panel.bookmarks");
  PANELS_MAP.get("backlinks").title = t("panel.backlinks");

  const panelContainers = {
    right: $.panelsRight,
  };

  for (const [location, container] of Object.entries(panelContainers)) {
    if (!container) continue;

    // Fade out existing panels
    const existingSections = container.querySelectorAll(".panel-section");
    existingSections.forEach((section) => {
      section.style.opacity = "0";
    });

    // Wait for fade out, then update content
    setTimeout(
      () => {
        container.innerHTML = "";
        const panelIds = PANEL_LAYOUT[location] || [];

        for (const id of panelIds) {
          const panelDef = PANELS_MAP.get(id);
          if (
            panelDef &&
            (!panelDef.requiresDocument || (panelDef.requiresDocument && doc))
          ) {
            const panelSection = document.createElement("div");
            panelSection.className = `panel-section ${id}-section`;
            panelSection.style.opacity = "0";
            panelSection.innerHTML = `<h4>${panelDef.title}</h4>`;

            const panelContent = document.createElement("div");
            panelContent.id = `${id}-panel`;
            panelContent.className = "panel-content";

            panelSection.appendChild(panelContent);
            container.appendChild(panelSection);

            // Render content after DOM is ready but before fade in
            requestAnimationFrame(() => {
              panelDef.render(panelContent, state, window.wikiApp);

              // Fade in new panel after content is rendered
              requestAnimationFrame(() => {
                panelSection.style.opacity = "1";
              });
            });
          }
        }
      },
      existingSections.length > 0 ? 200 : 0
    );
  }
}

function updatePanels() {
  const panelContainers = {
    right: $.panelsRight,
  };

  for (const location of Object.keys(panelContainers)) {
    const container = panelContainers[location];
    if (!container) continue;

    const panelIds = PANEL_LAYOUT[location] || [];
    for (const id of panelIds) {
      const panelDef = PANELS_MAP.get(id);
      if (panelDef && panelDef.update) {
        const panelContent = document.getElementById(`${id}-panel`);
        if (panelContent) {
          panelDef.update(panelContent, state, window.wikiApp);
        }
      }
    }
  }
}

// ============================================ 
// Mobile Sidebar
// ============================================ 
function toggleSidebar(forceState) {
  const open = forceState !== undefined ? forceState : !state.isSidebarOpen;

  if (open && state.isAuxPanelOpen) {
    toggleAuxPanel(false); // Close other panel
  }

  state.isSidebarOpen = open;
  $.sidebar.classList.toggle("is-open", open);

  const anyPanelOpen = state.isSidebarOpen || state.isAuxPanelOpen;
  $.mobileOverlay.classList.toggle("is-visible", anyPanelOpen);
  document.body.style.overflow = anyPanelOpen ? "hidden" : "";
}

function toggleAuxPanel(forceState) {
  const open = forceState !== undefined ? forceState : !state.isAuxPanelOpen;

  if (open && state.isSidebarOpen) {
    toggleSidebar(false); // Close other panel
  }

  state.isAuxPanelOpen = open;
  $.auxPanel.classList.toggle("is-open", open);

  const anyPanelOpen = state.isSidebarOpen || state.isAuxPanelOpen;
  $.mobileOverlay.classList.toggle("is-visible", anyPanelOpen);
  document.body.style.overflow = anyPanelOpen ? "hidden" : "";
}

// ============================================ 
// Home Page & Folder Page
// ============================================ 
function renderHomePage() {
  const dashboard = document.createElement("div");
  dashboard.className = "home-dashboard";

  // The main render loop
  HOME_CARDS.forEach((card) => {
    if (!card.id) return;

    const cardElement = document.createElement("div");
    cardElement.className = `home-card ${card.id}-card`;

    if (card.id === 'hero') {
        const heroContent = card.render(
          state,
          $,
          metaCache,
          graphIndex,
          getBacklinks,
          CONFIG,
          t
        );
        cardElement.innerHTML = heroContent;
    } else {
        const cardTitle = t(`card.${card.id}.title`);
        let headerHTML = "";
        if (cardTitle) {
          headerHTML = `
                    <div class="home-card-header">
                        <span class="icon">${card.icon}</span>
                        <h3>${cardTitle}</h3>
                    </div>
                `;
        }

        const contentHTML = card.render(
          state,
          $,
          metaCache,
          graphIndex,
          getBacklinks,
          CONFIG,
          t
        );
        cardElement.innerHTML = headerHTML + contentHTML;
    }
    dashboard.appendChild(cardElement);
  });

  $.homePageContent.innerHTML = ""; // Clear previous content
  $.homePageContent.appendChild(dashboard);

  // The post-render loop for binding events and initialization
  HOME_CARDS.forEach((card) => {
    if (!card.id) return;
    const cardElement = $.homePageContent.querySelector(`.${card.id}-card`);
    if (!cardElement) return;

    if (card.bindEvents) {
      // Pass only the dependencies that bindEvents needs
      card.bindEvents(
        cardElement,
        metaCache,
        renderTagResultsPage,
        openDocument
      );
    }
    if (card.init) {
      card.init(state, $, metaCache, graphIndex, getBacklinks, CONFIG, t);
    }
  });
}

function showHome() {
  cleanupHeroCard(); // Clean up hero card rotation interval

  state.currentPath = null;
  state.currentFolder = null;

  if (state.timeUpdater) {
    clearInterval(state.timeUpdater);
    state.timeUpdater = null;
  }

  $.placeholder.style.display = "none";
  $.document.style.display = "none";
  $.folderView.style.display = "none";
  $.homePageContent.style.display = "block";
  $.resultsPage.style.display = "none";
  if ($.commentsSection) $.commentsSection.style.display = "none";

  // Always render home page to ensure fresh data
  renderHomePage();

  state.timeUpdater = setInterval(updateTime, 1000);
  updateTime();

  updateActiveFileInList();
  renderPanels(null); // Clear panels for non-document pages

  window.location.hash = "";
  updateStatus(t("status.ready"));
}

function updateTime() {
  const now = new Date();
  const timeEl = document.getElementById("home-time");
  if (timeEl) {
    timeEl.textContent = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  }
}

function renderFolderPage(folderPath) {
  const filesInFolder = Array.from(metaCache.values()).filter(
    (doc) =>
      doc.path.startsWith(folderPath + "/") &&
      !doc.path.substring(folderPath.length + 1).includes("/")
  );
  const folderName = folderPath.split("/").pop();

  const dashboard = document.createElement("div");
  dashboard.className = "home-dashboard";

  // Hero card for the folder
  const heroCard = document.createElement("div");
  heroCard.className = "home-card hero-card";
  heroCard.innerHTML =
    `
        <h1><span class="icon" style="font-size: 2.5rem; vertical-align: middle;">📁</span> ${folderName}</h1>
        <p>${t('folder.documents_count').replace('{count}', filesInFolder.length)}</p>
    `;
  dashboard.appendChild(heroCard);

  // Dynamically render folder cards
  FOLDER_CARDS.forEach((card) => {
    if (!card.id) return;

    const cardElement = document.createElement("div");
    // Adjust grid-column for the documents card to be full-width
    const cardStyle =
      card.id === "folder-documents" ? 'style="grid-column: 1 / -1;"' : "";
    cardElement.className = `home-card ${card.id}-card`;
    cardElement.setAttribute("style", cardStyle);

    const cardTitle = t(`card.${card.id}.title`);
    let headerHTML = "";
    if (cardTitle) {
      headerHTML = `
                <div class="home-card-header">
                    <span class="icon">${card.icon}</span>
                    <h3>${cardTitle}</h3>
                </div>
            `;
    }

    const contentHTML = card.render(
      state,
      $,
      metaCache,
      graphIndex,
      getBacklinks,
      CONFIG,
      t,
      filesInFolder
    );
    cardElement.innerHTML = headerHTML + contentHTML;
    dashboard.appendChild(cardElement);
  });

  $.folderView.innerHTML = ""; // Clear previous content
  $.folderView.appendChild(dashboard);

  // Post-render for binding events
  FOLDER_CARDS.forEach((card) => {
    if (!card.id) return;
    const cardElement = $.folderView.querySelector(`.${card.id}-card`);
    if (!cardElement) return;

    if (card.bindEvents) {
      card.bindEvents(
        cardElement,
        metaCache,
        renderTagResultsPage,
        openDocument,
        filesInFolder
      );
    }
  });
}

function showFolderPage(folderPath) {
  cleanupHeroCard(); // Clean up hero card rotation interval
  state.currentPath = null;
  state.currentFolder = folderPath;
  if (state.timeUpdater) {
    clearInterval(state.timeUpdater);
    state.timeUpdater = null;
  }

  $.document.style.display = "none";
  $.placeholder.style.display = "none";
  $.homePageContent.style.display = "none";
  $.folderView.style.display = "block";
  $.resultsPage.style.display = "none";
  if ($.commentsSection) $.commentsSection.style.display = "none";

  renderFolderPage(folderPath);
  updateActiveFileInList();
  renderPanels(null); // Clear panels for non-document pages

  updateStatus(t("status.viewing_folder").replace("{folder}", folderPath));
}

// ============================================
// Search & Tag Results Page
// ============================================
function renderSearchResultsPage(results, query) {
  const resultsHTML =
    results.length > 0
      ? results
          .map((meta) => {
            const tagsHTML = meta.tags && meta.tags.length > 0
              ? `<div class="file-tags">${meta.tags.map(tag => `<span class="tag-badge">#${tag}</span>`).join(' ')}</div>`
              : '';
            return `
            <div class="recent-file-item" data-path="${meta.path}">
                <span class="recent-file-icon">📄</span>
                <div class="recent-file-info">
                    <div class="recent-file-title">${meta.title}</div>
                    ${tagsHTML}
                    <div class="recent-file-time">${meta.path}</div>
                </div>
            </div>
        `;
          })
          .join("")
      : `<p style="color: var(--c-text-tertiary); text-align: center; padding: var(--sp-4);">${t('search.no_results')}</p>`;

  // Create filtered metaCache with only search results
  const filteredMetaCache = new Map();
  results.forEach(meta => {
    filteredMetaCache.set(meta.path, meta);
  });

  // Import cards with filtered data
  const statsCardHTML = statsCard.render(state, $, filteredMetaCache, graphIndex, getBacklinks, CONFIG, t);
  const tagsCardHTML = tagsCard.render(state, $, filteredMetaCache, graphIndex, getBacklinks, CONFIG, t);

  const html =
    `
        <div class="home-dashboard">
            <div class="home-card hero-card">
                <h1>${t('search.title')}</h1>
                <p>${t('search.found').replace('{count}', results.length).replace('{query}', query)}</p>
            </div>
            <div class="home-card recent-card" style="grid-column: 1 / -1;">
                <div class="home-card-header">
                    <span class="icon">📄</span>
                    <h3>${t('common.documents')}</h3>
                </div>
                <div class="recent-files-list">
                    ${resultsHTML}
                </div>
            </div>
            <div class="home-card stats-card">
                <div class="home-card-header">
                    <span class="icon">📊</span>
                    <h3>${t('card.stats.title')}</h3>
                </div>
                ${statsCardHTML}
            </div>
            <div class="home-card tags-card">
                <div class="home-card-header">
                    <span class="icon">🏷️</span>
                    <h3>${t('card.tags.title')}</h3>
                </div>
                ${tagsCardHTML}
            </div>
        </div>
    `;

  $.resultsPage.innerHTML = html;

  $.resultsPage.querySelectorAll(".recent-file-item").forEach((item) => {
    item.addEventListener("click", () => {
      openDocument(item.dataset.path);
    });
  });

  // Bind tags card events with filtered metaCache
  const tagsCardElement = $.resultsPage.querySelector('.tags-card');
  if (tagsCardElement && tagsCard.bindEvents) {
    tagsCard.bindEvents(tagsCardElement, filteredMetaCache, renderTagResultsPage, openDocument);
  }

  showResultsPage();
}

function renderTagResultsPage(tag, results) {
  const resultsHTML =
    results.length > 0
      ? results
          .map((item) => {
            const meta = item.doc || item;
            const matchTypeLabel =
              item.matchType === "exact" ? t('tag.exact_match') : t('tag.partial_match');
            const matchedTagInfo = `<div class="cmd-matched-tag">${matchTypeLabel}: #${item.matchedTag}</div>`;
            const tagsHTML = meta.tags && meta.tags.length > 0
              ? `<div class="file-tags">${meta.tags.map(t => `<span class="tag-badge">#${t}</span>`).join(' ')}</div>`
              : '';

            return `
            <div class="recent-file-item" data-path="${meta.path}">
                <span class="recent-file-icon">📄</span>
                <div class="recent-file-info">
                    <div class="recent-file-title">${meta.title}</div>
                    ${matchedTagInfo}
                    ${tagsHTML}
                    <div class="recent-file-time">${meta.path}</div>
                </div>
            </div>
        `;
          })
          .join("")
      : `<p style="color: var(--c-text-tertiary); text-align: center; padding: var(--sp-4);">${t('tag.no_results')}</p>`;

  // Create filtered metaCache with only tag search results
  const filteredMetaCache = new Map();
  results.forEach(item => {
    const meta = item.doc || item;
    filteredMetaCache.set(meta.path, meta);
  });

  // Render cards with filtered data
  const statsCardHTML = statsCard.render(state, $, filteredMetaCache, graphIndex, getBacklinks, CONFIG, t);
  const tagsCardHTML = tagsCard.render(state, $, filteredMetaCache, graphIndex, getBacklinks, CONFIG, t);

  const html =
    `
        <div class="home-dashboard">
            <div class="home-card hero-card">
                <h1>#${tag}</h1>
                <p>${t('tag.found').replace('{count}', results.length)}</p>
            </div>
            <div class="home-card recent-card" style="grid-column: 1 / -1;">
                <div class="home-card-header">
                    <span class="icon">📄</span>
                    <h3>${t('common.documents')}</h3>
                </div>
                <div class="recent-files-list">
                    ${resultsHTML}
                </div>
            </div>
            <div class="home-card stats-card">
                <div class="home-card-header">
                    <span class="icon">📊</span>
                    <h3>${t('card.stats.title')}</h3>
                </div>
                ${statsCardHTML}
            </div>
            <div class="home-card tags-card">
                <div class="home-card-header">
                    <span class="icon">🏷️</span>
                    <h3>${t('card.tags.title')}</h3>
                </div>
                ${tagsCardHTML}
            </div>
        </div>
    `;
  $.resultsPage.innerHTML = html;

  $.resultsPage.querySelectorAll(".recent-file-item").forEach((item) => {
    item.addEventListener("click", () => {
      openDocument(item.dataset.path);
    });
  });

  // Bind tags card events with filtered metaCache
  const tagsCardElement = $.resultsPage.querySelector('.tags-card');
  if (tagsCardElement && tagsCard.bindEvents) {
    tagsCard.bindEvents(tagsCardElement, filteredMetaCache, renderTagResultsPage, openDocument);
  }

  showResultsPage();
}

function showResultsPage() {
  state.currentPath = null;
  state.currentFolder = null;
  if (state.timeUpdater) {
    clearInterval(state.timeUpdater);
    state.timeUpdater = null;
  }

  $.placeholder.style.display = "none";
  $.document.style.display = "none";
  $.folderView.style.display = "none";
  $.homePageContent.style.display = "none";
  $.resultsPage.style.display = "block";
  if ($.commentsSection) $.commentsSection.style.display = "none";

  updateActiveFileInList();
  renderPanels(null); // Clear panels for non-document pages
  updateStatus(t("status.viewing_search_results"));
}

// ============================================ 
// File Tree Rendering
// ============================================ 
function renderFileTree() {
  const tree = buildTree(Array.from(metaCache.values()));
  $.fileTree.innerHTML = renderTreeHTML(tree);

  $.fileTree.querySelectorAll(".file-item").forEach((item) => {
    const path = item.dataset.path;
    item.addEventListener("click", () => openDocument(path));
    item.addEventListener("mouseenter", (e) => handleQuickViewShow(e, path));
    item.addEventListener("mouseleave", handleQuickViewHide);
  });

  $.fileTree.querySelectorAll(".btn-folder-graph").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openFolderGraph(e.currentTarget.dataset.folderPath);
    });
  });

  $.fileTree.querySelectorAll(".folder-name-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      showFolderPage(e.currentTarget.dataset.folderPath);
    });
  });
}

function buildTree(files) {
  const root = { name: "", path: "", children: {}, files: [] };
  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current.children[part]) {
        const folderPath = parts.slice(0, i + 1).join("/");
        current.children[part] = {
          name: part,
          path: folderPath,
          children: {}, 
          files: [],
        };
      }
      current = current.children[part];
    }
    current.files.push(file);
  }
  return root;
}

function renderTreeHTML(node, level = 0) {
  let html = "";
  const sortedChildren = Object.entries(node.children).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  for (const [name, child] of sortedChildren) {
    html += `
            <details class="folder" ${level === 0 ? "open" : ""}>
                <summary style="padding-left: calc(var(--sp-3) + ${ 
                  level * 20
                }px)">
                    <span class="folder-icon">📁</span>
                    <a href="#" class="folder-name-link" data-folder-path="${
                      child.path
                    }">${name}</a>
                    <button class="btn ghost btn-folder-graph" data-folder-path="${
                      child.path
                    }" title="Open graph for ${name}">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="5" cy="5" r="2.5" fill="currentColor"/><circle cx="15" cy="5" r="2.5" fill="currentColor"/><circle cx="5" cy="15" r="2.5" fill="currentColor"/><circle cx="15" cy="15" r="2.5" fill="currentColor"/><path d="M7.5 5h5M7.5 15h5M5 7.5v5M15 7.5v5" stroke="currentColor" stroke-width="2"/></svg>
                    </button>
                </summary>
                ${renderTreeHTML(child, level + 1)}
            </details>
        `;
  }

  const sortedFiles = node.files.sort((a, b) => a.title.localeCompare(b.title));
  for (const file of sortedFiles) {
    html += `
            <div class="file-item" data-path="${ 
              file.path
            }" style="padding-left: calc(var(--sp-5) + ${level * 20}px)">
                <span class="file-icon">📄</span>
                <span>${file.title}</span>
            </div>
        `;
  }
  return html;
}

function updateActiveFileInList() {
  // Update file items
  $.fileTree.querySelectorAll(".file-item").forEach((el) => {
    el.classList.remove("active");
    if (el.dataset.path === state.currentPath) {
      el.classList.add("active");
    }
  });

  // Update folder items
  $.fileTree.querySelectorAll(".folder-name-link").forEach((el) => {
    el.classList.remove("active");
    el.closest("summary")?.classList.remove("active");
    if (el.dataset.folderPath === state.currentFolder) {
      el.classList.add("active");
      el.closest("summary")?.classList.add("active");
    }
  });
}

// ============================================ 
// Recent Files Tracking (LocalStorage)
// ============================================ 
function addToRecentFiles(path) {
  const MAX_RECENT = 10;
  let recentFiles = JSON.parse(localStorage.getItem("recentFiles") || "[]");

  // Remove if already exists
  recentFiles = recentFiles.filter((item) => item.path !== path);

  // Add to beginning with timestamp
  recentFiles.unshift({
    path: path,
    timestamp: Date.now(),
  });

  // Keep only MAX_RECENT items
  recentFiles = recentFiles.slice(0, MAX_RECENT);

  localStorage.setItem("recentFiles", JSON.stringify(recentFiles));
}

// ============================================ 
// Quick View
// ============================================ 
function handleQuickViewShow(event, path) {
  if (path === state.currentPath) return;
  clearTimeout(state.hideQuickViewTimeout);
  clearTimeout(state.showQuickViewTimeout);

  state.showQuickViewTimeout = setTimeout(async () => {
    const meta = metaCache.get(path);
    if (!meta) return;

    $.quickView.classList.add("visible");
    state.isQuickViewVisible = true;

    $.quickViewTitle.querySelector(".text").textContent = meta.title;
    $.quickViewBody.innerHTML = '<div class="quick-view-loading">...</div>';

    let content = fileCache.get(path);
    if (!content) {
      content = await fetchRaw(path, meta.sha);
      fileCache.set(path, content);
    }

    const displayContent = content.replace(/^---[\s\S]*?---/, "").trim();
    const previewHtml = state.converter.makeHtml(
      displayContent.substring(0, 3000) +
        (displayContent.length > 3000 ? "..." : "")
    );
    $.quickViewBody.innerHTML = previewHtml;

    $.quickView.onclick = () => {
      openDocument(path);
      handleQuickViewHide(true);
    };
  }, 500);
}

function handleQuickViewHide(immediate = false) {
  clearTimeout(state.showQuickViewTimeout);
  const delay = immediate ? 0 : 300;
  state.hideQuickViewTimeout = setTimeout(() => {
    if (state.isQuickViewVisible) {
      $.quickView.classList.remove("visible");
      state.isQuickViewVisible = false;
      $.quickView.onclick = null;
    }
  }, delay);
}

// ============================================ 
// Document Rendering
// ============================================ 
async function openDocument(path) {
  handleQuickViewHide();
  cleanupHeroCard(); // Clean up hero card rotation interval
  if (state.isSidebarOpen) {
    toggleSidebar(false);
  }

  if (state.currentPath === path) return;

  const meta = metaCache.get(path);
  if (!meta) {
    console.error(`Document not found: ${path}`);
    return;
  }

  $.contentArea.classList.add("fade-out");

  setTimeout(async () => {
    state.currentPath = path;
    state.currentFolder = null;
    $.placeholder.style.display = "none";
    $.folderView.style.display = "none";
    $.homePageContent.style.display = "none";
    $.resultsPage.style.display = "none";
    $.document.style.display = "block";
    $.commentsSection.style.display = "none"; // Hide comments initially
    updateActiveFileInList();

    // Add to recent files
    addToRecentFiles(path);

    // Update bookmark button state
    updateBookmarkButtonState(path);
    $.btnBookmark.onclick = () => toggleBookmark(path);

    let content = fileCache.get(path);
    if (!content) {
      updateStatus(t("status.loading").replace("{title}", meta.title));
      content = await fetchRaw(path, meta.sha);
      fileCache.set(path, content);
    }

    const displayContent = content.replace(/^---[\s\S]*?---/, "").trim();
    $.docTitle.textContent = meta.title;
    $.docContent.innerHTML = state.converter.makeHtml(displayContent);

    // Render metadata
    let metaHtml = "";
    if (meta.author) {
      metaHtml += `<span><span class="meta-label">Author:</span> ${meta.author}</span>`;
    }
    if (meta.date) {
      metaHtml += `<span><span class="meta-label">Date:</span> ${meta.date}</span>`;
    }
    $.docMetaInfo.innerHTML = metaHtml;

    $.docContent.querySelectorAll("a[data-path]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        openDocument(link.dataset.path);
      });
      link.addEventListener("mouseenter", (e) =>
        handleQuickViewShow(e, link.dataset.path)
      );
      link.addEventListener("mouseleave", handleQuickViewHide);
    });

    $.docTags.innerHTML =
      meta.tags && meta.tags.length > 0
        ? meta.tags
            .map((tag) => `<span class="tag" data-tag="${tag}">${tag}</span>`)
            .join("")
        : "";

    // Add click events to tags
    $.docTags.querySelectorAll(".tag").forEach((tagEl) => {
      tagEl.addEventListener("click", () => {
        const tag = tagEl.dataset.tag;
        const results = Array.from(metaCache.values())
          .filter(
            (meta) =>
              meta.tags &&
              meta.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
          )
          .map((meta) => ({ doc: meta, matchedTag: tag, matchType: "exact" }));
        renderTagResultsPage(tag, results);
      });
    });

    renderBreadcrumbs(path);
    renderBacklinks(path);
    renderPanels(meta);

    // Initial highlight for short documents
    requestAnimationFrame(updatePanels);

    if (typeof Prism !== "undefined") {
      Prism.highlightAllUnder($.docContent);
    }

    window.location.hash = encodeURIComponent(path);
    updateStatus(t("status.viewing").replace("{title}", meta.title));

    const outlinks = Array.from(graphIndex.get(path)?.out || []);
    if (outlinks.length > 0) {
      prefetchDocuments(outlinks, 5);
    }

    // Load comments for the document
    loadComments(path, meta.title);

    $.contentArea.classList.remove("fade-out");
    $.contentArea.scrollTop = 0;
  }, 200);
}

function renderBreadcrumbs(path) {
  const parts = path.replace(/\.mdx?$/, "").split("/");
  let cumulativePath = "";
  const homeCrumb = '<a href="#" class="crumb" data-path="home">Home</a>';

  const pathCrumbs = parts.map((part, i) => {
    const isLast = i === parts.length - 1;
    if (isLast) {
      return `<span class="crumb current">${part}</span>`;
    } else {
      cumulativePath += (cumulativePath ? "/" : "") + part;
      return `<a href="#" class="crumb" data-path="folder/${cumulativePath}">${part}</a>`;
    }
  });

  $.breadcrumbs.innerHTML = [homeCrumb, ...pathCrumbs].join(
    ' <span class="crumb-sep">/</span> '
  );

  $.breadcrumbs.querySelectorAll("a.crumb").forEach((crumb) => {
    crumb.addEventListener("click", (e) => {
      e.preventDefault();
      const target = e.target.dataset.path;
      if (target === "home") {
        showHome();
      } else if (target.startsWith("folder/")) {
        showFolderPage(target.replace("folder/", ""));
      }
    });
  });
}

function renderBacklinks(path) {
  const backlinks = getBacklinks(path);
  if (backlinks.length === 0) {
    $.backlinks.innerHTML = "";
    return;
  }

  let html = '<h3>Backlinks</h3><ul class="backlinks-list">';
  for (const inPath of backlinks) {
    const meta = metaCache.get(inPath);
    if (meta) {
      html += `<li><a href="#${encodeURIComponent(
        inPath
      )}" class="backlink" data-doc-path="${inPath}">${meta.title}</a></li>`;
    }
  }
  html += "</ul>";
  $.backlinks.innerHTML = html;

  $.backlinks.querySelectorAll("a[data-doc-path]").forEach((link) => {
    const docPath = link.getAttribute("data-doc-path");
    link.addEventListener("click", (e) => {
      e.preventDefault();
      openDocument(docPath);
    });
    link.addEventListener("mouseenter", (e) => handleQuickViewShow(e, docPath));
    link.addEventListener("mouseleave", handleQuickViewHide);
  });
}

// ============================================ 
// COMMENTS (Giscus)
// ============================================ 

function loadComments(docPath, docTitle) {
  const giscusContainer = $.commentsSection.querySelector(".giscus");
  if (!giscusContainer) return;

  // Clear existing giscus iframe if any
  giscusContainer.innerHTML = "";

  // Create giscus script element
  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.setAttribute("data-repo", CONFIG.giscus.repo);
  script.setAttribute("data-repo-id", CONFIG.giscus.repoId);
  script.setAttribute("data-category", CONFIG.giscus.category);
  script.setAttribute("data-category-id", CONFIG.giscus.categoryId);
  script.setAttribute("data-mapping", CONFIG.giscus.mapping);
  script.setAttribute("data-strict", CONFIG.giscus.strict);
  script.setAttribute("data-reactions-enabled", CONFIG.giscus.reactionsEnabled);
  script.setAttribute("data-emit-metadata", CONFIG.giscus.emitMetadata);
  script.setAttribute("data-input-position", CONFIG.giscus.inputPosition);
  script.setAttribute("data-lang", CONFIG.giscus.lang);
  script.setAttribute("data-loading", CONFIG.giscus.loading);
  script.crossOrigin = "anonymous";
  script.async = true;

  // Set theme based on current theme
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const giscusTheme = currentTheme === "dark" ? "dark" : "light";
  script.setAttribute("data-theme", giscusTheme);

  // Use document path as the term for mapping
  script.setAttribute("data-term", docPath);

  giscusContainer.appendChild(script);
  $.commentsSection.style.display = "block";
}

// ============================================ 
// Search & Commands
// ============================================ 
function initSearch() {
  state.searchIndex = new FlexSearch.Document({
    document: {
      id: "path",
      index: ["title", "content"],
      store: ["title", "path"],
    },
    tokenize: "forward",
    enrich: true,
  });
  for (const [path, meta] of metaCache) {
    const content = fileCache.get(path) || "";
    state.searchIndex.add({
      path,
      title: meta.title,
      content: content.replace(/^---n[\s\S]*?n---/, "").trim(),
    });
  }
}

async function search(query) {
  if (!state.searchIndex || !query.trim()) return [];
  const titleResults = await state.searchIndex.search(query, {
    field: "title",
    limit: 10,
    enrich: true,
  });
  const contentResults = await state.searchIndex.search(query, {
    field: "content",
    limit: 10,
    enrich: true,
  });
  const combined = new Map();
  const processResults = (results) => {
    results.forEach((fieldResult) => {
      fieldResult.result.forEach((doc) => {
        if (!combined.has(doc.id)) {
          // Get full metadata from metaCache to preserve tags and other info
          const fullMeta = metaCache.get(doc.id);
          combined.set(doc.id, fullMeta ? { ...fullMeta } : { path: doc.id, title: doc.doc?.title || doc.id });
        }
      });
    });
  };
  processResults(titleResults);
  processResults(contentResults);
  return Array.from(combined.values());
}

window.wikiApp = {
  openDocument,
  openGraph,
  openRandomDoc,
  clearCache,
  toggleTheme,
  resetSettings,
  getCurrentPath: () => state.currentPath,
  getDocContentEl: () => $.docContent,
  getContentAreaEl: () => $.contentArea,
};

function showCommandResults() {
  $.commandResults.classList.add("visible");
}

function hideCommandResults() {
  $.commandResults.classList.remove("visible");
}

function handleCommandInput(event) {
  const query = event.target.value.trim();
  if (!query) {
    $.commandResults.style.display = "none";
    return;
  }
  if (query.startsWith(">")) {
    const cmdQuery = query.slice(1).trim().toLowerCase();
    const matches = COMMANDS.filter((cmd) =>
      cmd.label.toLowerCase().includes(cmdQuery)
    );
    renderCommandResults(matches, true, cmdQuery);
  } else if (query.startsWith("#")) {
    const tagQuery = query.slice(1).trim().toLowerCase();
    if (!tagQuery) {
      $.commandResults.style.display = "none";
      return;
    }

    const exactMatches = [];
    const partialMatches = [];
    const matchedPaths = new Set();

    for (const meta of metaCache.values()) {
      if (!meta.tags || meta.tags.length === 0) continue;

      const lowerCaseTags = meta.tags.map((t) => t.toLowerCase());

      // Exact matches
      if (lowerCaseTags.includes(tagQuery)) {
        if (!matchedPaths.has(meta.path)) {
          exactMatches.push({
            doc: meta,
            matchedTag: meta.tags.find((t) => t.toLowerCase() === tagQuery),
            matchType: "exact",
          });
          matchedPaths.add(meta.path);
        }
      }
      // Partial matches
      else {
        const partial = meta.tags.find((t) =>
          t.toLowerCase().includes(tagQuery)
        );
        if (partial && !matchedPaths.has(meta.path)) {
          partialMatches.push({
            doc: meta,
            matchedTag: partial,
            matchType: "partial",
          });
          matchedPaths.add(meta.path);
        }
      }
    }

    const results = [...exactMatches, ...partialMatches];
    renderCommandResults(results, false, tagQuery, true);
  } else {
    search(query).then((results) =>
      renderCommandResults(results, false, query)
    );
  }
}

function renderCommandResults(items, isCommand, query, isTagSearch = false) {
  if (items.length === 0) {
    $.commandResults.style.display = "none";
    return;
  }
  const queryRegex = new RegExp(
    `(${query.replace(/[-\/\^$*+?.()|[\]{}]/g, "\\$&")})`,
    "gi"
  );
  $.commandResults.innerHTML = items
    .map((item, index) => {
      const animationStyle = `animation-delay: ${index * 40}ms;`;
      if (isCommand) {
        return `<div class="command-item animate-stagger" style="${animationStyle}" data-action="${item.label}"><span class="cmd-icon">${item.icon}</span><span class="cmd-label">${item.label}</span></div>`;
      } else {
        const meta = item.doc || item;
        const titleHighlight = meta.title.replace(
          queryRegex,
          "<mark>$1</mark>"
        );
        let contextSnippet = "";
        let matchedTagInfo = "";

        if (isTagSearch && item.matchedTag) {
          contextSnippet = meta.description || "";
          const matchTypeLabel =
            item.matchType === "exact" ? "Exact Match" : "Partial Match";
          matchedTagInfo = `<div class="cmd-matched-tag">${matchTypeLabel}: #${item.matchedTag}</div>`;
        } else {
          const content = (fileCache.get(meta.path) || "")
            .replace(/^---[\s\S]*?---/, "")
            .trim();
          const strippedContent = content
            .replace(/<[^>]*>/g, "")
            .replace(/[[.*]]/g, " ");
          const match = queryRegex.exec(strippedContent);
          if (match) {
            const startIndex = Math.max(0, match.index - 40);
            const endIndex = Math.min(strippedContent.length, match.index + 60);
            contextSnippet =
              "..." +
              strippedContent
                .substring(startIndex, endIndex)
                .replace(queryRegex, "<mark>$1</mark>") +
              "...";
          } else {
            contextSnippet = meta.description || "";
          }
        }

        return `<div class="command-item animate-stagger" style="${animationStyle}" data-path="${meta.path}"><span class="cmd-icon">📄</span><div><div class="cmd-label">${titleHighlight}</div>${matchedTagInfo}<div class="cmd-context">${contextSnippet}</div><div class="cmd-path">${meta.path}</div></div></div>`;
      }
    })
    .join("");
  $.commandResults.style.display = "block";

  $.commandResults.querySelectorAll(".command-item").forEach((item) => {
    item.addEventListener("click", () => {
      if (item.dataset.path) {
        openDocument(item.dataset.path);
      } else if (item.dataset.action) {
        const command = COMMANDS.find(
          (cmd) => cmd.label === item.dataset.action
        );
        if (command) command.action();
      }
      $.commandInput.value = "";
      $.commandResults.style.display = "none";
    });
  });
}

function openRandomDoc() {
  const paths = Array.from(metaCache.keys());
  const randomPath = paths[Math.floor(Math.random() * paths.length)];
  openDocument(randomPath);
}

// ============================================ 
// Graph
// ============================================ 
function openFolderGraph(folderPath) {
  const filesInFolder = Array.from(metaCache.keys()).filter((path) =>
    path.startsWith(folderPath + "/")
  );
  if (metaCache.has(folderPath + ".md")) filesInFolder.push(folderPath + ".md");

  const nodes = filesInFolder.map((path) => ({
    id: path,
    name: metaCache.get(path).title,
  }));
  const nodeIdsInFolder = new Set(filesInFolder);
  const links = [];
  for (const path of filesInFolder) {
    const node = graphIndex.get(path);
    if (node) {
      for (const target of node.out) {
        if (nodeIdsInFolder.has(target)) links.push({ source: path, target });
      }
    }
  }
  const folderGraphData = { nodes, links };
  $.graphModal.querySelector(
    ".graph-title"
  ).textContent = `Graph: ${folderPath}`;
  openGraph(folderGraphData);
}

function openGraph(graphData = null) {
    if (state.graphInstance) {
        state.graphInstance.destroy();
        state.graphInstance = null;
    }
    $.graphContainer.innerHTML = '';
    $.graphContainer.style.position = 'relative';

    state.currentGraphData = graphData;
    $.graphModal.showModal();
    document.body.classList.add("modal-open");

    if (!graphData) {
        $.graphModal.querySelector(".graph-title").textContent = "Document Graph";
        const nodes = Array.from(metaCache.keys()).map((path) => ({
            id: path,
            name: metaCache.get(path)?.title || path,
        }));
        const links = [];
        for (const [path, node] of graphIndex) {
            if (node.out) {
                for (const target of node.out) {
                    if (graphIndex.has(target)) {
                        links.push({ source: path, target: target });
                    }
                }
            }
        }
        state.currentGraphData = { nodes, links };
    }

    const btn3D = $.graphModal.querySelector("#btn-toggle-3d");
    btn3D.classList.toggle("active", state.graphViewMode === "3d");

    const btnPhysics = $.graphModal.querySelector("#btn-toggle-physics");
    if (btnPhysics) {
        btnPhysics.classList.add("active");
        btnPhysics.title = "Physics: ON";
    }

    setTimeout(() => {
        if (state.currentGraphData && state.currentGraphData.nodes.length > 0) {
            state.graphInstance = new VanillaGraph($.graphContainer, {
                data: state.currentGraphData,
                mode: state.graphViewMode,
                onNodeClick: (node) => {
                    window.dispatchEvent(new CustomEvent('open-path', { detail: { path: node.id } }));
                }
            });
        } else {
            $.graphContainer.innerHTML = '<p style="text-align: center; color: var(--c-text-tertiary); padding: var(--sp-8);">No data to display in graph.</p>';
        }
    }, 50);
}

function openPanelsModal() {
  if (!state.currentPath) return;

  // Copy content from aux panel
  const auxPanel = document.getElementById("panels-right");
  if (auxPanel) {
    $.panelsModalBody.innerHTML = auxPanel.innerHTML;
  }

  $.panelsModal.showModal();
}

function closePanelsModal() {
  $.panelsModal.close();
  $.panelsModalBody.innerHTML = "";
}

function closeGraph() {
    if (state.graphInstance) {
        state.graphInstance.destroy();
        state.graphInstance = null;
    }
    state.currentGraphData = null;
    $.graphContainer.innerHTML = '';
    $.graphModal.close();
    document.body.classList.remove("modal-open");
}

// ============================================
// Settings Panel
// ============================================
function toggleSettingsPanel(forceState) {
    state.isSettingsPanelOpen = forceState !== undefined ? forceState : !state.isSettingsPanelOpen;
    $.settingsPanel.classList.toggle("is-open", state.isSettingsPanelOpen);
    $.settingsBackdrop.classList.toggle("is-open", state.isSettingsPanelOpen);
}

function updateFontSize(size) {
    // Update both the base font size and the root font size
    document.documentElement.style.setProperty("--text-base", `${size}px`);
    document.documentElement.style.fontSize = `${size}px`;
    localStorage.setItem("fontSize", size);
    if ($.fontSizeValue) {
        $.fontSizeValue.textContent = `${size}px`;
    }
}

function updateFontFamily(font) {
    document.documentElement.style.setProperty("--font-system", font);
    localStorage.setItem("fontFamily", font);
}

function resetSettings() {
    // Reset to defaults
    const defaultFontSize = 16;
    const defaultFontFamily = "Inter, sans-serif";
    const defaultLanguage = "en";

    // Update UI
    $.fontSizeSlider.value = defaultFontSize;
    updateFontSize(defaultFontSize);

    $.fontFamilySelect.value = defaultFontFamily;
    updateFontFamily(defaultFontFamily);

    $.languageSelect.value = defaultLanguage;
    setLanguage(defaultLanguage);

    // Show confirmation
    updateStatus(t("status.settings_reset"));
    setTimeout(() => updateStatus(t("status.ready")), 2000);
}

function applyBranding() {
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --c-primary: ${CONFIG.accentColor};
            --c-primary-hover: ${CONFIG.accentColor};
            --c-primary-light: ${CONFIG.accentColor}26; /* 15% opacity */
        }
        body::before {
            background: radial-gradient(
                circle at 20% 30%,
                ${CONFIG.gradientColors[0]} 0%,
                transparent 50%
            ),
            radial-gradient(
                circle at 80% 70%,
                ${CONFIG.gradientColors[1]} 0%,
                transparent 50%
            );
        }
    `;
    document.head.appendChild(style);
    document.querySelector('meta[name="description"]').setAttribute('content', CONFIG.blogDescription);
}


// ============================================ 

// Theme & Events

// ============================================ 

function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "dark";

  document.documentElement.setAttribute("data-theme", savedTheme);

  $.btnTheme.addEventListener("click", toggleTheme);
}

async function toggleTheme(event) {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";

  // Check if View Transition API is supported
  if (!document.startViewTransition) {
    // Fallback for browsers that don't support View Transition API
    document.documentElement.setAttribute("data-theme", next);
    if (state.graphInstance) {
      state.graphInstance.setTheme(next);
    }
    localStorage.setItem("theme", next);
    updateGiscusTheme(next);
    return;
  }

  // Step 1: Fade out Giscus first
  const iframe = document.querySelector("iframe.giscus-frame");
  if (iframe) {
    iframe.style.transition = "opacity 0.3s ease";
    iframe.style.opacity = "0";
  }

  // Wait for Giscus to fade out
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Step 2: Get the position of the theme button for ripple effect
  const themeButton = event?.currentTarget || $.btnTheme;
  const rect = themeButton.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  // Calculate the maximum radius needed to cover the entire screen
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  // Set CSS custom properties for the clip-path animation
  document.documentElement.style.setProperty("--theme-transition-x", `${x}px`);
  document.documentElement.style.setProperty("--theme-transition-y", `${y}px`);
  document.documentElement.style.setProperty(
    "--theme-transition-end-radius",
    `${endRadius}px`
  );

  // Step 3: Start the view transition with slower animation
  const transition = document.startViewTransition(() => {
    document.documentElement.setAttribute("data-theme", next);
    if (state.graphInstance) {
      state.graphInstance.setTheme(next);
    }
    localStorage.setItem("theme", next);
  });

  // Step 4: After transition finishes, update and fade in Giscus
  await transition.finished;

  if (iframe) {
    const giscusTheme = next === "dark" ? "dark" : "light";
    iframe.contentWindow.postMessage(
      { giscus: { setConfig: { theme: giscusTheme } } },
      "https://giscus.app"
    );

    // Wait a bit for Giscus to update, then fade in
    setTimeout(() => {
      iframe.style.opacity = "1";
    }, 300);
  }
}

function updateGiscusTheme(theme) {
  const iframe = document.querySelector("iframe.giscus-frame");
  if (!iframe) return;

  // Fade out iframe
  iframe.style.transition = "opacity 0.3s ease";
  iframe.style.opacity = "0";

  // Wait for fade out, then update theme
  setTimeout(() => {
    const giscusTheme = theme === "dark" ? "dark" : "light";
    iframe.contentWindow.postMessage(
      { giscus: { setConfig: { theme: giscusTheme } } },
      "https://giscus.app"
    );

    // Fade back in after a short delay for theme to apply
    setTimeout(() => {
      iframe.style.opacity = "1";
    }, 200);
  }, 300);
}

async function clearCache() {
  const { clearCache: clearDB } = await import("./cache.js");
  await clearDB();
  alert("Cache cleared");
}

function toggleMobileSearch() {
  state.isSearchMobileOpen = !state.isSearchMobileOpen;
  const header = document.querySelector(".header");

  if (state.isSearchMobileOpen) {
    // Hide everything except search container
    header.classList.add("search-mode");
    $.commandInput.focus();
  } else {
    header.classList.remove("search-mode");
    $.commandInput.value = "";
    $.commandResults.style.display = "none";
  }
}

function bindEvents() {
  // Mobile search button
  $.btnSearchMobile?.addEventListener("click", toggleMobileSearch);
  $.btnSearchDesktop?.addEventListener("click", () => toggleDesktopSearch(true));

  // The search close button was removed, so this listener is no longer needed.
  // $.btnSearchClose?.addEventListener("click", () => {
  //   if (state.isSearchDesktopOpen) {
  //     toggleDesktopSearch(false);
  //   }
  //   if (state.isSearchMobileOpen) {
  //     toggleMobileSearch();
  //   }
  // });

  $.commandInput?.addEventListener("blur", () => {
    // If mobile search is open, close it when the input loses focus.
    if (state.isSearchMobileOpen) {
      // Use a small timeout to allow a click on a result to register before closing
      setTimeout(() => {
        // Re-check focus. If focus has moved to a child of the results, don't close.
        if (!$.commandResults.contains(document.activeElement)) {
          toggleMobileSearch();
        }
      }, 150);
    }
  });

  $.btnSettings?.addEventListener("click", () => toggleSettingsPanel(true));
  $.btnSettingsClose?.addEventListener("click", () => toggleSettingsPanel(false));
  $.settingsBackdrop?.addEventListener("click", () => toggleSettingsPanel(false));
  $.btnResetSettings?.addEventListener("click", resetSettings);

  $.fontSizeSlider?.addEventListener("input", (e) => updateFontSize(e.target.value));
  $.fontFamilySelect?.addEventListener("change", (e) => updateFontFamily(e.target.value));
  $.languageSelect?.addEventListener("change", (e) => setLanguage(e.target.value));

  $.commandInput?.addEventListener("input", handleCommandInput);

  $.commandInput?.addEventListener("click", handleCommandInput);

  $.commandInput?.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = e.target.value.trim();
      if (!query || query.startsWith(">")) return;

      $.commandResults.style.display = "none";

      if (query.startsWith("#")) {
        const tagQuery = query.slice(1).trim().toLowerCase();
        if (!tagQuery) return;

        const exactMatches = [];
        const partialMatches = [];
        const matchedPaths = new Set();

        for (const meta of metaCache.values()) {
          if (!meta.tags || meta.tags.length === 0) continue;

          const lowerCaseTags = meta.tags.map((t) => t.toLowerCase());

          if (lowerCaseTags.includes(tagQuery)) {
            if (!matchedPaths.has(meta.path)) {
              exactMatches.push({
                doc: meta,
                matchedTag: meta.tags.find((t) => t.toLowerCase() === tagQuery),
                matchType: "exact",
              });
              matchedPaths.add(meta.path);
            }
          } else {
            const partial = meta.tags.find((t) =>
              t.toLowerCase().includes(tagQuery)
            );
            if (partial && !matchedPaths.has(meta.path)) {
              partialMatches.push({
                doc: meta,
                matchedTag: partial,
                matchType: "partial",
              });
              matchedPaths.add(meta.path);
            }
          }
        }
        const results = [...exactMatches, ...partialMatches];
        renderTagResultsPage(tagQuery, results);
      } else {
        const results = await search(query);
        renderSearchResultsPage(results, query);
      }
    }
  });

  // Init
  updateBlogName();
  initShowdown();
  initTheme();
  // initGraph(); // Removed as it seems to be part of old, replaced graph logic
  renderPanels(null); // Initial render for non-doc panels

  // Event Listeners
  $.commandInput.addEventListener("input", handleCommandInput);
  $.homeLink.addEventListener("click", (e) => {
    e.preventDefault();
    showHome();
  });
  $.btnSidebarToggle.addEventListener("click", () => toggleSidebar());
  $.mobileOverlay.addEventListener("click", () => {
    if (state.isSidebarOpen) {
      toggleSidebar(false);
    }
    if (state.isAuxPanelOpen) {
      toggleAuxPanel(false);
    }
  });

  $.contentArea.addEventListener(
    "scroll",
    () => {
      if (state.currentPath) {
        requestAnimationFrame(updatePanels);
      }
    },
    { passive: true }
  );

  document.addEventListener("click", (e) => {
    if (!$.commandInput.contains(e.target) && !$.commandResults.contains(e.target)) {
      $.commandResults.style.display = "none";
    }
  });

  const debouncedResize = debounce(() => {
    if ($.graphContainer.offsetParent && state.graphInstance) {
      // The new graph module resizes with a visibility observer, but not on window resize.
      // For a better experience, we can destroy and recreate the graph.
      openGraph(state.currentGraphData);
    }
  }, 150);

  window.addEventListener("resize", debouncedResize);

  $.btnGraph?.addEventListener("click", () => openGraph());
  $.btnPanels?.addEventListener("click", () => openPanelsModal());
  $.closePanels?.addEventListener("click", () => closePanelsModal());
  $.btnAuxPanelToggle?.addEventListener("click", () => toggleAuxPanel());

  $.closeGraph?.addEventListener("click", closeGraph);

  window.addEventListener("open-path", (e) => {
    const { path } = e.detail;
    if (path) {
      openDocument(path);
      closeGraph();
    }
  });

  $.homeLink?.addEventListener("click", (e) => {
    e.preventDefault();
    showHome();
  });

  window.addEventListener("hashchange", () => {
    const decodedHash = decodeURIComponent(window.location.hash.slice(1));

    if (decodedHash && metaCache.has(decodedHash)) openDocument(decodedHash);
    else showHome();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $.graphModal.open) closeGraph();
  });

  $.quickView.addEventListener("mouseenter", () =>
    clearTimeout(state.hideQuickViewTimeout)
  );

  $.quickView.addEventListener("mouseleave", () => handleQuickViewHide());

  $.graphModal
    .querySelector("#btn-toggle-physics")
    ?.addEventListener("click", () => {
      if (state.graphInstance) {
        state.graphInstance.togglePhysics();
        const btn = $.graphModal.querySelector("#btn-toggle-physics");
        if (btn) {
          btn.classList.toggle("active");
          btn.title = state.graphInstance.engine.physics ? "Physics: ON" : "Physics: OFF";
        }
      }
    });

  $.graphModal
    .querySelector("#btn-toggle-3d")
    ?.addEventListener("click", () => {
      state.graphViewMode = state.graphViewMode === "3d" ? "2d" : "3d";
      // Re-opening the graph is the safest way to handle the mode change,
      // as it ensures everything is re-initialized correctly.
      openGraph(state.currentGraphData);
    });

  $.graphModal
    .querySelector("#btn-fullscreen")
    ?.addEventListener("click", () => {
      const isFullscreen = $.graphModal.classList.contains("fullscreen");

      if (isFullscreen) {
        // Collapsing from fullscreen
        $.graphModal.classList.add("collapsing");
        $.graphModal.classList.remove("fullscreen");

        setTimeout(() => {
          $.graphModal.classList.remove("collapsing");
        }, 300);
      } else {
        // Expanding to fullscreen
        $.graphModal.classList.add("fullscreen");
      }

      // Wait for animation to complete, then resize graph
      setTimeout(() => {
        if (state.graphInstance) {
          if (state.graphInstance.mode === '2d') {
            state.graphInstance.r2d.resize();
          } else {
            state.graphInstance.r3d.resize();
          }
        }
      }, 320);
    });
}

// ============================================ 

// Initialization

// ============================================ 

async function init() {
  if (!checkLibraries()) {
    setTimeout(init, 100);

    return;
  }

  try {
    updateStatus(t("status.initializing"));

    await initCache();

    const savedFontSize = localStorage.getItem("fontSize") || 16;
    $.fontSizeSlider.value = savedFontSize;
    updateFontSize(savedFontSize);

    const savedFontFamily = localStorage.getItem("fontFamily") || "Inter, sans-serif";
    $.fontFamilySelect.value = savedFontFamily;
    updateFontFamily(savedFontFamily);

    const savedLanguage = localStorage.getItem("language") || "en";
    $.languageSelect.value = savedLanguage;
    setLanguage(savedLanguage);

    applyBranding();

    initTheme();

    initShowdown();

    updateStatus(t("status.fetching_files"));

    state.allFiles = await fetchGitHubTree();

    updateStatus(t("status.indexing"));

    await indexFiles(state.allFiles, fetchRaw);

    updateStatus(t("status.building_graph"));

    buildGraph({ type: "global" });

    updateStatus(t("status.building_search_index"));

    initSearch();

    renderFileTree();

    // Initialize custom dropdowns
    createCustomDropdown($.fontFamilySelect);
    createCustomDropdown($.languageSelect);

    bindEvents();

    const decodedInitialHash = decodeURIComponent(
      window.location.hash.slice(1)
    );

    if (decodedInitialHash && metaCache.has(decodedInitialHash)) {
      openDocument(decodedInitialHash);
    } else {
      showHome();
    }

    updateStatus(t("status.ready"));
  } catch (err) {
    updateStatus(t("status.error").replace("{message}", err.message));
  }
}

init();