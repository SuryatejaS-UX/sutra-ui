/**
 * Review Studio — Client Visual Feedback & Element Annotation Tool
 * 
 * A zero-dependency, precision visual review tool for websites and client design collaboration.
 * 
 * Default Experience (Client Mode):
 * - 100% Client-facing, friendly, and jargon-free interface.
 * - Clients click any element to leave feedback directly for the designer.
 * - Simple categories: Text & Copy, Visual Design, Layout & Spacing, Fix & Problem, General Idea.
 * - 1-Click Sharing: Email to Designer, Copy for WhatsApp/Slack, Download Review .json.
 * - Zero emojis — 100% clean vector SVG icons.
 * 
 * Hidden Designer Mode (Alt + 456 or triple-click logo):
 * - Full technical inspection (CSS selectors, computed styles, DOM hierarchy, and element dimensions).
 * - Status resolution checkboxes (Open ⇄ Resolved).
 * - 1-Click "Copy for AI" prompt generation for Antigravity, Cursor, and Claude.
 * - Session Import / Export.
 */

(function (global) {
  'use strict';

  // Prevent multiple initializations
  if (global.__REVIEW_STUDIO_INITIALIZED__) {
    console.log('[Review Studio] Already initialized.');
    return;
  }
  global.__REVIEW_STUDIO_INITIALIZED__ = true;

  // ==========================================================================
  // 1. CONFIGURATION & ICONS (ZERO EMOJIS — 100% VECTOR SVGS)
  // ==========================================================================
  const STORAGE_KEY = `review_studio_feedback_${window.location.origin}${window.location.pathname}`;
  const CONFIG_KEY = `review_studio_config`;

  // Inline SVG Icon System
  const ICONS = {
    logo: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line><circle cx="12" cy="10" r="3"></circle></svg>`,
    crosshair: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>`,
    pin: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    send: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
    copy: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
    style: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2z"></path></svg>`,
    bug: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    text: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>`,
    layout: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`,
    idea: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="22" x2="14" y2="22"></line><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path></svg>`,
    check: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    checkCircle: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    circle: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`,
    trash: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    mail: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>`,
    chat: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`,
    download: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
    upload: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`,
    close: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    switch: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>`,
    eye: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
    eyeOff: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`,
    more: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1.5"></circle><circle cx="19" cy="12" r="1.5"></circle><circle cx="5" cy="12" r="1.5"></circle></svg>`
  };

  // Categories (Jargon-free labels for clients, precise labels for designer)
  const CATEGORIES = [
    { id: 'content', label: 'Content', clientLabel: 'Text & Copy', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', icon: ICONS.text },
    { id: 'style', label: 'Style', clientLabel: 'Visual Design', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', icon: ICONS.style },
    { id: 'layout', label: 'Layout', clientLabel: 'Layout & Spacing', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', icon: ICONS.layout },
    { id: 'bug', label: 'Bug', clientLabel: 'Fix & Problem', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', icon: ICONS.bug },
    { id: 'idea', label: 'Idea', clientLabel: 'General Idea', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', icon: ICONS.idea }
  ];

  const CLIENT_PROMPTS = [
    'Change this text',
    'Update this price/phone',
    'Make this larger',
    'Replace this image',
    'Button not working',
    'Question for designer'
  ];

  const DESIGNER_PROMPTS = [
    'Adjust padding/margin',
    'Improve contrast/color',
    'Fix responsive layout',
    'Update typography',
    'Add hover interaction',
    'Align with header'
  ];

  // ALWAYS Default to Client Mode. Designer mode is only accessed via hidden shortcut (Alt+D) or ?mode=designer
  function detectInitialRole() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'designer' || params.get('role') === 'designer') {
        return 'designer';
      }
    } catch (e) {}
    // Client mode is the strictly intended default for users and clients
    return 'client';
  }

  // ==========================================================================
  // 2. STATE MANAGEMENT
  // ==========================================================================
  const state = {
    mode: detectInitialRole(), // Default is always 'client'
    isInspecting: false,
    hoveredElement: null,
    selectedElement: null,
    editingCommentId: null,
    comments: [],
    pinsVisible: true,
    isHidden: true, // Hidden by default on screen; Alt+H toggles visibility
    isDrawerOpen: false,
    selectedCategory: 'content',
    searchQuery: '',
    filterStatus: 'all',
    clientName: '',
    designerEmail: '',
    logoClickCount: 0,
    logoClickTimer: null
  };

  // Shadow Root Container & References
  let hostEl = null;
  let shadowRoot = null;
  let highlightOverlay = null;
  let selectorBadge = null;
  let popoverEl = null;
  let pinsContainer = null;
  let toolbarEl = null;
  let drawerEl = null;
  let toastEl = null;
  let modalEl = null;
  let ghostRestoreBtn = null;

  const elementMap = new Map();

  // ==========================================================================
  // 3. PERSISTENCE & SETTINGS
  // ==========================================================================
  function loadData() {
    try {
      const savedComments = localStorage.getItem(STORAGE_KEY);
      if (savedComments) {
        state.comments = JSON.parse(savedComments);
      }
      const savedConfig = localStorage.getItem(CONFIG_KEY);
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        state.clientName = config.clientName || '';
        state.designerEmail = config.designerEmail || '';
      }
    } catch (e) {
      console.warn('[Review Studio] Failed to load data from localStorage', e);
      state.comments = [];
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.comments));
      localStorage.setItem(CONFIG_KEY, JSON.stringify({
        clientName: state.clientName,
        designerEmail: state.designerEmail
      }));
    } catch (e) {
      console.warn('[Review Studio] Failed to save data to localStorage', e);
    }
    updateBadgeCount();
    renderPins();
    if (state.isDrawerOpen) renderDrawerList();
  }

  // ==========================================================================
  // 4. ELEMENT INSPECTION & SELECTOR UTILITIES
  // ==========================================================================
  function getCleanSelector(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';

    if (el.id && document.querySelectorAll(`#${CSS.escape(el.id)}`).length === 1) {
      return `${el.tagName.toLowerCase()}#${CSS.escape(el.id)}`;
    }

    let path = [];
    let current = el;

    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body && current !== document.documentElement) {
      let selector = current.tagName.toLowerCase();

      if (current.id && document.querySelectorAll(`#${CSS.escape(current.id)}`).length === 1) {
        selector += `#${CSS.escape(current.id)}`;
        path.unshift(selector);
        break;
      }

      const classes = Array.from(current.classList)
        .filter(c => !c.startsWith('review-studio-') && !c.startsWith('artholic-') && !c.startsWith('agentation-') && !c.includes(':') && c.length < 32);

      if (classes.length > 0) {
        selector += '.' + classes.slice(0, 2).map(c => CSS.escape(c)).join('.');
      } else {
        let siblingIndex = 1;
        let sibling = current.previousElementSibling;
        let hasSameSiblings = false;

        while (sibling) {
          if (sibling.tagName === current.tagName) {
            hasSameSiblings = true;
            siblingIndex++;
          }
          sibling = sibling.previousElementSibling;
        }

        if (hasSameSiblings || current.nextElementSibling) {
          selector += `:nth-of-type(${siblingIndex})`;
        }
      }

      path.unshift(selector);
      current = current.parentElement;
      if (path.length >= 3) break;
    }

    return path.join(' > ');
  }

  // Human-friendly element name generator for clients
  function getHumanFriendlyName(el) {
    if (!el) return 'Selected Element';

    const aria = el.getAttribute('aria-label') || el.getAttribute('title');
    if (aria) return aria;

    const alt = el.getAttribute('alt');
    if (alt) return `Image: "${alt}"`;

    const placeholder = el.getAttribute('placeholder');
    if (placeholder) return `Input (${placeholder})`;

    const tag = el.tagName.toLowerCase();
    const text = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');

    if (text && text.length > 0 && text.length <= 36) {
      if (tag === 'button' || tag === 'a') return `"${text}" Button`;
      if (/^h[1-6]$/.test(tag)) return `Heading: "${text}"`;
      if (tag === 'p') return `Paragraph: "${text.slice(0, 24)}..."`;
    }

    if (el.closest('header')) return 'Header & Navigation';
    if (el.closest('footer')) return 'Page Footer';
    if (el.closest('nav')) return 'Navigation Bar';
    if (tag === 'img') return 'Image Graphic';
    if (tag === 'button') return 'Action Button';
    if (tag === 'a') return 'Link / Action';
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return 'Form Input';

    if (el.id) return `#${el.id}`;
    if (el.classList.length > 0) {
      const cls = Array.from(el.classList).find(c => !c.startsWith('review-studio') && !c.startsWith('artholic') && c.length > 2);
      if (cls) return `.${cls}`;
    }

    return `${tag.toUpperCase()} section`;
  }

  function getElementHierarchy(el) {
    const list = [];
    let curr = el;
    while (curr && curr !== document.documentElement && curr !== document.body) {
      list.unshift(curr);
      curr = curr.parentElement;
    }
    return list;
  }

  function getImportantComputedStyles(el) {
    const cs = window.getComputedStyle(el);
    const keys = [
      'display', 'position', 'color', 'background-color', 'border',
      'font-family', 'font-size', 'font-weight', 'line-height',
      'padding', 'margin', 'gap', 'border-radius', 'box-shadow', 'opacity', 'z-index'
    ];
    const result = {};
    keys.forEach(k => {
      const val = cs.getPropertyValue(k);
      if (val && val !== 'none' && val !== 'normal' && val !== 'auto' && val !== 'rgba(0, 0, 0, 0)') {
        result[k] = val;
      }
    });
    return result;
  }

  function getSnippet(el) {
    if (!el) return '';
    const clone = el.cloneNode(false);
    let html = clone.outerHTML || '';
    if (el.children.length > 0) {
      html = html.replace(/><\/[^>]+>$/, `>...</${el.tagName.toLowerCase()}>`);
    } else if (el.textContent && el.textContent.trim()) {
      const txt = el.textContent.trim().slice(0, 50);
      html = html.replace(/><\/[^>]+>$/, `>${txt}</${el.tagName.toLowerCase()}>`);
    }
    return html;
  }

  function findElementBySelector(selector) {
    if (!selector) return null;
    try {
      return document.querySelector(selector);
    } catch (e) {
      return null;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================================================
  // 5. SHADOW DOM CREATION & STYLES
  // ==========================================================================
  function initShadowDOM() {
    hostEl = document.createElement('review-studio-root');
    hostEl.setAttribute('id', 'review-studio-root');
    hostEl.setAttribute('aria-hidden', 'true');
    shadowRoot = hostEl.attachShadow({ mode: 'open' });

    const styleEl = document.createElement('style');
    styleEl.textContent = getStyles();
    shadowRoot.appendChild(styleEl);

    // Highlight Box
    highlightOverlay = document.createElement('div');
    highlightOverlay.className = 'rs-highlight';
    shadowRoot.appendChild(highlightOverlay);

    selectorBadge = document.createElement('div');
    selectorBadge.className = 'rs-selector-badge';
    shadowRoot.appendChild(selectorBadge);

    // Pins Container
    pinsContainer = document.createElement('div');
    pinsContainer.className = 'rs-pins-container';
    pinsContainer.style.display = 'none';
    shadowRoot.appendChild(pinsContainer);

    // Popover Dialog
    popoverEl = document.createElement('div');
    popoverEl.className = 'rs-popover';
    popoverEl.setAttribute('role', 'dialog');
    popoverEl.setAttribute('aria-modal', 'true');
    shadowRoot.appendChild(popoverEl);

    // Slide-out Drawer
    drawerEl = document.createElement('div');
    drawerEl.className = 'rs-drawer';
    shadowRoot.appendChild(drawerEl);

    // Modal Backdrop (Client Send)
    modalEl = document.createElement('div');
    modalEl.className = 'rs-modal-backdrop';
    shadowRoot.appendChild(modalEl);

    // Floating Toolbar Dock
    toolbarEl = document.createElement('div');
    toolbarEl.className = 'rs-toolbar';
    toolbarEl.style.display = 'none';
    shadowRoot.appendChild(toolbarEl);

    // Toast
    toastEl = document.createElement('div');
    toastEl.className = 'rs-toast';
    shadowRoot.appendChild(toastEl);

    // Restore Button (Bottom Right)
    ghostRestoreBtn = document.createElement('button');
    ghostRestoreBtn.className = 'rs-ghost-restore';
    ghostRestoreBtn.setAttribute('title', 'Show / Hide Review Studio (Alt+H)');
    ghostRestoreBtn.style.display = 'none';
    ghostRestoreBtn.innerHTML = `
      ${ICONS.logo}
      <span>Review Studio</span>
      <span class="rs-kbd" style="margin-left: 2px;">Alt+H</span>
    `;
    ghostRestoreBtn.onclick = () => toggleVisibility();
    shadowRoot.appendChild(ghostRestoreBtn);

    document.documentElement.appendChild(hostEl);
  }

  // ==========================================================================
  // 6. CSS DESIGN SYSTEM (CLEAN GLASSMORPHISM, ZERO EMOJIS)
  // ==========================================================================
  function getStyles() {
    return `
      :host {
        all: initial;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", Helvetica, Arial, sans-serif;
        font-size: 13px;
        line-height: 1.45;
        color: #f1f5f9;
        -webkit-font-smoothing: antialiased;
        box-sizing: border-box;
      }

      *, *::before, *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      /* HIGHLIGHT OVERLAY */
      .rs-highlight {
        position: fixed;
        display: none;
        pointer-events: none;
        z-index: 2147483640;
        border: 2px solid #38bdf8;
        background: rgba(56, 189, 248, 0.08);
        border-radius: 6px;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.3), 0 0 20px rgba(56, 189, 248, 0.35);
        transition: all 0.06s ease-out;
      }

      .rs-highlight::before, .rs-highlight::after {
        content: '';
        position: absolute;
        width: 8px;
        height: 8px;
        border-color: #38bdf8;
      }
      .rs-highlight::before {
        top: -3px; left: -3px;
        border-top: 2px solid #38bdf8;
        border-left: 2px solid #38bdf8;
      }
      .rs-highlight::after {
        bottom: -3px; right: -3px;
        border-bottom: 2px solid #38bdf8;
        border-right: 2px solid #38bdf8;
      }

      .rs-selector-badge {
        position: fixed;
        display: none;
        pointer-events: none;
        z-index: 2147483641;
        background: #090d16;
        color: #f8fafc;
        border: 1px solid rgba(255, 255, 255, 0.18);
        padding: 4px 10px;
        border-radius: 6px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 11px;
        font-weight: 500;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
        white-space: nowrap;
        max-width: 360px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* FLOATING DOCK TOOLBAR */
      .rs-toolbar {
        position: fixed;
        bottom: 22px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2147483642;
        display: none;
        align-items: center;
        gap: 6px;
        background: rgba(10, 15, 29, 0.92);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.14);
        box-shadow: 0 14px 35px -8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(0, 0, 0, 0.3);
        padding: 6px 10px;
        border-radius: 9999px;
        user-select: none;
        transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
      }

      .rs-brand-pill {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0 8px 0 4px;
        color: #f8fafc;
        font-weight: 700;
        font-size: 12px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        cursor: default;
      }
      .rs-brand-pill svg {
        color: #38bdf8;
      }

      .rs-designer-indicator {
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.06em;
        background: rgba(168, 85, 247, 0.25);
        color: #c084fc;
        border: 1px solid rgba(168, 85, 247, 0.45);
        padding: 2px 6px;
        border-radius: 9999px;
        text-transform: uppercase;
      }

      .rs-btn {
        appearance: none;
        border: none;
        background: transparent;
        color: #cbd5e1;
        height: 32px;
        padding: 0 12px;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;
      }
      .rs-btn:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #ffffff;
      }
      .rs-btn:active {
        transform: scale(0.97);
      }

      .rs-btn.active {
        background: #0284c7;
        color: #ffffff;
        box-shadow: 0 0 14px rgba(2, 132, 199, 0.5);
      }

      .rs-btn-primary {
        background: #0284c7;
        color: #ffffff;
      }
      .rs-btn-primary:hover {
        background: #0369a1;
      }

      .rs-btn-accent {
        background: #a855f7;
        color: #ffffff;
      }
      .rs-btn-accent:hover {
        background: #9333ea;
      }

      .rs-btn-icon {
        width: 32px;
        padding: 0;
        justify-content: center;
      }

      .rs-divider {
        width: 1px;
        height: 18px;
        background: rgba(255, 255, 255, 0.14);
        margin: 0 2px;
      }

      .rs-badge-count {
        background: rgba(255, 255, 255, 0.14);
        color: #f8fafc;
        font-size: 11px;
        font-weight: 600;
        padding: 1px 6px;
        border-radius: 9999px;
        margin-left: 2px;
      }

      .rs-kbd {
        font-family: inherit;
        font-size: 10px;
        padding: 2px 5px;
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        color: #94a3b8;
      }

      /* PIN MARKERS */
      .rs-pins-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 2147483638;
        display: none;
      }

      .rs-pin {
        position: absolute;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 11px;
        font-weight: 700;
        pointer-events: auto;
        cursor: pointer;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.95);
        transition: transform 0.16s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.15s ease;
        transform: translate(-50%, -50%);
        z-index: 2147483639;
      }
      .rs-pin:hover {
        transform: translate(-50%, -50%) scale(1.22);
        box-shadow: 0 5px 16px rgba(0, 0, 0, 0.5), 0 0 0 3px #ffffff;
      }
      .rs-pin.resolved {
        opacity: 0.65;
        background: #475569 !important;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3), 0 0 0 2px #94a3b8;
      }

      /* POPOVER DIALOG */
      .rs-popover {
        position: fixed;
        display: none;
        width: 380px;
        max-width: calc(100vw - 32px);
        background: #0b1120;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 12px;
        box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(0, 0, 0, 0.4);
        padding: 14px;
        z-index: 2147483644;
        animation: rs-pop-in 0.16s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes rs-pop-in {
        from { opacity: 0; transform: scale(0.96) translateY(6px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }

      .rs-pop-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
        gap: 8px;
      }

      .rs-target-chip {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 500;
        color: #38bdf8;
        max-width: 290px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .rs-pop-close {
        appearance: none;
        border: none;
        background: transparent;
        color: #94a3b8;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.15s ease;
      }
      .rs-pop-close:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.08);
      }

      .rs-cat-picker {
        display: flex;
        gap: 6px;
        margin-bottom: 12px;
        overflow-x: auto;
        padding-bottom: 2px;
      }

      .rs-cat-pill {
        appearance: none;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.04);
        color: #94a3b8;
        padding: 5px 10px;
        border-radius: 9999px;
        font-size: 11px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.15s ease;
      }
      .rs-cat-pill:hover {
        border-color: rgba(255, 255, 255, 0.25);
        color: #f1f5f9;
      }
      .rs-cat-pill.selected {
        background: var(--pill-bg);
        border-color: var(--pill-color);
        color: #ffffff;
        font-weight: 600;
      }
      .rs-cat-pill svg {
        color: var(--pill-color);
      }

      .rs-textarea {
        width: 100%;
        min-height: 84px;
        background: #060911;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 8px;
        color: #f8fafc;
        font-family: inherit;
        font-size: 12px;
        padding: 10px;
        resize: vertical;
        outline: none;
        transition: border-color 0.15s ease;
      }
      .rs-textarea:focus {
        border-color: #38bdf8;
      }

      .rs-quick-prompts {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-top: 8px;
        margin-bottom: 12px;
      }

      .rs-quick-chip {
        font-size: 10px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 4px;
        color: #94a3b8;
        padding: 2px 7px;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .rs-quick-chip:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.2);
      }

      .rs-pop-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 10px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }

      .rs-pop-actions {
        display: flex;
        gap: 6px;
      }

      /* REVIEW DRAWER (SIDEBAR) */
      .rs-drawer {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 420px;
        max-width: 90vw;
        background: #090d16;
        border-left: 1px solid rgba(255, 255, 255, 0.14);
        box-shadow: none;
        visibility: hidden;
        pointer-events: none;
        z-index: 2147483645;
        transform: translateX(100%);
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
          box-shadow 0.25s ease,
          visibility 0s linear 0.25s;
        display: flex;
        flex-direction: column;
      }
      .rs-drawer.open {
        transform: translateX(0);
        visibility: visible;
        pointer-events: auto;
        box-shadow: -10px 0 35px rgba(0, 0, 0, 0.6);
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
          box-shadow 0.25s ease,
          visibility 0s linear 0s;
      }

      .rs-drawer-header {
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .rs-drawer-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        font-size: 14px;
        color: #f8fafc;
      }

      .rs-drawer-search {
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .rs-drawer-search input {
        width: 100%;
        background: #060911;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 6px;
        color: #f8fafc;
        padding: 7px 12px;
        font-size: 12px;
        outline: none;
      }
      .rs-drawer-search input:focus {
        border-color: #38bdf8;
      }

      .rs-drawer-list {
        flex: 1;
        overflow-y: auto;
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .rs-drawer-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .rs-drawer-card:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(56, 189, 248, 0.4);
      }
      .rs-drawer-card.resolved {
        opacity: 0.6;
        border-style: dashed;
      }

      .rs-drawer-footer {
        padding: 14px 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        gap: 8px;
      }

      /* TOAST NOTIFICATION */
      .rs-toast {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-60px);
        background: #0284c7;
        color: #ffffff;
        font-weight: 600;
        font-size: 12px;
        padding: 8px 16px;
        border-radius: 9999px;
        box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.4);
        z-index: 2147483647;
        pointer-events: none;
        opacity: 0;
        transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .rs-toast.show {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }

      /* MODAL BACKDROP & DIALOG */
      .rs-modal-backdrop {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 2147483646;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .rs-modal-backdrop.open {
        display: flex;
      }

      .rs-modal {
        background: #090d16;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 14px;
        width: 500px;
        max-width: 100%;
        box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8);
        padding: 24px;
        animation: rs-pop-in 0.18s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .rs-modal-title {
        font-size: 16px;
        font-weight: 700;
        color: #f8fafc;
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
      }
      .rs-modal-subtitle {
        font-size: 12px;
        color: #94a3b8;
        margin-bottom: 18px;
      }

      .rs-share-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 20px;
      }

      .rs-share-card {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        padding: 14px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 6px;
        transition: all 0.15s ease;
        text-align: left;
      }
      .rs-share-card:hover {
        background: rgba(56, 189, 248, 0.08);
        border-color: #38bdf8;
      }
      .rs-share-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #f8fafc;
        font-size: 12px;
      }
      .rs-share-card-header svg {
        color: #38bdf8;
      }
      .rs-share-card-desc {
        font-size: 11px;
        color: #94a3b8;
        line-height: 1.35;
      }

      /* "Show Review Studio" PILL AT BOTTOM RIGHT */
      .rs-ghost-restore {
        position: fixed;
        bottom: 12px;
        right: 12px;
        z-index: 2147483646;
        background: rgba(10, 15, 29, 0.88);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 9999px;
        color: #cbd5e1;
        padding: 6px 14px;
        font-size: 11px;
        font-weight: 600;
        display: none;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        opacity: 0.85;
        transition: all 0.2s ease;
        user-select: none;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
      }
      .rs-ghost-restore:hover {
        opacity: 1;
        color: #ffffff;
        background: #090d16;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
        transform: scale(1.04);
        border-color: rgba(56, 189, 248, 0.5);
      }

      /* SPOTLIGHT PULSE EFFECT */
      @keyframes rs-spotlight {
        0% { outline: 3px solid #38bdf8; outline-offset: 4px; }
        50% { outline: 5px solid #60a5fa; outline-offset: 8px; }
        100% { outline: 3px solid transparent; outline-offset: 12px; }
      }
      .rs-spotlight-active {
        animation: rs-spotlight 1.2s ease-out;
      }

      /* PRINT MEDIA QUERY: Auto-hide on print or PDF export */
      @media print {
        :host, .rs-toolbar, .rs-pin, .rs-highlight, .rs-selector-badge, .rs-popover, .rs-drawer, .rs-ghost-restore, .rs-toast, .rs-modal-backdrop {
          display: none !important;
        }
      }
    `;
  }

  // ==========================================================================
  // 7. INSPECTOR ENGINE & SHORTCUTS
  // ==========================================================================
  function toggleInspectMode() {
    if (state.isHidden) toggleVisibility(true);

    state.isInspecting = !state.isInspecting;
    if (state.isInspecting) {
      document.body.style.cursor = 'crosshair';
      highlightOverlay.style.display = 'block';
      selectorBadge.style.display = 'block';
      showToast(state.mode === 'client' ? 'Click any element to add feedback for the designer' : 'Inspect mode active: Click any element', 'info');
      closePopover();
      closeDrawer();
    } else {
      document.body.style.cursor = '';
      highlightOverlay.style.display = 'none';
      selectorBadge.style.display = 'none';
      state.hoveredElement = null;
    }
    renderToolbar();
  }

  function toggleVisibility(showExplicitly = null) {
    if (showExplicitly !== null) {
      state.isHidden = !showExplicitly;
    } else {
      state.isHidden = !state.isHidden;
    }

    if (state.isHidden) {
      if (state.isInspecting) {
        document.body.style.cursor = '';
        state.isInspecting = false;
      }
      toolbarEl.style.display = 'none';
      pinsContainer.style.display = 'none';
      highlightOverlay.style.display = 'none';
      selectorBadge.style.display = 'none';
      popoverEl.style.display = 'none';
      drawerEl.classList.remove('open');
      state.isDrawerOpen = false;
      if (ghostRestoreBtn) ghostRestoreBtn.style.display = 'none';
      showToast('Review Studio hidden (Press Alt+H to show)', 'info');
    } else {
      toolbarEl.style.display = 'flex';
      pinsContainer.style.display = 'block';
      if (ghostRestoreBtn) ghostRestoreBtn.style.display = 'flex';
      renderPins();
      renderToolbar();
      showToast(state.mode === 'designer' ? 'Review Studio (Designer Mode)' : 'Review Studio (Click Feedback to begin)', 'info');
    }
  }

  // Hidden Designer Mode Toggle (Alt + 456 or triple-click logo)
  function toggleDesignerMode() {
    state.mode = state.mode === 'designer' ? 'client' : 'designer';
    if (state.isHidden) toggleVisibility(true);
    renderToolbar();
    if (state.isDrawerOpen) renderDrawerList();

    if (state.mode === 'designer') {
      showToast('Designer Mode Activated (Technical details & AI prompt enabled)', 'success');
    } else {
      showToast('Client Review Mode Activated', 'info');
    }
  }

  function handleMouseMove(e) {
    if (!state.isInspecting || state.isHidden) return;

    const path = e.composedPath();
    if (path.some(node => node === hostEl || (node.id && node.id === 'review-studio-root'))) {
      highlightOverlay.style.display = 'none';
      selectorBadge.style.display = 'none';
      return;
    }

    const target = e.target;
    if (!target || target === document.documentElement || target === document.body || target === hostEl) {
      highlightOverlay.style.display = 'none';
      selectorBadge.style.display = 'none';
      state.hoveredElement = null;
      return;
    }

    state.hoveredElement = target;
    updateHighlight(target);
  }

  function updateHighlight(el) {
    if (!el || state.isHidden) return;
    const rect = el.getBoundingClientRect();
    const selector = getCleanSelector(el);
    const friendlyName = getHumanFriendlyName(el);

    highlightOverlay.style.display = 'block';
    highlightOverlay.style.top = `${rect.top}px`;
    highlightOverlay.style.left = `${rect.left}px`;
    highlightOverlay.style.width = `${rect.width}px`;
    highlightOverlay.style.height = `${rect.height}px`;

    selectorBadge.style.display = 'block';
    selectorBadge.textContent = state.mode === 'client' 
      ? friendlyName 
      : `${selector} [${Math.round(rect.width)}×${Math.round(rect.height)}]`;

    let badgeTop = rect.top - 28;
    if (badgeTop < 10) badgeTop = rect.bottom + 6;
    let badgeLeft = Math.max(10, Math.min(rect.left, window.innerWidth - 370));

    selectorBadge.style.top = `${badgeTop}px`;
    selectorBadge.style.left = `${badgeLeft}px`;
  }

  function handleClick(e) {
    if (!state.isInspecting || state.isHidden) return;

    const path = e.composedPath();
    if (path.some(node => node === hostEl)) return;

    e.preventDefault();
    e.stopPropagation();

    const target = state.hoveredElement || e.target;
    if (!target || target === document.documentElement || target === document.body) return;

    selectElementForComment(target);
  }

  function selectElementForComment(el, existingComment = null) {
    state.selectedElement = el;
    state.editingCommentId = existingComment ? existingComment.id : null;
    if (existingComment) {
      state.selectedCategory = existingComment.category || 'content';
    }

    if (state.isInspecting) {
      toggleInspectMode();
    }

    openPopover(el, existingComment);
  }

  // ==========================================================================
  // 8. COMMENT POPOVER IMPLEMENTATION
  // ==========================================================================
  function openPopover(el, existingComment = null) {
    const rect = el.getBoundingClientRect();
    const selector = getCleanSelector(el);
    const friendlyName = getHumanFriendlyName(el);
    const hierarchy = getElementHierarchy(el);

    const initialText = existingComment ? existingComment.text : '';
    const initialCategory = existingComment ? existingComment.category : state.selectedCategory;
    const isClient = state.mode === 'client';

    popoverEl.innerHTML = `
      <div class="rs-pop-header">
        <div class="rs-target-chip" title="${selector}">
          <span>${friendlyName}</span>
          ${!isClient ? `<span style="opacity: 0.5; font-family: monospace; font-size: 10px;">(${selector})</span>` : ''}
        </div>
        <button class="rs-pop-close" id="rs-pop-close-btn" title="Close (Esc)">
          ${ICONS.close}
        </button>
      </div>

      ${!isClient ? `
        <div style="display: flex; gap: 4px; overflow-x: auto; margin-bottom: 10px; padding-bottom: 2px;">
          ${hierarchy.map((node, i) => {
            const isCurrent = node === el;
            const label = node.tagName.toLowerCase() + (node.id ? `#${node.id}` : '');
            return `<span class="rs-quick-chip ${isCurrent ? 'selected' : ''}" data-index="${i}" style="${isCurrent ? 'color:#38bdf8; border-color:#38bdf8;' : ''}">${label}</span>`;
          }).join('')}
        </div>
      ` : ''}

      <div class="rs-cat-picker" role="radiogroup">
        ${CATEGORIES.map(cat => `
          <button class="rs-cat-pill ${cat.id === initialCategory ? 'selected' : ''}" 
                  data-cat="${cat.id}" 
                  style="--pill-color: ${cat.color}; --pill-bg: ${cat.bg}">
            ${cat.icon}
            <span>${isClient ? cat.clientLabel : cat.label}</span>
          </button>
        `).join('')}
      </div>

      <textarea class="rs-textarea" id="rs-note-input" placeholder="${isClient ? 'What changes would you like here? (e.g. Update pricing, adjust wording, make headline bolder)' : 'What should change here? (e.g., Increase padding to 16px, darken border)'}">${escapeHtml(initialText)}</textarea>

      <div class="rs-quick-prompts">
        ${(isClient ? CLIENT_PROMPTS : DESIGNER_PROMPTS).map(p => `<span class="rs-quick-chip">${p}</span>`).join('')}
      </div>

      <div class="rs-pop-footer">
        <div style="font-size: 11px; color: #64748b;">
          <span>⌘/Ctrl+Enter to save</span>
        </div>
        <div class="rs-pop-actions">
          ${existingComment ? `
            <button class="rs-btn" id="rs-btn-delete" style="color: #ef4444;">Delete</button>
          ` : `
            <button class="rs-btn" id="rs-btn-cancel">Cancel</button>
          `}
          <button class="rs-btn rs-btn-primary" id="rs-btn-save">
            ${existingComment ? 'Update' : (isClient ? 'Add Note' : 'Save Pin')}
          </button>
        </div>
      </div>
    `;

    popoverEl.style.display = 'block';
    positionPopover(rect);

    const closeBtn = popoverEl.querySelector('#rs-pop-close-btn');
    if (closeBtn) closeBtn.onclick = closePopover;

    const cancelBtn = popoverEl.querySelector('#rs-btn-cancel');
    if (cancelBtn) cancelBtn.onclick = closePopover;

    const deleteBtn = popoverEl.querySelector('#rs-btn-delete');
    if (deleteBtn) {
      deleteBtn.onclick = () => {
        deleteComment(existingComment.id);
        closePopover();
      };
    }

    const saveBtn = popoverEl.querySelector('#rs-btn-save');
    if (saveBtn) {
      saveBtn.onclick = () => saveCurrentComment(el);
    }

    popoverEl.querySelectorAll('.rs-cat-pill').forEach(btn => {
      btn.onclick = () => {
        popoverEl.querySelectorAll('.rs-cat-pill').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.selectedCategory = btn.getAttribute('data-cat');
      };
    });

    const textarea = popoverEl.querySelector('#rs-note-input');
    popoverEl.querySelectorAll('.rs-quick-chip').forEach(chip => {
      chip.onclick = () => {
        if (chip.getAttribute('data-index') !== null) {
          const idx = parseInt(chip.getAttribute('data-index'), 10);
          const targetNode = hierarchy[idx];
          if (targetNode && targetNode !== el) {
            selectElementForComment(targetNode, existingComment);
          }
          return;
        }
        if (textarea.value) textarea.value += '; ' + chip.textContent;
        else textarea.value = chip.textContent;
        textarea.focus();
      };
    });

    textarea.onkeydown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        saveCurrentComment(el);
      } else if (e.key === 'Escape') {
        closePopover();
      }
    };

    setTimeout(() => textarea.focus(), 50);
  }

  function positionPopover(rect) {
    const popWidth = 380;
    const popHeight = 290;

    let left = rect.left;
    let top = rect.bottom + 8;

    if (top + popHeight > window.innerHeight - 20) {
      top = rect.top - popHeight - 8;
    }
    if (top < 10) top = 10;

    if (left + popWidth > window.innerWidth - 20) {
      left = window.innerWidth - popWidth - 20;
    }
    if (left < 10) left = 10;

    popoverEl.style.top = `${top}px`;
    popoverEl.style.left = `${left}px`;
  }

  function closePopover() {
    popoverEl.style.display = 'none';
    state.selectedElement = null;
    state.editingCommentId = null;
  }

  function saveCurrentComment(el) {
    const textarea = popoverEl.querySelector('#rs-note-input');
    const text = textarea ? textarea.value.trim() : '';

    if (!text) {
      showToast('Please type a feedback note', 'warn');
      return;
    }

    const selector = getCleanSelector(el);
    const friendlyName = getHumanFriendlyName(el);
    const rect = el.getBoundingClientRect();
    const computedStyles = getImportantComputedStyles(el);
    const snippet = getSnippet(el);

    if (state.editingCommentId) {
      const c = state.comments.find(item => item.id === state.editingCommentId);
      if (c) {
        c.text = text;
        c.category = state.selectedCategory;
        c.updatedAt = new Date().toISOString();
      }
      showToast('Feedback updated', 'success');
    } else {
      const newComment = {
        id: 'pin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        index: state.comments.length + 1,
        status: 'open',
        friendlyName: friendlyName,
        selector: selector,
        tagName: el.tagName.toLowerCase(),
        idAttr: el.id || '',
        classes: Array.from(el.classList).join(' '),
        text: text,
        category: state.selectedCategory,
        author: state.mode === 'client' ? (state.clientName || 'Client') : 'Designer',
        dimensions: {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          top: Math.round(rect.top + window.scrollY),
          left: Math.round(rect.left + window.scrollX)
        },
        computedStyles: computedStyles,
        snippet: snippet,
        createdAt: new Date().toISOString()
      };

      state.comments.push(newComment);
      elementMap.set(newComment.id, el);
      showToast(`Feedback #${newComment.index} added!`, 'success');
    }

    saveData();
    closePopover();
  }

  function deleteComment(id) {
    state.comments = state.comments.filter(c => c.id !== id);
    state.comments.forEach((c, idx) => c.index = idx + 1);
    elementMap.delete(id);
    saveData();
    showToast('Feedback item deleted', 'info');
  }

  function toggleCommentStatus(id) {
    const c = state.comments.find(item => item.id === id);
    if (!c) return;
    c.status = c.status === 'resolved' ? 'open' : 'resolved';
    saveData();
    showToast(c.status === 'resolved' ? `Item #${c.index} marked as resolved` : `Item #${c.index} reopened`, 'info');
  }

  // ==========================================================================
  // 9. PIN MARKERS RENDERING & ANCHORING
  // ==========================================================================
  function renderPins() {
    pinsContainer.innerHTML = '';
    if (!state.pinsVisible || state.isHidden) return;

    state.comments.forEach(comment => {
      let el = elementMap.get(comment.id);
      if (!el) {
        el = findElementBySelector(comment.selector);
        if (el) elementMap.set(comment.id, el);
      }

      if (!el) return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      const catObj = CATEGORIES.find(c => c.id === comment.category) || CATEGORIES[0];

      const pin = document.createElement('div');
      pin.className = `rs-pin ${comment.status === 'resolved' ? 'resolved' : ''}`;
      pin.style.backgroundColor = comment.status === 'resolved' ? '#475569' : catObj.color;
      pin.innerHTML = comment.status === 'resolved' ? ICONS.check : comment.index;
      pin.title = `[#${comment.index} - ${catObj.clientLabel}] ${comment.friendlyName || comment.selector}\n${comment.text}`;

      const pinX = rect.left + rect.width + window.scrollX;
      const pinY = rect.top + window.scrollY;

      pin.style.left = `${pinX}px`;
      pin.style.top = `${pinY}px`;

      pin.onmouseenter = () => updateHighlight(el);
      pin.onmouseleave = () => {
        if (!state.isInspecting) {
          highlightOverlay.style.display = 'none';
          selectorBadge.style.display = 'none';
        }
      };

      pin.onclick = (e) => {
        e.stopPropagation();
        selectElementForComment(el, comment);
      };

      pinsContainer.appendChild(pin);
    });
  }

  function updatePinsPosition() {
    if (!state.pinsVisible || state.isHidden || state.comments.length === 0) return;
    renderPins();
  }

  // ==========================================================================
  // 10. FLOATING DOCK TOOLBAR
  // ==========================================================================
  function renderToolbar() {
    if (state.isHidden) return;

    const isDesigner = state.mode === 'designer';

    toolbarEl.innerHTML = `
      <div class="rs-brand-pill" id="rs-brand-pill">
        ${ICONS.logo}
        <span>Review Studio</span>
        ${isDesigner ? `<span class="rs-designer-indicator">Designer</span>` : ''}
      </div>

      <div class="rs-divider"></div>

      <button class="rs-btn ${state.isInspecting ? 'active' : ''}" id="rs-btn-inspect" title="Toggle Feedback Mode (Alt+C)">
        ${ICONS.crosshair}
        <span>${state.isInspecting ? 'Cancel' : (isDesigner ? 'Comment' : 'Feedback')}</span>
        <span class="rs-kbd">Alt+C</span>
      </button>

      <button class="rs-btn" id="rs-btn-drawer" title="View all comments">
        ${ICONS.pin}
        <span>Items</span>
        <span class="rs-badge-count" id="rs-badge-count">${state.comments.length}</span>
      </button>

      ${isDesigner ? `
        <button class="rs-btn rs-btn-primary" id="rs-btn-copy-ai" title="Copy prompt for AI coding agents (Antigravity/Cursor/Claude)">
          ${ICONS.copy}
          <span>Copy for AI</span>
        </button>
      ` : `
        <button class="rs-btn rs-btn-primary" id="rs-btn-client-send" title="Send your feedback directly to the designer">
          ${ICONS.send}
          <span>Send Feedback</span>
        </button>
      `}

      <button class="rs-btn rs-btn-icon" id="rs-btn-more" title="More options">
        ${ICONS.more}
      </button>

      <button class="rs-btn rs-btn-icon" id="rs-btn-close" title="Hide Review Studio (Alt+H)">
        ${ICONS.close}
      </button>
    `;

    // Triple-click logo triggers hidden Designer Mode
    const brandPill = toolbarEl.querySelector('#rs-brand-pill');
    if (brandPill) {
      brandPill.onclick = () => {
        state.logoClickCount++;
        clearTimeout(state.logoClickTimer);
        state.logoClickTimer = setTimeout(() => {
          state.logoClickCount = 0;
        }, 500);

        if (state.logoClickCount >= 3) {
          state.logoClickCount = 0;
          toggleDesignerMode();
        }
      };
    }

    const inspectBtn = toolbarEl.querySelector('#rs-btn-inspect');
    if (inspectBtn) inspectBtn.onclick = toggleInspectMode;

    const drawerBtn = toolbarEl.querySelector('#rs-btn-drawer');
    if (drawerBtn) drawerBtn.onclick = toggleDrawer;

    const clientSendBtn = toolbarEl.querySelector('#rs-btn-client-send');
    if (clientSendBtn) clientSendBtn.onclick = openClientSendModal;

    const copyAiBtn = toolbarEl.querySelector('#rs-btn-copy-ai');
    if (copyAiBtn) copyAiBtn.onclick = copyFeedbackToClipboard;

    const moreBtn = toolbarEl.querySelector('#rs-btn-more');
    if (moreBtn) moreBtn.onclick = showMoreMenu;

    const closeBtn = toolbarEl.querySelector('#rs-btn-close');
    if (closeBtn) closeBtn.onclick = () => toggleVisibility(false);
  }

  function updateBadgeCount() {
    const badge = toolbarEl.querySelector('#rs-badge-count');
    if (badge) badge.textContent = state.comments.length;
  }

  function showMoreMenu(e) {
    const existingMenu = shadowRoot.querySelector('.rs-more-menu');
    if (existingMenu) {
      existingMenu.remove();
      return;
    }

    const isDesigner = state.mode === 'designer';

    const menu = document.createElement('div');
    menu.className = 'rs-more-menu';
    menu.style.cssText = `
      position: fixed;
      bottom: 65px;
      left: 50%;
      transform: translateX(-50%);
      background: #090d16;
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 10px;
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 3px;
      z-index: 2147483645;
      box-shadow: 0 16px 35px rgba(0, 0, 0, 0.6);
      width: 220px;
    `;

    // In Client Mode: show ONLY client-friendly actions (NO mention of designer mode)
    if (!isDesigner) {
      menu.innerHTML = `
        <button class="rs-btn" id="menu-download-session" style="justify-content: flex-start; width: 100%;">
          ${ICONS.download}
          <span>Download Feedback (.json)</span>
        </button>
        <button class="rs-btn" id="menu-toggle-pins" style="justify-content: flex-start; width: 100%;">
          ${state.pinsVisible ? ICONS.eyeOff : ICONS.eye}
          <span>${state.pinsVisible ? 'Hide Feedback Markers' : 'Show Feedback Markers'}</span>
        </button>
        <div style="height: 1px; background: rgba(255, 255, 255, 0.1); margin: 3px 0;"></div>
        <button class="rs-btn" id="menu-snapshot-mode" style="justify-content: flex-start; width: 100%;">
          ${ICONS.eyeOff}
          <span>Hide Review Studio</span>
          <span class="rs-kbd" style="margin-left: auto;">Alt+H</span>
        </button>
        <button class="rs-btn" id="menu-clear-all" style="justify-content: flex-start; width: 100%; color: #ef4444;">
          ${ICONS.trash}
          <span>Clear My Notes</span>
        </button>
      `;
    } else {
      // In Designer Mode: show full developer & AI tooling
      menu.innerHTML = `
        <button class="rs-btn" id="menu-switch-client" style="justify-content: flex-start; width: 100%;">
          ${ICONS.switch}
          <span>Return to Client View</span>
          <span class="rs-kbd" style="margin-left: auto;">Alt+456</span>
        </button>
        <button class="rs-btn" id="menu-download-session" style="justify-content: flex-start; width: 100%;">
          ${ICONS.download}
          <span>Export Session (.json)</span>
        </button>
        <button class="rs-btn" id="menu-import-session" style="justify-content: flex-start; width: 100%;">
          ${ICONS.upload}
          <span>Import Session (.json)</span>
        </button>
        <button class="rs-btn" id="menu-toggle-pins" style="justify-content: flex-start; width: 100%;">
          ${state.pinsVisible ? ICONS.eyeOff : ICONS.eye}
          <span>${state.pinsVisible ? 'Hide Pins' : 'Show Pins'}</span>
        </button>
        <div style="height: 1px; background: rgba(255, 255, 255, 0.1); margin: 3px 0;"></div>
        <button class="rs-btn" id="menu-snapshot-mode" style="justify-content: flex-start; width: 100%;">
          ${ICONS.eyeOff}
          <span>Hide Review Studio</span>
          <span class="rs-kbd" style="margin-left: auto;">Alt+H</span>
        </button>
        <button class="rs-btn" id="menu-clear-all" style="justify-content: flex-start; width: 100%; color: #ef4444;">
          ${ICONS.trash}
          <span>Clear All Items</span>
        </button>
      `;

      const switchBtn = menu.querySelector('#menu-switch-client');
      if (switchBtn) {
        switchBtn.onclick = () => {
          toggleDesignerMode();
          menu.remove();
        };
      }

      const importBtn = menu.querySelector('#menu-import-session');
      if (importBtn) {
        importBtn.onclick = () => {
          openImportDialog();
          menu.remove();
        };
      }
    }

    shadowRoot.appendChild(menu);

    menu.querySelector('#menu-download-session').onclick = () => {
      exportSessionFile();
      menu.remove();
    };

    menu.querySelector('#menu-toggle-pins').onclick = () => {
      state.pinsVisible = !state.pinsVisible;
      renderPins();
      showToast(state.pinsVisible ? 'Markers visible' : 'Markers hidden', 'info');
      menu.remove();
    };

    menu.querySelector('#menu-snapshot-mode').onclick = () => {
      toggleVisibility(false);
      menu.remove();
    };

    menu.querySelector('#menu-clear-all').onclick = () => {
      if (confirm('Are you sure you want to clear your feedback items on this page?')) {
        state.comments = [];
        elementMap.clear();
        saveData();
        showToast('All items cleared', 'info');
      }
      menu.remove();
    };

    setTimeout(() => {
      const handleOutside = (evt) => {
        if (!menu.contains(evt.target)) {
          menu.remove();
          window.removeEventListener('click', handleOutside);
        }
      };
      window.addEventListener('click', handleOutside);
    }, 10);
  }

  // ==========================================================================
  // 11. REVIEW DRAWER (SIDEBAR)
  // ==========================================================================
  function toggleDrawer() {
    if (state.isHidden) return;
    state.isDrawerOpen = !state.isDrawerOpen;
    if (state.isDrawerOpen) {
      drawerEl.classList.add('open');
      renderDrawerList();
    } else {
      drawerEl.classList.remove('open');
    }
  }

  function closeDrawer() {
    state.isDrawerOpen = false;
    drawerEl.classList.remove('open');
  }

  function renderDrawerList() {
    const isDesigner = state.mode === 'designer';
    const totalCount = state.comments.length;
    const resolvedCount = state.comments.filter(c => c.status === 'resolved').length;
    const openCount = totalCount - resolvedCount;

    drawerEl.innerHTML = `
      <div class="rs-drawer-header">
        <div class="rs-drawer-title">
          ${ICONS.logo}
          <span>${isDesigner ? 'Designer Review & AI Tasks' : 'Feedback Summary'}</span>
          <span class="rs-badge-count">${openCount} open</span>
        </div>
        <button class="rs-pop-close" id="rs-drawer-close">
          ${ICONS.close}
        </button>
      </div>

      <div class="rs-drawer-search">
        <input type="text" id="rs-search-input" placeholder="Search feedback notes..." value="${escapeHtml(state.searchQuery)}">
      </div>

      <div class="rs-drawer-list">
        ${totalCount === 0 ? `
          <div style="text-align: center; color: #64748b; margin-top: 50px;">
            <p style="font-weight: 600; color: #94a3b8; margin-bottom: 6px;">No feedback items yet</p>
            <p style="font-size: 11px;">Click <b>${isDesigner ? 'Comment' : 'Feedback'}</b> or press <b>Alt+C</b> to select an element on the screen.</p>
          </div>
        ` : state.comments
            .filter(c => {
              if (state.filterStatus === 'open' && c.status === 'resolved') return false;
              if (state.filterStatus === 'resolved' && c.status !== 'resolved') return false;
              if (!state.searchQuery) return true;
              const q = state.searchQuery.toLowerCase();
              return c.text.toLowerCase().includes(q) || (c.friendlyName && c.friendlyName.toLowerCase().includes(q)) || c.selector.toLowerCase().includes(q);
            })
            .map(c => {
              const catObj = CATEGORIES.find(cat => cat.id === c.category) || CATEGORIES[0];
              const isResolved = c.status === 'resolved';
              return `
                <div class="rs-drawer-card ${isResolved ? 'resolved' : ''}" data-id="${c.id}">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="background: ${isResolved ? '#475569' : catObj.color}; color: #fff; font-size: 10px; font-weight: 700; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">
                        ${isResolved ? ICONS.check : c.index}
                      </span>
                      <span style="font-size: 11px; font-weight: 600; color: ${isResolved ? '#94a3b8' : catObj.color};">${catObj.clientLabel}</span>
                    </div>

                    ${isDesigner ? `
                      <button class="rs-btn rs-btn-icon btn-toggle-resolve" data-id="${c.id}" style="height: 24px; width: 24px;" title="${isResolved ? 'Mark as Open' : 'Mark as Resolved'}">
                        ${isResolved ? ICONS.checkCircle : ICONS.circle}
                      </button>
                    ` : `
                      <span style="font-size: 10px; color: #64748b;">${isResolved ? 'Resolved' : 'Pending'}</span>
                    `}
                  </div>

                  <div style="font-size: 12px; font-weight: 600; color: #e2e8f0; margin-bottom: 4px;">
                    ${escapeHtml(c.friendlyName || c.selector)}
                  </div>
                  ${isDesigner ? `<div style="font-family: monospace; font-size: 10px; color: #38bdf8; margin-bottom: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${c.selector}</div>` : ''}

                  <div style="font-size: 12px; color: #cbd5e1; line-height: 1.4; background: rgba(0,0,0,0.25); padding: 8px; border-radius: 6px;">${escapeHtml(c.text)}</div>
                </div>
              `;
            }).join('')}
      </div>

      <div class="rs-drawer-footer">
        ${isDesigner ? `
          <button class="rs-btn rs-btn-primary" id="rs-drawer-copy-all" style="flex: 1;">
            ${ICONS.copy}
            <span>Copy All for AI</span>
          </button>
        ` : `
          <button class="rs-btn rs-btn-primary" id="rs-drawer-client-send" style="flex: 1;">
            ${ICONS.send}
            <span>Send Feedback to Designer</span>
          </button>
        `}
      </div>
    `;

    drawerEl.querySelector('#rs-drawer-close').onclick = closeDrawer;

    const searchInput = drawerEl.querySelector('#rs-search-input');
    if (searchInput) {
      searchInput.oninput = (e) => {
        state.searchQuery = e.target.value;
        renderDrawerList();
      };
    }

    const drawerSendBtn = drawerEl.querySelector('#rs-drawer-client-send');
    if (drawerSendBtn) drawerSendBtn.onclick = openClientSendModal;

    const drawerCopyBtn = drawerEl.querySelector('#rs-drawer-copy-all');
    if (drawerCopyBtn) drawerCopyBtn.onclick = copyFeedbackToClipboard;

    drawerEl.querySelectorAll('.btn-toggle-resolve').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        toggleCommentStatus(id);
      };
    });

    drawerEl.querySelectorAll('.rs-drawer-card').forEach(card => {
      card.onclick = () => {
        const id = card.getAttribute('data-id');
        const c = state.comments.find(item => item.id === id);
        if (!c) return;

        let el = elementMap.get(c.id) || findElementBySelector(c.selector);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('rs-spotlight-active');
          setTimeout(() => el.classList.remove('rs-spotlight-active'), 1200);
          selectElementForComment(el, c);
        } else {
          showToast('Target element not found on current view', 'warn');
        }
      };
    });
  }

  // ==========================================================================
  // 12. CLIENT FEEDBACK SUBMISSION & SHARING MODAL
  // ==========================================================================
  function openClientSendModal() {
    if (state.comments.length === 0) {
      showToast('Please add at least one feedback item before sending', 'warn');
      return;
    }

    const openCount = state.comments.filter(c => c.status !== 'resolved').length;

    modalEl.innerHTML = `
      <div class="rs-modal">
        <div class="rs-modal-title">
          ${ICONS.send}
          <span>Send Feedback to Designer</span>
        </div>
        <div class="rs-modal-subtitle">
          You have <b>${openCount} feedback items</b> ready for review. Choose how you would like to send them:
        </div>

        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 11px; font-weight: 600; color: #94a3b8; margin-bottom: 5px;">Your Name / Company (Optional):</label>
          <input type="text" id="rs-client-name-input" value="${escapeHtml(state.clientName)}" placeholder="e.g. Alex (Client)" style="width: 100%; background: #060911; border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 6px; color: #f8fafc; padding: 7px 10px; font-size: 12px; outline: none;">
        </div>

        <div class="rs-share-grid">
          <div class="rs-share-card" id="share-card-email">
            <div class="rs-share-card-header">
              ${ICONS.mail}
              <span>Email to Designer</span>
            </div>
            <div class="rs-share-card-desc">Opens your email app with formatted notes addressed to the designer.</div>
          </div>

          <div class="rs-share-card" id="share-card-chat">
            <div class="rs-share-card-header">
              ${ICONS.chat}
              <span>Copy for WhatsApp / Slack</span>
            </div>
            <div class="rs-share-card-desc">Copies a clean bulleted review list ready to paste directly in chat.</div>
          </div>

          <div class="rs-share-card" id="share-card-file">
            <div class="rs-share-card-header">
              ${ICONS.download}
              <span>Download Review (.json)</span>
            </div>
            <div class="rs-share-card-desc">Downloads a review data file that the designer can load into their tools.</div>
          </div>

          <div class="rs-share-card" id="share-card-copy-text">
            <div class="rs-share-card-header">
              ${ICONS.copy}
              <span>Copy Full Report</span>
            </div>
            <div class="rs-share-card-desc">Copies complete plain-text notes with timestamps and element titles.</div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button class="rs-btn" id="rs-modal-cancel">Close</button>
        </div>
      </div>
    `;

    modalEl.classList.add('open');

    const nameInput = modalEl.querySelector('#rs-client-name-input');
    if (nameInput) {
      nameInput.onchange = (e) => {
        state.clientName = e.target.value.trim();
        saveData();
      };
    }

    modalEl.querySelector('#rs-modal-cancel').onclick = () => {
      modalEl.classList.remove('open');
    };

    modalEl.querySelector('#share-card-email').onclick = () => {
      sendViaEmail();
      modalEl.classList.remove('open');
    };

    modalEl.querySelector('#share-card-chat').onclick = () => {
      copyClientChatSummary();
      modalEl.classList.remove('open');
    };

    modalEl.querySelector('#share-card-file').onclick = () => {
      exportSessionFile();
      modalEl.classList.remove('open');
    };

    modalEl.querySelector('#share-card-copy-text').onclick = () => {
      copyClientTextReport();
      modalEl.classList.remove('open');
    };
  }

  function sendViaEmail() {
    const title = document.title || 'Website Review';
    const client = state.clientName ? ` (${state.clientName})` : '';
    const subject = encodeURIComponent(`Design Feedback: ${title}${client}`);

    let body = `Hi,\n\nHere is my visual feedback on ${title} (${window.location.href}):\n\n`;

    state.comments.forEach((c, idx) => {
      const catObj = CATEGORIES.find(cat => cat.id === c.category) || CATEGORIES[0];
      body += `${idx + 1}. [${catObj.clientLabel}] ${c.friendlyName || c.selector}\n   Feedback: ${c.text}\n\n`;
    });

    body += `Sent via Review Studio.\n`;

    const recipient = state.designerEmail || '';
    const mailto = `mailto:${recipient}?subject=${subject}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    showToast('Email client opened!', 'success');
  }

  function copyClientChatSummary() {
    const title = document.title || 'Website Review';
    const client = state.clientName ? ` by ${state.clientName}` : '';
    let summary = `*Design Feedback for ${title}*${client}\n`;
    summary += `URL: ${window.location.href}\n\n`;

    state.comments.forEach((c, idx) => {
      const catObj = CATEGORIES.find(cat => cat.id === c.category) || CATEGORIES[0];
      summary += `${idx + 1}. *[${catObj.clientLabel}]* ${c.friendlyName || 'Element'}\n   ${c.text}\n\n`;
    });

    copyToClipboard(summary, 'Feedback summary copied! Ready to paste into WhatsApp or Slack.');
  }

  function copyClientTextReport() {
    const title = document.title || 'Website Review';
    let report = `========================================================\n`;
    report += `REVIEW STUDIO DESIGN FEEDBACK REPORT\n`;
    report += `Project: ${title}\n`;
    report += `Reviewer: ${state.clientName || 'Client'}\n`;
    report += `Date: ${new Date().toLocaleString()}\n`;
    report += `URL: ${window.location.href}\n`;
    report += `========================================================\n\n`;

    state.comments.forEach((c, idx) => {
      const catObj = CATEGORIES.find(cat => cat.id === c.category) || CATEGORIES[0];
      report += `[#${idx + 1}] ${catObj.clientLabel.toUpperCase()}: ${c.friendlyName}\n`;
      report += `Feedback: ${c.text}\n`;
      report += `Status: ${c.status === 'resolved' ? 'Resolved' : 'Pending'}\n\n`;
    });

    copyToClipboard(report, 'Full text report copied to clipboard!');
  }

  // ==========================================================================
  // 13. SESSION EXPORT / IMPORT
  // ==========================================================================
  function exportSessionFile() {
    const data = {
      app: 'Review Studio',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      page: {
        title: document.title,
        url: window.location.href,
        viewport: `${window.innerWidth}x${window.innerHeight}`
      },
      clientName: state.clientName,
      comments: state.comments
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `review-studio-feedback-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Feedback file downloaded (.json)', 'success');
  }

  function openImportDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          if (parsed && Array.isArray(parsed.comments)) {
            state.comments = parsed.comments;
            if (parsed.clientName) state.clientName = parsed.clientName;
            saveData();
            showToast(`Loaded ${parsed.comments.length} feedback items from file!`, 'success');
            if (state.isHidden) toggleVisibility(true);
          } else {
            showToast('Invalid Review Studio session file', 'warn');
          }
        } catch (err) {
          showToast('Failed to parse JSON file', 'warn');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  // ==========================================================================
  // 14. DESIGNER AI PROMPT GENERATOR
  // ==========================================================================
  function generateAIMarkdown() {
    if (state.comments.length === 0) return '';

    const title = document.title || 'Web Page';
    const url = window.location.href;
    const viewport = `${window.innerWidth} × ${window.innerHeight}`;
    const date = new Date().toLocaleString();
    const openTasks = state.comments.filter(c => c.status !== 'resolved');

    let md = `# Review Studio Visual Feedback for AI Coding Agent\n\n`;
    md += `> **Source Page**: [${title}](${url})\n`;
    md += `> **Viewport**: ${viewport} | **Date**: ${date}\n`;
    md += `> **Reviewer**: ${state.clientName || 'Client'}\n`;
    md += `> **Total Items**: ${state.comments.length} (${openTasks.length} open, ${state.comments.length - openTasks.length} resolved)\n\n`;
    md += `---\n\n`;

    state.comments.forEach(c => {
      const catObj = CATEGORIES.find(cat => cat.id === c.category) || CATEGORIES[0];
      const isResolved = c.status === 'resolved';

      md += `### [${c.index}] \`${c.selector}\` ${isResolved ? '(Status: RESOLVED)' : ''}\n\n`;
      md += `- **Feedback / Instruction**:\n  > ${c.text}\n`;
      md += `- **Target Element**: ${c.friendlyName || c.tagName}\n`;
      md += `- **Category**: ${catObj.label}\n`;
      md += `- **CSS Selector**: \`${c.selector}\`\n`;
      md += `- **HTML Tag**: \`<${c.tagName}>\`\n`;
      if (c.idAttr) md += `- **ID**: \`#${c.idAttr}\`\n`;
      if (c.classes) md += `- **Classes**: \`${c.classes}\`\n`;
      if (c.dimensions) md += `- **Rendered Dimensions**: ${c.dimensions.width}px × ${c.dimensions.height}px\n`;

      if (c.computedStyles && Object.keys(c.computedStyles).length > 0) {
        md += `- **Computed Styles Snapshot**:\n`;
        Object.entries(c.computedStyles).forEach(([k, v]) => {
          md += `  - \`${k}\`: \`${v}\`\n`;
        });
      }

      if (c.snippet) {
        md += `- **Element Snippet**:\n  \`\`\`html\n  ${c.snippet}\n  \`\`\`\n`;
      }

      md += `\n---\n\n`;
    });

    md += `### Instructions for AI Coding Agent\n`;
    md += `1. Review each feedback item above with its selector, element snippet, and instructions.\n`;
    md += `2. Search the codebase for the element ID, classes, or text content.\n`;
    md += `3. Implement the requested UI, style, layout, or copy adjustments accurately.\n`;
    md += `4. Strictly follow the established design tokens (tokens.css / DESIGN_TOKENS.md). Do NOT introduce new design tokens or hardcoded hex/rgba values while working.\n`;
    md += `5. If it is genuinely necessary to introduce a new design token, ask the user explicitly with recommended options and trade-offs before proceeding.\n`;
    md += `6. Ensure all responsive views and dark/light mode themes remain consistent and verified.\n`;

    return md;
  }

  function copyFeedbackToClipboard() {
    if (state.comments.length === 0) {
      showToast('No feedback items to copy', 'warn');
      return;
    }
    const md = generateAIMarkdown();
    copyToClipboard(md, `Copied ${state.comments.length} items formatted for AI!`);
  }

  function copyToClipboard(text, successMessage) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMessage, 'success');
      }).catch(() => fallbackCopy(text, successMessage));
    } else {
      fallbackCopy(text, successMessage);
    }
  }

  function fallbackCopy(text, successMessage) {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    try {
      document.execCommand('copy');
      showToast(successMessage, 'success');
    } catch (e) {
      showToast('Failed to copy to clipboard', 'warn');
    }
    document.body.removeChild(el);
  }

  // ==========================================================================
  // 15. TOAST NOTIFICATIONS
  // ==========================================================================
  let toastTimer = null;
  function showToast(message, type = 'info') {
    if (!toastEl) return;
    toastEl.textContent = message;

    if (type === 'success') {
      toastEl.style.background = '#0284c7';
    } else if (type === 'warn') {
      toastEl.style.background = '#ea580c';
    } else {
      toastEl.style.background = '#0284c7';
    }

    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2800);
  }

  // ==========================================================================
  // 16. EVENT LISTENERS & SHORTCUTS
  // ==========================================================================
  function setupEventListeners() {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('click', handleClick, true);
    window.addEventListener('scroll', updatePinsPosition, { passive: true });
    window.addEventListener('resize', updatePinsPosition, { passive: true });

    let designerKeySeq = [];
    let designerKeyTimer = null;

    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      const isInsideInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);

      if (e.key === 'Escape') {
        if (state.isInspecting) {
          toggleInspectMode();
          return;
        }
        if (popoverEl.style.display === 'block') {
          closePopover();
          return;
        }
        if (state.isDrawerOpen) {
          closeDrawer();
          return;
        }
        if (modalEl.classList.contains('open')) {
          modalEl.classList.remove('open');
          return;
        }
      }

      // Alt+H or Alt+\ toggles Review Studio Visibility
      if (e.altKey && (e.key === 'h' || e.key === 'H' || e.key === '\\')) {
        e.preventDefault();
        toggleVisibility();
        return;
      }

      // Alt+C toggles Feedback / Inspect Mode
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        toggleInspectMode();
        return;
      }

      // HIDDEN DESIGNER SHORTCUT: Alt + 456 (Hold Alt and type 4, 5, 6 sequentially)
      if (e.altKey) {
        const k = e.key;
        if (k === '4' || k === '5' || k === '6' || e.code === 'Numpad4' || e.code === 'Numpad5' || e.code === 'Numpad6') {
          const numChar = (k === '4' || e.code === 'Numpad4') ? '4' : ((k === '5' || e.code === 'Numpad5') ? '5' : '6');
          designerKeySeq.push(numChar);
          clearTimeout(designerKeyTimer);
          designerKeyTimer = setTimeout(() => {
            designerKeySeq = [];
          }, 3000);

          if (designerKeySeq.length >= 3 && designerKeySeq.slice(-3).join('') === '456') {
            designerKeySeq = [];
            e.preventDefault();
            toggleDesignerMode();
            return;
          }
        } else if (k !== 'Alt') {
          designerKeySeq = [];
        }
      } else {
        designerKeySeq = [];
      }

      // Cmd+Shift+C / Ctrl+Shift+C copies feedback
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'c' || e.key === 'C')) {
        if (!isInsideInput) {
          e.preventDefault();
          if (state.mode === 'client') {
            copyClientChatSummary();
          } else {
            copyFeedbackToClipboard();
          }
        }
      }
    });
  }

  // ==========================================================================
  // 17. PUBLIC INITIALIZATION & EXPORT
  // ==========================================================================
  function init() {
    loadData();
    initShadowDOM();
    setupEventListeners();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  const ReviewStudioAPI = {
    toggleInspect: toggleInspectMode,
    toggleVisibility: toggleVisibility,
    toggleDesignerMode: toggleDesignerMode,
    hide: () => toggleVisibility(false),
    show: () => toggleVisibility(true),
    getMode: () => state.mode,
    copyMarkdown: copyFeedbackToClipboard,
    exportSession: exportSessionFile,
    getComments: () => [...state.comments],
    clearAll: () => {
      state.comments = [];
      elementMap.clear();
      saveData();
    },
    version: '2.1.0'
  };

  global.ReviewStudio = ReviewStudioAPI;
  global.Artholic = ReviewStudioAPI; // Backward compatibility
  global.Agentation = ReviewStudioAPI; // Backward compatibility

})(typeof window !== 'undefined' ? window : this);
