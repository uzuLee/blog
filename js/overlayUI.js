// ============================================
// Document Overlay UI
// ============================================

import {
  addHighlight,
  addStrikethrough,
  addComment,
  getSelectedText,
  clearSelection,
  exportOverlays,
  importOverlays,
  applyOverlaysToContent,
  getOverlaysForDocument,
  clearOverlaysForDocument
} from './overlays.js';

let currentPath = null;
let selectedColor = '#ffeb3b';

const HIGHLIGHT_COLORS = [
  { color: '#ffeb3b', name: 'Yellow' },
  { color: '#4caf50', name: 'Green' },
  { color: '#2196f3', name: 'Blue' },
  { color: '#ff9800', name: 'Orange' },
  { color: '#e91e63', name: 'Pink' },
  { color: '#9c27b0', name: 'Purple' }
];

// ============================================
// Toolbar Creation
// ============================================

export function createOverlayToolbar(container, path) {
  currentPath = path;

  const toolbar = document.createElement('div');
  toolbar.className = 'overlay-toolbar';
  toolbar.innerHTML = `
    <button id="btn-highlight" title="Highlight selected text">
      🖍️ Highlight
    </button>
    <button id="btn-strikethrough" title="Strikethrough selected text">
      ✏️ Strikethrough
    </button>
    <button id="btn-comment" title="Add comment to selected text">
      💬 Comment
    </button>
    <div style="flex: 1"></div>
    <button id="btn-export-overlays" title="Export overlays">
      📤 Export
    </button>
    <button id="btn-import-overlays" title="Import overlays">
      📥 Import
    </button>
    <button id="btn-clear-overlays" title="Clear all overlays">
      🗑️ Clear All
    </button>
  `;

  // Insert toolbar before the document content
  container.insertBefore(toolbar, container.firstChild);

  // Attach event listeners
  document.getElementById('btn-highlight').addEventListener('click', handleHighlight);
  document.getElementById('btn-strikethrough').addEventListener('click', handleStrikethrough);
  document.getElementById('btn-comment').addEventListener('click', handleComment);
  document.getElementById('btn-export-overlays').addEventListener('click', handleExport);
  document.getElementById('btn-import-overlays').addEventListener('click', handleImport);
  document.getElementById('btn-clear-overlays').addEventListener('click', handleClearAll);
}

export function removeOverlayToolbar(container) {
  const toolbar = container.querySelector('.overlay-toolbar');
  if (toolbar) {
    toolbar.remove();
  }
}

// ============================================
// Action Handlers
// ============================================

function handleHighlight() {
  const selection = getSelectedText();
  if (!selection) {
    alert('Please select some text first');
    return;
  }

  // Show color picker
  showColorPicker((color) => {
    addHighlight(currentPath, selection.text, color);
    clearSelection();
    // Re-render overlays
    const docContent = document.getElementById('doc-content');
    reapplyOverlays(docContent, currentPath);
  });
}

function handleStrikethrough() {
  const selection = getSelectedText();
  if (!selection) {
    alert('Please select some text first');
    return;
  }

  addStrikethrough(currentPath, selection.text);
  clearSelection();

  // Re-render overlays
  const docContent = document.getElementById('doc-content');
  reapplyOverlays(docContent, currentPath);
}

function handleComment() {
  const selection = getSelectedText();
  if (!selection) {
    alert('Please select some text first');
    return;
  }

  const commentText = prompt('Enter your comment:');
  if (!commentText) return;

  addComment(currentPath, selection.text, commentText);
  clearSelection();

  // Re-render overlays
  const docContent = document.getElementById('doc-content');
  reapplyOverlays(docContent, currentPath);
}

function handleExport() {
  const json = exportOverlays(currentPath);
  showExportDialog(json);
}

function handleImport() {
  showImportDialog();
}

function handleClearAll() {
  if (!confirm('Are you sure you want to clear all overlays for this document?')) {
    return;
  }

  clearOverlaysForDocument(currentPath);

  // Re-render overlays (will be empty)
  const docContent = document.getElementById('doc-content');
  reapplyOverlays(docContent, currentPath);
}

// ============================================
// Color Picker
// ============================================

function showColorPicker(callback) {
  const picker = document.createElement('div');
  picker.className = 'color-picker';

  HIGHLIGHT_COLORS.forEach(({ color, name }) => {
    const option = document.createElement('div');
    option.className = 'color-option';
    option.style.backgroundColor = color;
    option.title = name;

    if (color === selectedColor) {
      option.classList.add('selected');
    }

    option.addEventListener('click', () => {
      selectedColor = color;
      callback(color);
      picker.remove();
    });

    picker.appendChild(option);
  });

  // Position near the highlight button
  const highlightBtn = document.getElementById('btn-highlight');
  const rect = highlightBtn.getBoundingClientRect();
  picker.style.position = 'fixed';
  picker.style.left = `${rect.left}px`;
  picker.style.top = `${rect.bottom + 5}px`;

  document.body.appendChild(picker);

  // Close picker when clicking outside
  setTimeout(() => {
    document.addEventListener('click', function closePicker(e) {
      if (!picker.contains(e.target) && e.target !== highlightBtn) {
        picker.remove();
        document.removeEventListener('click', closePicker);
      }
    });
  }, 100);
}

// ============================================
// Export/Import Dialogs
// ============================================

function showExportDialog(json) {
  const backdrop = document.createElement('div');
  backdrop.className = 'overlay-dialog-backdrop';

  const dialog = document.createElement('div');
  dialog.className = 'overlay-dialog';
  dialog.innerHTML = `
    <h2>📤 Export Overlays</h2>
    <p>Copy the JSON below to share your overlays:</p>
    <textarea readonly>${json}</textarea>
    <div class="overlay-dialog-actions">
      <button class="btn-copy">📋 Copy to Clipboard</button>
      <button class="btn-close">Close</button>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(dialog);

  dialog.querySelector('.btn-copy').addEventListener('click', () => {
    const textarea = dialog.querySelector('textarea');
    textarea.select();
    navigator.clipboard.writeText(textarea.value).then(() => {
      alert('Copied to clipboard!');
    });
  });

  dialog.querySelector('.btn-close').addEventListener('click', () => {
    backdrop.remove();
    dialog.remove();
  });

  backdrop.addEventListener('click', () => {
    backdrop.remove();
    dialog.remove();
  });
}

function showImportDialog() {
  const backdrop = document.createElement('div');
  backdrop.className = 'overlay-dialog-backdrop';

  const dialog = document.createElement('div');
  dialog.className = 'overlay-dialog';
  dialog.innerHTML = `
    <h2>📥 Import Overlays</h2>
    <p>Paste the JSON below to import overlays:</p>
    <textarea placeholder="Paste JSON here..."></textarea>
    <div style="margin-top: 10px;">
      <label>
        <input type="checkbox" id="merge-overlays" checked>
        Merge with existing overlays (uncheck to replace all)
      </label>
    </div>
    <div class="overlay-dialog-actions">
      <button class="btn-import primary">Import</button>
      <button class="btn-close">Cancel</button>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(dialog);

  dialog.querySelector('.btn-import').addEventListener('click', () => {
    const textarea = dialog.querySelector('textarea');
    const merge = dialog.querySelector('#merge-overlays').checked;

    const success = importOverlays(textarea.value, merge);
    if (success) {
      alert('Overlays imported successfully!');
      backdrop.remove();
      dialog.remove();

      // Re-render overlays
      const docContent = document.getElementById('doc-content');
      reapplyOverlays(docContent, currentPath);
    } else {
      alert('Failed to import overlays. Please check the JSON format.');
    }
  });

  dialog.querySelector('.btn-close').addEventListener('click', () => {
    backdrop.remove();
    dialog.remove();
  });

  backdrop.addEventListener('click', () => {
    backdrop.remove();
    dialog.remove();
  });
}

// ============================================
// Helper Functions
// ============================================

function reapplyOverlays(contentElement, path) {
  // Remove existing overlay elements
  contentElement.querySelectorAll('.overlay-highlight, .overlay-strikethrough, .overlay-comment-anchor').forEach(el => {
    const parent = el.parentNode;
    while (el.firstChild) {
      parent.insertBefore(el.firstChild, el);
    }
    parent.removeChild(el);
  });

  // Remove comment indicators
  contentElement.querySelectorAll('.comment-indicator').forEach(el => el.remove());

  // Normalize text nodes
  contentElement.normalize();

  // Re-apply overlays
  applyOverlaysToContent(contentElement, path);
}
