// ============================================
// Document Overlay System
// ============================================
// Handles highlights, strikethroughs, and comments on documents

const STORAGE_KEY = 'uzu_document_overlays';

// Overlay storage structure:
// {
//   "path/to/doc.md": {
//     "highlights": [
//       { id: "h1", text: "selected text", color: "#ffeb3b", timestamp: 123456 }
//     ],
//     "strikethroughs": [
//       { id: "s1", text: "selected text", timestamp: 123456 }
//     ],
//     "comments": [
//       { id: "c1", text: "anchor text", comment: "My comment", timestamp: 123456 }
//     ]
//   }
// }

let overlays = {};

// ============================================
// Storage Functions
// ============================================

export function loadOverlays() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    overlays = stored ? JSON.parse(stored) : {};
    return overlays;
  } catch (e) {
    console.error('Failed to load overlays:', e);
    overlays = {};
    return overlays;
  }
}

function saveOverlays() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overlays));
  } catch (e) {
    console.error('Failed to save overlays:', e);
  }
}

// ============================================
// Overlay Management
// ============================================

export function getOverlaysForDocument(path) {
  return overlays[path] || { highlights: [], strikethroughs: [], comments: [] };
}

export function addHighlight(path, text, color = '#ffeb3b') {
  if (!overlays[path]) {
    overlays[path] = { highlights: [], strikethroughs: [], comments: [] };
  }

  const id = `h_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const highlight = {
    id,
    text: text.trim(),
    color,
    timestamp: Date.now()
  };

  overlays[path].highlights.push(highlight);
  saveOverlays();
  return highlight;
}

export function addStrikethrough(path, text) {
  if (!overlays[path]) {
    overlays[path] = { highlights: [], strikethroughs: [], comments: [] };
  }

  const id = `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const strikethrough = {
    id,
    text: text.trim(),
    timestamp: Date.now()
  };

  overlays[path].strikethroughs.push(strikethrough);
  saveOverlays();
  return strikethrough;
}

export function addComment(path, anchorText, commentText) {
  if (!overlays[path]) {
    overlays[path] = { highlights: [], strikethroughs: [], comments: [] };
  }

  const id = `c_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const comment = {
    id,
    text: anchorText.trim(),
    comment: commentText,
    timestamp: Date.now()
  };

  overlays[path].comments.push(comment);
  saveOverlays();
  return comment;
}

export function removeOverlay(path, id) {
  if (!overlays[path]) return false;

  const types = ['highlights', 'strikethroughs', 'comments'];
  for (const type of types) {
    const index = overlays[path][type].findIndex(item => item.id === id);
    if (index !== -1) {
      overlays[path][type].splice(index, 1);
      saveOverlays();
      return true;
    }
  }
  return false;
}

export function updateComment(path, id, newCommentText) {
  if (!overlays[path]) return false;

  const comment = overlays[path].comments.find(c => c.id === id);
  if (comment) {
    comment.comment = newCommentText;
    saveOverlays();
    return true;
  }
  return false;
}

export function clearOverlaysForDocument(path) {
  if (overlays[path]) {
    delete overlays[path];
    saveOverlays();
  }
}

// ============================================
// Export/Import Functions
// ============================================

export function exportOverlays(path = null) {
  const data = path ? { [path]: overlays[path] } : overlays;
  return JSON.stringify(data, null, 2);
}

export function importOverlays(jsonString, merge = true) {
  try {
    const imported = JSON.parse(jsonString);

    if (merge) {
      // Merge with existing overlays
      Object.keys(imported).forEach(path => {
        if (!overlays[path]) {
          overlays[path] = imported[path];
        } else {
          overlays[path].highlights.push(...imported[path].highlights || []);
          overlays[path].strikethroughs.push(...imported[path].strikethroughs || []);
          overlays[path].comments.push(...imported[path].comments || []);
        }
      });
    } else {
      // Replace all overlays
      overlays = imported;
    }

    saveOverlays();
    return true;
  } catch (e) {
    console.error('Failed to import overlays:', e);
    return false;
  }
}

// ============================================
// Rendering Functions
// ============================================

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function applyOverlaysToContent(contentElement, path) {
  const docOverlays = getOverlaysForDocument(path);

  // Sort all overlays by text length (longest first) to handle overlapping text
  const allTextOverlays = [
    ...docOverlays.highlights.map(h => ({ ...h, type: 'highlight' })),
    ...docOverlays.strikethroughs.map(s => ({ ...s, type: 'strikethrough' })),
    ...docOverlays.comments.map(c => ({ ...c, type: 'comment' }))
  ].sort((a, b) => b.text.length - a.text.length);

  // Apply overlays to text nodes
  const walker = document.createTreeWalker(
    contentElement,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Skip script and style elements
        if (node.parentElement.tagName === 'SCRIPT' ||
            node.parentElement.tagName === 'STYLE' ||
            node.parentElement.classList.contains('heading-link-copy')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }

  // Track which nodes have been processed
  const processedNodes = new Set();

  allTextOverlays.forEach(overlay => {
    textNodes.forEach(textNode => {
      if (processedNodes.has(textNode) || !textNode.parentNode) return;

      const text = textNode.textContent;
      const searchText = overlay.text;
      const index = text.indexOf(searchText);

      if (index === -1) return;

      // Split the text node
      const before = text.substring(0, index);
      const match = text.substring(index, index + searchText.length);
      const after = text.substring(index + searchText.length);

      const fragment = document.createDocumentFragment();

      if (before) {
        fragment.appendChild(document.createTextNode(before));
      }

      // Create overlay element
      const overlayEl = document.createElement('span');
      overlayEl.className = `overlay-${overlay.type}`;
      overlayEl.dataset.overlayId = overlay.id;
      overlayEl.textContent = match;

      if (overlay.type === 'highlight') {
        overlayEl.style.backgroundColor = overlay.color;
      } else if (overlay.type === 'comment') {
        overlayEl.className += ' overlay-comment-anchor';
        overlayEl.dataset.comment = overlay.comment;
        overlayEl.title = overlay.comment;

        // Add comment indicator
        const indicator = document.createElement('span');
        indicator.className = 'comment-indicator';
        indicator.textContent = '💬';
        overlayEl.appendChild(indicator);
      }

      fragment.appendChild(overlayEl);

      if (after) {
        fragment.appendChild(document.createTextNode(after));
      }

      textNode.parentNode.replaceChild(fragment, textNode);
      processedNodes.add(textNode);
    });
  });

  // Add click handlers to comment anchors
  contentElement.querySelectorAll('.overlay-comment-anchor').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.stopPropagation();
      showCommentPopup(anchor, path);
    });
  });
}

function showCommentPopup(anchor, path) {
  // Remove any existing popups
  document.querySelectorAll('.comment-popup').forEach(p => p.remove());

  const popup = document.createElement('div');
  popup.className = 'comment-popup';

  const commentText = anchor.dataset.comment;
  const overlayId = anchor.dataset.overlayId;

  popup.innerHTML = `
    <div class="comment-popup-content">
      <textarea class="comment-text" rows="3">${commentText}</textarea>
      <div class="comment-popup-actions">
        <button class="btn-save-comment">💾 Save</button>
        <button class="btn-delete-comment">🗑️ Delete</button>
        <button class="btn-close-comment">✕ Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  // Position popup near the anchor
  const rect = anchor.getBoundingClientRect();
  popup.style.position = 'fixed';
  popup.style.left = `${rect.left}px`;
  popup.style.top = `${rect.bottom + 5}px`;
  popup.style.zIndex = '10000';

  // Handle actions
  popup.querySelector('.btn-save-comment').onclick = () => {
    const newText = popup.querySelector('.comment-text').value;
    updateComment(path, overlayId, newText);
    anchor.dataset.comment = newText;
    anchor.title = newText;
    popup.remove();
  };

  popup.querySelector('.btn-delete-comment').onclick = () => {
    if (confirm('Delete this comment?')) {
      removeOverlay(path, overlayId);
      // Unwrap the anchor element
      const parent = anchor.parentNode;
      while (anchor.firstChild) {
        parent.insertBefore(anchor.firstChild, anchor);
      }
      parent.removeChild(anchor);
      popup.remove();
    }
  };

  popup.querySelector('.btn-close-comment').onclick = () => {
    popup.remove();
  };

  // Close popup when clicking outside
  setTimeout(() => {
    document.addEventListener('click', function closePopup(e) {
      if (!popup.contains(e.target) && e.target !== anchor) {
        popup.remove();
        document.removeEventListener('click', closePopup);
      }
    });
  }, 100);
}

// ============================================
// UI Helper Functions
// ============================================

export function getSelectedText() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const text = selection.toString().trim();
  if (!text) return null;

  return {
    text,
    selection
  };
}

export function clearSelection() {
  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  }
}

// Initialize overlays on load
loadOverlays();
