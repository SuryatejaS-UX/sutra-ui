/**
 * Sutra UI - Custom Tooltip Engine
 * --------------------------------------------------------------------------
 * High-performance, accessible, zero-dependency custom tooltip system.
 * - Replaces slow, unstyled native browser title tooltips across the app.
 * - Formats keyboard shortcuts automatically with sleek <kbd> badges.
 * - Dynamic positioning with smart collision detection and arrow centering.
 * - Warm-handoff pattern (instant 0ms transition between adjacent buttons).
 * - Full WCAG 2.1 keyboard accessibility (focusin, focusout, Escape dismissal).
 * - MutationObserver to automatically upgrade dynamically created elements.
 */

(function () {
  'use strict';

  const HOVER_DELAY = 120; // ms before first tooltip appears
  const WARM_WINDOW = 350; // ms to keep warm state for instant switching
  const VIEWPORT_MARGIN = 8; // min px distance from viewport edge
  const ARROW_OFFSET = 8; // px offset between target and tooltip

  let tooltipEl = null;
  let labelEl = null;
  let kbdEl = null;
  let activeTarget = null;
  let showTimer = null;
  let hideTimer = null;
  let warmTimer = null;
  let isWarm = false;
  let lastPointerX = 0;
  let lastPointerY = 0;

  document.addEventListener('pointermove', (e) => {
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;

    // Dynamically track cursor along tall resizer bar if tooltip is active
    if (activeTarget && tooltipEl && tooltipEl.classList.contains('is-visible')) {
      if (activeTarget.classList.contains('sutra-resizer') || activeTarget.closest('.sutra-resizer')) {
        positionTooltip(activeTarget);
      }
    }
  }, { passive: true });

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // Initialize Tooltip DOM Element
  function initTooltipDOM() {
    if (tooltipEl) return;

    tooltipEl = document.createElement('div');
    tooltipEl.id = 'sutra-custom-tooltip';
    tooltipEl.className = 'sutra-tooltip';
    tooltipEl.setAttribute('role', 'tooltip');
    tooltipEl.setAttribute('aria-hidden', 'true');

    labelEl = document.createElement('span');
    labelEl.className = 'sutra-tooltip-label';

    kbdEl = document.createElement('kbd');
    kbdEl.className = 'sutra-tooltip-kbd';

    tooltipEl.appendChild(labelEl);
    tooltipEl.appendChild(kbdEl);
    document.body.appendChild(tooltipEl);
  }

  // Detect keyboard shortcut pattern in text
  function parseTooltipContent(rawText) {
    if (!rawText) return { label: '', shortcut: '' };

    const text = rawText.trim();

    // 1. Matches brackets like [|] or [⌘K]
    const bracketMatch = text.match(/^(.*?)\s*(\[[^\]]+\])$/);
    if (bracketMatch) {
      return {
        label: bracketMatch[1].trim(),
        shortcut: bracketMatch[2].replace(/[\[\]]/g, '')
      };
    }

    // 2. Matches parentheses with known key symbols or combinations
    const parenMatch = text.match(/^(.*?)\s*\(([^)]+)\)$/);
    if (parenMatch) {
      const inside = parenMatch[2].trim();
      const isShortcut =
        /[⌘⌥⇧⌃]/.test(inside) ||
        /\b(Ctrl|Alt|Shift|Command|Cmd|Option|Esc|Escape|Enter|Return|Tab|Space|Delete)\b/i.test(inside) ||
        /^([A-Z0-9]|F[1-12])$/i.test(inside) ||
        (inside.length <= 4 && !/\s/.test(inside));

      if (isShortcut) {
        return {
          label: parenMatch[1].trim(),
          shortcut: inside
        };
      }
    }

    return { label: text, shortcut: '' };
  }

  // Convert title attribute to data-custom-tooltip on an element
  function upgradeElementTitle(el) {
    if (!el || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return;
    const titleVal = el.getAttribute('title');
    if (titleVal && titleVal.trim()) {
      el.setAttribute('data-custom-tooltip', titleVal.trim());
      el.removeAttribute('title');
      if (!el.getAttribute('aria-label')) {
        const { label } = parseTooltipContent(titleVal);
        el.setAttribute('aria-label', label);
      }
    }
  }

  // Sanitize all elements in DOM
  function sanitizeAllTitles(root = document) {
    root.querySelectorAll('[title]').forEach(upgradeElementTitle);
  }

  // Find valid tooltip trigger ancestor
  function getTooltipTrigger(el) {
    if (!el || el === document.body || el === document.documentElement) return null;

    const trigger = el.closest('[data-tooltip], [data-custom-tooltip], [title]');
    if (!trigger) return null;

    if (!trigger.hasAttribute('data-tooltip') && (trigger.tagName === 'INPUT' || trigger.tagName === 'TEXTAREA')) {
      return null;
    }

    // Suppress tooltips on elements with open dropdowns or when menu trigger is expanded
    if (trigger.getAttribute('aria-expanded') === 'true' || 
        trigger.classList.contains('open') || 
        trigger.closest('.open') || 
        trigger.closest('[aria-expanded="true"]')) {
      return null;
    }

    return trigger;
  }

  // Show Tooltip for a target
  function showTooltip(target, immediate = false) {
    if (!target) return;
    if (target.getAttribute('aria-expanded') === 'true' || 
        target.classList.contains('open') || 
        target.closest('.open') || 
        target.closest('[aria-expanded="true"]')) {
      hideTooltip(true);
      return;
    }

    clearTimeout(showTimer);
    clearTimeout(hideTimer);

    // Extract text from title or data attributes
    let rawText = target.getAttribute('data-custom-tooltip') || target.getAttribute('data-tooltip') || target.getAttribute('title');
    if (!rawText || !rawText.trim()) return;

    // Ensure title is stripped so native OS tooltip never appears
    upgradeElementTitle(target);

    const explicitShortcut = target.getAttribute('data-tooltip-shortcut');
    let { label, shortcut } = parseTooltipContent(rawText);
    if (explicitShortcut) shortcut = explicitShortcut;

    // User requirement: remove keyboard access/shortcut badge from tab pill tooltips
    if (target.closest('.s08-tab-pill')) {
      shortcut = '';
    }

    activeTarget = target;

    const executeShow = () => {
      if (activeTarget !== target) return;
      if (target.getAttribute('aria-expanded') === 'true' || target.classList.contains('open') || target.closest('.open')) return;

      initTooltipDOM();

      const isExplicitMultiline = label && (label.includes('\n') || label.includes('\\n'));
      const isAutoMultiline = label && label.length > 42;

      if (isExplicitMultiline || isAutoMultiline) {
        let lines;
        if (isExplicitMultiline) {
          lines = label.split(/\r?\n|\\n/);
        } else {
          const mid = Math.floor(label.length / 2);
          const spaceAfter = label.indexOf(' ', mid);
          const spaceBefore = label.lastIndexOf(' ', mid);
          let splitIdx = -1;
          if (spaceAfter !== -1 && spaceBefore !== -1) {
            splitIdx = (spaceAfter - mid < mid - spaceBefore) ? spaceAfter : spaceBefore;
          } else {
            splitIdx = spaceAfter !== -1 ? spaceAfter : spaceBefore;
          }
          if (splitIdx !== -1) {
            lines = [label.slice(0, splitIdx).trim(), label.slice(splitIdx + 1).trim()];
          } else {
            lines = [label];
          }
        }
        labelEl.innerHTML = lines.map(l => escapeHTML(l.trim())).join('<br>');
        tooltipEl.classList.add('is-multiline');
      } else {
        labelEl.textContent = label;
        tooltipEl.classList.remove('is-multiline');
      }

      if (shortcut) {
        kbdEl.textContent = shortcut;
        kbdEl.style.display = 'inline-flex';
      } else {
        kbdEl.textContent = '';
        kbdEl.style.display = 'none';
      }

      const isAlreadyVisible = tooltipEl.classList.contains('is-visible');

      if (isWarm && isAlreadyVisible) {
        // Warm scrubbing: instant update without re-triggering enter transitions or flashing
        tooltipEl.classList.add('is-warm');
        positionTooltip(target);
        tooltipEl.setAttribute('aria-hidden', 'false');
        target.setAttribute('aria-describedby', 'sutra-custom-tooltip');
      } else {
        // Cold start: render hidden to measure dimensions, then spring in
        tooltipEl.classList.remove('is-warm');
        tooltipEl.classList.remove('is-visible');
        tooltipEl.style.visibility = 'hidden';
        tooltipEl.style.display = 'inline-flex';
        tooltipEl.style.left = '0px';
        tooltipEl.style.top = '0px';

        positionTooltip(target);

        tooltipEl.style.visibility = 'visible';
        tooltipEl.classList.add('is-visible');
        tooltipEl.setAttribute('aria-hidden', 'false');
        target.setAttribute('aria-describedby', 'sutra-custom-tooltip');
      }

      isWarm = true;
      clearTimeout(warmTimer);
    };

    if (immediate || isWarm) {
      executeShow();
    } else {
      showTimer = setTimeout(executeShow, HOVER_DELAY);
    }
  }

  // Hide Tooltip
  function hideTooltip(immediate = false) {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);

    const performHide = () => {
      if (activeTarget) {
        activeTarget.removeAttribute('aria-describedby');
        activeTarget = null;
      }

      if (tooltipEl) {
        tooltipEl.classList.remove('is-visible');
        tooltipEl.setAttribute('aria-hidden', 'true');
      }

      // Keep warm state active briefly for smooth transition to adjacent triggers
      clearTimeout(warmTimer);
      warmTimer = setTimeout(() => {
        isWarm = false;
        if (tooltipEl) {
          tooltipEl.classList.remove('is-warm');
          if (!activeTarget) {
            tooltipEl.style.display = 'none';
          }
        }
      }, WARM_WINDOW);
    };

    if (immediate || !isWarm) {
      performHide();
    } else {
      // Warm debounce: give the pointer 70ms to transition to an adjacent button without dropping visibility
      hideTimer = setTimeout(performHide, 70);
    }
  }

  // Calculate coordinates & smart orientation
  function positionTooltip(target) {
    if (!tooltipEl || !target) return;

    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width;
    const tooltipHeight = tooltipRect.height;
    const isResizer = target.classList.contains('sutra-resizer') || target.closest('.sutra-resizer') || targetRect.height > 120;

    // Desired placement
    let placement = target.getAttribute('data-tooltip-placement');

    if (!placement) {
      if (isResizer) {
        // Tall resizers: place to right of channel (or left if near right edge)
        placement = (targetRect.right + tooltipWidth + ARROW_OFFSET > window.innerWidth - VIEWPORT_MARGIN) ? 'left' : 'right';
      } else if (target.closest('.sutra-icon-dock')) {
        placement = 'right';
      } else if (target.closest('.s08-chat-col-footer') || target.closest('.s08-chat-input-actions')) {
        placement = 'top';
      } else if (targetRect.top < 70) {
        placement = 'bottom';
      } else if (targetRect.left < 80) {
        placement = 'right';
      } else if (targetRect.right > window.innerWidth - 100) {
        placement = 'left';
      } else {
        placement = 'top';
      }
    }

    // Collision detection & auto-flipping (skip top/bottom flip on tall resizers)
    if (!isResizer) {
      if (placement === 'top' && targetRect.top - tooltipHeight - ARROW_OFFSET < VIEWPORT_MARGIN) {
        placement = 'bottom';
      } else if (placement === 'bottom' && targetRect.bottom + tooltipHeight + ARROW_OFFSET > window.innerHeight - VIEWPORT_MARGIN) {
        placement = 'top';
      }
    }
    if (placement === 'left' && targetRect.left - tooltipWidth - ARROW_OFFSET < VIEWPORT_MARGIN) {
      placement = 'right';
    } else if (placement === 'right' && targetRect.right + tooltipWidth + ARROW_OFFSET > window.innerWidth - VIEWPORT_MARGIN) {
      placement = 'left';
    }

    // For tall resizers: anchor vertically near cursor position instead of element top
    const targetCenterY = isResizer
      ? Math.max(targetRect.top + 20, Math.min(lastPointerY || (targetRect.top + 40), targetRect.bottom - 20))
      : (targetRect.top + targetRect.height / 2);

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = targetRect.top - tooltipHeight - ARROW_OFFSET;
        left = targetRect.left + (targetRect.width - tooltipWidth) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + ARROW_OFFSET;
        left = targetRect.left + (targetRect.width - tooltipWidth) / 2;
        break;
      case 'left':
        top = targetCenterY - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - ARROW_OFFSET;
        break;
      case 'right':
        top = targetCenterY - tooltipHeight / 2;
        left = targetRect.right + ARROW_OFFSET;
        break;
    }

    // Clamp inside viewport
    const clampedLeft = Math.max(VIEWPORT_MARGIN, Math.min(left, window.innerWidth - tooltipWidth - VIEWPORT_MARGIN));
    const clampedTop = Math.max(VIEWPORT_MARGIN, Math.min(top, window.innerHeight - tooltipHeight - VIEWPORT_MARGIN));

    tooltipEl.style.left = `${Math.round(clampedLeft)}px`;
    tooltipEl.style.top = `${Math.round(clampedTop)}px`;
    tooltipEl.setAttribute('data-placement', placement);

    // Micro-arrow dynamic centering so it points directly to target center even if clamped
    if (placement === 'top' || placement === 'bottom') {
      const targetCenter = targetRect.left + targetRect.width / 2;
      const arrowLeft = Math.max(8, Math.min(targetCenter - clampedLeft, tooltipWidth - 8));
      tooltipEl.style.setProperty('--arrow-left', `${Math.round(arrowLeft)}px`);
    } else {
      const arrowTop = Math.max(8, Math.min(targetCenterY - clampedTop, tooltipHeight - 8));
      tooltipEl.style.setProperty('--arrow-top', `${Math.round(arrowTop)}px`);
    }
  }

  // Global event delegation
  document.addEventListener('mouseover', (e) => {
    const trigger = getTooltipTrigger(e.target);
    if (!trigger) {
      if (activeTarget && !activeTarget.contains(e.target)) {
        hideTooltip();
      }
      return;
    }
    if (trigger !== activeTarget) {
      showTooltip(trigger);
    }
  }, true);

  document.addEventListener('mouseout', (e) => {
    if (!activeTarget) return;
    const trigger = getTooltipTrigger(e.target);
    if (trigger === activeTarget) {
      const related = e.relatedTarget;
      if (!related || !activeTarget.contains(related)) {
        hideTooltip();
      }
    }
  }, true);

  // Keyboard accessibility: Tab navigation
  document.addEventListener('focusin', (e) => {
    const trigger = getTooltipTrigger(e.target);
    if (trigger) {
      showTooltip(trigger, false);
    }
  }, true);

  document.addEventListener('focusout', (e) => {
    if (activeTarget && activeTarget === e.target) {
      hideTooltip(true);
    }
  }, true);

  // Dismiss immediately on click, scroll, resize, or Escape
  document.addEventListener('click', () => {
    hideTooltip(true);
  }, true);

  window.addEventListener('scroll', () => {
    hideTooltip(true);
  }, { passive: true });

  window.addEventListener('resize', () => {
    hideTooltip(true);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideTooltip(true);
    }
  });

  // Observe DOM additions to upgrade dynamically rendered buttons
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          upgradeElementTitle(node);
          sanitizeAllTitles(node);
        }
      });
    });
  });

  // Pre-initialize on DOM ready
  function init() {
    initTooltipDOM();
    sanitizeAllTitles();
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose public API
  window.SutraTooltip = {
    show: showTooltip,
    hide: hideTooltip,
    refresh: () => {
      if (activeTarget) positionTooltip(activeTarget);
    },
    sanitize: sanitizeAllTitles
  };
})();
