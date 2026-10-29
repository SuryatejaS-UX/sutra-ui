/* ==========================================================================
   SUTRA UI - AGENT CATALOGUE CONTROLLER
   Handles:
   1. Real-time Search & Category Filtering
   2. View Switcher (Grid vs Table View)
   3. Dynamic Table Rows Generation
   4. Pagination with Page Slicing & Next/Prev Controls
   5. Interactive Button Feedback
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initCatalogueController();
});

/* ==========================================================================
   GLOBAL AUTO-HIDING SCROLLBAR CONTROLLER
   - Automatically detects active scrolling on any container across the application
   - Reveals scrollbar thumb by applying .is-scrolling during scroll events
   - Auto-fades scrollbar thumb 850ms after scroll motion ceases
   - Works hand-in-hand with hover reveal in base.css
   ========================================================================== */
(function initGlobalScrollbarBehavior() {
  const scrollTimeouts = new WeakMap();
  window.addEventListener('scroll', (e) => {
    const target = e.target;
    const scrollEl = target === document ? document.documentElement : (target instanceof Element ? target : null);
    if (!scrollEl) return;

    scrollEl.classList.add('is-scrolling');

    if (scrollTimeouts.has(scrollEl)) {
      clearTimeout(scrollTimeouts.get(scrollEl));
    }

    const timer = setTimeout(() => {
      scrollEl.classList.remove('is-scrolling');
      scrollTimeouts.delete(scrollEl);
    }, 850);

    scrollTimeouts.set(scrollEl, timer);
  }, { capture: true, passive: true });
})();

/**
 * Apple HIG direct manipulation rubber-band resistance formula
 * f(x) = (x * d * c) / (d + c * |x|)
 * where x = overshoot distance past boundary, d = dimension of element, c = resistance constant (0.55)
 */
function rubberband(overshoot, dimension, constant = 0.55) {
  if (dimension <= 0) return 0;
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

function initCatalogueController() {
  const searchInput = document.getElementById('agent-search-input');
  const categoryPills = document.querySelectorAll('.sutra-tab-pill');
  const viewGridBtn = document.getElementById('view-grid-btn');
  const viewTableBtn = document.getElementById('view-table-btn');
  const agentsGrid = document.getElementById('agents-grid');
  const agentsTableView = document.getElementById('agents-table-view');
  const agentsTableBody = document.getElementById('agents-table-body');
  const emptyState = document.getElementById('agents-empty-state');
  const paginationContainer = document.querySelector('.sutra-pagination');
  const paginationInfo = document.getElementById('pagination-info');
  const paginationPages = document.getElementById('pagination-pages');
  const prevBtn = document.getElementById('pagination-prev-btn');
  const nextBtn = document.getElementById('pagination-next-btn');

  // Helper to format and guard agent ratings against NaN, raw floats, and out-of-bound numbers
  function formatAgentRating(raw) {
    if (raw === null || raw === undefined || raw === '') return '—';
    const num = parseFloat(raw);
    if (!Number.isFinite(num) || isNaN(num)) return '—';
    const clamped = Math.max(0, Math.min(5, num));
    return clamped.toFixed(1);
  }

  // Helper to format user count with correct pluralization ("1 user" vs "12.4k users")
  function formatUserCount(rawUsers) {
    if (!rawUsers && rawUsers !== 0) return '0 users';
    const str = String(rawUsers).trim();
    const cleanStr = str.replace(/\s*users?$/i, '').trim();
    const isSingular = (cleanStr === '1');
    return `${cleanStr} ${isSingular ? 'user' : 'users'}`;
  }

  // Helper to safely format author string and prevent orphaned empty labels
  function formatAgentAuthor(author) {
    if (!author || !author.trim()) return '';
    const clean = author.trim().replace(/^By\s+/i, '');
    return clean ? `By ${clean}` : '';
  }

  // Agent dataset parsed from DOM cards
  const allCards = Array.from(document.querySelectorAll('.sutra-agent-card'));
  let agentsData = allCards.map((card, idx) => {
    const rawUsers = card.getAttribute('data-users') || '10k';
    const formattedUsers = formatUserCount(rawUsers);
    const usersSpan = card.querySelector('.sutra-agent-users');
    if (usersSpan) {
      const svg = usersSpan.querySelector('svg');
      usersSpan.innerHTML = `${svg ? svg.outerHTML : ''} ${formattedUsers}`;
    }
    const authorSpan = card.querySelector('.sutra-agent-author, .sutra-agent-version');
    const version = card.getAttribute('data-version') || 'v1.0.0';
    if (authorSpan) {
      authorSpan.textContent = version;
      authorSpan.setAttribute('dir', 'auto');
    }
    const nameEl = card.querySelector('.sutra-agent-name');
    if (nameEl) nameEl.setAttribute('dir', 'auto');
    const descEl = card.querySelector('.sutra-agent-desc');
    if (descEl) descEl.setAttribute('dir', 'auto');
    return {
      id: idx + 1,
      name: card.getAttribute('data-name'),
      category: card.getAttribute('data-category'),
      version: card.getAttribute('data-version') || 'v1.0.0',
      desc: card.getAttribute('data-desc'),
      author: (card.getAttribute('data-author') || '').trim(),
      rating: formatAgentRating(card.getAttribute('data-rating') || '4.9'),
      users: formattedUsers,
      cardElement: card,
      iconBoxHtml: card.querySelector('.sutra-agent-icon-box').outerHTML
    };
  });



  // Application State
  let currentView = 'grid'; // 'grid' | 'table'
  let activeCategory = 'All';
  let searchQuery = '';
  let currentPage = 1;
  const itemsPerPage = 8;

  // Initialize
  renderTableRows();
  applyFiltersAndPagination();

  // 1. Search Input Listener
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      currentPage = 1; // Reset to page 1 on new search
      applyFiltersAndPagination();
    });
  }

  // 2. Category Tab Pills Listener
  categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      categoryPills.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-selected', 'false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-selected', 'true');
      activeCategory = pill.getAttribute('data-category') || 'All';
      currentPage = 1; // Reset to page 1 on category change
      applyFiltersAndPagination();
    });
  });

  // 3. View Switcher (Grid vs Table) with Apple 120ms Opacity Crossfade
  if (viewGridBtn && viewTableBtn) {
    viewGridBtn.addEventListener('click', () => {
      if (currentView === 'grid') return;
      currentView = 'grid';
      viewGridBtn.classList.add('active');
      viewTableBtn.classList.remove('active');

      if (agentsTableView && agentsTableView.style.display !== 'none') {
        agentsTableView.style.opacity = '0';
        setTimeout(() => {
          agentsTableView.style.display = 'none';
          if (agentsGrid) {
            agentsGrid.style.display = 'grid';
            agentsGrid.style.opacity = '0';
            void agentsGrid.offsetHeight; // Force reflow
            agentsGrid.style.opacity = '1';
          }
          applyFiltersAndPagination();
        }, 120);
      } else {
        if (agentsGrid) {
          agentsGrid.style.display = 'grid';
          agentsGrid.style.opacity = '1';
        }
        applyFiltersAndPagination();
      }
    });

    viewTableBtn.addEventListener('click', () => {
      if (currentView === 'table') return;
      currentView = 'table';
      viewTableBtn.classList.add('active');
      viewGridBtn.classList.remove('active');

      if (agentsGrid && agentsGrid.style.display !== 'none') {
        agentsGrid.style.opacity = '0';
        setTimeout(() => {
          agentsGrid.style.display = 'none';
          if (agentsTableView) {
            agentsTableView.style.display = 'block';
            agentsTableView.style.opacity = '0';
            void agentsTableView.offsetHeight; // Force reflow
            agentsTableView.style.opacity = '1';
          }
          applyFiltersAndPagination();
        }, 120);
      } else {
        if (agentsTableView) {
          agentsTableView.style.display = 'block';
          agentsTableView.style.opacity = '1';
        }
        applyFiltersAndPagination();
      }
    });
  }

  // 4. Populate Table View Rows (With Accordion for Description, Version tag, Clean Agent Cell)
  function renderTableRows() {
    if (!agentsTableBody) return;
    agentsTableBody.innerHTML = '';

    agentsData.forEach(agent => {
      const catBadgeClass = getCategoryBadgeClass(agent.category);

      // Main Table Row
      const tr = document.createElement('tr');
      tr.className = 'sutra-table-row';
      tr.setAttribute('data-id', agent.id);
      tr.setAttribute('data-category', agent.category);
      tr.setAttribute('data-name', agent.name);

      tr.innerHTML = `
        <td class="sutra-td-expand">
          <button class="sutra-table-expand-btn" aria-label="Toggle description" aria-expanded="false" title="Expand description">
            <svg class="sutra-expand-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </td>
        <td class="sutra-td-agent">
          <div class="sutra-table-cell-agent">
            <div class="sutra-agent-icon-box ${catBadgeClass}">
              ${agent.cardElement.querySelector('.sutra-agent-icon-box svg').outerHTML}
            </div>
            <span class="sutra-table-agent-name" dir="auto">${agent.name}</span>
          </div>
        </td>
        <td class="sutra-td-category">
          <span class="sutra-category-badge ${catBadgeClass}">${agent.category}</span>
        </td>
        <td class="sutra-td-version">
          <span class="sutra-table-version-badge" title="${agent.version}">${agent.version}</span>
        </td>
        <td class="sutra-td-rating">
          <div class="sutra-table-rating-wrap">
            <svg width="12" height="12" viewBox="0 0 24 24">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span>${formatAgentRating(agent.rating)}</span>
          </div>
        </td>
        <td class="sutra-td-users">
          <div class="sutra-table-users-wrap">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>${agent.users}</span>
          </div>
        </td>
        <td class="sutra-td-action">
          <button class="sutra-btn sutra-btn-ghost sutra-btn-xs sutra-table-use-btn" data-agent="${agent.name}">Use Agent</button>
        </td>
      `;

      // Accordion Sub-Row for Description
      const accTr = document.createElement('tr');
      accTr.className = 'sutra-table-accordion-row';
      accTr.id = `accordion-${agent.id}`;
      accTr.style.display = 'none';

      accTr.innerHTML = `
        <td colspan="7" class="sutra-table-accordion-td">
          <div class="sutra-table-accordion-content">
            <p class="sutra-table-accordion-desc" dir="auto">${agent.desc}</p>
          </div>
        </td>
      `;

      // Accordion toggle handler
      function toggleAccordion() {
        const isExp = tr.classList.contains('expanded');
        const expandBtn = tr.querySelector('.sutra-table-expand-btn');
        if (isExp) {
          tr.classList.remove('expanded');
          accTr.style.display = 'none';
          if (expandBtn) {
            expandBtn.setAttribute('aria-expanded', 'false');
            expandBtn.setAttribute('title', 'Expand description');
          }
        } else {
          tr.classList.add('expanded');
          accTr.style.display = 'table-row';
          if (expandBtn) {
            expandBtn.setAttribute('aria-expanded', 'true');
            expandBtn.setAttribute('title', 'Collapse description');
          }
        }
      }

      const expandBtn = tr.querySelector('.sutra-table-expand-btn');
      if (expandBtn) {
        expandBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleAccordion();
        });
      }

      tr.style.cursor = 'pointer';
      tr.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        toggleAccordion();
      });

      agentsTableBody.appendChild(tr);
      agentsTableBody.appendChild(accTr);
      agent.tableRowElement = tr;
      agent.accordionRowElement = accTr;
    });

    // Attach button click events to table buttons
    document.querySelectorAll('.sutra-table-use-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleUseAgentClick(btn);
      });
    });
  }

  function getCategoryBadgeClass(category) {
    switch (category) {
      case 'Development': return 'dev';
      case 'Writing': return 'writing';
      case 'Data': return 'data';
      case 'Productivity': return 'security';
      case 'Design': return 'design';
      default: return 'general';
    }
  }

  // 5. Core Filtering and Pagination Engine
  function applyFiltersAndPagination() {
    // A. Filter agents
    const filteredAgents = agentsData.filter(agent => {
      const matchesCategory = (activeCategory === 'All') || (agent.category === activeCategory);
      const matchesSearch = !searchQuery || 
                            agent.name.toLowerCase().includes(searchQuery) || 
                            agent.desc.toLowerCase().includes(searchQuery);
      return matchesCategory && matchesSearch;
    });

    const totalFiltered = filteredAgents.length;
    const totalPages = Math.ceil(totalFiltered / itemsPerPage) || 1;

    // Guard page bounds
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    // Calculate slice indices
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalFiltered);
    const visiblePageAgents = filteredAgents.slice(startIndex, endIndex);

    // B. Update Grid cards visibility
    agentsData.forEach(agent => {
      const isVisibleOnThisPage = visiblePageAgents.includes(agent);
      if (agent.cardElement) {
        agent.cardElement.style.display = isVisibleOnThisPage ? 'flex' : 'none';
      }
      if (agent.tableRowElement) {
        agent.tableRowElement.style.display = isVisibleOnThisPage ? 'table-row' : 'none';
      }
      if (agent.accordionRowElement) {
        if (!isVisibleOnThisPage) {
          agent.accordionRowElement.style.display = 'none';
          if (agent.tableRowElement) {
            agent.tableRowElement.classList.remove('expanded');
            const btn = agent.tableRowElement.querySelector('.sutra-table-expand-btn');
            if (btn) btn.setAttribute('aria-expanded', 'false');
          }
        } else if (agent.tableRowElement && agent.tableRowElement.classList.contains('expanded')) {
          agent.accordionRowElement.style.display = 'table-row';
        } else {
          agent.accordionRowElement.style.display = 'none';
        }
      }
    });

    // C. Handle Empty State
    if (emptyState) {
      emptyState.style.display = totalFiltered === 0 ? 'flex' : 'none';
    }
    if (paginationContainer) {
      paginationContainer.style.display = totalFiltered === 0 ? 'none' : 'flex';
    }

    // D. Update Pagination UI
    if (paginationInfo) {
      if (totalFiltered === 1) {
        paginationInfo.innerHTML = `Showing <strong>1</strong> of <strong>1</strong> agent`;
      } else if (totalFiltered > 0) {
        paginationInfo.innerHTML = `Showing <strong>${startIndex + 1}–${endIndex}</strong> of <strong>${totalFiltered}</strong> agents`;
      } else {
        paginationInfo.innerHTML = `Showing <strong>0</strong> agents`;
      }
    }

    // Prev / Next button states
    if (prevBtn) {
      prevBtn.disabled = (currentPage === 1);
    }
    if (nextBtn) {
      nextBtn.disabled = (currentPage === totalPages);
    }

    // Render Page Number Buttons (Compact Ellipsis Window for 1,000+ items)
    if (paginationPages) {
      paginationPages.innerHTML = '';

      function createPageBtn(page) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `sutra-page-btn ${page === currentPage ? 'active' : ''}`;
        pageBtn.textContent = page;
        pageBtn.setAttribute('aria-label', `Page ${page}`);
        pageBtn.addEventListener('click', () => {
          currentPage = page;
          applyFiltersAndPagination();
        });
        return pageBtn;
      }

      function createEllipsis() {
        const span = document.createElement('span');
        span.className = 'sutra-page-ellipsis';
        span.textContent = '…';
        span.setAttribute('aria-hidden', 'true');
        return span;
      }

      // Determine compact page array
      let pages = [];
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        if (currentPage <= 4) {
          pages = [1, 2, 3, 4, 5, '...', totalPages];
        } else if (currentPage >= totalPages - 3) {
          pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        } else {
          pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
        }
      }

      pages.forEach(item => {
        if (item === '...') {
          paginationPages.appendChild(createEllipsis());
        } else {
          paginationPages.appendChild(createPageBtn(item));
        }
      });
    }
  }

  // 6. Pagination Prev / Next Click Listeners
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        applyFiltersAndPagination();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const totalFiltered = agentsData.filter(agent => {
        const matchesCategory = (activeCategory === 'All') || (agent.category === activeCategory);
        const matchesSearch = !searchQuery || 
                              agent.name.toLowerCase().includes(searchQuery) || 
                              agent.desc.toLowerCase().includes(searchQuery);
        return matchesCategory && matchesSearch;
      }).length;
      const totalPages = Math.ceil(totalFiltered / itemsPerPage) || 1;

      if (currentPage < totalPages) {
        currentPage++;
        applyFiltersAndPagination();
      }
    });
  }

  // 7. Agent Selection & shadcn sidebar-08 Workspace Controller
  const catalogueView = document.getElementById('sutra-catalogue-view');
  const workspaceView = document.getElementById('sutra-workspace-view');
  const s08Sidebar = document.getElementById('s08-sidebar');
  const s08SidebarTrigger = document.getElementById('s08-sidebar-trigger');
  const s08PlaygroundGroup = document.getElementById('s08-playground-group');
  const s08PlaygroundTrigger = document.getElementById('s08-playground-trigger');
  const s08CrumbBack = document.getElementById('s08-crumb-back');
  const s08CrumbCurrent = document.getElementById('s08-crumb-current');
  const s08CrumbSep = document.getElementById('s08-crumb-sep') || document.querySelector('.s08-breadcrumb-sep');
  const s08AgentTitle = document.getElementById('s08-agent-title');
  const s08AgentSubtitle = document.getElementById('s08-agent-subtitle');
  const s08WorkspaceTitle = document.getElementById('s08-workspace-title');
  const s08WorkspaceSubtitle = document.getElementById('s08-workspace-subtitle');
  const tabViewsContainer = document.getElementById('s08-tab-views-container');
  const tabPillsList = document.getElementById('s08-tab-pills-list');
  const addTabWrap = document.getElementById('s08-add-tab-wrap');
  const addTabBtn = document.getElementById('s08-add-tab-btn');
  const addTabMenu = document.getElementById('s08-add-tab-menu');
  const tabsScrollArea = document.getElementById('s08-tabs-scroll-area');
  const tabOverflowWrap = document.getElementById('s08-tab-overflow-wrap');
  const tabOverflowBtn = document.getElementById('s08-tab-overflow-btn');
  const tabOverflowMenu = document.getElementById('s08-tab-overflow-menu');
  const tabCountBadge = document.getElementById('s08-tab-count-badge');
  const overflowList = document.getElementById('s08-overflow-list');
  const overflowCount = document.getElementById('s08-overflow-count');

  // Standard tab definitions
  const tabDefinitions = {
    'sources': { label: 'Artifacts', viewId: 's08-view-sources' },
    'artifacts': { label: 'Artifacts', viewId: 's08-view-sources' },
    'files': { label: 'Files', viewId: 's08-view-sources' },
    'editor': { label: 'Editor', viewId: 's08-view-editor' },
    'browser': { label: 'Browser', viewId: 's08-view-browser' },
    'log viewer': { label: 'Log Viewer', viewId: 's08-view-log-viewer' }
  };

  const normalizeTabKey = (k) => {
    const clean = (k || '').toLowerCase().trim();
    if (clean === 'artifacts' || clean === 'files') return 'sources';
    return clean;
  };

  const getTabViewId = (k) => {
    const clean = normalizeTabKey(k);
    if (clean === 'sources') return 's08-view-sources';
    if (clean === 'browser') return 's08-view-browser';
    if (clean === 'log viewer' || clean === 'logs') return 's08-view-log-viewer';
    return tabDefinitions[clean]?.viewId || 's08-view-editor';
  };

  // Standard deliverables dataset
  const defaultDeliverables = [
    {
      id: 'art-epic-universal-login',
      name: 'EPIC_Universal_Login.md',
      size: '6.2 KB',
      type: 'generated',
      ext: 'md',
      badge: 'EPIC-104',
      author: 'Business Analysis Agent',
      time: 'Just now',
      desc: 'Universal Application Login spec committed to Jira (EPIC-104)'
    },
    {
      id: 'art-spec-architecture',
      name: 'architecture-spec.md',
      size: '8.4 KB',
      type: 'generated',
      ext: 'md',
      badge: 'SPEC',
      author: 'Agent General',
      time: '10m ago',
      desc: 'System architecture, stage renderers, SLA targets'
    },
    {
      id: 'art-diff-forecast',
      name: 'forecast.ts',
      size: '+18 / -4',
      type: 'generated',
      ext: 'diff',
      badge: 'DIFF',
      author: 'Synthetix',
      time: '24m ago',
      desc: 'EWMA anomaly detection and confidence intervals'
    },
    {
      id: 'art-diagram-topology',
      name: 'system-topology.svg',
      size: '24.1 KB',
      type: 'generated',
      ext: 'svg',
      badge: 'DIAGRAM',
      author: 'DevOps Specialist',
      time: '1h ago',
      desc: 'Microservices, Agent Clusters & Gateway Vector Topology'
    },
    {
      id: 'art-audit-report',
      name: 'auth_security_audit_report.json',
      size: '34.2 KB',
      type: 'uploaded',
      ext: 'json',
      badge: 'JSON',
      author: 'Security Lead',
      time: '2h ago',
      desc: 'OAuth2 RBAC vulnerability matrix'
    }
  ];

  // Hoisted artifact state variables initialized immediately
  var artifactsData = [...defaultDeliverables];
  window.artifactsData = artifactsData;
  var currentArtifactDoc = null;
  var renderArtifactContentIntoStage = null;
  var openArtifactInStage = null;
  // Phase 10: Horizontal Stage / Monitor Split Ratio
  var savedStageHeightRatio = null;
  var lastActiveStageKey = 'browser';
  // Phase 11: Workspace Persistence & Deep-Linking State
  var isHydrating = false;
  var saveWorkspaceState = null;
  var hydrateWorkspaceState = null;

  // Dynamic Breadcrumbs Handler:
  // - Global level (no project folder selected): displays ONLY chat title (e.g. "API Authentication Flow")
  // - Grouped in project folder: displays [Project Name] / [Chat Title] (e.g. "Travel / Flight Booking API")
  function updateBreadcrumbs(chatTitle, projectName = null) {
    if (projectName) {
      if (s08CrumbBack) {
        s08CrumbBack.textContent = projectName;
        s08CrumbBack.style.display = 'inline-flex';
      }
      if (s08CrumbSep) {
        s08CrumbSep.style.display = 'inline-block';
      }
      if (s08CrumbCurrent) {
        s08CrumbCurrent.textContent = chatTitle;
      }
    } else {
      if (s08CrumbBack) {
        s08CrumbBack.style.display = 'none';
      }
      if (s08CrumbSep) {
        s08CrumbSep.style.display = 'none';
      }
      if (s08CrumbCurrent) {
        s08CrumbCurrent.textContent = chatTitle;
      }
    }
  }

  // Primary Navigation Dock items
  const dockBtns = document.querySelectorAll('.sutra-dock-btn');
  const dockCatalogueBtn = dockBtns[0]; // Catalogue
  const dockWorkspaceBtn = dockBtns[1]; // Workspaces

  // Helper to safely extract grapheme cluster without slicing UTF-16 surrogate pairs or emoji ZWJ sequences
  function getGraphemes(str) {
    if (!str) return [];
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
      return Array.from(segmenter.segment(str), s => s.segment);
    }
    return Array.from(str);
  }

  // Helper to generate 2-letter agent initials badge (Unicode & Emoji safe, suffix-aware)
  function getAgentInitials(name) {
    if (!name) return 'AG';
    const clean = name.trim();
    if (!clean) return 'AG';

    // Split words by space, hyphen, underscore
    const rawWords = clean.split(/[\s_-]+/).filter(Boolean);
    if (rawWords.length === 0) return 'AG';

    // Filter out common suffixes that shouldn't contribute to person/agent initials
    const suffixRegex = /^(III|II|IV|V|VI|Jr|Sr|Inc|LLC|Corp|v\d+.*)$/i;
    const meaningfulWords = rawWords.filter(w => !suffixRegex.test(w));
    const words = meaningfulWords.length > 0 ? meaningfulWords : rawWords;

    if (words.length >= 2) {
      const firstG = getGraphemes(words[0])[0] || '';
      const lastG = getGraphemes(words[words.length - 1])[0] || '';
      return (firstG + lastG).toUpperCase();
    }

    // Single word (e.g. "Jo", "Synthetix", "J", "🦊")
    const graphemes = getGraphemes(words[0]);
    if (graphemes.length >= 2) {
      return (graphemes[0] + graphemes[1]).toUpperCase();
    }
    return (graphemes[0] || 'AG').toUpperCase();
  }

  let currentAgent = 'Agent General';
  let currentWorkspaceScope = '';
  let currentWorkAreaScope = '';
  let currentWorkspacePlan = '';

  const agentRoles = {
    'Synthetix': 'Development',
    'Agent General': 'Autonomous Specialist',
    'Design Engineer': 'UI/UX & Design Tokens',
    'Sales Copilot': 'Enterprise CRM Specialist',
    'Financial Analyst': 'FinOps & Forecasting',
    'DevOps Specialist': 'CI/CD & Cloud Infrastructure',
    'Research Assistant': 'Data Gathering & Synthesis'
  };

  function updateAgentTabTitles(agentName) {
    const isSynthetix = (agentName || '').toLowerCase().trim() === 'synthetix';
    const tabTitle = isSynthetix ? 'Files' : 'Artifacts';

    // 1. Update tabDefinitions if available
    if (typeof tabDefinitions !== 'undefined' && tabDefinitions['sources']) {
      tabDefinitions['sources'].label = tabTitle;
    }

    // 2. Update the tab pill label if it exists in the DOM
    const sourcesPillLabel = document.querySelector('.s08-tab-pill[data-tab-name="sources"] .s08-tab-pill-label');
    if (sourcesPillLabel) {
      sourcesPillLabel.textContent = tabTitle;
    }

    // 3. Update the add-tab menu item label
    const sourcesMenuItem = document.querySelector('.s08-tab-menu-item[data-tab-name="sources"] span');
    if (sourcesMenuItem) {
      sourcesMenuItem.textContent = tabTitle;
    }

    // 4. Update empty reopen button & description if present
    const emptyReopenLabel = document.getElementById('s08-empty-reopen-tab-label');
    if (emptyReopenLabel) {
      emptyReopenLabel.textContent = `Reopen ${tabTitle}`;
    } else {
      const emptyReopenBtn = document.getElementById('s08-empty-reopen-tab-btn');
      if (emptyReopenBtn) emptyReopenBtn.textContent = `Reopen ${tabTitle}`;
    }
    const noTabsDesc = document.getElementById('s08-no-tabs-desc');
    if (noTabsDesc) {
      noTabsDesc.textContent = `Select a tab from the "+" menu above or reopen ${tabTitle}.`;
    }

    // 4. Update the contextual action button
    if (typeof updateTabContextAction === 'function') {
      updateTabContextAction(typeof currentActiveTab !== 'undefined' ? currentActiveTab : 'sources');
    }

    // 5. Toggle between Synthetix Files View and Artifacts View (Strictly preserve Synthetix flow)
    const synthetixFilesView = document.getElementById('s08-synthetix-files-view');
    const artifactsView = document.getElementById('s08-artifacts-view');
    if (synthetixFilesView && artifactsView) {
      if (isSynthetix) {
        synthetixFilesView.style.display = 'flex';
        artifactsView.style.display = 'none';
      } else {
        synthetixFilesView.style.display = 'none';
        artifactsView.style.display = 'flex';
      }
    }

    // 6. Responsive width adjustment for Artifacts vs Synthetix Files
    const insets = document.getElementById('s08-inset-body');
    if (typeof currentActiveTab !== 'undefined' && currentActiveTab === 'sources' && insets) {
      if (!insets.classList.contains('tabs-collapsed') && !insets.classList.contains('tabs-full-width')) {
        // Only override if not in three-pane or multi-open mode
        if (!insets.classList.contains('tabs-three-pane') && !insets.classList.contains('tabs-multi-open')) {
          const rect = insets.getBoundingClientRect();
          if (rect && rect.width > 0) {
            if (isSynthetix) {
              const minS = Math.max(160, Math.round(rect.width * 0.15));
              const maxS = Math.max(260, Math.round(rect.width * 0.25));
              let targetW = (typeof savedSynthetixTabsWidth !== 'undefined' && savedSynthetixTabsWidth) ? savedSynthetixTabsWidth : Math.round(rect.width * 0.20);
              targetW = Math.max(minS, Math.min(maxS, targetW));
              const convW = rect.width - targetW;
              insets.style.gridTemplateColumns = `${convW}px 0px 1fr`;
            } else {
              const minA = Math.max(320, Math.round(rect.width * 0.22));
              const maxA = Math.max(480, Math.round(rect.width * 0.35));
              let targetW = (typeof savedArtifactsTabsWidth !== 'undefined' && savedArtifactsTabsWidth) ? savedArtifactsTabsWidth : Math.max(340, Math.round(rect.width * 0.27));
              targetW = Math.max(minA, Math.min(maxA, targetW));
              const convW = rect.width - targetW;
              insets.style.gridTemplateColumns = `${convW}px 0px 1fr`;
            }
          } else {
            insets.style.gridTemplateColumns = isSynthetix ? '1fr 0px minmax(200px, 240px)' : '1fr 0px minmax(320px, 340px)';
          }
        }
      }
    }

    // 7. Update empty state labels & topbar titles
    updateSourcesViewEmptyState();
  }

  function updateSourcesViewEmptyState() {
    const isSynthetix = (currentAgent || '').toLowerCase().trim() === 'synthetix';
    const emptyStateEl = document.getElementById('s08-sources-empty-state');
    const treeEl = document.getElementById('s08-sources-tree');
    const emptyTitleEl = document.getElementById('s08-sources-empty-title');
    const emptyDescEl = document.getElementById('s08-sources-empty-desc');
    const titleEl = document.getElementById('s08-sources-title');
    const toggleAllBtn = document.getElementById('s08-tree-toggle-all');

    const isEmpty = !currentWorkspaceScope || currentWorkspaceScope === 'Select Workspace' || currentWorkspaceScope === 'Select Repository' || currentWorkspaceScope === 'None' || currentWorkspaceScope === '';

    if (isEmpty) {
      if (emptyStateEl) emptyStateEl.style.display = 'flex';
      if (treeEl) treeEl.style.display = 'none';
      if (toggleAllBtn) toggleAllBtn.style.display = 'none';

      if (emptyTitleEl) {
        emptyTitleEl.textContent = isSynthetix ? 'No Files Loaded' : 'No Workspace Selected';
      }
      if (emptyDescEl) {
        emptyDescEl.textContent = isSynthetix
          ? 'Select a workspace and folder in the conversation scope to load and explore project files.'
          : 'Select a workspace and folder in the conversation scope to view and explore the project file tree.';
      }
      if (titleEl) {
        titleEl.textContent = isSynthetix ? 'Files Tree (No Workspace Selected)' : 'Workspace Tree (No Workspace Selected)';
      }
    } else {
      if (emptyStateEl) emptyStateEl.style.display = 'none';
      if (treeEl) treeEl.style.display = 'block';
      if (toggleAllBtn) toggleAllBtn.style.display = 'inline-flex';

      if (titleEl) {
        titleEl.textContent = isSynthetix
          ? `Files Tree: ${currentWorkspaceScope}`
          : `Workspace Tree: ${currentWorkspaceScope}`;
      }
    }
  }

  function formatAgentPillLabel(name) {
    if (!name) return 'Agent General';
    const clean = name.trim();
    return clean.length > 16 ? clean.slice(0, 16) + '...' : clean;
  }

  function setAgent(name) {
    currentAgent = name || 'Agent General';
    const agentPillLabel = document.getElementById('s08-agent-pill-label');
    const agentPillBtn = document.getElementById('s08-agent-pill-btn');
    if (agentPillLabel) {
      agentPillLabel.textContent = formatAgentPillLabel(currentAgent);
    }
    if (agentPillBtn) {
      agentPillBtn.setAttribute('title', currentAgent);
      agentPillBtn.setAttribute('data-custom-tooltip', currentAgent);
      agentPillBtn.setAttribute('aria-label', `Active Agent: ${currentAgent}`);
      agentPillBtn.setAttribute('data-agent', currentAgent);
    }

    // Update Agent Title and Subtitle in sidebar header
    if (s08AgentTitle) s08AgentTitle.textContent = currentAgent;
    if (s08AgentSubtitle) {
      s08AgentSubtitle.textContent = agentRoles[currentAgent] || 'Autonomous Specialist';
    }
    const agentLogoBadge = document.getElementById('s08-agent-logo-badge');
    if (agentLogoBadge) {
      agentLogoBadge.textContent = getAgentInitials(currentAgent);
    }

    // Sync menu checks across both agent dropdowns
    const agentMenu = document.getElementById('s08-agent-menu');
    const sidebarAgentMenu = document.getElementById('s08-sidebar-agent-menu');
    [agentMenu, sidebarAgentMenu].forEach(menu => {
      if (!menu) return;
      menu.querySelectorAll('.s08-agent-menu-item:not(.view-catalogues-btn)').forEach(i => {
        const isSelected = (i.getAttribute('data-agent') || '').toLowerCase() === currentAgent.toLowerCase();
        i.classList.toggle('active', isSelected);
        let check = i.querySelector('.check-icon');
        if (isSelected && !check) {
          const checkSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          checkSvg.setAttribute('class', 'check-icon');
          checkSvg.setAttribute('width', '12');
          checkSvg.setAttribute('height', '12');
          checkSvg.setAttribute('viewBox', '0 0 24 24');
          checkSvg.setAttribute('fill', 'none');
          checkSvg.setAttribute('stroke', 'currentColor');
          checkSvg.setAttribute('stroke-width', '3');
          checkSvg.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
          i.appendChild(checkSvg);
        } else if (!isSelected && check) {
          check.remove();
        }
      });
    });

    updateAgentTabTitles(currentAgent);
    if (!isHydrating && typeof saveWorkspaceState === 'function') {
      saveWorkspaceState();
    }
  }

  function openWorkspace(agentName, agentCategory, preserveExistingTabs = false) {
    const finalAgentName = agentName || 'Agent General';
    setAgent(finalAgentName);
    if (agentCategory && s08AgentSubtitle) {
      s08AgentSubtitle.textContent = agentCategory;
    }
    if (s08WorkspaceTitle && (!s08WorkspaceTitle.textContent.trim() || s08WorkspaceTitle.textContent.trim() === 'Acme Inc')) {
      s08WorkspaceTitle.textContent = currentWorkspaceScope || 'Select Workspace';
    }
    if (s08WorkspaceSubtitle && (!s08WorkspaceSubtitle.textContent.trim() || s08WorkspaceSubtitle.textContent.trim() === 'Enterprise')) {
      s08WorkspaceSubtitle.textContent = currentWorkAreaScope || 'Work Area';
    }

    const activeChat = document.querySelector('.s08-chat-item.active');
    if (activeChat) {
      const title = activeChat.getAttribute('data-title') || activeChat.querySelector('.s08-chat-title')?.textContent?.trim() || 'API Authentication Flow';
      const projectGroup = activeChat.closest('.s08-project-group');
      if (projectGroup) {
        const projectName = projectGroup.getAttribute('data-project-name') || projectGroup.querySelector('.s08-project-name')?.textContent?.trim() || 'Project';
        updateBreadcrumbs(title, projectName);
      } else {
        updateBreadcrumbs(title, null);
      }
    } else {
      updateBreadcrumbs('API Authentication Flow', null);
    }

    if (catalogueView) catalogueView.style.display = 'none';
    if (workspaceView) workspaceView.style.display = 'flex';

    if (dockCatalogueBtn) dockCatalogueBtn.classList.remove('active');
    if (dockWorkspaceBtn) dockWorkspaceBtn.classList.add('active');

    const existingPills = tabPillsList ? Array.from(tabPillsList.querySelectorAll('.s08-tab-pill')) : [];
    if (preserveExistingTabs && existingPills.length > 0) {
      updateTabsLayout();
      if (currentActiveTab) focusTab(currentActiveTab);
    } else {
      // User requirement: When an agent is launched afresh, start with default files/artifacts tab
      if (tabPillsList) {
        tabPillsList.innerHTML = '';
        const isSyn = (finalAgentName || '').toLowerCase().trim() === 'synthetix';
        const label = isSyn ? 'Files' : 'Artifacts';
        const pillBtn = document.createElement('button');
        pillBtn.className = 's08-tab-pill active open-pane';
        pillBtn.setAttribute('data-tab-name', 'sources');
        pillBtn.setAttribute('type', 'button');
        pillBtn.innerHTML = `
          <span class="s08-tab-pill-label">${label}</span>
          <span class="s08-tab-close-icon" title="Close tab">×</span>
        `;
        tabPillsList.appendChild(pillBtn);
        updateTabsLayout();
        focusTab('sources');
      }
    }

    // Recalculate right-panel / tab sizing once workspace view is visible and laid out
    requestAnimationFrame(() => {
      updateAgentTabTitles(finalAgentName);
    });
  }

  function openCatalogue() {
    if (workspaceView) workspaceView.style.display = 'none';
    if (catalogueView) catalogueView.style.display = 'flex';

    if (dockWorkspaceBtn) dockWorkspaceBtn.classList.remove('active');
    if (dockCatalogueBtn) dockCatalogueBtn.classList.add('active');
  }

  // Handle "Use Agent" Button Click in Catalogue Cards & Table
  document.querySelectorAll('.sutra-agent-card .sutra-btn, .sutra-table-use-btn, .sutra-agent-table .sutra-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleUseAgentClick(btn);
    });
  });

  function handleUseAgentClick(btn) {
    const card = btn.closest('.sutra-agent-card') || btn.closest('tr');
    if (!card) return;
    const agentName = card.getAttribute('data-name') || btn.getAttribute('data-agent') || 'Acme Inc';
    const agentCategory = card.getAttribute('data-category') || 'Enterprise';

    const originalText = btn.textContent;
    btn.textContent = 'Launching...';
    btn.style.backgroundColor = 'var(--color-surface-card-subtle)';
    btn.style.color = 'var(--color-text-secondary)';
    btn.style.borderColor = 'var(--color-border-hover)';

    setTimeout(() => {
      btn.textContent = 'Active ✓';
      btn.style.backgroundColor = 'var(--color-status-success-bg)';
      btn.style.color = 'var(--color-status-success-text)';
      btn.style.borderColor = 'var(--color-status-success-border)';

      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.backgroundColor = '';
        btn.style.color = '';
        btn.style.borderColor = '';
        
        // Transition to shadcn sidebar-08 layout
        openWorkspace(agentName, agentCategory);
      }, 400);
    }, 400);
  }

  // Clicking anywhere on card also opens workspace
  allCards.forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const agentName = card.getAttribute('data-name');
      const agentCategory = card.getAttribute('data-category');
      openWorkspace(agentName, agentCategory);
    });
  });

  // Breadcrumbs click handling:
  // If clicking on a project folder in the breadcrumb, expand and scroll to that folder in the sidebar
  if (s08CrumbBack) {
    s08CrumbBack.addEventListener('click', () => {
      const projName = s08CrumbBack.textContent.trim();
      const projItem = Array.from(document.querySelectorAll('.s08-project-group')).find(g => {
        return g.querySelector('.s08-project-name')?.textContent?.trim() === projName;
      });
      if (projItem) {
        document.querySelectorAll('.s08-project-group').forEach(g => g.classList.remove('open'));
        projItem.classList.add('open');
        projItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        openCatalogue();
      }
    });
  }

  // Dock buttons
  if (dockCatalogueBtn) {
    dockCatalogueBtn.addEventListener('click', () => {
      openCatalogue();
    });
  }
  if (dockWorkspaceBtn) {
    dockWorkspaceBtn.addEventListener('click', () => {
      openWorkspace(currentAgent || 'Acme Inc', 'Enterprise', true);
    });
  }

  // Sidebar-08 Trigger [|] Collapse / Expand
  let sourcesAutoClosedBySidebar = false;

  if (s08SidebarTrigger && s08Sidebar) {
    s08SidebarTrigger.addEventListener('click', () => {
      s08Sidebar.classList.toggle('collapsed');
      const isCollapsed = s08Sidebar.classList.contains('collapsed');
      s08SidebarTrigger.setAttribute('title', isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar');
      document.body.classList.toggle('s08-sidebar-collapsed', isCollapsed);

      if (!isCollapsed) {
        // Exit Zen mode if active
        if (s08InsetBody && s08InsetBody.classList.contains('tabs-full-width')) {
          s08InsetBody.classList.remove('tabs-full-width');
          if (s08SplitToggleBtn) {
            s08SplitToggleBtn.classList.remove('active');
            s08SplitToggleBtn.setAttribute('title', 'Expand tabs to full width');
          }
        }

        // Only on narrow screens (< 1024px) do we auto-minimize sources to avoid crowding
        if (window.innerWidth < 1024) {
          const sourcesPill = tabPillsList ? tabPillsList.querySelector('.s08-tab-pill[data-tab-name="sources"]') : null;
          if (sourcesPill && !minimizedPanes.has('sources')) {
            sourcesAutoClosedBySidebar = true;
            minimizedPanes.add('sources');
            sourcesPill.classList.add('is-minimized');
            sourcesPill.classList.remove('active');
            updateTabsLayout();
          }
        }
      } else {
        // User collapsed the secondary nav:
        // If files/artifacts tab was auto-closed when secondary nav was opened, restore it by default!
        if (sourcesAutoClosedBySidebar) {
          sourcesAutoClosedBySidebar = false;
          minimizedPanes.delete('sources');
          const sourcesPill = tabPillsList ? tabPillsList.querySelector('.s08-tab-pill[data-tab-name="sources"]') : null;
          if (sourcesPill) {
            sourcesPill.classList.remove('is-minimized');
          }
          openOrSwitchTab('sources');
        }
      }
    });
  }

  // New Task button in conversation header (visible only when secondary nav is completely collapsed) (Annotation 3)
  const s08ChatNewTaskBtn = document.getElementById('s08-chat-new-task-btn');
  if (s08ChatNewTaskBtn) {
    s08ChatNewTaskBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      createNewGlobalChat();
    });
  }

  // ==========================================================================
  // TWO-COLUMN CANVAS & GROUP OF TABS CONTROLLERS (Annotations 1, 2, 3)
  // ==========================================================================
  const s08InsetBody = document.getElementById('s08-inset-body');
  const s08RightSidebarTrigger = document.getElementById('s08-right-sidebar-trigger');
  const s08CloseTabsBtn = document.getElementById('s08-close-tabs-btn');
  const s08SplitToggleBtn = document.getElementById('s08-split-toggle-btn');
  const s08SourcesTitle = document.getElementById('s08-sources-title');

  // 1. Collapse / Expand Group of Tabs Panel
  if (s08CloseTabsBtn && s08InsetBody) {
    s08CloseTabsBtn.addEventListener('click', () => {
      s08InsetBody.classList.remove('tabs-full-width');
      s08InsetBody.classList.add('tabs-collapsed');
      s08InsetBody.style.gridTemplateColumns = '';
      if (s08SplitToggleBtn) {
        s08SplitToggleBtn.classList.remove('active');
        s08SplitToggleBtn.setAttribute('title', 'Expand tabs to full width');
      }
      if (s08RightSidebarTrigger) {
        s08RightSidebarTrigger.style.display = 'inline-flex';
        s08RightSidebarTrigger.setAttribute('title', 'Re-open Side Tabs Panel [|]');
      }
    });
  }

  if (s08RightSidebarTrigger && s08InsetBody) {
    s08RightSidebarTrigger.addEventListener('click', () => {
      s08InsetBody.classList.remove('tabs-collapsed');
      s08InsetBody.classList.remove('tabs-full-width');
      s08InsetBody.style.gridTemplateColumns = '';
      s08RightSidebarTrigger.style.display = 'none';
      if (s08SplitToggleBtn) {
        s08SplitToggleBtn.classList.remove('active');
        s08SplitToggleBtn.setAttribute('title', 'Expand tabs to full width');
      }
      const remainingPills = tabPillsList ? tabPillsList.querySelectorAll('.s08-tab-pill') : [];
      if (remainingPills.length === 0) {
        openOrSwitchTab('sources');
      } else {
        updateTabsLayout();
      }
    });
  }

  // 2. Toggle Tab Panel Full Width (|↔|) (Annotation 1)
  // When clicked, expands tabs to full width and closes secondary navigation. On restore, restores both.
  if (s08SplitToggleBtn && s08InsetBody) {
    s08SplitToggleBtn.addEventListener('click', () => {
      s08InsetBody.classList.remove('tabs-collapsed');
      s08InsetBody.classList.toggle('tabs-full-width');
      s08InsetBody.style.gridTemplateColumns = '';
      const isFull = s08InsetBody.classList.contains('tabs-full-width');
      s08SplitToggleBtn.setAttribute('title', isFull ? 'Restore conversation section' : 'Expand tabs to full width');
      s08SplitToggleBtn.classList.toggle('active', isFull);

      // Annotation [1]: "also when this is clicked the secondary navigation also closes"
      if (s08Sidebar) {
        if (isFull) {
          s08Sidebar.classList.add('collapsed');
          document.body.classList.add('s08-sidebar-collapsed');
          if (s08SidebarTrigger) s08SidebarTrigger.setAttribute('title', 'Expand Sidebar');
        } else {
          s08Sidebar.classList.remove('collapsed');
          document.body.classList.remove('s08-sidebar-collapsed');
          if (s08SidebarTrigger) s08SidebarTrigger.setAttribute('title', 'Collapse Sidebar');
        }
      }
    });
  }

  // 3. Agent Selector Dropdown in Query Input Section (Annotation 5)
  // Per feedback: Keep ONLY 'Agent' on pill; on hover/click show the agent being used.
  const agentPillDropdown = document.getElementById('s08-agent-pill-dropdown');
  const agentPillBtn = document.getElementById('s08-agent-pill-btn');
  const agentPillLabel = document.getElementById('s08-agent-pill-label');
  const agentMenu = document.getElementById('s08-agent-menu');

  if (agentPillBtn && agentMenu) {
    agentPillBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      agentMenu.classList.toggle('open');
      const isOpen = agentMenu.classList.contains('open');
      agentPillBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (agentPillDropdown) agentPillDropdown.classList.toggle('open', isOpen);
    });

    agentMenu.querySelectorAll('.s08-agent-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedAgent = item.getAttribute('data-agent') || 'Agent General';
        setAgent(selectedAgent);
        agentMenu.classList.remove('open');
        if (agentPillDropdown) agentPillDropdown.classList.remove('open');
        agentPillBtn.setAttribute('aria-expanded', 'false');
        appendLogMessage(`Active Agent set to "${selectedAgent}"`, 'INFO');
      });
    });

    document.addEventListener('click', (e) => {
      if (!agentPillDropdown || !agentPillDropdown.contains(e.target)) {
        agentMenu.classList.remove('open');
        if (agentPillDropdown) agentPillDropdown.classList.remove('open');
        if (agentPillBtn) agentPillBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Sidebar Agent Switcher (Annotation 5)
    const sidebarAgentBtn = document.getElementById('s08-agent-switcher-btn');
    const sidebarAgentMenu = document.getElementById('s08-sidebar-agent-menu');
    if (sidebarAgentBtn && sidebarAgentMenu) {
      sidebarAgentBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close workspace menu if open
        const sidebarWsMenu = document.getElementById('s08-sidebar-workspace-menu');
        if (sidebarWsMenu) sidebarWsMenu.classList.remove('open');

        sidebarAgentMenu.classList.toggle('open');
        const isOpen = sidebarAgentMenu.classList.contains('open');
        sidebarAgentBtn.setAttribute('aria-expanded', isOpen);
      });

      sidebarAgentMenu.querySelectorAll('.s08-agent-menu-item:not(.view-catalogues-btn)').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const selectedAgent = item.getAttribute('data-agent') || 'Agent General';
          setAgent(selectedAgent);
          sidebarAgentMenu.classList.remove('open');
          sidebarAgentBtn.setAttribute('aria-expanded', 'false');
          appendLogMessage(`Active Agent set to "${selectedAgent}"`, 'INFO');
        });
      });

      // View Catalogues redirect button (Annotation 5)
      const viewCataloguesBtn = document.getElementById('s08-view-catalogues-btn');
      if (viewCataloguesBtn) {
        viewCataloguesBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          sidebarAgentMenu.classList.remove('open');
          sidebarAgentBtn.setAttribute('aria-expanded', 'false');
          openCatalogue();
          appendLogMessage('Navigated to Agent Catalogue view from switcher', 'INFO');
        });
      }

      document.addEventListener('click', (e) => {
        if (!sidebarAgentBtn.contains(e.target) && !sidebarAgentMenu.contains(e.target)) {
          sidebarAgentMenu.classList.remove('open');
          sidebarAgentBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  // 4. Workspace & Work Area State Controller (Annotations 2 & 6)
  const scopeDropdownContainer = document.getElementById('s08-scope-dropdown-container');
  const scopeBtn = document.getElementById('s08-scope-btn');
  const scopeWsBadge = document.getElementById('s08-scope-ws-badge');
  const scopeWaBadge = document.getElementById('s08-scope-wa-badge');
  const s08WorkspaceSwitcherBtn = document.getElementById('s08-workspace-switcher-btn');
  const s08SidebarWorkspaceMenu = document.getElementById('s08-sidebar-workspace-menu');

  // Unified function to set active Workspace / Repository and Work Area / Environment
  function setWorkspaceAndWorkArea(ws, wa, plan = 'Local', triggerQuery = false) {
    const isEmpty = !ws || ws === 'Select Workspace' || ws === 'Select Work Area' || ws === 'Select Repository' || ws === 'None' || ws === '';
    currentWorkspaceScope = isEmpty ? '' : ws;
    currentWorkAreaScope = isEmpty ? '' : wa;
    currentWorkspacePlan = isEmpty ? '' : (plan || 'Local');

    try {
      if (isEmpty) {
        localStorage.removeItem('sutra_workspace_scope');
        localStorage.removeItem('sutra_workarea_scope');
        localStorage.removeItem('sutra_workspace_plan');
      } else {
        localStorage.setItem('sutra_workspace_scope', ws);
        localStorage.setItem('sutra_workarea_scope', wa);
        localStorage.setItem('sutra_workspace_plan', plan || 'Local');
      }
    } catch (_) {}

    const cardTitle = document.getElementById('s08-scope-card-title');
    const cardDesc = document.getElementById('s08-scope-card-desc');
    const btnPlusIcon = document.getElementById('s08-scope-btn-plus-icon');
    const scopeSlash = document.getElementById('s08-scope-slash');

    if (isEmpty) {
      if (s08WorkspaceTitle) s08WorkspaceTitle.textContent = 'Select Workspace';
      if (s08WorkspaceSubtitle) s08WorkspaceSubtitle.textContent = 'Work Area';
      if (s08WorkspaceSwitcherBtn) s08WorkspaceSwitcherBtn.classList.add('is-empty');

      if (cardTitle) cardTitle.textContent = 'Select Work Area';
      if (cardDesc) cardDesc.textContent = 'Define a new project folder or domain boundary in your workspace.';
      if (btnPlusIcon) btnPlusIcon.style.display = 'inline-block';
      if (scopeSlash) scopeSlash.style.display = 'none';

      if (scopeWsBadge) {
        scopeWsBadge.textContent = 'Select Work Area';
        scopeWsBadge.classList.add('is-empty');
      }
      if (scopeWaBadge) {
        scopeWaBadge.textContent = 'Folder';
        scopeWaBadge.style.display = 'none';
        scopeWaBadge.classList.add('is-empty');
      }
      if (scopeBtn) {
        scopeBtn.classList.add('is-empty');
        scopeBtn.setAttribute('title', 'Select Work Area');
        scopeBtn.setAttribute('data-custom-tooltip', 'Select Work Area');
      }

      const scopeContextNote = document.getElementById('s08-scope-context-note');
      if (scopeContextNote) {
        scopeContextNote.textContent = 'Primary: Workspace (codebase) • Secondary: Folder (execution sandbox)';
      }

      updateSourcesViewEmptyState();

      // Clear checks in sidebar cascading workspace menu
      if (s08SidebarWorkspaceMenu) {
        s08SidebarWorkspaceMenu.querySelectorAll('.s08-sidebar-wa-item:not(.create-action)').forEach(i => {
          i.classList.remove('active');
          const check = i.querySelector('.check-icon');
          if (check) check.remove();
        });
        s08SidebarWorkspaceMenu.querySelectorAll('.s08-sidebar-ws-sub-wrap').forEach(w => {
          w.classList.remove('active');
        });
      }

      // Clear checks in cascading scope menu
      document.querySelectorAll('.s08-submenu-item').forEach(i => {
        i.classList.remove('active');
        const check = i.querySelector('.check-icon');
        if (check) check.remove();
      });
      document.querySelectorAll('.s08-scope-menu-sub-wrap').forEach(w => {
        w.classList.remove('active');
      });

      appendLogMessage('Active Workspace / Folder cleared', 'SCOPE');
      return;
    }

    // 1. Update sidebar workspace display
    if (s08WorkspaceTitle) s08WorkspaceTitle.textContent = ws;
    if (s08WorkspaceSubtitle) s08WorkspaceSubtitle.textContent = plan || 'Local';
    if (s08WorkspaceSwitcherBtn) s08WorkspaceSwitcherBtn.classList.remove('is-empty');

    // 2. Update card header title & description
    if (cardTitle) cardTitle.textContent = 'Active Work Area';
    if (cardDesc) cardDesc.textContent = `Target Scope: ${ws} • Folder: ${wa}`;
    if (btnPlusIcon) btnPlusIcon.style.display = 'none';
    if (scopeSlash) scopeSlash.style.display = 'inline';

    // 3. Update conversation scope button and remove empty state
    if (scopeWsBadge) {
      scopeWsBadge.textContent = ws;
      scopeWsBadge.classList.remove('is-empty');
    }
    if (scopeWaBadge) {
      scopeWaBadge.textContent = wa;
      scopeWaBadge.style.display = 'inline';
      scopeWaBadge.classList.remove('is-empty');
    }
    if (scopeBtn) {
      scopeBtn.classList.remove('is-empty');
      scopeBtn.setAttribute('title', `Active Scope: ${ws} / ${wa}`);
      scopeBtn.setAttribute('data-custom-tooltip', `Active Scope: ${ws} / ${wa}`);
    }

    // 3. Update bottom context note
    const scopeContextNote = document.getElementById('s08-scope-context-note');
    if (scopeContextNote) {
      scopeContextNote.textContent = `Target Scope: ${ws} • Folder: ${wa}`;
    }

    // 4. Update Sources Tab Tree Header & Empty State
    updateSourcesViewEmptyState();

    // Helper to render checkmark SVG
    function ensureCheckmark(el, shouldHave) {
      el.classList.toggle('active', shouldHave);
      let check = el.querySelector('.check-icon');
      if (shouldHave && !check) {
        const checkSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        checkSvg.setAttribute('class', 'check-icon');
        checkSvg.setAttribute('width', '12');
        checkSvg.setAttribute('height', '12');
        checkSvg.setAttribute('viewBox', '0 0 24 24');
        checkSvg.setAttribute('fill', 'none');
        checkSvg.setAttribute('stroke', 'currentColor');
        checkSvg.setAttribute('stroke-width', '3');
        checkSvg.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
        el.appendChild(checkSvg);
      } else if (!shouldHave && check) {
        check.remove();
      }
    }

    // 5. Sync active checks in sidebar cascading workspace menu
    if (s08SidebarWorkspaceMenu) {
      s08SidebarWorkspaceMenu.querySelectorAll('.s08-sidebar-wa-item:not(.create-action):not(.s08-clear-ws-btn)').forEach(i => {
        const isSel = i.getAttribute('data-ws') === ws && i.getAttribute('data-wa') === wa;
        ensureCheckmark(i, isSel);
      });

      s08SidebarWorkspaceMenu.querySelectorAll('.s08-sidebar-ws-sub-wrap').forEach(w => {
        w.classList.toggle('active', w.getAttribute('data-ws') === ws);
      });
    }

    // 6. Sync active checks in cascading scope menu (and any body-detached submenus)
    document.querySelectorAll('.s08-submenu-item:not(.create-action):not(.s08-clear-ws-btn)').forEach(i => {
      const isSel = i.getAttribute('data-ws') === ws && i.getAttribute('data-wa') === wa;
      ensureCheckmark(i, isSel);
    });
    document.querySelectorAll('.s08-scope-menu-sub-wrap').forEach(w => {
      w.classList.toggle('active', w.getAttribute('data-ws') === ws);
    });

    appendLogMessage(`Active Workspace / Work Area Scope updated: ${ws} / ${wa} (${plan})`, 'SCOPE');

    // Trigger user query and Agent Context + Suggestions output upon explicit user selection
    if (triggerQuery && !isEmpty) {
      const scopeBar = document.getElementById('s08-scope-setup-bar');
      if (scopeBar) scopeBar.classList.add('is-collapsed');
      const chatCol = document.getElementById('s08-chat-col-body');
      if (chatCol) chatCol.classList.add('has-messages');

      const queryText = `${ws} / ${wa}`;
      if (typeof lastUserPrompt !== 'undefined') {
        lastUserPrompt = queryText;
      }

      // Update active task title in header breadcrumb if 'New task' or default
      if (s08CrumbCurrent && (s08CrumbCurrent.textContent === 'New task' || s08CrumbCurrent.textContent === 'API Authentication Flow')) {
        s08CrumbCurrent.textContent = queryText;
      }

      // 1. Dispatch User Message Bubble
      appendMessageBubble('user', queryText);
      appendLogMessage(`Scope query dispatched: "${queryText}"`, 'INFO');

      // 2. Automatically generate Agent Response with Context and Suggestions
      setTimeout(() => {
        generateAgentResponse(queryText);
      }, 400);
    }
  }

  // Default to clean empty state on startup per client feedback
  setWorkspaceAndWorkArea('', '', '', false);
  try {
    localStorage.removeItem('sutra_workspace_scope');
    localStorage.removeItem('sutra_workarea_scope');
    localStorage.removeItem('sutra_workspace_plan');
  } catch (_) {}

  // Sidebar Workspace Switcher Dropdown Interaction: 2-Level Cascading Submenus (Annotation 1 & 2)
  if (s08WorkspaceSwitcherBtn && s08SidebarWorkspaceMenu) {
    const sidebarWsWraps = s08SidebarWorkspaceMenu.querySelectorAll('.s08-sidebar-ws-sub-wrap');

    function closeAllSidebarSubmenus() {
      sidebarWsWraps.forEach(w => w.classList.remove('open'));
    }

    s08WorkspaceSwitcherBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close sidebar agent menu if open
      const sidebarAgentMenu = document.getElementById('s08-sidebar-agent-menu');
      if (sidebarAgentMenu) sidebarAgentMenu.classList.remove('open');

      closeAllSidebarSubmenus();
      s08SidebarWorkspaceMenu.classList.toggle('open');
      const isOpen = s08SidebarWorkspaceMenu.classList.contains('open');
      s08WorkspaceSwitcherBtn.setAttribute('aria-expanded', isOpen);
      if (s08Sidebar) {
        s08Sidebar.classList.toggle('has-open-dropdown', isOpen);
      }
    });

    // Level 1: Workspace Trigger Click & Submenu Hover
    sidebarWsWraps.forEach(wrap => {
      const trigger = wrap.querySelector('.s08-ws-sub-trigger');

      // On hover, exclusively open this submenu and close all others
      wrap.addEventListener('mouseenter', () => {
        sidebarWsWraps.forEach(w => {
          if (w !== wrap) w.classList.remove('open');
        });
        wrap.classList.add('open');
      });

      if (trigger) {
        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          const isAlreadyOpen = wrap.classList.contains('open');
          closeAllSidebarSubmenus();
          if (!isAlreadyOpen) {
            wrap.classList.add('open');
          }
        });
      }
    });

    // Leaving the sidebar workspace menu closes submenus
    s08SidebarWorkspaceMenu.addEventListener('mouseleave', closeAllSidebarSubmenus);

    // Level 2: Work Area Selection Click
    s08SidebarWorkspaceMenu.querySelectorAll('.s08-sidebar-wa-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllSidebarSubmenus();
        if (item.getAttribute('data-action') === 'clear-workspace') {
          setWorkspaceAndWorkArea('', '', '');
          s08SidebarWorkspaceMenu.classList.remove('open');
          s08WorkspaceSwitcherBtn.setAttribute('aria-expanded', 'false');
          if (s08Sidebar) s08Sidebar.classList.remove('has-open-dropdown');
          return;
        }

        const ws = item.getAttribute('data-ws') || (s08WorkspaceTitle ? s08WorkspaceTitle.textContent.trim() : 'Acme Inc');
        const wa = item.getAttribute('data-wa') || 'Design Engineering';
        const plan = item.getAttribute('data-plan') || 'Enterprise';

        if (wa === '__create_new__') {
          const newArea = prompt(`Connect new Work Area in ${ws}:`, 'Mobile Core');
          if (newArea && newArea.trim()) {
            setWorkspaceAndWorkArea(ws, newArea.trim(), plan, true);
          }
        } else {
          setWorkspaceAndWorkArea(ws, wa, plan, true);
        }
        s08SidebarWorkspaceMenu.classList.remove('open');
        s08WorkspaceSwitcherBtn.setAttribute('aria-expanded', 'false');
        if (s08Sidebar) s08Sidebar.classList.remove('has-open-dropdown');
      });
    });

    document.addEventListener('click', (e) => {
      if (!s08WorkspaceSwitcherBtn.contains(e.target) && !s08SidebarWorkspaceMenu.contains(e.target)) {
        closeAllSidebarSubmenus();
        s08SidebarWorkspaceMenu.classList.remove('open');
        s08WorkspaceSwitcherBtn.setAttribute('aria-expanded', 'false');
        if (s08Sidebar) s08Sidebar.classList.remove('has-open-dropdown');
      }
    });
  }

  // Cascading Scope Selector in Chat Column (Annotations 2 & 7 - shadcn DropdownMenuSub)
  if (scopeBtn && scopeDropdownContainer) {
    const scopeWsWraps = document.querySelectorAll('.s08-scope-menu-sub-wrap');
    const scopeRootMenu = document.getElementById('s08-scope-root-menu');

    let submenuCloseTimer = null;
    function scheduleCloseSubmenus() {
      clearTimeout(submenuCloseTimer);
      submenuCloseTimer = setTimeout(() => {
        closeAllScopeSubmenus();
      }, 160);
    }
    function cancelCloseSubmenus() {
      clearTimeout(submenuCloseTimer);
    }

    function closeAllScopeSubmenus() {
      clearTimeout(submenuCloseTimer);
      scopeWsWraps.forEach(w => {
        w.classList.remove('open');
        const sm = w._submenu || w.querySelector('.s08-scope-submenu');
        if (sm) {
          sm.classList.remove('flip-left', 'open');
          sm.style.display = 'none';
          sm.style.opacity = '0';
          sm.style.visibility = 'hidden';
          sm.style.pointerEvents = 'none';
          sm.style.left = '';
          sm.style.right = '';
          sm.style.top = '';
        }
      });
    }

    function updateRootMenuAlignment() {
      if (!scopeRootMenu || !scopeBtn) return;
      const btnRect = scopeBtn.getBoundingClientRect();
      const menuWidth = 220;
      const col = document.getElementById('s08-conversation-col');
      const colRect = col ? col.getBoundingClientRect() : null;
      const rightLimit = colRect ? colRect.right - 10 : window.innerWidth - 12;

      // Center menu under button if space permits in empty-state card mode
      const idealLeft = (scopeBtn.offsetWidth - menuWidth) / 2;
      const absLeft = btnRect.left + idealLeft;
      if (absLeft < (colRect ? colRect.left + 10 : 10)) {
        scopeRootMenu.style.left = '0';
        scopeRootMenu.style.right = 'auto';
      } else if (btnRect.left + idealLeft + menuWidth > rightLimit) {
        scopeRootMenu.style.left = 'auto';
        scopeRootMenu.style.right = '0';
      } else {
        scopeRootMenu.style.left = `${Math.round(idealLeft)}px`;
        scopeRootMenu.style.right = 'auto';
      }

      // Dynamic Vertical Flipping: prevent dropdown truncation by chat footer / composer
      const footer = document.querySelector('.s08-chat-col-footer');
      const chatBody = document.getElementById('s08-chat-col-body');
      const footerTop = footer ? footer.getBoundingClientRect().top : (chatBody ? chatBody.getBoundingClientRect().bottom : window.innerHeight);
      const bodyTop = chatBody ? chatBody.getBoundingClientRect().top : 0;

      const spaceBelow = footerTop - btnRect.bottom;
      const spaceAbove = btnRect.top - bodyTop;
      const requiredMenuHeight = 245;

      if (spaceBelow < requiredMenuHeight && spaceAbove > spaceBelow) {
        scopeRootMenu.classList.add('upward');
        scopeRootMenu.style.top = 'auto';
        scopeRootMenu.style.bottom = 'calc(100% + 6px)';
        scopeRootMenu.style.transformOrigin = 'bottom left';
        scopeRootMenu.style.maxHeight = `${Math.max(160, Math.floor(spaceAbove - 16))}px`;
      } else {
        scopeRootMenu.classList.remove('upward');
        scopeRootMenu.style.top = 'calc(100% + 4px)';
        scopeRootMenu.style.bottom = 'auto';
        scopeRootMenu.style.transformOrigin = 'top left';
        scopeRootMenu.style.maxHeight = `${Math.max(160, Math.floor(spaceBelow - 16))}px`;
      }
    }

    const cardIconWrap = document.getElementById('s08-scope-card-icon-wrap');
    if (cardIconWrap) {
      cardIconWrap.addEventListener('click', (e) => {
        e.stopPropagation();
        scopeBtn.click();
      });
    }

    scopeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllScopeSubmenus();
      updateRootMenuAlignment();
      scopeDropdownContainer.classList.toggle('open');
      const isOpen = scopeDropdownContainer.classList.contains('open');
      scopeBtn.setAttribute('aria-expanded', isOpen);
    });

    window.addEventListener('resize', () => {
      if (scopeDropdownContainer && scopeDropdownContainer.classList.contains('open')) {
        updateRootMenuAlignment();
      }
    });

    document.addEventListener('click', (e) => {
      const isInsideSubmenu = Array.from(document.querySelectorAll('.s08-scope-submenu')).some(sm => sm.contains(e.target));
      if (!scopeDropdownContainer.contains(e.target) && !isInsideSubmenu) {
        closeAllScopeSubmenus();
        scopeDropdownContainer.classList.remove('open');
        scopeBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Level 1 Workspace hover/click toggle & floating positioning (shadcn DropdownMenuSub)
    // Move submenus to body once so they escape ancestor overflow-x:hidden / backdrop-filter containing blocks
    scopeWsWraps.forEach(wrap => {
      const trigger = wrap.querySelector('.s08-sub-trigger');
      const submenu = wrap.querySelector('.s08-scope-submenu');

      if (submenu) {
        wrap._submenu = submenu;
        submenu._wrap = wrap;
        submenu.setAttribute('data-ws', wrap.getAttribute('data-ws') || '');
        submenu.setAttribute('data-plan', wrap.getAttribute('data-plan') || 'GitHub');
        if (submenu.parentNode !== document.body) {
          document.body.appendChild(submenu);
        }
      }

      function adjustSubmenuPosition() {
        const sm = wrap._submenu || wrap.querySelector('.s08-scope-submenu');
        if (!sm) return;
        const rect = wrap.getBoundingClientRect();
        const submenuWidth = 215;
        const pad = 10;

        // Check horizontal space relative to the browser viewport
        const spaceRight = window.innerWidth - rect.right;
        const spaceLeft = rect.left;

        sm.classList.remove('flip-left');

        let targetLeft;
        if (spaceRight >= submenuWidth + pad) {
          // Standard flyout right
          targetLeft = rect.right + 2;
        } else if (spaceLeft >= submenuWidth + pad) {
          // Flip left if near the right edge of browser screen
          targetLeft = rect.left - submenuWidth - 2;
          sm.classList.add('flip-left');
        } else {
          targetLeft = Math.max(pad, window.innerWidth - submenuWidth - pad);
        }

        // Vertical positioning aligned with the item
        let targetTop = rect.top - 2;
        const submenuHeight = sm.offsetHeight || 150;
        if (targetTop + submenuHeight > window.innerHeight - pad) {
          targetTop = Math.max(pad, window.innerHeight - submenuHeight - pad);
        }
        targetTop = Math.max(pad, targetTop);

        sm.style.position = 'fixed';
        sm.style.left = `${Math.round(targetLeft)}px`;
        sm.style.top = `${Math.round(targetTop)}px`;
        sm.style.zIndex = '99999';
        sm.style.display = 'flex';
        sm.style.opacity = '1';
        sm.style.visibility = 'visible';
        sm.style.pointerEvents = 'auto';
        sm.classList.add('open');
      }

      wrap._adjustSubmenuPosition = adjustSubmenuPosition;

      function openThisSubmenu() {
        cancelCloseSubmenus();
        scopeWsWraps.forEach(w => {
          if (w !== wrap) {
            w.classList.remove('open');
            const otherSm = w._submenu || w.querySelector('.s08-scope-submenu');
            if (otherSm) {
              otherSm.classList.remove('flip-left', 'open');
              otherSm.style.display = 'none';
              otherSm.style.opacity = '0';
              otherSm.style.visibility = 'hidden';
              otherSm.style.pointerEvents = 'none';
            }
          }
        });
        wrap.classList.add('open');
        adjustSubmenuPosition();
      }

      wrap.addEventListener('mouseenter', openThisSubmenu);
      wrap.addEventListener('mouseleave', scheduleCloseSubmenus);

      const sm = wrap._submenu || wrap.querySelector('.s08-scope-submenu');
      if (sm) {
        sm.addEventListener('mouseenter', cancelCloseSubmenus);
        sm.addEventListener('mouseleave', scheduleCloseSubmenus);
      }

      if (trigger) {
        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          cancelCloseSubmenus();
          const isAlreadyOpen = wrap.classList.contains('open');
          if (isAlreadyOpen) {
            closeAllScopeSubmenus();
          } else {
            openThisSubmenu();
          }
        });
      }
    });

    if (scopeRootMenu) {
      scopeRootMenu.addEventListener('mouseenter', cancelCloseSubmenus);
      scopeRootMenu.addEventListener('mouseleave', scheduleCloseSubmenus);
    }

    // Submenus close on real scroll or window resize so they don't detach
    const chatBody = document.getElementById('s08-chat-col-body');
    let lastChatScroll = chatBody ? chatBody.scrollTop : 0;
    if (chatBody) {
      chatBody.addEventListener('scroll', () => {
        if (Math.abs(chatBody.scrollTop - lastChatScroll) > 16) {
          closeAllScopeSubmenus();
        }
        lastChatScroll = chatBody.scrollTop;
      }, { passive: true });
    }
    window.addEventListener('scroll', closeAllScopeSubmenus, { passive: true });
    window.addEventListener('resize', closeAllScopeSubmenus, { passive: true });

    // Submenu items selection: Workspace & Work Area (Annotation 2 & 7)
    document.querySelectorAll('.s08-submenu-item').forEach(subItem => {
      subItem.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllScopeSubmenus();
        if (subItem.getAttribute('data-action') === 'clear-workspace') {
          setWorkspaceAndWorkArea('', '', '');
          scopeDropdownContainer.classList.remove('open');
          scopeBtn.setAttribute('aria-expanded', 'false');
          return;
        }

        const ws = subItem.getAttribute('data-ws');
        const wa = subItem.getAttribute('data-wa');

        scopeDropdownContainer.classList.remove('open');
        scopeBtn.setAttribute('aria-expanded', 'false');

        if (wa === '__create_new__') {
          const newArea = prompt(`Connect new Branch / Environment in ${ws}:`, 'feat/auth-v2');
          if (newArea && newArea.trim()) {
            setWorkspaceAndWorkArea(ws, newArea.trim(), 'GitHub', true);
          }
          return;
        }

        const sm = subItem.closest('.s08-scope-submenu');
        const wrap = subItem.closest('.s08-scope-menu-sub-wrap') || (sm ? sm._wrap : null);
        const plan = subItem.getAttribute('data-plan') || (wrap ? wrap.getAttribute('data-plan') : null) || (sm ? sm.getAttribute('data-plan') : null) || 'GitHub';
        setWorkspaceAndWorkArea(ws, wa, plan, true);
      });
    });

    const connectRepoBtn = document.getElementById('s08-connect-repo-btn');
    if (connectRepoBtn) {
      connectRepoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllScopeSubmenus();
        scopeDropdownContainer.classList.remove('open');
        scopeBtn.setAttribute('aria-expanded', 'false');
        const repoUrl = prompt('Enter GitHub / GitLab repository URL:', 'github.com/acme-corp/analytics-engine');
        if (repoUrl && repoUrl.trim()) {
          const cleanName = repoUrl.trim().replace(/^https?:\/\//, '').replace(/^github\.com\//, '');
          setWorkspaceAndWorkArea(cleanName, 'Development Sandbox', 'GitHub', true);
          appendLogMessage(`Repository connected: ${cleanName}`, 'GIT');
        }
      });
    }

    const openLocalRepoBtn = document.getElementById('s08-open-local-repo-btn');
    if (openLocalRepoBtn) {
      openLocalRepoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllScopeSubmenus();
        scopeDropdownContainer.classList.remove('open');
        scopeBtn.setAttribute('aria-expanded', 'false');
        const folderPath = prompt('Enter local workspace folder path:', '~/Developer/sutra-ui');
        if (folderPath && folderPath.trim()) {
          const folderName = folderPath.trim().split(/[\\/]/).pop() || 'local-repo';
          setWorkspaceAndWorkArea(`local/${folderName}`, 'main (Local Sandbox)', 'Local', true);
          appendLogMessage(`Local workspace mounted: ${folderPath}`, 'WORKSPACE');
        }
      });
    }
  }

  // ==========================================================================
  // DRAGGABLE SPLIT RESIZERS (Annotation 6)
  // ==========================================================================
  let currentActiveTab = 'sources';
  const minimizedPanes = new Set();
  let savedSourceTabsWidth = null;
  let savedSynthetixTabsWidth = null;
  let savedArtifactsTabsWidth = null;
  let savedOtherTabsWidth = null;
  let lastTabsWidth = null;

  // 1. Canvas Split Resizer (between Conversation Col and Tabs Col)
  const canvasResizer = document.getElementById('s08-canvas-resizer');
  if (canvasResizer && s08InsetBody) {
    let isCanvasDragging = false;
    let startX = 0;
    let startConvWidth = 0;
    let containerWidth = 0;
    let willSnapCanvasMode = null; // 'tabs-close' | 'conv-close' | null

    canvasResizer.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      isCanvasDragging = true;
      canvasResizer.classList.add('is-active');
      document.body.classList.add('is-resizing');

      try {
        canvasResizer.setPointerCapture(e.pointerId);
      } catch (_) {}

      if (scopeDropdownContainer) {
        scopeDropdownContainer.classList.remove('open');
        if (scopeBtn) scopeBtn.setAttribute('aria-expanded', 'false');
        document.querySelectorAll('.s08-scope-menu-sub-wrap').forEach(w => {
          w.classList.remove('open', 'inline-mode');
          const sm = w.querySelector('.s08-scope-submenu');
          if (sm) sm.classList.remove('inline-mode', 'flip-left');
        });
      }

      // Temporarily remove transition for instant response
      s08InsetBody.style.transition = 'none';

      const rect = s08InsetBody.getBoundingClientRect();
      const convCol = document.getElementById('s08-conversation-col');
      const convRect = convCol ? convCol.getBoundingClientRect() : { width: rect.width * 0.30 };

      startX = e.clientX;
      startConvWidth = convRect.width;
      containerWidth = rect.width;

      function onPointerMove(ev) {
        if (!isCanvasDragging || containerWidth <= 200) return;
        const dx = ev.clientX - startX;
        const candidateConvWidth = startConvWidth + dx;
        const candidateTabsWidth = containerWidth - candidateConvWidth;

        // Dynamic 10%–20% fluid scaling threshold before snapping (15% or 180px)
        const snapTabsThreshold = Math.max(180, Math.round(containerWidth * 0.15));
        const snapConvThreshold = Math.max(180, Math.round(containerWidth * 0.15));

        if (candidateTabsWidth < snapTabsThreshold) {
          canvasResizer.classList.add('will-snap-close');
          s08InsetBody.classList.add('tabs-snap-ghost');
          willSnapCanvasMode = 'tabs-close';

          // Apple HIG Direct Manipulation Rubber-Banding
          const overshoot = snapTabsThreshold - candidateTabsWidth;
          const dampedOvershoot = rubberband(overshoot, snapTabsThreshold, 0.55);
          const visualTabsWidth = Math.max(10, snapTabsThreshold - dampedOvershoot);
          const visualConvWidth = containerWidth - visualTabsWidth;
          s08InsetBody.style.setProperty('grid-template-columns', `${visualConvWidth}px 0px 1fr`, 'important');
        } else if (candidateConvWidth < snapConvThreshold) {
          canvasResizer.classList.add('will-snap-close');
          s08InsetBody.classList.remove('tabs-snap-ghost');
          willSnapCanvasMode = 'conv-close';

          // Apple HIG Direct Manipulation Rubber-Banding
          const overshoot = snapConvThreshold - candidateConvWidth;
          const dampedOvershoot = rubberband(overshoot, snapConvThreshold, 0.55);
          const visualConvWidth = Math.max(10, snapConvThreshold - dampedOvershoot);
          s08InsetBody.style.setProperty('grid-template-columns', `${visualConvWidth}px 0px 1fr`, 'important');
        } else {
          canvasResizer.classList.remove('will-snap-close');
          s08InsetBody.classList.remove('tabs-snap-ghost');
          willSnapCanvasMode = null;

          const minConvWidth = snapConvThreshold;
          const maxConvWidth = containerWidth - snapTabsThreshold;
          const newConvWidth = Math.max(minConvWidth, Math.min(maxConvWidth, candidateConvWidth));
          const newTabsWidth = containerWidth - newConvWidth;

          s08InsetBody.classList.remove('tabs-full-width', 'tabs-collapsed');
          if (s08SplitToggleBtn) {
            s08SplitToggleBtn.classList.remove('active');
            s08SplitToggleBtn.setAttribute('title', 'Expand tabs to full width');
          }
          if (s08RightSidebarTrigger) {
            s08RightSidebarTrigger.style.display = 'none';
          }

          lastTabsWidth = newTabsWidth;
          s08InsetBody.style.setProperty('grid-template-columns', `${newConvWidth}px 0px 1fr`, 'important');

          if (typeof updateTabsLayout === 'function') {
            updateTabsLayout();
          }
        }
      }

      function onPointerUp(ev) {
        if (!isCanvasDragging) return;
        isCanvasDragging = false;
        canvasResizer.classList.remove('is-active', 'will-snap-close');
        document.body.classList.remove('is-resizing');
        s08InsetBody.style.transition = '';

        try {
          canvasResizer.releasePointerCapture(ev.pointerId);
        } catch (_) {}

        canvasResizer.removeEventListener('pointermove', onPointerMove);
        canvasResizer.removeEventListener('pointerup', onPointerUp);
        canvasResizer.removeEventListener('pointercancel', onPointerUp);

        if (willSnapCanvasMode === 'tabs-close') {
          // Snap closed! Smooth Apple spring transition into collapsed state
          s08InsetBody.style.transition = 'grid-template-columns 240ms cubic-bezier(0.16, 1, 0.3, 1)';
          s08InsetBody.classList.add('tabs-collapsed');
          s08InsetBody.classList.remove('tabs-full-width', 'tabs-snap-ghost');
          s08InsetBody.style.gridTemplateColumns = '';
          setTimeout(() => { s08InsetBody.style.transition = ''; }, 250);

          if (s08RightSidebarTrigger) {
            s08RightSidebarTrigger.style.display = 'inline-flex';
            s08RightSidebarTrigger.setAttribute('title', 'Re-open Side Tabs Panel [|]');
          }
        } else if (willSnapCanvasMode === 'conv-close') {
          // Dragged below minimum limit to left -> tabs expand to 100% full width with spring
          s08InsetBody.style.transition = 'grid-template-columns 240ms cubic-bezier(0.16, 1, 0.3, 1)';
          s08InsetBody.classList.add('tabs-full-width');
          s08InsetBody.classList.remove('tabs-collapsed', 'tabs-snap-ghost');
          s08InsetBody.style.gridTemplateColumns = '';
          setTimeout(() => { s08InsetBody.style.transition = ''; }, 250);

          if (s08SplitToggleBtn) {
            s08SplitToggleBtn.classList.add('active');
            s08SplitToggleBtn.setAttribute('title', 'Restore split layout');
          }
        } else {
          s08InsetBody.classList.remove('tabs-snap-ghost');
          if (lastTabsWidth) {
            if (currentActiveTab === 'sources') {
              const isSyn = (currentAgent || '').toLowerCase().trim() === 'synthetix';
              if (isSyn) {
                savedSynthetixTabsWidth = lastTabsWidth;
              } else {
                savedArtifactsTabsWidth = lastTabsWidth;
              }
              savedSourceTabsWidth = lastTabsWidth;
            } else {
              savedOtherTabsWidth = lastTabsWidth;
            }
          }
          if (typeof updateTabsLayout === 'function') {
            updateTabsLayout();
          }
        }

        willSnapCanvasMode = null;
      }

      canvasResizer.addEventListener('pointermove', onPointerMove);
      canvasResizer.addEventListener('pointerup', onPointerUp);
      canvasResizer.addEventListener('pointercancel', onPointerUp);
    });

    // Double-click resets conversation & tabs split to default layout proportions with Apple spring
    canvasResizer.addEventListener('dblclick', () => {
      s08InsetBody.style.transition = 'grid-template-columns 280ms cubic-bezier(0.16, 1, 0.3, 1)';
      s08InsetBody.style.gridTemplateColumns = '';
      lastTabsWidth = null;
      setTimeout(() => {
        s08InsetBody.style.transition = '';
      }, 300);
      if (typeof updateTabsLayout === 'function') {
        updateTabsLayout();
      }
    });
  }

  // 2. Sidebar Split Resizer (between Secondary Nav and Inset)
  const sidebarResizer = document.getElementById('s08-sidebar-resizer');
  if (sidebarResizer && s08Sidebar) {
    let isSidebarDragging = false;
    let startX = 0;
    let startSidebarWidth = 0;
    let willSnapCloseSidebar = false;

    sidebarResizer.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      isSidebarDragging = true;
      sidebarResizer.classList.add('is-active');
      document.body.classList.add('is-resizing');

      try {
        sidebarResizer.setPointerCapture(e.pointerId);
      } catch (_) {}

      s08Sidebar.style.transition = 'none';
      startX = e.clientX;
      startSidebarWidth = s08Sidebar.getBoundingClientRect().width;

      function onPointerMove(ev) {
        if (!isSidebarDragging) return;
        const dx = ev.clientX - startX;
        const candidateW = startSidebarWidth + dx;

        // Snap threshold: dragged left below 13% (< 130px or < 13% screen width)
        const snapThreshold = Math.max(130, Math.round(window.innerWidth * 0.13));

        if (candidateW < snapThreshold) {
          sidebarResizer.classList.add('will-snap-close');
          willSnapCloseSidebar = true;

          // Apple HIG Direct Manipulation Rubber-Banding
          const overshoot = snapThreshold - candidateW;
          const dampedOvershoot = rubberband(overshoot, snapThreshold, 0.55);
          const visualW = Math.max(10, snapThreshold - dampedOvershoot);
          s08Sidebar.style.width = `${visualW}px`;
        } else {
          sidebarResizer.classList.remove('will-snap-close');
          willSnapCloseSidebar = false;

          // Restore if collapsed
          s08Sidebar.classList.remove('collapsed');
          document.body.classList.remove('s08-sidebar-collapsed');
          if (s08SidebarTrigger) s08SidebarTrigger.setAttribute('title', 'Collapse Sidebar');

          // User expanded sidebar via resizer: minimize files/artifacts tab if open, preserving its pill in header
          const sourcesPill = tabPillsList ? tabPillsList.querySelector('.s08-tab-pill[data-tab-name="sources"]') : null;
          if (sourcesPill && !minimizedPanes.has('sources')) {
            sourcesAutoClosedBySidebar = true;
            minimizedPanes.add('sources');
            sourcesPill.classList.add('is-minimized');
            sourcesPill.classList.remove('active');
            updateTabsLayout();
          }
          
          // Clamp to min/max 15%–20% (clamp(180px, 18vw, 280px))
          const minW = Math.max(180, Math.round(window.innerWidth * 0.15));
          const maxW = Math.min(280, Math.round(window.innerWidth * 0.20));
          const clampedW = Math.max(minW, Math.min(maxW, candidateW));
          s08Sidebar.style.width = `${clampedW}px`;
        }
      }

      function onPointerUp(ev) {
        if (!isSidebarDragging) return;
        isSidebarDragging = false;
        sidebarResizer.classList.remove('is-active', 'will-snap-close');
        document.body.classList.remove('is-resizing');
        s08Sidebar.style.transition = '';

        try {
          sidebarResizer.releasePointerCapture(ev.pointerId);
        } catch (_) {}

        sidebarResizer.removeEventListener('pointermove', onPointerMove);
        sidebarResizer.removeEventListener('pointerup', onPointerUp);
        sidebarResizer.removeEventListener('pointercancel', onPointerUp);

        if (willSnapCloseSidebar) {
          // Snap closed with Apple spring transition
          s08Sidebar.style.transition = 'width 240ms cubic-bezier(0.16, 1, 0.3, 1)';
          s08Sidebar.classList.add('collapsed');
          document.body.classList.add('s08-sidebar-collapsed');
          s08Sidebar.style.width = '';
          setTimeout(() => { s08Sidebar.style.transition = ''; }, 250);

          if (s08SidebarTrigger) s08SidebarTrigger.setAttribute('title', 'Expand Sidebar');

          // Auto-restore sources if it was previously auto-closed by sidebar opening
          if (sourcesAutoClosedBySidebar) {
            sourcesAutoClosedBySidebar = false;
            minimizedPanes.delete('sources');
            const sourcesPill = tabPillsList ? tabPillsList.querySelector('.s08-tab-pill[data-tab-name="sources"]') : null;
            if (sourcesPill) {
              sourcesPill.classList.remove('is-minimized');
            }
            openOrSwitchTab('sources');
          }
        }

        willSnapCloseSidebar = false;
      }

      sidebarResizer.addEventListener('pointermove', onPointerMove);
      sidebarResizer.addEventListener('pointerup', onPointerUp);
      sidebarResizer.addEventListener('pointercancel', onPointerUp);
    });

    sidebarResizer.addEventListener('dblclick', () => {
      s08Sidebar.style.transition = 'width 280ms cubic-bezier(0.16, 1, 0.3, 1)';
      s08Sidebar.style.width = '';
      setTimeout(() => { s08Sidebar.style.transition = ''; }, 300);
    });
  }

  // ==========================================================================
  // TAB PANES DRAGGABLE SPLIT RESIZERS (Vertical & Horizontal inside Column 2)
  // ==========================================================================
  const tabResizerV = document.getElementById('s08-tab-resizer-v');
  const tabResizerH = document.getElementById('s08-tab-resizer-h');

  // 1. Vertical Tab Resizer (Left Pane vs Right Panes)
  if (tabResizerV && tabViewsContainer) {
    let isDraggingV = false;
    let startX = 0;
    let startLeftW = 0;
    let containerW = 0;
    let willSnapCloseMode = null; // 'sources' | 'browser' | 'editor' | 'log viewer' | 'right-pane' | null

    tabResizerV.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      isDraggingV = true;
      tabResizerV.classList.add('is-active');
      document.body.classList.add('is-resizing');

      try {
        tabResizerV.setPointerCapture(e.pointerId);
      } catch (_) {}

      tabViewsContainer.style.transition = 'none';
      startX = e.clientX;
      containerW = tabViewsContainer.getBoundingClientRect().width;

      const isBrowserEditor = tabViewsContainer.classList.contains('layout-browser-editor');
      const leftView = isBrowserEditor
        ? document.getElementById('s08-view-editor')
        : document.getElementById('s08-view-sources');
      const leftRect = leftView ? leftView.getBoundingClientRect() : { width: Math.round(containerW * 0.28) };
      startLeftW = leftRect.width;

      function onPointerMove(ev) {
        if (!isDraggingV || containerW <= 100) return;
        const dx = ev.clientX - startX;
        const candidateLeftW = startLeftW + dx;
        const remainingRightW = containerW - candidateLeftW;

        // Dynamic 10%–20% fluid scaling threshold before snapping (15% or 130px)
        const snapThreshold = Math.max(130, Math.round(containerW * 0.15));

        if (isBrowserEditor) {
          // Left is Editor, Right is Browser
          if (candidateLeftW < snapThreshold) {
            tabResizerV.classList.add('will-snap-close');
            willSnapCloseMode = 'editor';

            // Rubber-banding damping past snap boundary
            const overshoot = snapThreshold - candidateLeftW;
            const dampedOvershoot = rubberband(overshoot, snapThreshold, 0.55);
            const visualLeftW = Math.max(10, snapThreshold - dampedOvershoot);
            tabViewsContainer.style.setProperty('grid-template-columns', `${visualLeftW}px 0px 1fr`, 'important');
          } else if (remainingRightW < snapThreshold) {
            tabResizerV.classList.add('will-snap-close');
            willSnapCloseMode = 'browser';

            // Rubber-banding damping past snap boundary
            const overshoot = snapThreshold - remainingRightW;
            const dampedOvershoot = rubberband(overshoot, snapThreshold, 0.55);
            const visualRightW = Math.max(10, snapThreshold - dampedOvershoot);
            const visualLeftW = containerW - visualRightW;
            tabViewsContainer.style.setProperty('grid-template-columns', `${visualLeftW}px 0px 1fr`, 'important');
          } else {
            tabResizerV.classList.remove('will-snap-close');
            willSnapCloseMode = null;
            const minW = snapThreshold;
            const maxW = containerW - snapThreshold;
            const clampedW = Math.max(minW, Math.min(maxW, candidateLeftW));
            tabViewsContainer.style.setProperty('grid-template-columns', `${clampedW}px 0px 1fr`, 'important');
          }
        } else {
          // Left is Sources (Artifacts/Files), Right is Browser / Editor / Log Viewer
          // Dragging left: Sources shrinks down to 10%-20% (15% or 130px), then snaps closed
          if (candidateLeftW < snapThreshold) {
            tabResizerV.classList.add('will-snap-close');
            willSnapCloseMode = 'sources';

            // Rubber-banding damping past snap boundary
            const overshoot = snapThreshold - candidateLeftW;
            const dampedOvershoot = rubberband(overshoot, snapThreshold, 0.55);
            const visualLeftW = Math.max(10, snapThreshold - dampedOvershoot);
            tabViewsContainer.style.setProperty('grid-template-columns', `${visualLeftW}px 0px 1fr`, 'important');
          }
          // Dragging right: Right pane (Browser/Editor/Logs) shrinks down to 10%-20% (15% or 130px), then snaps closed!
          else if (remainingRightW < snapThreshold) {
            tabResizerV.classList.add('will-snap-close');
            if (tabViewsContainer.classList.contains('layout-sources-browser')) {
              willSnapCloseMode = 'browser';
            } else if (tabViewsContainer.classList.contains('layout-sources-logs')) {
              willSnapCloseMode = 'log viewer';
            } else if (tabViewsContainer.classList.contains('layout-sources-editor')) {
              willSnapCloseMode = 'editor';
            } else if (tabViewsContainer.classList.contains('layout-three-pane')) {
              willSnapCloseMode = 'right-pane';
            } else {
              willSnapCloseMode = 'browser';
            }

            // Rubber-banding damping past snap boundary
            const overshoot = snapThreshold - remainingRightW;
            const dampedOvershoot = rubberband(overshoot, snapThreshold, 0.55);
            const visualRightW = Math.max(10, snapThreshold - dampedOvershoot);
            const visualLeftW = containerW - visualRightW;
            tabViewsContainer.style.setProperty('grid-template-columns', `${visualLeftW}px 0px 1fr`, 'important');
          } else {
            // Fluid scaling anywhere between 15% and 85%! Browser and Sources both dynamically scale!
            tabResizerV.classList.remove('will-snap-close');
            willSnapCloseMode = null;
            const minW = snapThreshold;
            const maxW = containerW - snapThreshold;
            const clampedW = Math.max(minW, Math.min(maxW, candidateLeftW));
            tabViewsContainer.style.setProperty('grid-template-columns', `${clampedW}px 0px 1fr`, 'important');
          }
        }
      }

      function onPointerUp(ev) {
        if (!isDraggingV) return;
        isDraggingV = false;
        tabResizerV.classList.remove('is-active', 'will-snap-close');
        document.body.classList.remove('is-resizing');
        tabViewsContainer.style.transition = '';

        try {
          tabResizerV.releasePointerCapture(ev.pointerId);
        } catch (_) {}

        tabResizerV.removeEventListener('pointermove', onPointerMove);
        tabResizerV.removeEventListener('pointerup', onPointerUp);
        tabResizerV.removeEventListener('pointercancel', onPointerUp);

        if (willSnapCloseMode) {
          tabViewsContainer.style.transition = 'grid-template-columns 240ms cubic-bezier(0.16, 1, 0.3, 1)';
          setTimeout(() => { tabViewsContainer.style.transition = ''; }, 250);
        }

        if (willSnapCloseMode === 'sources') {
          minimizedPanes.add('sources');
          const sourcesPill = tabPillsList ? tabPillsList.querySelector('.s08-tab-pill[data-tab-name="sources"]') : null;
          if (sourcesPill) {
            sourcesPill.classList.add('is-minimized');
            sourcesPill.classList.remove('active');
            sourcesPill.setAttribute('title', 'Artifacts (Minimized - click to restore)');
          }
          tabViewsContainer.style.gridTemplateColumns = '';
          updateTabsLayout();
        } else if (willSnapCloseMode === 'browser') {
          minimizedPanes.add('browser');
          const browserPill = tabPillsList ? tabPillsList.querySelector('.s08-tab-pill[data-tab-name="browser"]') : null;
          if (browserPill) {
            browserPill.classList.add('is-minimized');
            browserPill.classList.remove('active');
            browserPill.setAttribute('title', 'Browser (Minimized - click to restore)');
          }
          tabViewsContainer.style.gridTemplateColumns = '';
          updateTabsLayout();
        } else if (willSnapCloseMode === 'editor') {
          const editorPill = tabPillsList ? (tabPillsList.querySelector('.s08-tab-pill[data-tab-name="editor"]') || tabPillsList.querySelector('.s08-tab-pill:not([data-tab-name="browser"]):not([data-tab-name="sources"]):not([data-tab-name="log viewer"]):not([data-tab-name="logs"])')) : null;
          if (editorPill) {
            const k = normalizeTabKey(editorPill.getAttribute('data-tab-name') || 'editor');
            minimizedPanes.add(k);
            editorPill.classList.add('is-minimized');
            editorPill.classList.remove('active');
            editorPill.setAttribute('title', `${editorPill.textContent.trim()} (Minimized - click to restore)`);
          }
          tabViewsContainer.style.gridTemplateColumns = '';
          updateTabsLayout();
        } else if (willSnapCloseMode === 'log viewer') {
          minimizedPanes.add('log viewer');
          const logsPill = tabPillsList ? (tabPillsList.querySelector('.s08-tab-pill[data-tab-name="log viewer"]') || tabPillsList.querySelector('.s08-tab-pill[data-tab-name="logs"]')) : null;
          if (logsPill) {
            logsPill.classList.add('is-minimized');
            logsPill.classList.remove('active');
            logsPill.setAttribute('title', 'Log Viewer (Minimized - click to restore)');
          }
          tabViewsContainer.style.gridTemplateColumns = '';
          updateTabsLayout();
        } else if (willSnapCloseMode === 'right-pane') {
          const activeStage = lastActiveStageKey || 'browser';
          minimizedPanes.add(activeStage);
          const stagePill = tabPillsList ? tabPillsList.querySelector(`.s08-tab-pill[data-tab-name="${activeStage}"]`) : null;
          if (stagePill) {
            stagePill.classList.add('is-minimized');
            stagePill.classList.remove('active');
            stagePill.setAttribute('title', `${stagePill.textContent.trim()} (Minimized - click to restore)`);
          }
          tabViewsContainer.style.gridTemplateColumns = '';
          updateTabsLayout();
        } else if (!isHydrating && typeof saveWorkspaceState === 'function') {
          saveWorkspaceState();
        }

        willSnapCloseMode = null;
      }

      tabResizerV.addEventListener('pointermove', onPointerMove);
      tabResizerV.addEventListener('pointerup', onPointerUp);
      tabResizerV.addEventListener('pointercancel', onPointerUp);
    });

    // Double-click resets pane width to default proportion with Apple spring
    tabResizerV.addEventListener('dblclick', () => {
      tabViewsContainer.style.transition = 'grid-template-columns 280ms cubic-bezier(0.16, 1, 0.3, 1)';
      tabViewsContainer.style.gridTemplateColumns = '';
      setTimeout(() => {
        tabViewsContainer.style.transition = '';
      }, 300);
      if (!isHydrating && typeof saveWorkspaceState === 'function') {
        saveWorkspaceState();
      }
    });
  }

  // 2. Horizontal Draggable Divider (The Stage vs The Monitor)
  if (tabResizerH && tabViewsContainer) {
    let isDraggingH = false;
    let containerRect = null;
    let willSnapCloseHMode = null; // 'logs' | 'stage' | null

    tabResizerH.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      isDraggingH = true;
      tabResizerH.classList.add('is-active');
      document.body.classList.add('is-resizing-row');
      try {
        tabResizerH.setPointerCapture(e.pointerId);
      } catch (_) {}

      tabViewsContainer.style.transition = 'none';
      containerRect = tabViewsContainer.getBoundingClientRect();

      function onPointerMove(ev) {
        if (!isDraggingH || !containerRect) return;
        const totalH = containerRect.height;
        if (totalH <= 160) return;

        const candidateStageH = ev.clientY - containerRect.top;
        const remainingLogH = totalH - candidateStageH;

        // Dynamic 10%–20% fluid scaling threshold before snapping (15% or 90px/100px)
        const snapLogsThreshold = Math.max(90, Math.round(totalH * 0.15));
        const snapStageThreshold = Math.max(100, Math.round(totalH * 0.15));

        // Dragging DOWN: Log Viewer shrinks below 10%-20% -> snaps closed
        if (remainingLogH < snapLogsThreshold) {
          tabResizerH.classList.add('will-snap-close');
          willSnapCloseHMode = 'logs';
        }
        // Dragging UP: Stage shrinks below 10%-20% -> snaps closed
        else if (candidateStageH < snapStageThreshold) {
          tabResizerH.classList.add('will-snap-close');
          willSnapCloseHMode = 'stage';
        } else {
          tabResizerH.classList.remove('will-snap-close');
          willSnapCloseHMode = null;

          const minStageH = snapStageThreshold;
          const maxStageH = totalH - snapLogsThreshold;
          const clampedStageH = Math.max(minStageH, Math.min(maxStageH, candidateStageH));
          savedStageHeightRatio = clampedStageH / totalH;
          tabViewsContainer.style.setProperty('grid-template-rows', `${clampedStageH}px 0px 1fr`, 'important');
        }
      }

      function onPointerUp(ev) {
        if (!isDraggingH) return;
        isDraggingH = false;
        tabResizerH.classList.remove('is-active', 'will-snap-close');
        document.body.classList.remove('is-resizing-row');
        tabViewsContainer.style.transition = '';

        try {
          tabResizerH.releasePointerCapture(ev.pointerId);
        } catch (_) {}

        tabResizerH.removeEventListener('pointermove', onPointerMove);
        tabResizerH.removeEventListener('pointerup', onPointerUp);
        tabResizerH.removeEventListener('pointercancel', onPointerUp);

        if (willSnapCloseHMode === 'logs') {
          minimizedPanes.add('log viewer');
          const logsPill = tabPillsList ? (tabPillsList.querySelector('.s08-tab-pill[data-tab-name="log viewer"]') || tabPillsList.querySelector('.s08-tab-pill[data-tab-name="logs"]')) : null;
          if (logsPill) {
            logsPill.classList.add('is-minimized');
            logsPill.classList.remove('active');
            logsPill.setAttribute('title', 'Log Viewer (Minimized - click to restore)');
          }
          savedStageHeightRatio = null;
          tabViewsContainer.style.gridTemplateRows = '';
          updateTabsLayout();
        } else if (willSnapCloseHMode === 'stage') {
          const activeStage = lastActiveStageKey || 'browser';
          minimizedPanes.add(activeStage);
          const stagePill = tabPillsList ? tabPillsList.querySelector(`.s08-tab-pill[data-tab-name="${activeStage}"]`) : null;
          if (stagePill) {
            stagePill.classList.add('is-minimized');
            stagePill.classList.remove('active');
            stagePill.setAttribute('title', `${stagePill.textContent.trim()} (Minimized - click to restore)`);
          }
          savedStageHeightRatio = null;
          tabViewsContainer.style.gridTemplateRows = '';
          updateTabsLayout();
        } else if (!isHydrating && typeof saveWorkspaceState === 'function') {
          saveWorkspaceState();
        }

        willSnapCloseHMode = null;
      }

      tabResizerH.addEventListener('pointermove', onPointerMove);
      tabResizerH.addEventListener('pointerup', onPointerUp);
      tabResizerH.addEventListener('pointercancel', onPointerUp);
    });

    // Double-click resets pane height to default golden proportion (65% stage)
    tabResizerH.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      savedStageHeightRatio = null;
      tabViewsContainer.style.gridTemplateRows = '';
      if (!isHydrating && typeof saveWorkspaceState === 'function') {
        saveWorkspaceState();
      }
    });

    // Keyboard accessibility: ArrowUp/Down to resize, Enter/Home to reset
    tabResizerH.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter' || e.key === 'Home') {
        e.preventDefault();
        const rect = tabViewsContainer.getBoundingClientRect();
        const totalH = rect.height;
        if (totalH <= 160) return;

        if (e.key === 'Enter' || e.key === 'Home') {
          savedStageHeightRatio = null;
          tabViewsContainer.style.gridTemplateRows = '';
          if (!isHydrating && typeof saveWorkspaceState === 'function') {
            saveWorkspaceState();
          }
          return;
        }

        let currentStageH = Math.round(totalH * (savedStageHeightRatio || 0.65));
        const step = 24; // 24px step per arrow key
        if (e.key === 'ArrowUp') currentStageH -= step;
        if (e.key === 'ArrowDown') currentStageH += step;

        const minStageH = Math.max(100, Math.round(totalH * 0.15));
        const maxStageH = totalH - Math.max(90, Math.round(totalH * 0.15));
        currentStageH = Math.max(minStageH, Math.min(maxStageH, currentStageH));

        savedStageHeightRatio = currentStageH / totalH;
        tabViewsContainer.style.setProperty('grid-template-rows', `${currentStageH}px 0px 1fr`, 'important');
        if (!isHydrating && typeof saveWorkspaceState === 'function') {
          saveWorkspaceState();
        }
      }
    });
  }

  // 5. Tabs Controller & Dropdown (Image 1 & Image 2, Sources Default Active per Annotation 6)
  // Toggle Add Tab Menu (Annotations 3 & 8: Clean CSS absolute positioning and robust click interaction)
  if (addTabBtn && addTabMenu) {
    addTabBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      addTabMenu.style.top = '';
      addTabMenu.style.left = '';
      if (tabOverflowMenu) tabOverflowMenu.classList.remove('open');
      if (tabOverflowBtn) tabOverflowBtn.setAttribute('aria-expanded', 'false');
      addTabMenu.classList.toggle('open');
      const isOpen = addTabMenu.classList.contains('open');
      addTabBtn.setAttribute('aria-expanded', isOpen);
    });

    document.addEventListener('click', (e) => {
      if (!addTabBtn.contains(e.target) && !addTabMenu.contains(e.target)) {
        addTabMenu.classList.remove('open');
        if (addTabBtn) addTabBtn.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && addTabMenu.classList.contains('open')) {
        addTabMenu.classList.remove('open');
        if (addTabBtn) addTabBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Clicking menu items: Editor, browser, log viewer, Sources
    addTabMenu.querySelectorAll('.s08-tab-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const tabKey = (item.getAttribute('data-tab-name') || '').toLowerCase().trim();
        openOrSwitchTab(tabKey);
        addTabMenu.classList.remove('open');
        addTabBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Seamless horizontal mouse wheel scrolling across tab pills (deltaY -> scrollLeft)
  if (tabsScrollArea) {
    tabsScrollArea.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        tabsScrollArea.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }

  // Tab Overflow Dropdown Menu ([▼])
  function renderTabOverflowMenu() {
    if (!overflowList || !tabPillsList) return;
    const pills = Array.from(tabPillsList.querySelectorAll('.s08-tab-pill'));
    if (overflowCount) overflowCount.textContent = `${pills.length} tab${pills.length === 1 ? '' : 's'}`;

    let html = '';
    pills.forEach((pill, idx) => {
      const tabKey = (pill.getAttribute('data-tab-name') || '').toLowerCase().trim();
      const isActive = pill.classList.contains('active');
      const label = pill.querySelector('.s08-tab-pill-label')?.textContent?.trim() || tabKey;
      const shortcut = idx < 9 ? `⌘${idx + 1}` : '';

      html += `
        <button class="s08-overflow-item ${isActive ? 'active' : ''}" data-tab-name="${tabKey}" type="button">
          <span class="s08-overflow-item-bullet"></span>
          <span class="s08-overflow-item-label">${escapeHTML(label)}</span>
          <span class="s08-overflow-item-close" data-close-tab="${tabKey}" title="Close tab">×</span>
        </button>
      `;
    });

    overflowList.innerHTML = html;

    overflowList.querySelectorAll('.s08-overflow-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const closeBtn = e.target.closest('.s08-overflow-item-close');
        const tabKey = item.getAttribute('data-tab-name');
        if (closeBtn) {
          e.stopPropagation();
          const pill = tabPillsList.querySelector(`.s08-tab-pill[data-tab-name="${tabKey}"]`);
          if (pill) closeTabPill(tabKey, pill);
          renderTabOverflowMenu();
        } else if (tabKey) {
          const cleanKey = normalizeTabKey(tabKey);
          const isCurrentTab = (currentActiveTab && normalizeTabKey(currentActiveTab) === cleanKey) || item.classList.contains('active');
          const targetViewId = getTabViewId(cleanKey);
          const targetView = document.getElementById(targetViewId);
          const hasBorder = targetView && targetView.classList.contains('is-active-pane');

          if (isCurrentTab) {
            if (hasBorder) {
              if (targetView) targetView.classList.remove('is-active-pane');
            } else {
              if (targetView) targetView.classList.add('is-active-pane');
            }
          } else {
            focusTab(tabKey, true);
            if (targetView) targetView.classList.add('is-active-pane');
          }
          if (tabOverflowMenu) tabOverflowMenu.classList.remove('open');
          if (tabOverflowBtn) tabOverflowBtn.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  if (tabOverflowBtn && tabOverflowMenu) {
    tabOverflowBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      tabOverflowMenu.style.top = '';
      tabOverflowMenu.style.left = '';
      renderTabOverflowMenu();
      tabOverflowMenu.classList.toggle('open');
      const isOpen = tabOverflowMenu.classList.contains('open');
      tabOverflowBtn.setAttribute('aria-expanded', isOpen);
      if (isOpen && addTabMenu) addTabMenu.classList.remove('open');
    });

    document.addEventListener('click', (e) => {
      if (!tabOverflowBtn.contains(e.target) && !tabOverflowMenu.contains(e.target)) {
        tabOverflowMenu.classList.remove('open');
        tabOverflowBtn.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && tabOverflowMenu.classList.contains('open')) {
        tabOverflowMenu.classList.remove('open');
        tabOverflowBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function openOrSwitchTab(tabKey, customDef = null) {
    const rawKey = tabKey;
    tabKey = normalizeTabKey(tabKey);
    minimizedPanes.delete(tabKey);
    const isSyn = (currentAgent || '').toLowerCase().trim() === 'synthetix';
    const defaultLabel = tabKey === 'sources' ? (isSyn ? 'Files' : 'Artifacts') : (tabDefinitions[tabKey]?.label || rawKey);
    const tabDef = customDef || tabDefinitions[tabKey] || { label: defaultLabel, viewId: `s08-view-${tabKey}` };
    if (customDef && !tabDefinitions[tabKey]) {
      tabDefinitions[tabKey] = customDef;
    }
    
    // Ensure tabs panel is un-collapsed if collapsed
    if (s08InsetBody && s08InsetBody.classList.contains('tabs-collapsed')) {
      s08InsetBody.classList.remove('tabs-collapsed');
      s08InsetBody.classList.remove('tabs-full-width');
      s08InsetBody.style.gridTemplateColumns = '';
      if (s08RightSidebarTrigger) s08RightSidebarTrigger.style.display = 'none';
      if (s08SplitToggleBtn) {
        s08SplitToggleBtn.classList.remove('active');
        s08SplitToggleBtn.setAttribute('title', 'Expand tabs to full width');
      }
    }

    // Check if pill already exists in tab bar (using normalized key matching)
    let existingPill = null;
    if (tabPillsList) {
      const pills = Array.from(tabPillsList.querySelectorAll('.s08-tab-pill'));
      existingPill = pills.find(p => normalizeTabKey(p.getAttribute('data-tab-name')) === tabKey) || null;
    }
    
    if (existingPill && customDef && customDef.label) {
      const labelEl = existingPill.querySelector('.s08-tab-pill-label');
      if (labelEl) labelEl.textContent = customDef.label;
      existingPill.setAttribute('title', customDef.label);
    }

    if (!existingPill && tabPillsList) {
      const pillBtn = document.createElement('button');
      pillBtn.className = 's08-tab-pill open-pane';
      pillBtn.setAttribute('data-tab-name', tabKey);
      pillBtn.setAttribute('type', 'button');
      pillBtn.setAttribute('title', tabDef.label);
      pillBtn.innerHTML = `
        <span class="s08-tab-pill-label">${escapeHTML(tabDef.label)}</span>
        <span class="s08-tab-close-icon" title="Close tab">×</span>
      `;
      
      tabPillsList.appendChild(pillBtn);
      existingPill = pillBtn;
    }

    focusTab(tabKey);

    if (existingPill) {
      existingPill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }

  // Contextual Action Button based on active tab (Annotation 1)
  const tabContextActionBtn = document.getElementById('s08-tab-context-action-btn');

  function updateTabContextAction(tabKey) {
    if (!tabContextActionBtn) return;
    const cleanKey = (tabKey || '').toLowerCase().trim();
    tabContextActionBtn.style.display = 'inline-flex';

    if (cleanKey === 'log viewer') {
      tabContextActionBtn.setAttribute('title', 'Clear Log Stream');
      tabContextActionBtn.setAttribute('aria-label', 'Clear logs');
      tabContextActionBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
      `;
      tabContextActionBtn.onclick = () => {
        const logContent = document.querySelector('.s08-logs-content');
        if (logContent) {
          const now = new Date();
          const timeStr = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
          logContent.innerHTML = `<div class="s08-log-row info"><span class="log-t">${timeStr}</span> <span class="log-tag">INFO</span> Log stream cleared by user.</div>`;
          appendLogMessage('Log stream cleared', 'OK');
        }
      };
    } else if (cleanKey === 'editor') {
      tabContextActionBtn.setAttribute('title', 'Copy Code to Clipboard');
      tabContextActionBtn.setAttribute('data-custom-tooltip', 'Copy Code to Clipboard');
      tabContextActionBtn.setAttribute('aria-label', 'Copy code');
      tabContextActionBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
        </svg>
      `;
      tabContextActionBtn.onclick = () => {
        const codeEl = document.querySelector('.s08-editor-content code') || document.getElementById('s08-stage-code-text');
        if (codeEl) {
          handleCopyFeedback(tabContextActionBtn, codeEl.textContent, 'Copy Code to Clipboard');
          appendLogMessage('Editor code copied to clipboard', 'OK');
        }
      };
    } else if (cleanKey === 'browser') {
      tabContextActionBtn.setAttribute('title', 'Reload Browser Preview');
      tabContextActionBtn.setAttribute('aria-label', 'Reload preview');
      tabContextActionBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/>
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>
        </svg>
      `;
      tabContextActionBtn.onclick = () => {
        appendLogMessage('Browser preview reloaded: http://localhost:3000/app/preview', 'OK');
        tabContextActionBtn.style.color = 'var(--color-brand-primary)';
        setTimeout(() => { tabContextActionBtn.style.color = ''; }, 1000);
      };
    } else { // sources / files / artifacts default
      const isSyn = (currentAgent || '').toLowerCase().trim() === 'synthetix';
      const label = isSyn ? 'Files' : 'Artifacts';
      tabContextActionBtn.setAttribute('title', `Refresh ${label} Tree`);
      tabContextActionBtn.setAttribute('aria-label', `Refresh ${label.toLowerCase()}`);
      tabContextActionBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
      `;
      tabContextActionBtn.onclick = () => {
        appendLogMessage(`${label} tree refreshed: 7 items scanned`, 'INFO');
        tabContextActionBtn.style.color = 'var(--color-brand-primary)';
        setTimeout(() => { tabContextActionBtn.style.color = ''; }, 1000);
      };
    }
  }

  function updateTabsLayout() {
    if (!tabViewsContainer || !tabPillsList) return;

    const pills = Array.from(tabPillsList.querySelectorAll('.s08-tab-pill'));
    const allTabKeys = pills.map(p => normalizeTabKey(p.getAttribute('data-tab-name')));

    // Only non-minimized tabs participate in the grid layouts
    let openKeys = allTabKeys.filter(k => !minimizedPanes.has(k));
    if (openKeys.length === 0 && allTabKeys.length > 0) {
      // If all tabs were minimized, keep the active tab visible
      const fallbackKey = normalizeTabKey(currentActiveTab) || allTabKeys[0];
      minimizedPanes.delete(fallbackKey);
      openKeys = [fallbackKey];
    }

    // Sync clean non-repetitive labels and minimized classes
    pills.forEach((pill) => {
      const rawKey = (pill.getAttribute('data-tab-name') || '').toLowerCase().trim();
      const tabKey = normalizeTabKey(rawKey);
      const isMin = minimizedPanes.has(tabKey);
      pill.classList.toggle('is-minimized', isMin);
      if (isMin) pill.classList.remove('active');

      const labelEl = pill.querySelector('.s08-tab-pill-label');
      const isSyn = (currentAgent || '').toLowerCase().trim() === 'synthetix';
      const defaultLabel = tabKey === 'sources' ? (isSyn ? 'Files' : 'Artifacts') : (tabDefinitions[tabKey]?.label || rawKey);
      const baseLabel = labelEl?.textContent?.trim() || defaultLabel;
      const cleanLabel = baseLabel.replace(/^(Artifacts|Browser Preview|Browser|Log Viewer|Logs|Editor):\s*/i, '');
      if (labelEl && labelEl.textContent !== cleanLabel) {
        labelEl.textContent = cleanLabel;
      }
      const titleText = isMin ? `${cleanLabel} (Minimized - click to restore)` : cleanLabel;
      pill.setAttribute('title', titleText);
      pill.setAttribute('data-custom-tooltip', titleText);
      pill.removeAttribute('data-tooltip-shortcut');
    });

    // Update Tab Overflow Chevron state & badge
    if (tabOverflowWrap) {
      if (allTabKeys.length >= 2) {
        tabOverflowWrap.style.display = 'flex';
        if (tabCountBadge) tabCountBadge.textContent = allTabKeys.length;
        
        if (tabsScrollArea && tabsScrollArea.scrollWidth > tabsScrollArea.clientWidth + 4) {
          tabOverflowBtn?.classList.add('is-overflowing');
          tabOverflowBtn?.setAttribute('title', `All open tabs (${allTabKeys.length}) • Scrollable`);
        } else {
          tabOverflowBtn?.classList.remove('is-overflowing');
          tabOverflowBtn?.setAttribute('title', `All open tabs (${allTabKeys.length})`);
        }
      } else {
        tabOverflowWrap.style.display = 'none';
      }
    }

    const noTabsView = document.getElementById('s08-no-tabs-view');

    // Remove all multi-pane layout classes first and reset inline grid dimensions
    tabViewsContainer.classList.remove(
      'layout-three-pane',
      'layout-sources-browser',
      'layout-sources-logs',
      'layout-browser-logs',
      'layout-sources-editor',
      'layout-editor-logs',
      'layout-browser-editor',
      'is-fallback-single'
    );
    tabViewsContainer.style.gridTemplateColumns = '';
    tabViewsContainer.style.gridTemplateRows = '';

    const sourcesView = document.getElementById('s08-view-sources');
    const browserView = document.getElementById('s08-view-browser');
    const logsView = document.getElementById('s08-view-log-viewer');
    const editorView = document.getElementById('s08-view-editor');

    const allViews = [sourcesView, browserView, logsView, editorView].filter(Boolean);

    // Hide any views whose tabs are not currently open
    allViews.forEach(v => {
      const viewId = v.id;
      const isOpen = openKeys.some(k => getTabViewId(k) === viewId);
      if (!isOpen) {
        v.style.display = 'none';
        v.classList.remove('is-active-pane');
      }
    });

    // Case 0: All tabs closed -> show empty placeholder
    if (openKeys.length === 0) {
      allViews.forEach(v => {
        v.style.display = 'none';
        v.classList.remove('is-open', 'active', 'is-focused');
      });
      if (noTabsView) noTabsView.style.display = 'flex';
      if (tabContextActionBtn) tabContextActionBtn.style.visibility = 'hidden';
      if (s08InsetBody) {
        s08InsetBody.classList.remove('tabs-multi-open', 'tabs-three-pane', 'has-wide-tab', 'is-sources-active');
      }
      return;
    }

    if (noTabsView) noTabsView.style.display = 'none';
    if (tabContextActionBtn) tabContextActionBtn.style.visibility = '';

    const hasSources = openKeys.includes('sources');
    const hasLogs = openKeys.includes('log viewer');

    // Identify stage candidates (Browser, Editor, or dynamic files)
    const stageKeys = openKeys.filter(k => k !== 'sources' && k !== 'log viewer');
    const hasBrowser = stageKeys.includes('browser');
    const hasEditor = stageKeys.some(k => k !== 'browser');
    
    // Determine which Stage tab is active
    let activeStageKey = 'browser';
    const activeKeyClean = normalizeTabKey(currentActiveTab);
    if (activeKeyClean && stageKeys.includes(activeKeyClean)) {
      activeStageKey = activeKeyClean;
      lastActiveStageKey = activeKeyClean;
    } else if (lastActiveStageKey && stageKeys.includes(lastActiveStageKey)) {
      activeStageKey = lastActiveStageKey;
    } else if (stageKeys.includes('browser')) {
      activeStageKey = 'browser';
      lastActiveStageKey = 'browser';
    } else if (stageKeys.length > 0) {
      activeStageKey = stageKeys[0];
      lastActiveStageKey = stageKeys[0];
    }

    // Helper to render the active Stage view
    function renderActiveStage() {
      if (activeStageKey === 'browser') {
        if (browserView) browserView.style.display = 'flex';
        if (editorView) editorView.style.display = 'none';
      } else {
        if (editorView) editorView.style.display = 'flex';
        if (browserView) browserView.style.display = 'none';
      }
    }

    // Phase 10: Apply saved Stage height ratio to 3-pane and Stage+Logs layouts
    function applySavedStageHeight() {
      if (savedStageHeightRatio && tabViewsContainer) {
        const containerH = tabViewsContainer.getBoundingClientRect().height;
        if (containerH > 200) {
          const minStageH = 160;
          const minLogH = 120;
          const maxStageH = containerH - minLogH;
          const stageH = Math.max(minStageH, Math.min(maxStageH, Math.round(containerH * savedStageHeightRatio)));
          tabViewsContainer.style.gridTemplateRows = `${stageH}px 0px 1fr`;
        }
      }
    }

    // Helper: Single-Active-Tab Fallback when width is too constrained for multiple panes
    function applySingleActiveTabFallback() {
      tabViewsContainer.classList.add('is-fallback-single');
      allViews.forEach(v => { v.style.display = 'none'; });

      const activeKey = (currentActiveTab && openKeys.includes(normalizeTabKey(currentActiveTab)))
        ? normalizeTabKey(currentActiveTab)
        : (stageKeys.length > 0 ? activeStageKey : openKeys[0]);

      if (activeKey === 'sources') {
        if (sourcesView) sourcesView.style.display = 'flex';
      } else if (activeKey === 'log viewer') {
        if (logsView) logsView.style.display = 'flex';
      } else if (activeKey === 'browser') {
        if (browserView) browserView.style.display = 'flex';
      } else {
        if (editorView) editorView.style.display = 'flex';
      }

      if (s08InsetBody) {
        s08InsetBody.classList.remove('tabs-three-pane', 'tabs-vertical-stack');
        s08InsetBody.classList.add('tabs-multi-open', 'has-wide-tab');
      }
    }

    const tabsCol = document.getElementById('s08-tabs-col');
    let availableTabsWidth = (tabViewsContainer && tabViewsContainer.getBoundingClientRect().width > 0)
      ? tabViewsContainer.getBoundingClientRect().width
      : (tabsCol ? tabsCol.getBoundingClientRect().width : window.innerWidth * 0.6);
    const containerHeight = (tabViewsContainer && tabViewsContainer.getBoundingClientRect().height > 0)
      ? tabViewsContainer.getBoundingClientRect().height
      : window.innerHeight * 0.7;

    // Minimum readable threshold for side-by-side splits:
    // Sources list/tree (220px) + Stage/Code/Browser (460px) = 680px
    const minSideBySideWidth = 680;

    // SCENARIO 1: 3-Pane Adaptive Studio
    // Condition: Sources (Anchor) + Stage (Browser or Editor) + Logs (Monitor) are open
    if (hasSources && stageKeys.length > 0 && hasLogs) {
      // Step A: Adapt layout proactively to give optimal width for all 3 panes
      if (s08Sidebar && !s08Sidebar.classList.contains('collapsed')) {
        s08Sidebar.classList.add('collapsed');
        document.body.classList.add('s08-sidebar-collapsed');
        if (s08SidebarTrigger) s08SidebarTrigger.setAttribute('title', 'Expand Sidebar');
      }
      sourcesAutoClosedBySidebar = false;

      if (s08InsetBody) {
        s08InsetBody.classList.remove('tabs-vertical-stack', 'is-sources-active');
        s08InsetBody.classList.add('tabs-multi-open', 'tabs-three-pane', 'has-wide-tab');
        s08InsetBody.style.gridTemplateColumns = '';
      }

      // Step B: Re-measure available width with adapted 75% column
      const adaptedWidth = tabsCol ? tabsCol.getBoundingClientRect().width : window.innerWidth * 0.75;

      // If available width is truly too small (e.g. tablet portrait < 680px), drop down to single active tab
      if (adaptedWidth < minSideBySideWidth) {
        applySingleActiveTabFallback();
        return;
      }

      tabViewsContainer.classList.add('layout-three-pane');
      if (sourcesView) sourcesView.style.display = 'flex';
      if (logsView) logsView.style.display = 'flex';
      renderActiveStage();
      applySavedStageHeight();
    }
    // SCENARIO 2: Sources + Active Stage (No Logs) - Side-by-Side
    else if (hasSources && stageKeys.length > 0 && !hasLogs) {
      if (availableTabsWidth < minSideBySideWidth) {
        applySingleActiveTabFallback();
        return;
      }

      if (s08InsetBody) {
        s08InsetBody.classList.remove('tabs-three-pane', 'tabs-vertical-stack', 'is-sources-active');
        s08InsetBody.classList.add('tabs-multi-open', 'has-wide-tab');
        s08InsetBody.style.gridTemplateColumns = '';
      }
      if (sourcesView) sourcesView.style.display = 'flex';
      if (logsView) logsView.style.display = 'none';

      if (activeStageKey === 'browser') {
        tabViewsContainer.classList.add('layout-sources-browser');
        if (browserView) browserView.style.display = 'flex';
        if (editorView) editorView.style.display = 'none';
      } else {
        tabViewsContainer.classList.add('layout-sources-editor');
        if (editorView) editorView.style.display = 'flex';
        if (browserView) browserView.style.display = 'none';
      }
    }
    // SCENARIO 3: Sources + Logs (No Stage) - Side-by-Side
    else if (hasSources && hasLogs && stageKeys.length === 0) {
      if (availableTabsWidth < minSideBySideWidth) {
        applySingleActiveTabFallback();
        return;
      }

      if (s08InsetBody) {
        s08InsetBody.classList.remove('tabs-three-pane', 'tabs-vertical-stack', 'is-sources-active');
        s08InsetBody.classList.add('tabs-multi-open', 'has-wide-tab');
        s08InsetBody.style.gridTemplateColumns = '';
      }
      tabViewsContainer.classList.add('layout-sources-logs');
      if (sourcesView) sourcesView.style.display = 'flex';
      if (logsView) logsView.style.display = 'flex';
      if (browserView) browserView.style.display = 'none';
      if (editorView) editorView.style.display = 'none';
    }
    // SCENARIO 4: Active Stage + Logs (No Sources) - VERTICAL STACK (Single 1fr column)
    else if (!hasSources && stageKeys.length > 0 && hasLogs) {
      // Vertical stack requires min height (300px) and min width (420px)
      if (availableTabsWidth < 420 || containerHeight < 300) {
        applySingleActiveTabFallback();
        return;
      }

      if (s08InsetBody) {
        s08InsetBody.classList.remove('tabs-three-pane', 'is-sources-active');
        s08InsetBody.classList.add('tabs-multi-open', 'tabs-vertical-stack', 'has-wide-tab');
        s08InsetBody.style.gridTemplateColumns = '';
      }
      if (sourcesView) sourcesView.style.display = 'none';
      if (logsView) logsView.style.display = 'flex';

      if (activeStageKey === 'browser') {
        tabViewsContainer.classList.add('layout-browser-logs');
        if (browserView) browserView.style.display = 'flex';
        if (editorView) editorView.style.display = 'none';
      } else {
        tabViewsContainer.classList.add('layout-editor-logs');
        if (editorView) editorView.style.display = 'flex';
        if (browserView) browserView.style.display = 'none';
      }
      applySavedStageHeight();
    }
    // SCENARIO 5: Multiple Stage Tabs only (No Sources, No Logs)
    else if (!hasSources && !hasLogs && stageKeys.length > 1) {
      if (s08InsetBody) {
        s08InsetBody.classList.remove('tabs-three-pane', 'tabs-vertical-stack', 'is-sources-active');
        s08InsetBody.classList.add('tabs-multi-open', 'has-wide-tab');
        s08InsetBody.style.gridTemplateColumns = '';
      }
      if (sourcesView) sourcesView.style.display = 'none';
      if (logsView) logsView.style.display = 'none';

      // If both Browser and an Editor/Code document are open simultaneously
      if (hasBrowser && hasEditor && availableTabsWidth >= minSideBySideWidth) {
        tabViewsContainer.classList.add('layout-browser-editor');
        if (editorView) editorView.style.display = 'flex';
        if (browserView) browserView.style.display = 'flex';
      } else {
        renderActiveStage();
      }
    }
    // SCENARIO 6: Single Tab Open
    else {
      if (s08InsetBody) {
        s08InsetBody.classList.remove('tabs-multi-open', 'tabs-three-pane', 'tabs-vertical-stack');
        s08InsetBody.style.gridTemplateColumns = '';
        if (openKeys[0] === 'sources') {
          s08InsetBody.classList.remove('has-wide-tab');
          s08InsetBody.classList.add('is-sources-active');
        } else {
          s08InsetBody.classList.remove('is-sources-active');
          s08InsetBody.classList.add('has-wide-tab');
        }
      }

      allViews.forEach(v => { v.style.display = 'none'; });
      const activeKey = (currentActiveTab && openKeys.includes(normalizeTabKey(currentActiveTab)))
        ? normalizeTabKey(currentActiveTab)
        : openKeys[0];
      const targetViewId = getTabViewId(activeKey);
      const targetEl = document.getElementById(targetViewId);
      if (targetEl) targetEl.style.display = 'flex';
    }

    // Retain active focus outline on pane only if it was already active (prevents unprompted border on landing)
    const currentActivePane = currentActiveTab ? document.getElementById(getTabViewId(currentActiveTab)) : null;
    const wasActivePaneHighlighted = currentActivePane && currentActivePane.classList.contains('is-active-pane');
    allViews.forEach(v => v.classList.remove('is-active-pane'));
    if (wasActivePaneHighlighted && currentActivePane && currentActivePane.style.display !== 'none') {
      currentActivePane.classList.add('is-active-pane');
    }
  }

  // Synchronize Tab Pill status and active pane focus based on body selection
  function syncActiveTabSelection(tabKey, targetPaneEl) {
    if (!tabPillsList || !tabViewsContainer) return;

    if (!tabKey) {
      currentActiveTab = null;
      tabPillsList.querySelectorAll('.s08-tab-pill').forEach(pill => pill.classList.remove('active'));
      document.querySelectorAll('.s08-tab-view').forEach(view => view.classList.remove('is-active-pane'));
      updateTabContextAction(null);
      if (!isHydrating && typeof saveWorkspaceState === 'function') saveWorkspaceState();
      return;
    }

    const cleanKey = normalizeTabKey(tabKey);
    currentActiveTab = cleanKey;

    // 1. Update tab pills active state in the header (Only the current active tab gets .active and the blue dot)
    tabPillsList.querySelectorAll('.s08-tab-pill').forEach(pill => {
      const pillKey = normalizeTabKey(pill.getAttribute('data-tab-name'));
      const isMatch = (pillKey === cleanKey) || 
        (cleanKey === 'editor' && pillKey !== 'sources' && pillKey !== 'browser' && pillKey !== 'log viewer' && pillKey !== 'logs');
      if (isMatch) {
        pill.classList.remove('is-minimized');
        pill.classList.add('active');
        try {
          pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        } catch (_) {}
      } else {
        pill.classList.remove('active');
      }
    });

    // 2. Update contextual action icon in header
    updateTabContextAction(cleanKey);

    // 3. Mark active pane body with subtle focus styling
    document.querySelectorAll('.s08-tab-view').forEach(view => {
      view.classList.remove('is-active-pane');
    });
    if (targetPaneEl) {
      targetPaneEl.classList.add('is-active-pane');
    }

    // 4. Update stage tracking if an editor or browser pane was selected
    if (cleanKey === 'browser') {
      lastActiveStageKey = 'browser';
    } else if (cleanKey !== 'sources' && cleanKey !== 'log viewer') {
      lastActiveStageKey = cleanKey;
    }

    // 5. Persist state non-disruptively
    if (!isHydrating && typeof saveWorkspaceState === 'function') {
      saveWorkspaceState();
    }
  }

  function focusTab(tabKey, highlight = true) {
    if (!tabPillsList || !tabViewsContainer) return;

    tabKey = normalizeTabKey(tabKey);
    minimizedPanes.delete(tabKey);
    currentActiveTab = tabKey;

    // Check if focusing an artifact that isn't already the current active artifact document
    if (typeof artifactsData !== 'undefined') {
      const matchedArtifact = artifactsData.find(a => a.name === tabKey || a.id === tabKey);
      if (matchedArtifact) {
        if (!currentArtifactDoc || currentArtifactDoc.name !== matchedArtifact.name) {
          if (typeof renderArtifactContentIntoStage === 'function') {
            renderArtifactContentIntoStage(matchedArtifact);
          }
        }
      } else if (tabKey === 'editor') {
        // Fallback for general 'editor' tab: render the default code configuration document
        const editorDoc = (artifactsData && artifactsData.length > 0)
          ? (artifactsData.find(a => a.name === 'workspace_config.json' || a.ext === 'json') || artifactsData.find(a => a.ext === 'ts' || a.ext === 'yaml') || artifactsData[0])
          : { id: 'doc-config', name: 'workspace_config.json', ext: 'json', badge: 'JSON', size: '1.2 KB' };
        if (typeof renderArtifactContentIntoStage === 'function') {
          renderArtifactContentIntoStage(editorDoc);
        }
      }
    }

    // Update tab pills active state using normalized key comparison
    tabPillsList.querySelectorAll('.s08-tab-pill').forEach(pill => {
      const pillKey = normalizeTabKey(pill.getAttribute('data-tab-name'));
      if (pillKey === tabKey) {
        pill.classList.remove('is-minimized');
        pill.classList.add('active');
        pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      } else {
        pill.classList.remove('active');
      }
    });

    // Update contextual action for this tab
    updateTabContextAction(tabKey);

    // Re-render layout so active stage tab immediately displays
    updateTabsLayout();

    // If highlight is true, activate the highlight border on this pane
    if (highlight) {
      const targetView = document.getElementById(getTabViewId(tabKey));
      if (targetView) {
        document.querySelectorAll('.s08-tab-view.is-active-pane').forEach(v => {
          if (v !== targetView) v.classList.remove('is-active-pane');
        });
        targetView.classList.add('is-active-pane');
      }
    }

    if (!isHydrating && typeof saveWorkspaceState === 'function') {
      saveWorkspaceState();
    }
  }

  function setActiveTab(tabKey) {
    focusTab(tabKey);
  }

  function closeTabPill(tabKey, pillEl) {
    const cleanKey = normalizeTabKey(tabKey);
    minimizedPanes.delete(cleanKey);

    const finishClose = (wasActive) => {
      const remainingPills = tabPillsList ? Array.from(tabPillsList.querySelectorAll('.s08-tab-pill:not(.is-exiting)')) : [];
      if (remainingPills.length > 0) {
        if (wasActive) {
          const nextKey = remainingPills[remainingPills.length - 1].getAttribute('data-tab-name');
          focusTab(nextKey);
        } else {
          updateTabsLayout();
          if (!isHydrating && typeof saveWorkspaceState === 'function') {
            saveWorkspaceState();
          }
        }
      } else {
        updateTabsLayout();
        currentActiveTab = null;
        if (!isHydrating && typeof saveWorkspaceState === 'function') {
          saveWorkspaceState();
        }
      }
    };

    let targetPill = pillEl;
    if (!targetPill && tabPillsList) {
      targetPill = tabPillsList.querySelector(`.s08-tab-pill[data-tab-name="${tabKey}"]`) ||
                   tabPillsList.querySelector(`.s08-tab-pill[data-tab-name="${cleanKey}"]`);
    }

    if (targetPill) {
      const wasActive = targetPill.classList.contains('active');
      targetPill.classList.add('is-exiting');
      setTimeout(() => {
        targetPill.remove();
        finishClose(wasActive);
      }, 140);
    } else {
      finishClose(currentActiveTab === cleanKey);
    }
  }

  // ==========================================================================
  // PHASE 11: WORKSPACE STATE PERSISTENCE & URL DEEP-LINKING
  // ==========================================================================
  const WORKSPACE_STORAGE_KEY = 'sutra_workspace_state_v1';

  function updateUrlQueryState() {
    try {
      const url = new URL(window.location.href);
      if (currentActiveTab) {
        url.searchParams.set('tab', currentActiveTab);
      } else {
        url.searchParams.delete('tab');
      }

      if (currentAgent && currentAgent !== 'Agent General') {
        url.searchParams.set('agent', currentAgent);
      } else {
        url.searchParams.delete('agent');
      }

      if (savedStageHeightRatio) {
        url.searchParams.set('split', (Math.round(savedStageHeightRatio * 100) / 100).toString());
      } else {
        url.searchParams.delete('split');
      }

      window.history.replaceState({}, '', url.toString());
    } catch (_) {}
  }

  saveWorkspaceState = function() {
    if (isHydrating) return;
    try {
      if (!tabPillsList) return;
      const pills = Array.from(tabPillsList.querySelectorAll('.s08-tab-pill'));
      const openTabs = pills.map(p => {
        const name = p.getAttribute('data-tab-name');
        const label = p.querySelector('.s08-tab-pill-label')?.textContent || name;
        return { name, label };
      });

      const state = {
        version: 1,
        activeAgent: currentAgent || 'Agent General',
        openTabs: openTabs,
        activeTab: currentActiveTab || null,
        stageHeightRatio: savedStageHeightRatio || null,
        activeDeliverable: currentArtifactDoc ? currentArtifactDoc.name : null,
        timestamp: Date.now()
      };

      localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(state));
      updateUrlQueryState();
    } catch (err) {
      console.warn('Workspace state persistence skipped:', err);
    }
  };

  hydrateWorkspaceState = function() {
    try {
      isHydrating = true;
      const urlParams = new URLSearchParams(window.location.search);
      const isBreakUiStress = urlParams.has('data') && urlParams.get('data') !== 'demo';

      // Check reset flag
      if (urlParams.get('reset') === 'true' || urlParams.get('clear') === 'true') {
        localStorage.removeItem(WORKSPACE_STORAGE_KEY);
        urlParams.delete('reset');
        urlParams.delete('clear');
        window.history.replaceState({}, '', window.location.pathname);
      }

      const paramAgent = urlParams.get('agent');
      const paramTab = urlParams.get('tab');
      const paramTabs = urlParams.get('tabs');
      const paramSplit = urlParams.get('split');
      const paramWs = urlParams.get('workspace') || urlParams.get('ws');
      const paramWa = urlParams.get('workarea') || urlParams.get('wa');

      // 1. Restore Agent from URL if specified
      if (paramAgent) {
        setAgent(paramAgent);
      }

      // 1b. Restore Workspace & Work Area from URL if specified
      if (paramWs) {
        setWorkspaceAndWorkArea(paramWs, paramWa || 'Design Engineering');
      }

      // 2. Restore Split Ratio from URL if specified
      if (paramSplit) {
        const parsedSplit = parseFloat(paramSplit);
        if (!isNaN(parsedSplit) && parsedSplit >= 0.2 && parsedSplit <= 0.85) {
          savedStageHeightRatio = parsedSplit;
        }
      }

      // If break-ui harness is injecting its own stress test state, let it handle layout
      if (isBreakUiStress) {
        isHydrating = false;
        return;
      }

      // 3. Deep-linked tabs in URL override localStorage
      if (paramTabs || paramTab) {
        const tabsToOpen = paramTabs ? paramTabs.split(',').map(t => t.trim()).filter(Boolean) : [];
        if (paramTab && !tabsToOpen.includes(paramTab)) {
          tabsToOpen.push(paramTab);
        }

        // When deep-linking to a deliverable or editor/browser, ensure the left anchor (sources/artifacts) is also open
        if (!tabsToOpen.includes('sources') && paramTab !== 'sources') {
          tabsToOpen.unshift('sources');
        }

        if (tabsToOpen.length > 0) {
          if (tabPillsList) tabPillsList.innerHTML = '';

          tabsToOpen.forEach(tabName => {
            const matchedArtifact = typeof artifactsData !== 'undefined' ? artifactsData.find(a => a.name === tabName || a.id === tabName) : null;
            if (matchedArtifact) {
              openOrSwitchTab(matchedArtifact.name, {
                label: matchedArtifact.name,
                viewId: 's08-view-editor'
              });
            } else {
              openOrSwitchTab(tabName);
            }
          });

          const targetActive = paramTab || tabsToOpen[tabsToOpen.length - 1];
          focusTab(targetActive);
          if (catalogueView) catalogueView.style.display = 'none';
          if (workspaceView) workspaceView.style.display = 'flex';
          if (dockCatalogueBtn) dockCatalogueBtn.classList.remove('active');
          if (dockWorkspaceBtn) dockWorkspaceBtn.classList.add('active');
          isHydrating = false;
          saveWorkspaceState();
          return;
        }
      }

      // 4. Hydrate from localStorage
      const rawStored = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (rawStored) {
        const state = JSON.parse(rawStored);
        if (state && typeof state === 'object' && Array.isArray(state.openTabs)) {
          if (state.activeAgent && !paramAgent) {
            setAgent(state.activeAgent);
          }

          if (state.stageHeightRatio && !paramSplit) {
            savedStageHeightRatio = state.stageHeightRatio;
          }

          if (state.openTabs.length > 0) {
            if (tabPillsList) tabPillsList.innerHTML = '';

            state.openTabs.forEach(t => {
              if (!t || !t.name) return;
              const matchedArtifact = typeof artifactsData !== 'undefined' ? artifactsData.find(a => a.name === t.name || a.id === t.name) : null;
              if (matchedArtifact) {
                openOrSwitchTab(matchedArtifact.name, {
                  label: t.label || matchedArtifact.name,
                  viewId: 's08-view-editor'
                });
              } else {
                openOrSwitchTab(t.name, {
                  label: t.label || tabDefinitions[t.name]?.label || t.name,
                  viewId: tabDefinitions[t.name]?.viewId || `s08-view-${t.name}`
                });
              }
            });

            const activeToFocus = state.activeTab || state.openTabs[0].name;
            if (activeToFocus) {
              focusTab(activeToFocus);
            }

            if (state.activeDeliverable && typeof artifactsData !== 'undefined') {
              const doc = artifactsData.find(a => a.name === state.activeDeliverable);
              if (doc && typeof renderArtifactContentIntoStage === 'function') {
                renderArtifactContentIntoStage(doc);
              }
            }

            if (catalogueView) catalogueView.style.display = 'none';
            if (workspaceView) workspaceView.style.display = 'flex';
            if (dockCatalogueBtn) dockCatalogueBtn.classList.remove('active');
            if (dockWorkspaceBtn) dockWorkspaceBtn.classList.add('active');
          }
        }
      }
    } catch (err) {
      console.warn('Workspace state hydration error, falling back to defaults:', err);
    } finally {
      isHydrating = false;
    }
  };

  // Delegated click & close handlers on tabPillsList container (guarantees single listener & clean toggle)
  if (tabPillsList) {
    tabPillsList.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('.s08-tab-close-icon');
      const pill = e.target.closest('.s08-tab-pill');
      if (!pill) return;
      const tabKey = pill.getAttribute('data-tab-name');
      if (!tabKey) return;

      if (closeBtn) {
        e.preventDefault();
        e.stopPropagation();
        if (normalizeTabKey(tabKey) === 'sources') sourcesAutoClosedBySidebar = false;
        closeTabPill(tabKey, pill);
        return;
      }

      const cleanKey = normalizeTabKey(tabKey);
      const isCurrentTab = (currentActiveTab && normalizeTabKey(currentActiveTab) === cleanKey) || pill.classList.contains('active');
      const targetViewId = getTabViewId(cleanKey);
      const targetView = document.getElementById(targetViewId);
      const hasBorder = targetView && targetView.classList.contains('is-active-pane');

      if (isCurrentTab) {
        // Toggle the highlight border on the active tab
        if (hasBorder) {
          if (targetView) targetView.classList.remove('is-active-pane');
        } else {
          if (targetView) targetView.classList.add('is-active-pane');
        }
      } else {
        focusTab(tabKey, true);
        if (targetView) targetView.classList.add('is-active-pane');
      }
    });
  }

  // Global Workspace Tab Keyboard Shortcuts: ⌘1..⌘9 to switch tabs, ⌘W to close active tab
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        const pills = Array.from(tabPillsList ? tabPillsList.querySelectorAll('.s08-tab-pill') : []);
        if (pills[num - 1]) {
          e.preventDefault();
          const targetKey = pills[num - 1].getAttribute('data-tab-name');
          if (targetKey) focusTab(targetKey, true);
        }
      } else if (e.key.toLowerCase() === 'w' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        if (currentActiveTab && tabPillsList) {
          const activePill = tabPillsList.querySelector(`.s08-tab-pill[data-tab-name="${currentActiveTab}"]`);
          if (activePill) {
            e.preventDefault();
            closeTabPill(currentActiveTab, activePill);
          }
        }
      }
    }
  });

  // Wire Pane Body Selection & Dismiss Highlight Border on Interaction
  const sourcesBodyView = document.getElementById('s08-view-sources');
  const browserBodyView = document.getElementById('s08-view-browser');
  const editorBodyView = document.getElementById('s08-view-editor');
  const logsBodyView = document.getElementById('s08-view-log-viewer');

  const handlePanePointerDown = (tabKey, viewEl, e) => {
    if (e.target.closest('.s08-tab-close-icon') || e.target.closest('.s08-browser-close-btn') || e.target.closest('.s08-stage-close-btn') || e.target.closest('.s08-logs-close-btn') || e.target.closest('.s08-logs-clear-btn')) return;
    
    const cleanKey = normalizeTabKey(tabKey);
    const isCurrentActive = (currentActiveTab === cleanKey);
    const hasHighlightBorder = viewEl.classList.contains('is-active-pane');

    if (isCurrentActive) {
      // User is working inside the active section: clicking inside removes the highlight border!
      if (hasHighlightBorder) {
        viewEl.classList.remove('is-active-pane');
      }
    } else {
      // If switching to this pane from another pane, focus it and highlight it
      syncActiveTabSelection(cleanKey, viewEl);
      viewEl.classList.add('is-active-pane');
      e._justActivatedPane = true;
    }
  };

  if (sourcesBodyView) {
    sourcesBodyView.addEventListener('pointerdown', (e) => handlePanePointerDown('sources', sourcesBodyView, e));
  }
  if (browserBodyView) {
    browserBodyView.addEventListener('pointerdown', (e) => handlePanePointerDown('browser', browserBodyView, e));
  }
  if (editorBodyView) {
    editorBodyView.addEventListener('pointerdown', (e) => {
      const editorPill = tabPillsList ? (tabPillsList.querySelector('.s08-tab-pill[data-tab-name]:not([data-tab-name="browser"]):not([data-tab-name="sources"]):not([data-tab-name="log viewer"]):not([data-tab-name="logs"])') || tabPillsList.querySelector('.s08-tab-pill[data-tab-name="editor"]')) : null;
      const targetKey = editorPill ? editorPill.getAttribute('data-tab-name') : (currentArtifactDoc ? currentArtifactDoc.name : 'editor');
      handlePanePointerDown(targetKey, editorBodyView, e);
    });
  }
  if (logsBodyView) {
    logsBodyView.addEventListener('pointerdown', (e) => handlePanePointerDown('log viewer', logsBodyView, e));
  }

  // Universal Screen-Wide Dismissal of Tab Pane Highlight Border (Inside & Outside)
  // Per client feedback: Highlight border must toggle off on interaction anywhere on screen (inside or outside the section)
  document.addEventListener('pointerdown', (e) => {
    // 1. Skip if this event was an activation click on an inactive pane
    if (e._justActivatedPane) return;

    // 2. Exclude clicking on tab pills or tab menu items (which manage tab switching / border toggle)
    if (e.target.closest('.s08-tab-pill') || e.target.closest('.s08-add-tab-wrap') || 
        e.target.closest('.s08-tab-overflow-wrap') || e.target.closest('.s08-tab-menu-item')) return;

    // 3. If clicking anywhere outside the tab panes (conversation section, input box, canvas background, header, etc.)
    const insideTabView = e.target.closest('.s08-tab-view');
    if (!insideTabView) {
      document.querySelectorAll('.s08-tab-view.is-active-pane').forEach(view => {
        view.classList.remove('is-active-pane');
      });
    } else {
      // Clicking inside an already highlighted active pane: working in it dismisses the border
      if (insideTabView.classList.contains('is-active-pane')) {
        insideTabView.classList.remove('is-active-pane');
      }
    }
  });

  // Explicitly clear highlight border when focusing or interacting with conversation chat input
  const s08ChatTextarea = document.getElementById('s08-chat-textarea');
  const s08ChatInputBox = document.getElementById('s08-chat-input-box');
  if (s08ChatTextarea) {
    s08ChatTextarea.addEventListener('focus', () => {
      document.querySelectorAll('.s08-tab-view.is-active-pane').forEach(view => view.classList.remove('is-active-pane'));
    });
  }
  if (s08ChatInputBox) {
    s08ChatInputBox.addEventListener('pointerdown', () => {
      document.querySelectorAll('.s08-tab-view.is-active-pane').forEach(view => view.classList.remove('is-active-pane'));
    });
  }

  // Wire Log Viewer in-header Clear Button (Annotation 3)
  const logsClearBtn = document.getElementById('s08-logs-clear-btn');
  if (logsClearBtn) {
    logsClearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const logContent = document.querySelector('.s08-logs-content');
      if (logContent) {
        logContent.innerHTML = '<div class="s08-log-row info"><span class="log-t">[00:00:00]</span> <span class="log-tag">RESET</span> Log stream cleared by user.</div>';
      }
    });
  }

  // Wire Log Viewer in-header Close Button: closes log viewer tab
  const logsCloseBtn = document.getElementById('s08-logs-close-btn');
  if (logsCloseBtn) {
    logsCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const logsPill = tabPillsList ? (tabPillsList.querySelector('.s08-tab-pill[data-tab-name="log viewer"]') || tabPillsList.querySelector('.s08-tab-pill[data-tab-name="logs"]')) : null;
      closeTabPill('log viewer', logsPill);
    });
  }

  // Wire empty state "Reopen" button in no-tabs placeholder
  const emptyReopenTabBtn = document.getElementById('s08-empty-reopen-tab-btn');
  if (emptyReopenTabBtn) {
    emptyReopenTabBtn.addEventListener('click', () => {
      openOrSwitchTab('sources');
    });
  }

  // Wire empty state "Select Scope" button
  const emptySelectScopeBtn = document.getElementById('s08-empty-select-scope-btn');
  if (emptySelectScopeBtn && scopeBtn) {
    emptySelectScopeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      scopeBtn.click();
      scopeBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // --------------------------------------------------------------------------
  // Interactive Browser Tab Controller (Search & URL Navigation)
  // --------------------------------------------------------------------------
  const browserUrlInput = document.getElementById('s08-browser-url-input');
  const browserReloadBtn = document.getElementById('s08-browser-reload-btn');
  const browserBackBtn = document.getElementById('s08-browser-back-btn');
  const browserForwardBtn = document.getElementById('s08-browser-forward-btn');

  let browserHistory = ['http://localhost:3000/app/preview'];
  let browserHistoryIndex = 0;

  function renderJiraTicketView(targetUrl, ticketKey = 'EPIC-104') {
    if (!browserCanvasWrap) return;
    browserCanvasWrap.classList.add('has-full-app');

    // Extract key if present in targetUrl
    const match = targetUrl.match(/(EPIC-\d+|FEAT-\d+|STORY-\d+)/i);
    const key = match ? match[1].toUpperCase() : ticketKey;

    browserCanvasWrap.innerHTML = `
      <div class="s08-jira-app" id="s08-jira-app">
        <!-- Jira Application Top Bar -->
        <div class="s08-jira-topbar">
          <div class="s08-jira-topbar-left">
            <div class="s08-jira-brand">
              <span class="s08-jira-brand-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                  <polyline points="2 17 12 22 22 17"/>
                  <polyline points="2 12 12 17 22 12"/>
                </svg>
              </span>
              <span>Jira</span>
            </div>
            <div class="s08-jira-ws-pill">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
              <span>Acme Inc / Design Engineering</span>
            </div>
          </div>
          <div class="s08-jira-topbar-right">
            <div class="s08-jira-search-mini">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span>Search Jira issues...</span>
            </div>
            <span class="s08-jira-live-badge">
              <span class="s08-jira-live-badge-dot"></span>
              <span>Cloud Live</span>
            </span>
            <div class="s08-jira-avatar-mini" title="Sarah Jenkins (Lead Business Analyst)">SJ</div>
          </div>
        </div>

        <!-- Jira Sync Ribbon (Linking back to Sutra IDE) -->
        <div class="s08-jira-sync-ribbon">
          <div class="s08-jira-sync-info">
            <span class="s08-jira-sync-dot"></span>
            <span>Synchronized with Sutra Agentic IDE • Entity ID: <strong>IN-104</strong> • Payload commit: <code>#8f2a104</code></span>
          </div>
          <button class="s08-jira-back-btn" id="s08-jira-return-editor" type="button" title="Switch back to Sutra Markdown Editor">
            <span>View Spec in Sutra Editor</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </button>
        </div>

        <!-- Scrollable Main Issue Body -->
        <div class="s08-jira-scroll-body">
          <!-- Breadcrumbs -->
          <div class="s08-jira-breadcrumbs">
            <span>Acme Inc</span> <span class="sep">/</span>
            <span>Design Engineering</span> <span class="sep">/</span>
            <span>Epics</span> <span class="sep">/</span>
            <span class="current">${escapeHTML(key)}</span>
          </div>

          <!-- Issue Header -->
          <div class="s08-jira-issue-header">
            <div class="s08-jira-issue-title-group">
              <div class="s08-jira-key-badge">
                <span class="s08-jira-type-icon epic" title="Epic Issue Type">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 4h16v16l-8-4-8 4V4z"/>
                  </svg>
                </span>
                <span>${escapeHTML(key)}</span>
              </div>
              <h2 class="s08-jira-title-text">Universal Application Login</h2>
            </div>
            <div class="s08-jira-actions-bar">
              <button class="s08-jira-status-dropdown" id="s08-jira-status-toggle" type="button" title="Click to cycle workflow status">
                <span id="s08-jira-status-label">Defined</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <button class="s08-jira-btn" type="button" id="s08-jira-edit-btn">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span>Edit</span>
              </button>
              <button class="s08-jira-btn" type="button" id="s08-jira-comment-btn">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span>Comment</span>
              </button>
              <button class="s08-jira-btn" type="button">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                <span>Link Issue</span>
              </button>
            </div>
          </div>

          <!-- Two-Column Grid (70% Main / 30% Details Sidebar) -->
          <div class="s08-jira-grid">
            <!-- Left Column: Description, Child Work Items, Activity -->
            <div class="s08-jira-left">
              <!-- Description Section -->
              <div class="s08-jira-section">
                <div class="s08-jira-section-header">Description</div>
                <div class="s08-jira-desc-box">
                  <p><strong>Business Objective:</strong> Implement a robust, unified single sign-on (SSO) and authentication framework across web and mobile platforms for Acme Inc enterprise customers, eliminating siloed credential stores while enforcing zero-trust access control.</p>
                  <p><strong>Core Capabilities:</strong></p>
                  <ul>
                    <li>Multi-Factor Authentication (TOTP via Authenticator Apps and SMS OTP fallback)</li>
                    <li>Federated SSO Integration (Google Workspace, Microsoft Entra ID / Azure AD, Apple ID)</li>
                    <li>Self-service credential recovery and password reset workflow</li>
                    <li>Comprehensive security audit logging and brute-force account lockout protection</li>
                  </ul>
                  <div class="s08-jira-code-spec">Feature: Universal Application Login
  As an enterprise user
  I want a unified, secure login experience
  So that I can access my workspace tools with zero-trust protection

  Scenario: Successful TOTP Multi-Factor Authentication
    Given the user navigates to the login screen
    When they enter valid primary credentials
    Then the system requests a 6-digit TOTP code
    And validates the code within a 30-second skew tolerance window</div>
                </div>
              </div>

              <!-- Child Features Hierarchy Table -->
              <div class="s08-jira-section">
                <div class="s08-jira-section-header">
                  <span>Child Features (4)</span>
                  <button class="s08-jira-btn" type="button" style="height: 24px; font-size: 11px;">+ Add Feature</button>
                </div>
                <div class="s08-jira-table-wrap">
                  <div class="s08-jira-table-progress">
                    <span>Hierarchy Progress: <strong>1 of 4 completed (25%)</strong></span>
                    <div class="s08-jira-progress-bar">
                      <div class="s08-jira-progress-fill" style="width: 25%;"></div>
                    </div>
                  </div>
                  <table class="s08-jira-table">
                    <thead>
                      <tr>
                        <th>Key</th>
                        <th>Summary</th>
                        <th>Status</th>
                        <th>Points</th>
                        <th>Assignee</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <span class="s08-jira-feat-key">
                            <span class="s08-jira-type-icon feature" title="Feature">
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12h6"/></svg>
                            </span>
                            <span>FEAT-201</span>
                          </span>
                        </td>
                        <td>Multi-Factor Authentication (TOTP / SMS)</td>
                        <td><span class="s08-jira-status-pill defined">Defined</span></td>
                        <td>8 pts</td>
                        <td>Sarah Jenkins</td>
                      </tr>
                      <tr>
                        <td>
                          <span class="s08-jira-feat-key">
                            <span class="s08-jira-type-icon feature" title="Feature">
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12h6"/></svg>
                            </span>
                            <span>FEAT-202</span>
                          </span>
                        </td>
                        <td>OAuth2 Social & Enterprise SSO Providers</td>
                        <td><span class="s08-jira-status-pill planned">Planned</span></td>
                        <td>5 pts</td>
                        <td>Alex Wong</td>
                      </tr>
                      <tr>
                        <td>
                          <span class="s08-jira-feat-key">
                            <span class="s08-jira-type-icon feature" title="Feature">
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12h6"/></svg>
                            </span>
                            <span>FEAT-203</span>
                          </span>
                        </td>
                        <td>Self-Service Password Reset & Recovery</td>
                        <td><span class="s08-jira-status-pill planned">Planned</span></td>
                        <td>5 pts</td>
                        <td>Marcus Brody</td>
                      </tr>
                      <tr>
                        <td>
                          <span class="s08-jira-feat-key">
                            <span class="s08-jira-type-icon feature" title="Feature">
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12h6"/></svg>
                            </span>
                            <span>FEAT-204</span>
                          </span>
                        </td>
                        <td>Audit Logging & Failed Login Lockout</td>
                        <td><span class="s08-jira-status-pill done">Done</span></td>
                        <td>3 pts</td>
                        <td>Elena Rostova</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Activity & Audit Stream -->
              <div class="s08-jira-section">
                <div class="s08-jira-section-header">Activity</div>
                <div class="s08-jira-activity-tabs">
                  <button class="s08-jira-activity-tab active" type="button" data-act="all">All</button>
                  <button class="s08-jira-activity-tab" type="button" data-act="comments">Comments (0)</button>
                  <button class="s08-jira-activity-tab" type="button" data-act="history">History (2)</button>
                  <button class="s08-jira-activity-tab" type="button" data-act="worklog">Work Log</button>
                </div>
                <div class="s08-jira-audit-entry">
                  <div class="s08-jira-audit-avatar" title="Sutra BA Agent Automation">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="10" rx="2"/>
                      <circle cx="12" cy="5" r="2"/>
                      <path d="M12 7v4"/>
                      <line x1="8" y1="16" x2="8" y2="16"/>
                      <line x1="16" y1="16" x2="16" y2="16"/>
                    </svg>
                  </div>
                  <div class="s08-jira-audit-content">
                    <div class="s08-jira-audit-header">
                      <span class="s08-jira-audit-author">Sutra Business Analysis Agent</span>
                      <span class="s08-jira-audit-time">Just now via REST API v2</span>
                    </div>
                    <div class="s08-jira-audit-body">
                      Created Epic <strong>${escapeHTML(key)}</strong> from approved deliverable specification <code>EPIC_Universal_Login_Draft.md</code> (+68 lines committed).
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column: Agile Attributes Sidebar -->
            <div class="s08-jira-sidebar">
              <div class="s08-jira-sidecard">
                <div class="s08-jira-sidecard-title">Details</div>
                <div class="s08-jira-meta-row">
                  <span class="s08-jira-meta-label">Status</span>
                  <span class="s08-jira-meta-val"><span class="s08-jira-status-pill defined" id="s08-jira-side-status">Defined</span></span>
                </div>
                <div class="s08-jira-meta-row">
                  <span class="s08-jira-meta-label">Priority</span>
                  <span class="s08-jira-meta-val s08-jira-priority-high">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                    <span>High</span>
                  </span>
                </div>
                <div class="s08-jira-meta-row">
                  <span class="s08-jira-meta-label">Story Points</span>
                  <span class="s08-jira-meta-val">21 pts</span>
                </div>
                <div class="s08-jira-meta-row">
                  <span class="s08-jira-meta-label">Target Release</span>
                  <span class="s08-jira-meta-val">Q4 2026 Core</span>
                </div>
                <div class="s08-jira-meta-row">
                  <span class="s08-jira-meta-label">Sprint / PI</span>
                  <span class="s08-jira-meta-val">PI-4 Sprint 2</span>
                </div>
                <div class="s08-jira-meta-row">
                  <span class="s08-jira-meta-label">Resolution</span>
                  <span class="s08-jira-meta-val" style="color:var(--color-vendor-jira-text-muted, #6B778C);">Unresolved</span>
                </div>
              </div>

              <div class="s08-jira-sidecard">
                <div class="s08-jira-sidecard-title">People</div>
                <div class="s08-jira-meta-row">
                  <span class="s08-jira-meta-label">Assignee</span>
                  <span class="s08-jira-meta-val">
                    <span class="s08-jira-avatar-mini" style="width:18px; height:18px; font-size:9px;">SJ</span>
                    <span>Sarah Jenkins</span>
                  </span>
                </div>
                <div class="s08-jira-meta-row">
                  <span class="s08-jira-meta-label">Reporter</span>
                  <span class="s08-jira-meta-val">
                    <span class="s08-jira-avatar-mini" style="width:18px; height:18px; background:var(--color-vendor-jira-text-muted, #6B778C);" title="Automation">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="10" rx="2"/>
                        <circle cx="12" cy="5" r="2"/>
                        <path d="M12 7v4"/>
                      </svg>
                    </span>
                    <span>Sutra AI Assistant</span>
                  </span>
                </div>
              </div>

              <div class="s08-jira-sidecard">
                <div class="s08-jira-sidecard-title">Agile Context</div>
                <div class="s08-jira-meta-row">
                  <span class="s08-jira-meta-label">Workspace</span>
                  <span class="s08-jira-meta-val">Acme Inc</span>
                </div>
                <div class="s08-jira-meta-row">
                  <span class="s08-jira-meta-label">Work Area</span>
                  <span class="s08-jira-meta-val">Design Engineering</span>
                </div>
                <div class="s08-jira-meta-row">
                  <span class="s08-jira-meta-label">Entity ID</span>
                  <span class="s08-jira-meta-val"><code>IN-104</code></span>
                </div>
                <div class="s08-jira-meta-row">
                  <span class="s08-jira-meta-label">Synced via</span>
                  <span class="s08-jira-meta-val">Sutra Agentic IDE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Wire return to editor button
    const returnEditorBtn = document.getElementById('s08-jira-return-editor');
    if (returnEditorBtn) {
      returnEditorBtn.addEventListener('click', () => {
        openOrSwitchTab('editor');
        appendLogMessage(`Switched from Jira ${key} preview to Sutra Editor spec`, 'INFO');
      });
    }

    // Wire interactive status cycler
    const statusToggleBtn = document.getElementById('s08-jira-status-toggle');
    const statusLabel = document.getElementById('s08-jira-status-label');
    const sideStatus = document.getElementById('s08-jira-side-status');
    const workflowStages = ['Defined', 'In Progress', 'In Review', 'Done'];
    let currentStageIndex = 0;

    if (statusToggleBtn && statusLabel) {
      statusToggleBtn.addEventListener('click', () => {
        currentStageIndex = (currentStageIndex + 1) % workflowStages.length;
        const nextStage = workflowStages[currentStageIndex];
        statusLabel.textContent = nextStage;
        if (sideStatus) {
          sideStatus.textContent = nextStage;
          sideStatus.className = `s08-jira-status-pill ${nextStage.toLowerCase().replace(' ', '-')}`;
        }
        appendLogMessage(`Jira: Workflow status transitioned to "${nextStage}" for ${key}`, 'OK');
      });
    }

    // Wire activity tabs
    const actTabs = browserCanvasWrap.querySelectorAll('.s08-jira-activity-tab');
    actTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        actTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });
  }

  function renderConnectedBrowserPreview(targetUrl) {
    if (!browserCanvasWrap) return;

    // Check if targetUrl is a Jira or Jira issue ticket
    const isJira = targetUrl.toLowerCase().includes('jira') || 
                   targetUrl.includes('EPIC-') || 
                   targetUrl.toLowerCase().includes('jira');

    if (isJira) {
      renderJiraTicketView(targetUrl);
      return;
    }

    browserCanvasWrap.classList.remove('has-full-app');
    browserCanvasWrap.innerHTML = `
      <div class="s08-browser-loaded-view s08-browser-app-frame">
        <div class="s08-app-preview-header">
          <div class="s08-app-preview-status">
            <span class="s08-status-dot-pulse"></span>
            <span class="s08-app-preview-url">${escapeHTML(targetUrl)}</span>
          </div>
          <span class="s08-board-status-pill">Active Preview</span>
        </div>
        <div class="s08-app-preview-body">
          <div class="s08-app-preview-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" x2="22" y1="12" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <h4 class="s08-canvas-heading" style="margin: 0;">Connected to Web Application</h4>
          <p class="s08-canvas-text" style="max-width: 400px; margin: 0;">
            Live session connected to <code>${escapeHTML(targetUrl)}</code>. Interactive web elements and live port updates stream here.
          </p>
          <div class="s08-app-preview-actions">
            <button class="s08-canvas-search-btn" id="s08-frame-reload-btn" type="button">Reload App</button>
            <button class="s08-canvas-chip" id="s08-frame-new-search-btn" type="button">New Search / URL</button>
          </div>
        </div>
      </div>
    `;

    const frameReloadBtn = document.getElementById('s08-frame-reload-btn');
    if (frameReloadBtn) frameReloadBtn.addEventListener('click', () => navigateBrowser(targetUrl, false));
    const frameNewSearchBtn = document.getElementById('s08-frame-new-search-btn');
    if (frameNewSearchBtn) frameNewSearchBtn.addEventListener('click', resetBrowserToBlank);
  }

  function resetBrowserToBlank() {
    if (!browserCanvasWrap) return;
    browserCanvasWrap.classList.remove('has-full-app');
    browserCanvasWrap.innerHTML = `
      <div class="s08-browser-blank-canvas" id="s08-browser-blank-canvas">
        <div class="s08-canvas-art-box">
          <div class="s08-canvas-icon-badge">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" x2="22" y1="12" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <h4 class="s08-canvas-heading">Web Browser & Application Preview</h4>
          <p class="s08-canvas-text">Search for any web application or enter a URL above to inspect live pages, test local dev servers (e.g. localhost:3000), or preview agent-built web apps.</p>

          <div class="s08-canvas-search-box">
            <svg class="s08-canvas-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" class="s08-canvas-search-input" id="s08-canvas-search-input" placeholder="Search application or enter URL..." aria-label="Search or enter URL" spellcheck="false" />
            <button class="s08-canvas-search-btn" id="s08-canvas-search-btn" type="button">Open</button>
          </div>

          <div class="s08-canvas-quick-chips">
            <span class="s08-chips-label">Quick launch:</span>
            <button class="s08-canvas-chip" type="button" data-url="https://jira.enterprise.internal/epics/EPIC-104" title="Open Jira Epic EPIC-104">
              <span class="chip-status-dot" style="background-color: var(--color-vendor-jira-blue, #0052CC);"></span>
              <span>Jira: EPIC-104</span>
            </button>
            <button class="s08-canvas-chip" type="button" data-url="http://localhost:3000">
              <span class="chip-status-dot"></span>
              <span>localhost:3000</span>
            </button>
            <button class="s08-canvas-chip" type="button" data-url="http://localhost:5173">
              <span class="chip-status-dot"></span>
              <span>localhost:5173</span>
            </button>
            <button class="s08-canvas-chip" type="button" data-url="https://docs.github.com">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
              <span>Docs</span>
            </button>
          </div>
        </div>
      </div>
    `;
    wireBlankCanvasListeners();
  }

  function navigateBrowser(rawQuery, pushHistory = true) {
    if (!rawQuery || !rawQuery.trim()) return;
    let url = rawQuery.trim();
    if (!/^https?:\/\//i.test(url) && !url.startsWith('about:')) {
      if (url.startsWith('localhost') || url.startsWith('127.0.0.1')) {
        url = 'http://' + url;
      } else if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(url)) {
        url = 'https://' + url;
      } else {
        url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      }
    }

    const topInput = document.getElementById('s08-browser-url-input');
    if (topInput) topInput.value = url;

    if (pushHistory) {
      browserHistory.push(url);
      browserHistoryIndex = browserHistory.length - 1;
    }

    renderConnectedBrowserPreview(url);
    focusTab('browser');
    appendLogMessage(`Browser: Loaded ${url}`, 'OK');
  }

  function wireBlankCanvasListeners() {
    const sInput = document.getElementById('s08-canvas-search-input');
    const sBtn = document.getElementById('s08-canvas-search-btn');
    if (sInput) {
      sInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          navigateBrowser(sInput.value);
        }
      });
    }
    if (sBtn && sInput) {
      sBtn.addEventListener('click', () => {
        navigateBrowser(sInput.value);
      });
    }
    document.querySelectorAll('.s08-canvas-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const url = chip.getAttribute('data-url');
        if (url) navigateBrowser(url);
      });
    });
  }

  wireBlankCanvasListeners();

  if (browserUrlInput) {
    browserUrlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        navigateBrowser(browserUrlInput.value);
      }
    });
  }

  if (browserReloadBtn) {
    browserReloadBtn.addEventListener('click', () => {
      const topInput = document.getElementById('s08-browser-url-input');
      const cur = topInput ? topInput.value : 'http://localhost:3000/app/preview';
      navigateBrowser(cur, false);
    });
  }

  if (browserBackBtn) {
    browserBackBtn.addEventListener('click', () => {
      if (browserHistoryIndex > 0) {
        browserHistoryIndex--;
        navigateBrowser(browserHistory[browserHistoryIndex], false);
      }
    });
  }

  if (browserForwardBtn) {
    browserForwardBtn.addEventListener('click', () => {
      if (browserHistoryIndex < browserHistory.length - 1) {
        browserHistoryIndex++;
        navigateBrowser(browserHistory[browserHistoryIndex], false);
      }
    });
  }

  // Global Interceptor: Clicks on Jira links (e.g. [EPIC-104 ↗]) open directly inside Sutra UI Browser Tab
  document.addEventListener('click', (e) => {
    const jiraLink = e.target.closest('.s08-jira-link, a[href*="jira"], [data-jira-key]');
    if (jiraLink) {
      e.preventDefault();
      e.stopPropagation();
      const key = jiraLink.getAttribute('data-jira-key') || 'EPIC-104';
      const targetUrl = jiraLink.getAttribute('href') || `https://jira.enterprise.internal/epics/${key}`;
      openOrSwitchTab('browser');
      navigateBrowser(targetUrl);
      appendLogMessage(`Navigated to Jira ticket ${key} inside embedded Browser Tab`, 'OK');
    }
  });

  // Initialize multi-pane simultaneous layout & active focus
  updateTabsLayout();
  focusTab('sources');
  updateAgentTabTitles(currentAgent || 'Agent General');
  updateSourcesViewEmptyState();

  // Window resize handler: update tabs layout (fallback to single active tab if space is < 920px)
  let windowResizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(windowResizeTimer);
    windowResizeTimer = setTimeout(() => {
      if (window.innerWidth < 680 && s08InsetBody && !s08InsetBody.classList.contains('tabs-collapsed')) {
        s08InsetBody.classList.add('tabs-collapsed');
        s08InsetBody.style.gridTemplateColumns = '';
        if (s08RightSidebarTrigger) {
          s08RightSidebarTrigger.style.display = 'inline-flex';
          s08RightSidebarTrigger.setAttribute('title', 'Re-open Side Tabs Panel [|]');
        }
      }
      if (typeof updateTabsLayout === 'function') {
        updateTabsLayout();
      }
    }, 60);
  });

  // ==========================================================================
  // SHADCN / SUTRA FILE TREE COMPONENT CONTROLLER (Annotation 6)
  // Folders are Collapsibles, Files are Buttons with onSelect callback
  // ==========================================================================
  const sourcesTreeContainer = document.getElementById('s08-sources-tree');
  const treeToggleAllBtn = document.getElementById('s08-tree-toggle-all');

  const fileSnippets = {
    'src/app.tsx': {
      filename: 'src/app.tsx',
      badge: 'TSX',
      code: `import React, { useState } from 'react';\nimport { FileTree } from './components/file-tree';\nimport tokens from './tokens/colors.json';\n\nexport default function App() {\n  const [selectedFile, setSelectedFile] = useState('src/app.tsx');\n\n  return (\n    <div className="sutra-app-shell">\n      <header className="app-header">\n        <h1>Sutra Agentic Platform</h1>\n      </header>\n      <main className="app-workspace">\n        <FileTree onSelect={(path) => setSelectedFile(path)} />\n      </main>\n    </div>\n  );\n}`
    },
    'src/forecast.ts': {
      filename: 'src/forecast.ts',
      badge: 'TS',
      code: `export interface ForecastMetric {\n  date: string;\n  disbursedAmount: number;\n  projectedVolume: number;\n  anomalyScore: number;\n}\n\nexport function calculateEWMA(data: number[], alpha: number = 0.25): number[] {\n  const results: number[] = [];\n  let s = data[0] || 0;\n  for (const x of data) {\n    s = alpha * x + (1 - alpha) * s;\n    results.push(Math.round(s * 100) / 100);\n  }\n  return results;\n}`
    },
    'src/tokens/colors.json': {
      filename: 'src/tokens/colors.json',
      badge: 'JSON',
      code: `{\n  "brand": {\n    "primary": "#006EF5",\n    "hover": "#005BD4",\n    "glow": "rgba(0, 110, 245, 0.25)"\n  },\n  "surface": {\n    "canvas": "#FCFCFD",\n    "subtle": "#F8FAFC",\n    "card": "#FFFFFF"\n  },\n  "status": {\n    "success": "#047857",\n    "warning": "#B45309",\n    "error": "#DC2626"\n  }\n}`
    },
    'src/tokens/typography.json': {
      filename: 'src/tokens/typography.json',
      badge: 'JSON',
      code: `{\n  "fontFamily": {\n    "sans": ["Open Sans", "-apple-system", "sans-serif"],\n    "mono": ["JetBrains Mono", "monospace"]\n  },\n  "scale": {\n    "xs": "12px",\n    "sm": "13px",\n    "base": "14px",\n    "md": "16px",\n    "lg": "20px"\n  }\n}`
    },
    'src/components/file-tree.tsx': {
      filename: 'src/components/file-tree.tsx',
      badge: 'TSX',
      code: `import React from 'react';\nimport { ChevronRight, Folder, FileCode } from 'lucide-react';\nimport { Button } from '@/components/ui/button';\nimport { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';\n\nexport function FileTreeNode({ node, onSelect }: { node: any; onSelect: (path: string) => void }) {\n  if (node.type === 'folder') {\n    return (\n      <Collapsible defaultOpen>\n        <CollapsibleTrigger render={<Button variant="ghost" size="sm" className="w-full justify-start" />}>\n          <ChevronRight className="transition-transform group-data-panel-open/button:rotate-90" />\n          <Folder className="text-muted-foreground" />\n          {node.name}\n        </CollapsibleTrigger>\n        <CollapsibleContent>\n          <div className="ml-4 flex flex-col border-l pl-2">\n            {node.children.map((child: any) => (\n              <FileTreeNode key={child.path} node={child} onSelect={onSelect} />\n            ))}\n          </div>\n        </CollapsibleContent>\n      </Collapsible>\n    );\n  }\n  return (\n    <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => onSelect(node.path)}>\n      <FileCode className="text-muted-foreground" />\n      {node.name}\n    </Button>\n  );\n}`
    },
    'package.json': {
      filename: 'package.json',
      badge: 'JSON',
      code: `{\n  "name": "sutra-web-platform",\n  "version": "2.4.0",\n  "private": true,\n  "dependencies": {\n    "@radix-ui/react-collapsible": "^1.1.0",\n    "lucide-react": "^0.453.0",\n    "react": "^18.3.1",\n    "react-dom": "^18.3.1"\n  }\n}`
    },
    'README.md': {
      filename: 'README.md',
      badge: 'MARKDOWN',
      code: `# Sutra AI Platform Workspace\nTarget Workspace: \`web-platform\`\nEnvironment: \`Cloud Sandbox (Node.js 20)\`\n\n## Changed Files\n- \`src/app.tsx\` - Added FileTree component mount\n- \`src/forecast.ts\` - EWMA calculations & anomaly baseline\n- \`src/tokens/colors.json\` - Design system token definitions\n- \`src/components/file-tree.tsx\` - Shadcn Collapsible file tree`
    }
  };

  function updateEditorWithFile(path) {
    const fileData = fileSnippets[path];
    if (!fileData) return;

    if (path.endsWith('.md')) {
      openArtifactInStage({
        id: 'file-' + path.replace(/[^a-zA-Z0-9]/g, '-'),
        name: fileData.filename,
        size: '1.2 KB',
        type: 'uploaded',
        ext: 'md',
        badge: 'MARKDOWN',
        author: 'Workspace File',
        desc: 'Documentation spec'
      });
      return;
    }

    // Default code view
    const mdView = document.getElementById('s08-stage-markdown-view');
    const diffView = document.getElementById('s08-stage-diff-view');
    const diagramView = document.getElementById('s08-stage-diagram-view');
    const codeView = document.getElementById('s08-stage-code-view');
    const viewToggles = document.getElementById('s08-stage-view-toggles');
    const zoomControls = document.getElementById('s08-stage-zoom-controls');

    if (mdView) mdView.style.display = 'none';
    if (diffView) diffView.style.display = 'none';
    if (diagramView) diagramView.style.display = 'none';
    if (codeView) codeView.style.display = 'block';
    if (viewToggles) viewToggles.style.display = 'none';
    if (zoomControls) zoomControls.style.display = 'none';

    const editorFilename = document.getElementById('s08-stage-filename');
    const editorBadge = document.getElementById('s08-stage-badge');
    const editorCode = document.getElementById('s08-stage-code-text');
    const editorSubmeta = document.getElementById('s08-stage-submeta');
    const iconEl = document.getElementById('s08-stage-file-icon');

    if (editorFilename) editorFilename.textContent = fileData.filename;
    if (editorBadge) {
      editorBadge.textContent = fileData.badge;
      editorBadge.className = 's08-editor-badge';
    }
    if (editorSubmeta) editorSubmeta.textContent = `${path} • UTF-8`;
    if (editorCode) editorCode.textContent = fileData.code;
    if (iconEl) {
      iconEl.className = 's08-stage-file-icon icon-code';
      iconEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
    }
  }

  if (sourcesTreeContainer) {
    // 1. Folder Collapsible Trigger Clicks
    sourcesTreeContainer.addEventListener('click', (e) => {
      const trigger = e.target.closest('.s08-tree-trigger');
      if (trigger) {
        e.stopPropagation();
        const folderNode = trigger.closest('.s08-tree-folder');
        if (folderNode) {
          folderNode.classList.toggle('open');
          const isOpen = folderNode.classList.contains('open');
          trigger.setAttribute('aria-expanded', isOpen);
          syncTreeToggleAllButton();
        }
        return;
      }

      // 2. File Button Selection Clicks (variant="ghost" size="sm" onClick={() => onSelect(node.path)})
      const fileBtn = e.target.closest('.s08-tree-file');
      if (fileBtn) {
        e.stopPropagation();
        sourcesTreeContainer.querySelectorAll('.s08-tree-file').forEach(f => f.classList.remove('active'));
        fileBtn.classList.add('active');
        const path = fileBtn.getAttribute('data-path');
        if (path) {
          updateEditorWithFile(path);
          appendLogMessage(`File inspected: ${path}`, 'FILE');
          const fileName = fileBtn.querySelector('.s08-tree-name')?.textContent?.trim() || path.split('/').pop();
          openOrSwitchTab('editor', { label: fileName, viewId: 's08-view-editor' });
        }
      }
    });
  }

  // Smart Unified Expand All / Collapse All Toggle (Annotation 2)
  function syncTreeToggleAllButton() {
    if (!sourcesTreeContainer || !treeToggleAllBtn) return;
    const folders = Array.from(sourcesTreeContainer.querySelectorAll('.s08-tree-folder'));
    if (folders.length === 0) return;

    // "if anything is closed then show expand all. if anything is open then show collapse all"
    const hasClosedFolders = folders.some(f => !f.classList.contains('open'));

    if (hasClosedFolders) {
      treeToggleAllBtn.setAttribute('title', 'Expand all');
      treeToggleAllBtn.setAttribute('aria-label', 'Expand all folders');
      treeToggleAllBtn.setAttribute('data-custom-tooltip', 'Expand all');
      treeToggleAllBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 3 21 3 21 9"/>
          <polyline points="9 21 3 21 3 15"/>
          <line x1="21" y1="3" x2="14" y2="10"/>
          <line x1="3" y1="21" x2="10" y2="14"/>
        </svg>
      `;
    } else {
      treeToggleAllBtn.setAttribute('title', 'Collapse all');
      treeToggleAllBtn.setAttribute('aria-label', 'Collapse all folders');
      treeToggleAllBtn.setAttribute('data-custom-tooltip', 'Collapse all');
      treeToggleAllBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="4 14 10 14 10 20"/>
          <polyline points="20 10 14 10 14 4"/>
          <line x1="14" y1="10" x2="21" y2="3"/>
          <line x1="10" y1="14" x2="3" y2="21"/>
        </svg>
      `;
    }
  }

  if (treeToggleAllBtn && sourcesTreeContainer) {
    treeToggleAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const folders = Array.from(sourcesTreeContainer.querySelectorAll('.s08-tree-folder'));
      const hasClosedFolders = folders.some(f => !f.classList.contains('open'));

      if (hasClosedFolders) {
        // Expand all
        folders.forEach(folder => {
          folder.classList.add('open');
          const trig = folder.querySelector('.s08-tree-trigger');
          if (trig) trig.setAttribute('aria-expanded', 'true');
        });
        appendLogMessage('All folders expanded', 'TREE');
      } else {
        // Collapse all
        folders.forEach(folder => {
          folder.classList.remove('open');
          const trig = folder.querySelector('.s08-tree-trigger');
          if (trig) trig.setAttribute('aria-expanded', 'false');
        });
        appendLogMessage('All folders collapsed', 'TREE');
      }
      syncTreeToggleAllButton();
    });

    // Initialize toggle state on startup
    syncTreeToggleAllButton();
  }

  // ==========================================================================
  // ARTIFACTS TAB CONTROLLER (Upload, Drag-and-Drop, Filter Pills, Search)
  // ==========================================================================
  const artifactsUploadCard = document.querySelector('.s08-artifacts-upload-card');
  const artifactsDropzone = document.getElementById('s08-artifacts-dropzone');
  const artifactsFileInput = document.getElementById('s08-artifacts-file-input');
  const artifactsBrowseBtn = document.getElementById('s08-artifacts-browse-btn');
  const gdriveBtn = document.getElementById('s08-gdrive-btn');
  const onedriveBtn = document.getElementById('s08-onedrive-btn');
  const artifactsSearchInput = document.getElementById('s08-artifacts-search-input');
  const artifactsFilterTabs = document.querySelectorAll('#s08-artifacts-filter-tabs .sutra-tab-pill');
  const artifactsEmptyState = document.getElementById('s08-artifacts-empty-state');
  const artifactsEmptyUploadBtn = document.getElementById('s08-artifacts-empty-upload-btn');
  const artifactsList = document.getElementById('s08-artifacts-list');

  if (!artifactsData || artifactsData.length === 0) {
    artifactsData = [...defaultDeliverables];
  }
  let currentArtifactFilter = 'all';
  let artifactSearchQuery = '';
  let stageZoomLevel = 100;

  function formatArtifactFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function getArtifactIcon(ext) {
    const e = (ext || '').toLowerCase();
    if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'].includes(e)) {
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;
    }
    if (['diff', 'patch'].includes(e)) {
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>`;
    }
    if (['md', 'markdown', 'txt', 'doc'].includes(e)) {
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
    }
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'json', 'html', 'css', 'go', 'rs'].includes(e)) {
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
    }
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`;
  }

  // Phase 9: Rich Renderers for The Stage
  function renderMarkdownSpecHTML(artifact) {
    const isEpic = (artifact.name || '').includes('EPIC') || artifact.badge === 'EPIC-104';
    if (isEpic) {
      return `
        <div class="s08-md-doc">
          <div class="s08-md-badges-row">
            <span class="s08-md-pill">Jira Epic</span>
            <span class="s08-md-pill pill-success">Committed (EPIC-104)</span>
            <span class="s08-md-pill">Design Engineering</span>
            <span class="s08-md-pill">Acme Inc</span>
          </div>

          <h1>Epic: Universal Application Login</h1>
          <p style="font-size: 13.5px; color: var(--color-text-secondary, #475569); margin-bottom: 16px;">
            <strong>Jira Key</strong>: <a class="s08-jira-link" data-jira-key="EPIC-104" href="https://jira.enterprise.internal/epics/EPIC-104" style="color:var(--color-vendor-jira-blue, #0052CC); font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:4px; background:var(--color-vendor-jira-subtle, #F4F5F7); padding:2px 8px; border-radius:var(--radius-xs, 4px); border:1px solid var(--color-vendor-jira-border, #DFE1E6); cursor:pointer;"><span>[EPIC-104 ↗]</span></a>
            &nbsp;|&nbsp; <strong>Status</strong>: Defined in Jira &nbsp;|&nbsp; <strong>Entity ID</strong>: IN-104
          </p>

          <div class="s08-md-alert s08-md-alert-tip">
            <div class="s08-md-alert-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </div>
            <div class="s08-md-alert-content">
              <strong>Jira Cloud Connected:</strong> Click <a class="s08-jira-link" data-jira-key="EPIC-104" href="https://jira.enterprise.internal/epics/EPIC-104" style="color:var(--color-vendor-jira-blue, #0052CC); font-weight:600; text-decoration:underline; cursor:pointer;">[EPIC-104 ↗]</a> to inspect the live ticket, child features, and agile workflow directly in the embedded <strong>Browser</strong> tab.
            </div>
          </div>

          <h2>1. Business Objective</h2>
          <p>Provide a hardened, omnichannel authentication architecture unifying web, mobile, and partner portals under a zero-trust single sign-on foundation.</p>

          <h2>2. Acceptance Criteria (Gherkin Scenarios)</h2>
          <div class="s08-md-code-box">
            <div class="s08-md-code-header">
              <span>gherkin</span>
              <span>acceptance_criteria.feature</span>
            </div>
            <pre><code>Feature: Universal Application Login
  Scenario: Successful TOTP Multi-Factor Authentication
    Given the user navigates to the login screen
    When they enter valid primary credentials
    Then the system requests a 6-digit TOTP code
    And validates the code within a 30-second skew tolerance window

  Scenario: Account Lockout on Multiple Failed Attempts
    Given the user has 4 consecutive failed password attempts
    When they submit a 5th incorrect attempt
    Then the system locks the account for 15 minutes
    And sends a security alert email to the registered address</code></pre>
          </div>

          <h2>3. Downstream Feature Breakdown</h2>
          <div class="s08-md-table-wrap">
            <table class="s08-md-table">
              <thead>
                <tr>
                  <th>Feature Key</th>
                  <th>Title</th>
                  <th>Estimate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><a class="s08-jira-link" data-jira-key="FEAT-201" href="https://jira.enterprise.internal/epics/EPIC-104" style="color:var(--color-vendor-jira-blue, #0052CC); font-weight:600; text-decoration:none;">FEAT-201 ↗</a></td>
                  <td>Multi-Factor Authentication (TOTP / SMS)</td>
                  <td>8 pts</td>
                  <td><span class="s08-md-pill pill-success">Defined</span></td>
                </tr>
                <tr>
                  <td><a class="s08-jira-link" data-jira-key="FEAT-202" href="https://jira.enterprise.internal/epics/EPIC-104" style="color:var(--color-vendor-jira-blue, #0052CC); font-weight:600; text-decoration:none;">FEAT-202 ↗</a></td>
                  <td>OAuth2 Social & Enterprise SSO Providers</td>
                  <td>5 pts</td>
                  <td><span class="s08-md-pill">Planned</span></td>
                </tr>
                <tr>
                  <td><a class="s08-jira-link" data-jira-key="FEAT-203" href="https://jira.enterprise.internal/epics/EPIC-104" style="color:var(--color-vendor-jira-blue, #0052CC); font-weight:600; text-decoration:none;">FEAT-203 ↗</a></td>
                  <td>Self-Service Password Reset & Recovery</td>
                  <td>5 pts</td>
                  <td><span class="s08-md-pill">Planned</span></td>
                </tr>
                <tr>
                  <td><a class="s08-jira-link" data-jira-key="FEAT-204" href="https://jira.enterprise.internal/epics/EPIC-104" style="color:var(--color-vendor-jira-blue, #0052CC); font-weight:600; text-decoration:none;">FEAT-204 ↗</a></td>
                  <td>Audit Logging & Failed Login Lockout</td>
                  <td>3 pts</td>
                  <td><span class="s08-md-pill pill-success">Done</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    const isReadme = (artifact.name || '').toLowerCase() === 'readme.md';
    if (isReadme) {
      return `
        <div class="s08-md-doc">
          <div class="s08-md-badges-row">
            <span class="s08-md-pill pill-purple">README.md</span>
            <span class="s08-md-pill pill-success">v2.4.0</span>
            <span class="s08-md-pill">Cloud Sandbox</span>
          </div>
          <h1>Sutra AI Platform Workspace</h1>
          <p>Target Workspace: <code>web-platform</code> | Environment: <code>Cloud Sandbox (Node.js 20)</code></p>
          <div class="s08-md-alert s08-md-alert-tip">
            <div class="s08-md-alert-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <div class="s08-md-alert-content">
              <strong>Quick Start:</strong> Run <code>npm run dev</code> to boot the local dev server or inspect the active task in The Stage.
            </div>
          </div>
          <h2>Changed Files in Session</h2>
          <ul class="s08-md-checklist">
            <li><span class="s08-md-check checked"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span> <code>src/app.tsx</code> — Mounted FileTree component</li>
            <li><span class="s08-md-check checked"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span> <code>src/forecast.ts</code> — EWMA calculations & anomaly baseline</li>
            <li><span class="s08-md-check checked"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span> <code>src/tokens/colors.json</code> — Design system color hierarchy</li>
            <li><span class="s08-md-check checked"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span> <code>src/components/file-tree.tsx</code> — Shadcn Collapsible file tree</li>
          </ul>
        </div>
      `;
    }

    return `
      <div class="s08-md-doc">
        <div class="s08-md-badges-row">
          <span class="s08-md-pill pill-purple">ARCH-SPEC-v2.4</span>
          <span class="s08-md-pill pill-success">Approved</span>
          <span class="s08-md-pill">SOC-2 Type II</span>
          <span class="s08-md-pill">Generated by Agent General</span>
        </div>

        <h1>Sutra Autonomous Agent Platform — Architecture Specification</h1>
        <p style="font-size: var(--font-size-base, 14px); color: var(--color-text-secondary, #475569); margin-bottom: var(--spacing-4, 16px);">
          Technical blueprint for multi-tenant agent orchestration, zero-latency streaming pipelines, and reactive Stage deliverable rendering.
        </p>

        <div class="s08-md-alert s08-md-alert-note">
          <div class="s08-md-alert-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </div>
          <div class="s08-md-alert-content">
            <strong>Architecture Note:</strong> Deliverable artifacts rendered in The Stage operate as isolated shadow scopes. All markdown documents, git diffs, and SVG diagrams are hot-reloaded reactively without interrupting the agent conversational stream.
          </div>
        </div>

        <h2>1. Core Component Topology & Latency SLAs</h2>
        <p>The workspace runtime employs an <em>Anchor + Stage + Monitor</em> tri-pane architecture to balance deep work, ambient awareness, and file exploration:</p>

        <div class="s08-md-table-wrap">
          <table class="s08-md-table">
            <thead>
              <tr>
                <th>Subsystem</th>
                <th>Role</th>
                <th>P99 SLA</th>
                <th>Concurrency</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>The Stage Deliverable</strong></td>
                <td>Markdown, Git Diff & SVG preview</td>
                <td>&lt; 16ms</td>
                <td>Client Reactive</td>
                <td><span class="s08-md-pill pill-success">Active (Phase 9)</span></td>
              </tr>
              <tr>
                <td><strong>Left Anchor</strong></td>
                <td>Workspace tree & artifact hub</td>
                <td>&lt; 25ms</td>
                <td>1,000 files/tree</td>
                <td><span class="s08-md-pill pill-success">Active</span></td>
              </tr>
              <tr>
                <td><strong>Monitor Stream</strong></td>
                <td>Agent telemetry & execution logs</td>
                <td>&lt; 10ms</td>
                <td>50,000 evt/s</td>
                <td><span class="s08-md-pill pill-success">Active</span></td>
              </tr>
              <tr>
                <td><strong>Vector RAG Store</strong></td>
                <td>Hybrid semantic code retrieval</td>
                <td>&lt; 42ms</td>
                <td>5M embeddings</td>
                <td><span class="s08-md-pill">Optimized</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>2. Workspace Layout Phases Checklist</h2>
        <ul class="s08-md-checklist">
          <li>
            <span class="s08-md-check checked"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span><strong>Phase 6:</strong> Pinned sibling <code>[+]</code> button & horizontal scroll with mouse wheel support</span>
          </li>
          <li>
            <span class="s08-md-check checked"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span><strong>Phase 7:</strong> Stripped redundant prefixes (<code>Artifacts:</code>, <code>Editor:</code>) & added keyboard shortcuts (<code>⌘1..⌘9</code>, <code>⌘W</code>)</span>
          </li>
          <li>
            <span class="s08-md-check checked"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span><strong>Phase 8:</strong> Tab Overflow chevron dropdown (<code>[▼]</code>) with count badge, active checkmarks, and 1-click jump</span>
          </li>
          <li>
            <span class="s08-md-check checked"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span><strong>Phase 9:</strong> Agent-generated deliverable artifacts (Markdown Spec, Unified Git Diff, SVG Architecture Diagram)</span>
          </li>
          <li>
            <span class="s08-md-check pending"></span>
            <span><strong>Phase 10:</strong> Split pane drag-divider gestures, bidirectional layout persistence, and multi-window export</span>
          </li>
        </ul>

        <div class="s08-md-alert s08-md-alert-tip">
          <div class="s08-md-alert-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          </div>
          <div class="s08-md-alert-content">
            <strong>Pro Tip:</strong> Click the <strong>Raw</strong> toggle in the top-right header to inspect the underlying GitHub-Flavored Markdown syntax, or click <strong>Copy</strong> to copy the raw payload directly to your clipboard.
          </div>
        </div>

        <h2>3. Integration Interface Contract</h2>
        <div class="s08-md-code-box">
          <div class="s08-md-code-header">
            <span>typescript</span>
            <span>payload.d.ts</span>
          </div>
          <pre><code>export interface DeliverableArtifact {
  id: string;
  title: string;
  format: 'markdown' | 'diff' | 'svg' | 'code';
  metadata: {
    author: string;
    generatedAt: string;
    sizeBytes: number;
    gitDiffStats?: { additions: number; deletions: number };
  };
  payload: string;
}</code></pre>
        </div>
      </div>
    `;
  }

  function getRawMarkdownSource(artifact) {
    return `# Sutra Autonomous Agent Platform — Architecture Specification v2.4\nStatus: Approved | Author: Agent General | SOC-2 Type II\n\n> Architecture Note: Deliverable artifacts rendered in The Stage operate as isolated shadow scopes. All markdown documents, git diffs, and SVG diagrams are hot-reloaded reactively without interrupting the agent conversational stream.\n\n## 1. Core Component Topology & Latency SLAs\n| Subsystem | Role | P99 SLA | Concurrency | Status |\n| :--- | :--- | :--- | :--- | :--- |\n| The Stage Deliverable | Markdown, Git Diff & SVG preview | < 16ms | Client Reactive | Active (Phase 9) |\n| Left Anchor | Workspace tree & artifact hub | < 25ms | 1,000 files/tree | Active |\n| Monitor Stream | Agent telemetry & execution logs | < 10ms | 50,000 evt/s | Active |\n| Vector RAG Store | Hybrid semantic code retrieval | < 42ms | 5M embeddings | Optimized |\n\n## 2. Workspace Layout Phases Checklist\n- [x] Phase 6: Pinned sibling [+] button & horizontal scroll with mouse wheel support\n- [x] Phase 7: Stripped redundant prefixes & added keyboard shortcuts (⌘1..⌘9, ⌘W)\n- [x] Phase 8: Tab Overflow chevron dropdown ([▼]) with count badge, active checkmarks, and 1-click jump\n- [x] Phase 9: Agent-generated deliverable artifacts (Markdown Spec, Unified Git Diff, SVG Architecture Diagram)\n- [ ] Phase 10: Split pane drag-divider gestures, bidirectional layout persistence, and multi-window export\n\n## 3. Integration Interface Contract\n\`\`\`typescript\nexport interface DeliverableArtifact {\n  id: string;\n  title: string;\n  format: 'markdown' | 'diff' | 'svg' | 'code';\n  metadata: {\n    author: string;\n    generatedAt: string;\n    sizeBytes: number;\n    gitDiffStats?: { additions: number; deletions: number };\n  };\n  payload: string;\n}\n\`\`\``;
  }

  function renderGitDiffHTML(artifact) {
    return `
      <div class="s08-diff-container">
        <div class="s08-diff-banner">
          <div class="s08-diff-banner-left">
            <span class="s08-diff-path">src/forecast.ts</span>
            <span style="color: var(--color-text-disabled, #94A3B8);">•</span>
            <span style="color: var(--color-text-tertiary, #64748B);">Patch generated by Synthetix</span>
          </div>
          <div class="s08-diff-stats-chip">
            <span class="s08-diff-stat-add">+18 additions</span>
            <span class="s08-diff-stat-del">-4 deletions</span>
          </div>
        </div>

        <table class="s08-diff-table">
          <tbody>
            <tr class="s08-diff-row hunk">
              <td class="s08-diff-num">...</td>
              <td class="s08-diff-num">...</td>
              <td class="s08-diff-marker"></td>
              <td class="s08-diff-code">@@ -8,14 +8,28 @@ export interface ForecastMetric {</td>
            </tr>
            <tr class="s08-diff-row">
              <td class="s08-diff-num">8</td>
              <td class="s08-diff-num">8</td>
              <td class="s08-diff-marker"></td>
              <td class="s08-diff-code">  date: string;</td>
            </tr>
            <tr class="s08-diff-row">
              <td class="s08-diff-num">9</td>
              <td class="s08-diff-num">9</td>
              <td class="s08-diff-marker"></td>
              <td class="s08-diff-code">  disbursedAmount: number;</td>
            </tr>
            <tr class="s08-diff-row">
              <td class="s08-diff-num">10</td>
              <td class="s08-diff-num">10</td>
              <td class="s08-diff-marker"></td>
              <td class="s08-diff-code">  projectedVolume: number;</td>
            </tr>
            <tr class="s08-diff-row add">
              <td class="s08-diff-num"></td>
              <td class="s08-diff-num">11</td>
              <td class="s08-diff-marker">+</td>
              <td class="s08-diff-code">  confidenceInterval: [number, number];</td>
            </tr>
            <tr class="s08-diff-row add">
              <td class="s08-diff-num"></td>
              <td class="s08-diff-num">12</td>
              <td class="s08-diff-marker">+</td>
              <td class="s08-diff-code">  outlierAnomalyScore: number;</td>
            </tr>
            <tr class="s08-diff-row">
              <td class="s08-diff-num">11</td>
              <td class="s08-diff-num">13</td>
              <td class="s08-diff-marker"></td>
              <td class="s08-diff-code">}</td>
            </tr>
            <tr class="s08-diff-row hunk">
              <td class="s08-diff-num">...</td>
              <td class="s08-diff-num">...</td>
              <td class="s08-diff-marker"></td>
              <td class="s08-diff-code">@@ -15,7 +17,21 @@ export function calculateEWMA(</td>
            </tr>
            <tr class="s08-diff-row del">
              <td class="s08-diff-num">15</td>
              <td class="s08-diff-num"></td>
              <td class="s08-diff-marker">-</td>
              <td class="s08-diff-code">export function calculateEWMA(data: number[], alpha: number = 0.25): number[] {</td>
            </tr>
            <tr class="s08-diff-row del">
              <td class="s08-diff-num">16</td>
              <td class="s08-diff-num"></td>
              <td class="s08-diff-marker">-</td>
              <td class="s08-diff-code">  const results: number[] = [];</td>
            </tr>
            <tr class="s08-diff-row del">
              <td class="s08-diff-num">17</td>
              <td class="s08-diff-num"></td>
              <td class="s08-diff-marker">-</td>
              <td class="s08-diff-code">  let s = data[0] || 0;</td>
            </tr>
            <tr class="s08-diff-row del">
              <td class="s08-diff-num">18</td>
              <td class="s08-diff-num"></td>
              <td class="s08-diff-marker">-</td>
              <td class="s08-diff-code">  for (const x of data) { s = alpha * x + (1 - alpha) * s; results.push(Math.round(s * 100) / 100); }</td>
            </tr>
            <tr class="s08-diff-row add">
              <td class="s08-diff-num"></td>
              <td class="s08-diff-num">17</td>
              <td class="s08-diff-marker">+</td>
              <td class="s08-diff-code">export function calculateEWMA(</td>
            </tr>
            <tr class="s08-diff-row add">
              <td class="s08-diff-num"></td>
              <td class="s08-diff-num">18</td>
              <td class="s08-diff-marker">+</td>
              <td class="s08-diff-code">  data: number[],</td>
            </tr>
            <tr class="s08-diff-row add">
              <td class="s08-diff-num"></td>
              <td class="s08-diff-num">19</td>
              <td class="s08-diff-marker">+</td>
              <td class="s08-diff-code">  alpha: number = 0.25,</td>
            </tr>
            <tr class="s08-diff-row add">
              <td class="s08-diff-num"></td>
              <td class="s08-diff-num">20</td>
              <td class="s08-diff-marker">+</td>
              <td class="s08-diff-code">  volatilityThreshold: number = 1.96</td>
            </tr>
            <tr class="s08-diff-row add">
              <td class="s08-diff-num"></td>
              <td class="s08-diff-num">21</td>
              <td class="s08-diff-marker">+</td>
              <td class="s08-diff-code">): { smoothed: number[]; anomalies: number[] } {</td>
            </tr>
            <tr class="s08-diff-row add">
              <td class="s08-diff-num"></td>
              <td class="s08-diff-num">22</td>
              <td class="s08-diff-marker">+</td>
              <td class="s08-diff-code">  const smoothed: number[] = [];</td>
            </tr>
            <tr class="s08-diff-row add">
              <td class="s08-diff-num"></td>
              <td class="s08-diff-num">23</td>
              <td class="s08-diff-marker">+</td>
              <td class="s08-diff-code">  const anomalies: number[] = [];</td>
            </tr>
            <tr class="s08-diff-row add">
              <td class="s08-diff-num"></td>
              <td class="s08-diff-num">24</td>
              <td class="s08-diff-marker">+</td>
              <td class="s08-diff-code">  let s = data[0] || 0;</td>
            </tr>
            <tr class="s08-diff-row add">
              <td class="s08-diff-num"></td>
              <td class="s08-diff-num">25</td>
              <td class="s08-diff-marker">+</td>
              <td class="s08-diff-code">  let variance = 0;</td>
            </tr>
            <tr class="s08-diff-row add">
              <td class="s08-diff-num"></td>
              <td class="s08-diff-num">26</td>
              <td class="s08-diff-marker">+</td>
              <td class="s08-diff-code">  data.forEach((val, idx) =&gt; {</td>
            </tr>
            <tr class="s08-diff-row add">
              <td class="s08-diff-num"></td>
              <td class="s08-diff-num">27</td>
              <td class="s08-diff-marker">+</td>
              <td class="s08-diff-code">    const prev = s;</td>
            </tr>
            <tr class="s08-diff-row add">
              <td class="s08-diff-num"></td>
              <td class="s08-diff-num">28</td>
              <td class="s08-diff-marker">+</td>
              <td class="s08-diff-code">    s = alpha * val + (1 - alpha) * s;</td>
            </tr>
            <tr class="s08-diff-row add">
              <td class="s08-diff-num"></td>
              <td class="s08-diff-num">29</td>
              <td class="s08-diff-marker">+</td>
              <td class="s08-diff-code">    variance = (1 - alpha) * (variance + alpha * Math.pow(val - prev, 2));</td>
            </tr>
            <tr class="s08-diff-row add">
              <td class="s08-diff-num"></td>
              <td class="s08-diff-num">30</td>
              <td class="s08-diff-marker">+</td>
              <td class="s08-diff-code">    if (Math.abs(val - s) &gt; volatilityThreshold * Math.sqrt(variance) &amp;&amp; idx &gt; 3) {</td>
            </tr>
            <tr class="s08-diff-row add">
              <td class="s08-diff-num"></td>
              <td class="s08-diff-num">31</td>
              <td class="s08-diff-marker">+</td>
              <td class="s08-diff-code">      anomalies.push(idx);</td>
            </tr>
            <tr class="s08-diff-row add">
              <td class="s08-diff-num"></td>
              <td class="s08-diff-num">32</td>
              <td class="s08-diff-marker">+</td>
              <td class="s08-diff-code">    }</td>
            </tr>
            <tr class="s08-diff-row add">
              <td class="s08-diff-num"></td>
              <td class="s08-diff-num">33</td>
              <td class="s08-diff-marker">+</td>
              <td class="s08-diff-code">    smoothed.push(Math.round(s * 100) / 100);</td>
            </tr>
            <tr class="s08-diff-row add">
              <td class="s08-diff-num"></td>
              <td class="s08-diff-num">34</td>
              <td class="s08-diff-marker">+</td>
              <td class="s08-diff-code">  });</td>
            </tr>
            <tr class="s08-diff-row add">
              <td class="s08-diff-num"></td>
              <td class="s08-diff-num">35</td>
              <td class="s08-diff-marker">+</td>
              <td class="s08-diff-code">  return { smoothed, anomalies };</td>
            </tr>
            <tr class="s08-diff-row">
              <td class="s08-diff-num">19</td>
              <td class="s08-diff-num">36</td>
              <td class="s08-diff-marker"></td>
              <td class="s08-diff-code">}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  function getRawDiffSource(artifact) {
    return `diff --git a/src/forecast.ts b/src/forecast.ts\nindex 3f9a12b..8e04b1c 100644\n--- a/src/forecast.ts\n+++ b/src/forecast.ts\n@@ -8,14 +8,28 @@ export interface ForecastMetric {\n   date: string;\n   disbursedAmount: number;\n   projectedVolume: number;\n+  confidenceInterval: [number, number];\n+  outlierAnomalyScore: number;\n }\n\n-export function calculateEWMA(data: number[], alpha: number = 0.25): number[] {\n-  const results: number[] = [];\n-  let s = data[0] || 0;\n-  for (const x of data) { s = alpha * x + (1 - alpha) * s; results.push(Math.round(s * 100) / 100); }\n-  return results;\n-}\n+export function calculateEWMA(\n+  data: number[],\n+  alpha: number = 0.25,\n+  volatilityThreshold: number = 1.96\n+): { smoothed: number[]; anomalies: number[] } {\n+  const smoothed: number[] = [];\n+  const anomalies: number[] = [];\n+  let s = data[0] || 0;\n+  let variance = 0;\n+  data.forEach((val, idx) => {\n+    const prev = s;\n+    s = alpha * val + (1 - alpha) * s;\n+    variance = (1 - alpha) * (variance + alpha * Math.pow(val - prev, 2));\n+    if (Math.abs(val - s) > volatilityThreshold * Math.sqrt(variance) && idx > 3) anomalies.push(idx);\n+    smoothed.push(Math.round(s * 100) / 100);\n+  });\n+  return { smoothed, anomalies };\n+}`;
  }

  function getUpdatedFileSource(artifact) {
    if (artifact && (artifact.name === 'forecast.ts' || artifact.id === 'art-diff-forecast')) {
      return `/**
 * src/forecast.ts
 * EWMA calculations & anomaly baseline with volatility confidence intervals
 * Updated by Agent Synthetix
 */

export interface ForecastMetric {
  date: string;
  disbursedAmount: number;
  projectedVolume: number;
  confidenceInterval: [number, number];
  outlierAnomalyScore: number;
}

export function calculateEWMA(
  data: number[],
  alpha: number = 0.25,
  volatilityThreshold: number = 1.96
): { smoothed: number[]; anomalies: number[] } {
  const smoothed: number[] = [];
  const anomalies: number[] = [];
  let s = data[0] || 0;
  let variance = 0;

  data.forEach((val, idx) => {
    const prev = s;
    s = alpha * val + (1 - alpha) * s;
    variance = (1 - alpha) * (variance + alpha * Math.pow(val - prev, 2));

    if (Math.abs(val - s) > volatilityThreshold * Math.sqrt(variance) && idx > 3) {
      anomalies.push(idx);
    }
    smoothed.push(Math.round(s * 100) / 100);
  });

  return { smoothed, anomalies };
}

export function getDisbursementTrend(metrics: ForecastMetric[]): {
  projectedTotal: number;
  riskBand: 'low' | 'moderate' | 'high';
} {
  const amounts = metrics.map(m => m.disbursedAmount);
  const { smoothed, anomalies } = calculateEWMA(amounts);
  const projectedTotal = smoothed.reduce((acc, curr) => acc + curr, 0);
  const riskBand = anomalies.length > 2 ? 'high' : anomalies.length > 0 ? 'moderate' : 'low';
  return { projectedTotal, riskBand };
}`;
    }
    return getRawDiffSource(artifact);
  }

  function renderTopologySVGHTML(artifact) {
    return `
      <div class="s08-stage-diagram-canvas">
        <svg width="780" height="420" viewBox="0 0 780 420" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 12px 32px rgba(0,0,0,0.4));">
          <rect width="780" height="420" rx="12" fill="#0F172A" stroke="#1E293B" stroke-width="1.5"/>
          <defs>
            <pattern id="diag-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#334155" opacity="0.3"/>
            </pattern>
            <linearGradient id="grad-blue" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#006EF5"/>
              <stop offset="100%" stop-color="#004BB5"/>
            </linearGradient>
            <linearGradient id="grad-purple" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#9333EA"/>
              <stop offset="100%" stop-color="#6B21A8"/>
            </linearGradient>
            <linearGradient id="grad-emerald" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#10B981"/>
              <stop offset="100%" stop-color="#047857"/>
            </linearGradient>
            <linearGradient id="grad-amber" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#F59E0B"/>
              <stop offset="100%" stop-color="#B45309"/>
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
          </defs>
          <rect width="780" height="420" fill="url(#diag-grid)" rx="12"/>

          <!-- Connection Paths -->
          <path d="M 210 210 C 250 210, 250 210, 290 210" stroke="#3B82F6" stroke-width="2" stroke-dasharray="4 4" opacity="0.8"/>
          <path d="M 470 185 C 505 185, 505 92, 540 92" stroke="#10B981" stroke-width="2" stroke-linecap="round"/>
          <path d="M 470 210 C 505 210, 505 210, 540 210" stroke="#06B6D4" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>
          <path d="M 470 235 C 505 235, 505 328, 540 328" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/>

          <!-- Header -->
          <text x="32" y="38" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="600" letter-spacing="1">TOPOLOGY MAP</text>
          <text x="32" y="58" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="16" font-weight="700">Autonomous Multi-Agent Workspace Cluster</text>
          <rect x="660" y="28" width="88" height="24" rx="12" fill="#047857" opacity="0.3"/>
          <circle cx="675" cy="40" r="4" fill="#10B981"/>
          <text x="686" y="44" fill="#34D399" font-family="sans-serif" font-size="11" font-weight="600">LIVE SYNC</text>

          <!-- 1. Node: Sutra Client UI -->
          <g transform="translate(40, 160)">
            <rect width="170" height="100" rx="10" fill="#1E293B" stroke="#3B82F6" stroke-width="1.5"/>
            <rect x="14" y="14" width="32" height="32" rx="6" fill="url(#grad-blue)"/>
            <path d="M22 22 h16 v16 h-16 z" stroke="#FFFFFF" stroke-width="1.8" fill="none"/>
            <text x="56" y="28" fill="#FFFFFF" font-family="sans-serif" font-size="14" font-weight="600">Sutra Client UI</text>
            <text x="56" y="42" fill="#94A3B8" font-family="sans-serif" font-size="12">Stage + Anchor + Mon</text>
            <line x1="14" y1="60" x2="156" y2="60" stroke="#334155" stroke-width="1"/>
            <text x="14" y="80" fill="#60A5FA" font-family="ui-monospace, monospace" font-size="12">127.0.0.1:5500</text>
            <text x="120" y="80" fill="#34D399" font-family="sans-serif" font-size="12" font-weight="600">60 FPS</text>
          </g>

          <!-- 2. Node: Agent General -->
          <g transform="translate(290, 145)">
            <rect width="180" height="130" rx="10" fill="#1E293B" stroke="#A855F7" stroke-width="1.8" filter="url(#glow)"/>
            <rect x="14" y="14" width="36" height="36" rx="8" fill="url(#grad-purple)"/>
            <circle cx="32" cy="32" r="7" stroke="#FFFFFF" stroke-width="1.8" fill="none"/>
            <text x="60" y="28" fill="#FFFFFF" font-family="sans-serif" font-size="14" font-weight="700">Agent General</text>
            <text x="60" y="44" fill="#C084FC" font-family="sans-serif" font-size="12" font-weight="500">Orchestrator Core</text>
            <line x1="14" y1="64" x2="166" y2="64" stroke="#334155" stroke-width="1"/>
            <text x="14" y="84" fill="#94A3B8" font-family="sans-serif" font-size="12">Task Pipeline: Reactive</text>
            <text x="14" y="102" fill="#94A3B8" font-family="sans-serif" font-size="12">P99 Dispatch: &lt; 120ms</text>
            <rect x="14" y="112" width="152" height="6" rx="3" fill="#334155"/>
            <rect x="14" y="112" width="130" height="6" rx="3" fill="#A855F7"/>
          </g>

          <!-- 3. Node: Synthetix Worker -->
          <g transform="translate(540, 52)">
            <rect width="200" height="80" rx="10" fill="#1E293B" stroke="#10B981" stroke-width="1.5"/>
            <rect x="14" y="14" width="28" height="28" rx="6" fill="url(#grad-emerald)"/>
            <polyline points="23 28 28 33 34 23" stroke="#FFFFFF" stroke-width="2" fill="none"/>
            <text x="52" y="26" fill="#FFFFFF" font-family="sans-serif" font-size="12" font-weight="600">Synthetix Agent</text>
            <text x="52" y="39" fill="#6EE7B7" font-family="sans-serif" font-size="12">Code Synthesis & Diff</text>
            <text x="14" y="64" fill="#94A3B8" font-family="ui-monospace, monospace" font-size="12">Patch: src/forecast.ts (+18/-4)</text>
          </g>

          <!-- 4. Node: The Stage Deliverable Engine -->
          <g transform="translate(540, 165)">
            <rect width="200" height="90" rx="10" fill="#1E293B" stroke="#06B6D4" stroke-width="2"/>
            <rect x="14" y="14" width="30" height="30" rx="6" fill="#0891B2"/>
            <rect x="21" y="21" width="16" height="16" rx="2" stroke="#FFFFFF" stroke-width="1.8" fill="none"/>
            <text x="54" y="26" fill="#FFFFFF" font-family="sans-serif" font-size="14" font-weight="700">The Stage Engine</text>
            <text x="54" y="40" fill="#67E8F9" font-family="sans-serif" font-size="12">Markdown • Diff • SVG</text>
            <line x1="14" y1="56" x2="186" y2="56" stroke="#334155" stroke-width="1"/>
            <text x="14" y="74" fill="#38BDF8" font-family="sans-serif" font-size="12" font-weight="600">Multi-Deliverable Live Tabs</text>
          </g>

          <!-- 5. Node: DevOps Specialist -->
          <g transform="translate(540, 288)">
            <rect width="200" height="80" rx="10" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5"/>
            <rect x="14" y="14" width="28" height="28" rx="6" fill="url(#grad-amber)"/>
            <circle cx="28" cy="28" r="6" stroke="#FFFFFF" stroke-width="1.8" fill="none"/>
            <text x="52" y="26" fill="#FFFFFF" font-family="sans-serif" font-size="12" font-weight="600">DevOps Specialist</text>
            <text x="52" y="39" fill="#FCD34D" font-family="sans-serif" font-size="12">Stream Telemetry & Logs</text>
            <text x="14" y="64" fill="#94A3B8" font-family="ui-monospace, monospace" font-size="12">Cluster Health: 99.98% SLA</text>
          </g>

          <!-- Bottom Footer -->
          <g transform="translate(40, 385)">
            <text x="0" y="12" fill="#64748B" font-family="sans-serif" font-size="12">Vector Store: 5,420,100 embeddings indexed</text>
            <text x="320" y="12" fill="#64748B" font-family="sans-serif" font-size="12">Sandbox: Node.js 20 Cloud Runtime</text>
            <text x="600" y="12" fill="#10B981" font-family="sans-serif" font-size="12" font-weight="600">● Pipeline Active</text>
          </g>
        </svg>
      </div>
    `;
  }

  function getRawSVGSource(artifact) {
    return `<svg width="780" height="420" viewBox="0 0 780 420" xmlns="http://www.w3.org/2000/svg">\n  <!-- Sutra Multi-Agent Workspace Cluster Architecture -->\n  <rect width="780" height="420" fill="#0F172A"/>\n  <g id="client-ui"><rect x="40" y="160" width="170" height="100" fill="#1E293B"/></g>\n  <g id="orchestrator"><rect x="290" y="145" width="180" height="130" fill="#1E293B"/></g>\n  <g id="synthetix"><rect x="540" y="52" width="200" height="80" fill="#1E293B"/></g>\n  <g id="stage-engine"><rect x="540" y="165" width="200" height="90" fill="#1E293B"/></g>\n  <g id="devops"><rect x="540" y="288" width="200" height="80" fill="#1E293B"/></g>\n</svg>`;
  }

  function getJSONReportSource(artifact) {
    return `{\n  "report": "auth_security_audit_report",\n  "auditDate": "2026-10-24T01:30:00Z",\n  "compliance": {\n    "soc2Type2": true,\n    "hipaa": true,\n    "iso27001": true\n  },\n  "scannedEndpoints": [\n    {\n      "path": "/api/v2/auth/token",\n      "method": "POST",\n      "rateLimit": "100req/min",\n      "rbacRequired": ["enterprise_admin"],\n      "vulnerabilities": []\n    },\n    {\n      "path": "/api/v2/workspace/deliverables",\n      "method": "GET",\n      "rateLimit": "1000req/min",\n      "rbacRequired": ["member", "viewer"],\n      "vulnerabilities": []\n    }\n  ],\n  "summary": {\n    "critical": 0,\n    "high": 0,\n    "medium": 0,\n    "low": 0,\n    "status": "PASSED"\n  }\n}`;
  }

  function updateDiagramZoom() {
    const canvas = document.querySelector('.s08-stage-diagram-canvas');
    if (canvas) {
      canvas.style.transform = `scale(${stageZoomLevel / 100})`;
    }
    const zoomLevelLabel = document.getElementById('s08-stage-zoom-level');
    if (zoomLevelLabel) zoomLevelLabel.textContent = `${stageZoomLevel}%`;
  }

  // Phase 9: Open and Render Any Artifact in The Stage
  renderArtifactContentIntoStage = function(artifact) {
    if (!artifact) return;
    currentArtifactDoc = artifact;

    // Highlight item in Left Anchor
    if (artifactsList) {
      artifactsList.querySelectorAll('.s08-artifact-item').forEach(i => {
        i.classList.toggle('active', i.getAttribute('data-id') === artifact.id);
      });
    }

    const filenameEl = document.getElementById('s08-stage-filename');
    const badgeEl = document.getElementById('s08-stage-badge');
    const submetaEl = document.getElementById('s08-stage-submeta');
    const iconEl = document.getElementById('s08-stage-file-icon');
    const viewToggles = document.getElementById('s08-stage-view-toggles');
    const zoomControls = document.getElementById('s08-stage-zoom-controls');

    const mdView = document.getElementById('s08-stage-markdown-view');
    const diffView = document.getElementById('s08-stage-diff-view');
    const diagramView = document.getElementById('s08-stage-diagram-view');
    const codeView = document.getElementById('s08-stage-code-view');
    const codeText = document.getElementById('s08-stage-code-text');
    const diffBtn = document.getElementById('s08-stage-diff-btn');

    if (mdView) mdView.style.display = 'none';
    if (diffView) diffView.style.display = 'none';
    if (diagramView) diagramView.style.display = 'none';
    if (codeView) codeView.style.display = 'none';
    if (viewToggles) viewToggles.style.display = 'none';
    if (zoomControls) zoomControls.style.display = 'none';
    if (diffBtn) diffBtn.style.display = 'none';

    if (filenameEl) filenameEl.textContent = artifact.name;
    if (badgeEl) {
      badgeEl.textContent = artifact.badge || (artifact.ext || '').toUpperCase();
      badgeEl.className = 's08-editor-badge';
      if (artifact.badge === 'SPEC' || artifact.ext === 'md') badgeEl.classList.add('badge-spec');
      else if (artifact.badge === 'DIFF' || artifact.ext === 'diff') badgeEl.classList.add('badge-diff');
      else if (artifact.badge === 'DIAGRAM' || artifact.ext === 'svg') badgeEl.classList.add('badge-diagram');
    }
    if (submetaEl) {
      submetaEl.textContent = `${artifact.size} • ${artifact.author || (artifact.type === 'generated' ? 'Agent General' : 'Uploaded File')}`;
    }

    if (iconEl) {
      iconEl.className = 's08-stage-file-icon';
      if (artifact.badge === 'SPEC' || artifact.ext === 'md') {
        iconEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
      } else if (artifact.badge === 'DIFF' || artifact.ext === 'diff') {
        iconEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>`;
      } else if (artifact.badge === 'DIAGRAM' || artifact.ext === 'svg') {
        iconEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`;
      } else {
        iconEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
      }
    }

    if (artifact.ext === 'md' || artifact.badge === 'SPEC') {
      if (viewToggles) viewToggles.style.display = 'flex';
      const togglePreviewBtn = document.getElementById('s08-stage-toggle-preview');
      const toggleRawBtn = document.getElementById('s08-stage-toggle-raw');
      if (togglePreviewBtn && toggleRawBtn) {
        togglePreviewBtn.classList.add('active');
        toggleRawBtn.classList.remove('active');
      }
      if (mdView) {
        mdView.style.display = 'block';
        mdView.innerHTML = renderMarkdownSpecHTML(artifact);
      }
      if (codeText) codeText.textContent = getRawMarkdownSource(artifact);
    } else if (artifact.ext === 'diff' || artifact.badge === 'DIFF') {
      // By default show the updated file if user wants to see changes they can click the diff action icon
      if (codeView) {
        codeView.style.display = 'block';
        if (codeText) codeText.textContent = getUpdatedFileSource(artifact);
      }
      if (diffView) {
        diffView.style.display = 'none';
        diffView.innerHTML = renderGitDiffHTML(artifact);
      }
      const diffBtn = document.getElementById('s08-stage-diff-btn');
      if (diffBtn) {
        diffBtn.style.display = 'inline-flex';
        diffBtn.classList.remove('active');
        diffBtn.setAttribute('title', 'View Changes / Diff');
        diffBtn.setAttribute('data-custom-tooltip', 'View Changes / Diff');
        diffBtn.onclick = (e) => {
          e.stopPropagation();
          const isCurrentlyShowingDiff = diffView && diffView.style.display !== 'none';
          if (isCurrentlyShowingDiff) {
            diffBtn.classList.remove('active');
            diffBtn.setAttribute('title', 'View Changes / Diff');
            diffBtn.setAttribute('data-custom-tooltip', 'View Changes / Diff');
            if (diffView) diffView.style.display = 'none';
            if (codeView) {
              codeView.style.display = 'block';
              if (codeText) codeText.textContent = getUpdatedFileSource(artifact);
            }
          } else {
            diffBtn.classList.add('active');
            diffBtn.setAttribute('title', 'View Updated File');
            diffBtn.setAttribute('data-custom-tooltip', 'View Updated File');
            if (codeView) codeView.style.display = 'none';
            if (diffView) {
              diffView.style.display = 'block';
              diffView.innerHTML = renderGitDiffHTML(artifact);
            }
          }
        };
      }
    } else if (artifact.ext === 'svg' || artifact.badge === 'DIAGRAM') {
      const diffBtn = document.getElementById('s08-stage-diff-btn');
      if (diffBtn) diffBtn.style.display = 'none';
      if (zoomControls) zoomControls.style.display = 'flex';
      stageZoomLevel = 100;
      updateDiagramZoom();
      if (diagramView) {
        diagramView.style.display = 'flex';
        diagramView.innerHTML = renderTopologySVGHTML(artifact);
      }
      if (codeText) codeText.textContent = getRawSVGSource(artifact);
    } else {
      if (codeView) {
        codeView.style.display = 'block';
        if (codeText) codeText.textContent = getJSONReportSource(artifact);
      }
    }
  }

  openArtifactInStage = function(artifact) {
    if (!artifact) return;
    renderArtifactContentIntoStage(artifact);

    // Open/switch Stage tab pill with clean name (no repetitive prefixes)
    openOrSwitchTab(artifact.name, {
      label: artifact.name,
      viewId: 's08-view-editor'
    });

    appendLogMessage(`Deliverable viewed in Stage: ${artifact.name}`, 'STAGE');
  }

  function renderArtifacts() {
    if (!artifactsList || !artifactsEmptyState) return;

    // Toggle compact version of upload card when deliverables exist (Annotation 5)
    const hasFiles = artifactsData && artifactsData.length > 0;
    if (artifactsUploadCard) {
      artifactsUploadCard.classList.toggle('is-compact', hasFiles);
    }

    const filtered = artifactsData.filter(item => {
      const matchFilter = currentArtifactFilter === 'all' || item.type === currentArtifactFilter;
      const matchSearch = !artifactSearchQuery || 
                          item.name.toLowerCase().includes(artifactSearchQuery) ||
                          (item.badge && item.badge.toLowerCase().includes(artifactSearchQuery)) ||
                          (item.desc && item.desc.toLowerCase().includes(artifactSearchQuery));
      return matchFilter && matchSearch;
    });

    if (filtered.length === 0) {
      artifactsEmptyState.style.display = 'flex';
      artifactsList.style.display = 'none';
      artifactsList.innerHTML = '';

      const emptyTitle = artifactsEmptyState.querySelector('.s08-empty-state-title');
      const emptyDesc = artifactsEmptyState.querySelector('.s08-empty-state-desc');
      if (artifactsEmptyUploadBtn) {
        artifactsEmptyUploadBtn.style.display = (currentArtifactFilter === 'generated') ? 'none' : 'inline-flex';
      }
      if (emptyTitle && emptyDesc) {
        if (currentArtifactFilter === 'generated') {
          emptyTitle.textContent = 'No generated artifacts yet';
          emptyDesc.textContent = 'Outputs, specs, and diagrams generated by the agent during tasks will appear here.';
        } else if (currentArtifactFilter === 'uploaded') {
          emptyTitle.textContent = 'No uploaded files yet';
          emptyDesc.textContent = 'Upload files or import from cloud storage to view them here.';
        } else {
          emptyTitle.textContent = 'No artifacts yet';
          emptyDesc.textContent = 'Upload files or generate outputs during your agent sessions to view and manage them here.';
        }
      }
      return;
    }

    artifactsEmptyState.style.display = 'none';
    artifactsList.style.display = 'flex';

    artifactsList.innerHTML = filtered.map(item => `
      <div class="s08-artifact-item ${currentArtifactDoc && currentArtifactDoc.id === item.id ? 'active' : ''}" data-id="${item.id}" data-name="${escapeHTML(item.name)}" title="Click to open ${escapeHTML(item.name)} in The Stage">
        <div class="s08-artifact-item-left">
          <div class="s08-artifact-item-icon ${item.badge === 'SPEC' ? 'icon-spec' : item.badge === 'DIFF' ? 'icon-diff' : item.badge === 'DIAGRAM' ? 'icon-diagram' : 'icon-code'}">
            ${getArtifactIcon(item.ext)}
          </div>
          <div class="s08-artifact-item-meta">
            <div class="s08-artifact-name-row">
              <span class="s08-artifact-item-name" title="${escapeHTML(item.name)}">${escapeHTML(item.name)}</span>
              <span class="s08-artifact-badge-type ${item.type === 'generated' ? 'generated' : ''}">${item.badge || item.ext.toUpperCase()}</span>
            </div>
            <span class="s08-artifact-item-sub">
              <span>${item.size}</span>
              <span>•</span>
              <span>${item.time || 'recent'}</span>
            </span>
          </div>
        </div>
        <div class="s08-artifact-actions">
          <button class="s08-artifact-action-btn s08-artifact-dl-btn" type="button" title="Download ${escapeHTML(item.name)}" aria-label="Download ${escapeHTML(item.name)}" data-custom-tooltip="Download ${escapeHTML(item.name)}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button class="s08-artifact-action-btn s08-artifact-del-btn" type="button" title="Delete ${escapeHTML(item.name)}" aria-label="Delete ${escapeHTML(item.name)}" data-custom-tooltip="Delete ${escapeHTML(item.name)}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        </div>
      </div>
    `).join('');

    artifactsList.querySelectorAll('.s08-artifact-item').forEach(itemEl => {
      const id = itemEl.getAttribute('data-id');
      
      // 1-Click to Open anywhere on the item
      itemEl.addEventListener('click', (e) => {
        if (e.target.closest('.s08-artifact-dl-btn') || e.target.closest('.s08-artifact-del-btn')) return;
        const target = artifactsData.find(a => a.id === id);
        if (target) {
          openArtifactInStage(target);
        }
      });

      const dlBtn = itemEl.querySelector('.s08-artifact-dl-btn');
      if (dlBtn) {
        dlBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const target = artifactsData.find(a => a.id === id);
          if (target) {
            appendLogMessage(`Exported deliverable: ${target.name}`, 'OK');
            dlBtn.style.color = 'var(--color-icon-success, #10B981)';
            setTimeout(() => { dlBtn.style.color = ''; }, 1000);
          }
        });
      }

      const delBtn = itemEl.querySelector('.s08-artifact-del-btn');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const target = artifactsData.find(a => a.id === id);
          if (!target) return;
          const fileName = target.name;

          // Remove deliverable from data store
          artifactsData = artifactsData.filter(a => a.id !== id);
          appendLogMessage(`Deleted deliverable: ${fileName}`, 'WARN');

          // Close matching open tab pill if exists
          if (tabPillsList) {
            const openPill = tabPillsList.querySelector(`.s08-tab-pill[data-tab-name="${fileName}"]`);
            if (openPill) {
              closeTabPill(fileName, openPill);
            }
          }

          // If currently displayed in The Stage, gracefully advance or reset
          if (currentArtifactDoc && (currentArtifactDoc.id === id || currentArtifactDoc.name === fileName)) {
            currentArtifactDoc = null;
            if (artifactsData.length > 0) {
              openArtifactInStage(artifactsData[0]);
            } else {
              const markdownView = document.getElementById('s08-stage-markdown-view');
              const diffView = document.getElementById('s08-stage-diff-view');
              const diagramView = document.getElementById('s08-stage-diagram-view');
              if (markdownView) markdownView.style.display = 'none';
              if (diffView) diffView.style.display = 'none';
              if (diagramView) diagramView.style.display = 'none';
              const filenameEl = document.getElementById('s08-stage-filename');
              if (filenameEl) filenameEl.textContent = 'No deliverable selected';
            }
          }

          renderArtifacts();
        });
      }
    });
  }

  function addArtifactsFromFiles(files) {
    if (!files || !files.length) return;
    Array.from(files).forEach(f => {
      artifactsData.unshift({
        id: 'art-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        name: f.name,
        size: formatArtifactFileSize(f.size),
        type: 'uploaded',
        ext: f.name.includes('.') ? f.name.split('.').pop().toLowerCase() : ''
      });
    });
    renderArtifacts();
    appendLogMessage(`Attached ${files.length} artifact file(s)`, 'OK');
  }

  // Trigger file selection via Browse button or Empty State Upload button
  if (artifactsBrowseBtn) {
    artifactsBrowseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (artifactsData.length === 0) {
        artifactsData = [...sampleUploadedDocs];
        renderArtifacts();
        appendLogMessage('Artifacts loaded from workspace', 'INFO');
      }
      if (artifactsFileInput) artifactsFileInput.click();
    });
  }

  if (artifactsEmptyUploadBtn) {
    artifactsEmptyUploadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (artifactsData.length === 0) {
        artifactsData = [...sampleUploadedDocs];
        renderArtifacts();
        appendLogMessage('Artifacts loaded from workspace', 'INFO');
      }
      if (artifactsFileInput) artifactsFileInput.click();
    });
  }

  if (artifactsFileInput) {
    artifactsFileInput.addEventListener('change', () => {
      if (artifactsFileInput.files && artifactsFileInput.files.length > 0) {
        addArtifactsFromFiles(artifactsFileInput.files);
        artifactsFileInput.value = '';
      }
    });
  }

  // Drag and Drop
  if (artifactsDropzone) {
    artifactsDropzone.addEventListener('click', (e) => {
      if (e.target.closest('#s08-artifacts-browse-btn')) return;
      if (artifactsData.length === 0) {
        artifactsData = [...sampleUploadedDocs];
        renderArtifacts();
        appendLogMessage('Artifacts loaded from workspace', 'INFO');
      }
      if (artifactsFileInput) artifactsFileInput.click();
    });

    ['dragenter', 'dragover'].forEach(evt => {
      artifactsDropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        artifactsDropzone.classList.add('drag-over');
      });
    });

    ['dragleave', 'dragend'].forEach(evt => {
      artifactsDropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        artifactsDropzone.classList.remove('drag-over');
      });
    });

    artifactsDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      artifactsDropzone.classList.remove('drag-over');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addArtifactsFromFiles(e.dataTransfer.files);
      }
    });
  }

  // Cloud integrations (Google Drive & OneDrive)
  if (gdriveBtn) {
    gdriveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      artifactsData.unshift({
        id: 'art-' + Date.now() + '-gd',
        name: 'Technical_Architecture_Spec.gdoc',
        size: '142 KB',
        type: 'uploaded',
        ext: 'doc'
      });
      renderArtifacts();
      appendLogMessage('Connected to Google Drive: Technical_Architecture_Spec.gdoc imported', 'OK');
    });
  }

  if (onedriveBtn) {
    onedriveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      artifactsData.unshift({
        id: 'art-' + Date.now() + '-od',
        name: 'Financial_Forecast_Model.xlsx',
        size: '1.8 MB',
        type: 'uploaded',
        ext: 'xlsx'
      });
      renderArtifacts();
      appendLogMessage('Connected to OneDrive: Financial_Forecast_Model.xlsx imported', 'OK');
    });
  }

  // Search input live filtering
  if (artifactsSearchInput) {
    artifactsSearchInput.addEventListener('input', (e) => {
      artifactSearchQuery = (e.target.value || '').toLowerCase().trim();
      renderArtifacts();
    });
  }

  // Filter Tabs (All, Uploaded, Generated - Existing Sutra Tab Component)
  artifactsFilterTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      artifactsFilterTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      currentArtifactFilter = tab.getAttribute('data-filter') || 'all';
      renderArtifacts();
    });
  });

  // Initial render of artifacts
  renderArtifacts();

  // Stage Deliverable Controls Wiring (Preview / Raw, Zoom, Copy, Download)
  const togglePreviewBtn = document.getElementById('s08-stage-toggle-preview');
  const toggleRawBtn = document.getElementById('s08-stage-toggle-raw');
  if (togglePreviewBtn && toggleRawBtn) {
    togglePreviewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePreviewBtn.classList.add('active');
      toggleRawBtn.classList.remove('active');
      const mdView = document.getElementById('s08-stage-markdown-view');
      const codeView = document.getElementById('s08-stage-code-view');
      if (mdView) mdView.style.display = 'block';
      if (codeView) codeView.style.display = 'none';
    });
    toggleRawBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleRawBtn.classList.add('active');
      togglePreviewBtn.classList.remove('active');
      const mdView = document.getElementById('s08-stage-markdown-view');
      const codeView = document.getElementById('s08-stage-code-view');
      if (mdView) mdView.style.display = 'none';
      if (codeView) codeView.style.display = 'block';
    });
  }

  const zoomInBtn = document.getElementById('s08-stage-zoom-in');
  const zoomOutBtn = document.getElementById('s08-stage-zoom-out');
  const zoomResetBtn = document.getElementById('s08-stage-zoom-reset');
  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (stageZoomLevel < 200) {
        stageZoomLevel += 20;
        updateDiagramZoom();
      }
    });
  }
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (stageZoomLevel > 40) {
        stageZoomLevel -= 20;
        updateDiagramZoom();
      }
    });
  }
  if (zoomResetBtn) {
    zoomResetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      stageZoomLevel = 100;
      updateDiagramZoom();
    });
  }

  // Unified Apple-grade Copy Feedback Helper (Annotation 4)
  function handleCopyFeedback(btn, textToCopy, defaultTooltip = 'Copy') {
    if (!btn) return;
    const originalSvg = btn.innerHTML;
    const originalTooltip = btn.getAttribute('data-custom-tooltip') || btn.getAttribute('title') || defaultTooltip;
    const originalColor = btn.style.color || '';

    const executeCopyUI = () => {
      btn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      `;
      btn.style.color = 'var(--color-icon-success, #059669)';
      btn.setAttribute('data-custom-tooltip', 'Copied!');
      btn.setAttribute('title', 'Copied!');

      // Instantly update active custom tooltip
      if (window.SutraTooltip && typeof window.SutraTooltip.show === 'function') {
        window.SutraTooltip.show(btn, true);
      }

      setTimeout(() => {
        btn.innerHTML = originalSvg;
        btn.style.color = originalColor;
        btn.setAttribute('data-custom-tooltip', originalTooltip);
        btn.setAttribute('title', originalTooltip);
        if (window.SutraTooltip && typeof window.SutraTooltip.sanitize === 'function') {
          window.SutraTooltip.sanitize(btn);
        }
        if (document.activeElement === btn && window.SutraTooltip) {
          window.SutraTooltip.show(btn, true);
        }
      }, 2000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        executeCopyUI();
      }).catch(() => {
        try {
          const ta = document.createElement('textarea');
          ta.value = textToCopy;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          executeCopyUI();
        } catch (_) {
          appendLogMessage('Clipboard copy failed', 'WARN');
        }
      });
    } else {
      try {
        const ta = document.createElement('textarea');
        ta.value = textToCopy;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        executeCopyUI();
      } catch (_) {
        appendLogMessage('Clipboard copy failed', 'WARN');
      }
    }
  }

  const stageCopyBtn = document.getElementById('s08-stage-copy-btn');
  if (stageCopyBtn) {
    stageCopyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      let contentToCopy = '';
      const codeText = document.getElementById('s08-stage-code-text');
      if (codeText && codeText.textContent) contentToCopy = codeText.textContent;
      if (contentToCopy) {
        handleCopyFeedback(stageCopyBtn, contentToCopy, 'Copy Content');
        appendLogMessage('Stage deliverable copied to clipboard', 'OK');
      }
    });
  }

  const stageDlBtn = document.getElementById('s08-stage-dl-btn');
  if (stageDlBtn) {
    stageDlBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const filename = document.getElementById('s08-stage-filename')?.textContent || 'deliverable';
      appendLogMessage(`Exported deliverable: ${filename}`, 'OK');
      stageDlBtn.style.color = 'var(--color-icon-success, #059669)';
      setTimeout(() => { stageDlBtn.style.color = ''; }, 1000);
    });
  }

  const stageCloseBtn = document.getElementById('s08-stage-close-btn');
  if (stageCloseBtn) {
    stageCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const targetPill = tabPillsList ? (
        (currentArtifactDoc ? tabPillsList.querySelector(`.s08-tab-pill[data-tab-name="${currentArtifactDoc.name}"]`) : null) ||
        (currentActiveTab ? tabPillsList.querySelector(`.s08-tab-pill[data-tab-name="${currentActiveTab}"]`) : null) ||
        tabPillsList.querySelector('.s08-tab-pill[data-tab-name="editor"]') ||
        tabPillsList.querySelector('.s08-tab-pill[data-tab-name]:not([data-tab-name="browser"]):not([data-tab-name="sources"]):not([data-tab-name="log viewer"]):not([data-tab-name="logs"])')
      ) : null;
      const targetKey = targetPill ? targetPill.getAttribute('data-tab-name') : (currentArtifactDoc?.name || 'editor');
      closeTabPill(targetKey, targetPill);
    });
  }

  const browserCloseBtn = document.getElementById('s08-browser-close-btn');
  if (browserCloseBtn) {
    browserCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const browserPill = tabPillsList ? tabPillsList.querySelector('.s08-tab-pill[data-tab-name="browser"]') : null;
      closeTabPill('browser', browserPill);
    });
  }

  // 6. Conversational Stream & Chat Input Handling
  const chatInputBox = document.getElementById('s08-chat-input-box');
  const chatTextarea = document.getElementById('s08-chat-textarea');
  const chatSendBtn = document.getElementById('s08-chat-send-btn');
  const chatAttachBtn = document.getElementById('s08-chat-attach-btn');
  const chatMicBtn = document.getElementById('s08-chat-mic-btn');
  const messagesStream = document.getElementById('s08-messages-stream');
  const suggestedPrompts = document.getElementById('s08-suggested-prompts');
  const chatColBody = document.getElementById('s08-chat-col-body');
  const browserCanvasWrap = document.getElementById('s08-browser-canvas-wrap');

  let activeCancelGeneration = null;

  // Helper to add log entries in Log Viewer tab
  function appendLogMessage(msg, tag = 'INFO') {
    const logContent = document.querySelector('.s08-logs-content');
    if (!logContent) return;
    const now = new Date();
    const timeStr = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
    const row = document.createElement('div');
    row.className = `s08-log-row ${tag === 'OK' ? 'ok' : 'info'}`;
    row.innerHTML = `<span class="log-t">${timeStr}</span> <span class="log-tag">${tag}</span> ${escapeHTML(msg)}`;
    logContent.appendChild(row);
    logContent.scrollTop = logContent.scrollHeight;
  }

  // Send button state manager & active input attention
  function updateSendBtnState() {
    if (!chatSendBtn || !chatTextarea) return;
    if (chatSendBtn.classList.contains('is-generating')) return; // keep generating stop state intact
    const hasText = chatTextarea.value.trim().length > 0;
    chatSendBtn.disabled = !hasText;
    chatSendBtn.classList.toggle('is-active', hasText);
  }

  // Dynamic Stop / Cancel Generation State Manager
  function setGeneratingState(isGenerating, cancelFn = null) {
    if (!chatSendBtn) return;
    activeCancelGeneration = isGenerating ? cancelFn : null;

    if (isGenerating) {
      chatSendBtn.classList.add('is-generating');
      chatSendBtn.disabled = false;
      chatSendBtn.setAttribute('data-custom-tooltip', 'Stop generating (Esc)');
      chatSendBtn.setAttribute('title', 'Stop generating (Esc)');
      chatSendBtn.setAttribute('aria-label', 'Stop generating');
      chatSendBtn.innerHTML = `
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
          <rect x="5" y="5" width="14" height="14" rx="2.5"/>
        </svg>
      `;
    } else {
      chatSendBtn.classList.remove('is-generating');
      chatSendBtn.setAttribute('data-custom-tooltip', 'Send (Enter)');
      chatSendBtn.setAttribute('title', 'Send (Enter)');
      chatSendBtn.setAttribute('aria-label', 'Send prompt');
      chatSendBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      `;
      updateSendBtnState();
    }

    if (window.SutraTooltip && typeof window.SutraTooltip.hide === 'function') {
      window.SutraTooltip.hide(true);
    }
  }

  // Auto-resize chat textarea & manage input attention
  if (chatTextarea) {
    chatTextarea.addEventListener('input', () => {
      chatTextarea.style.height = 'auto';
      chatTextarea.style.height = Math.min(chatTextarea.scrollHeight, 120) + 'px';
      updateSendBtnState();
    });

    chatTextarea.addEventListener('focus', () => {
      if (chatInputBox) chatInputBox.classList.add('is-focused');
    });

    chatTextarea.addEventListener('blur', () => {
      if (chatInputBox) chatInputBox.classList.remove('is-focused');
    });

    chatTextarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (chatSendBtn && chatSendBtn.classList.contains('is-generating')) {
          if (typeof activeCancelGeneration === 'function') activeCancelGeneration();
          return;
        }
        submitChatMessage();
      }
    });
  }

  if (chatSendBtn) {
    chatSendBtn.addEventListener('click', () => {
      if (chatSendBtn.classList.contains('is-generating')) {
        if (typeof activeCancelGeneration === 'function') {
          activeCancelGeneration();
        }
        return;
      }
      submitChatMessage();
    });
  }

  // Global Escape key listener to cancel generation if running
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatSendBtn && chatSendBtn.classList.contains('is-generating')) {
      if (typeof activeCancelGeneration === 'function') {
        e.preventDefault();
        activeCancelGeneration();
      }
    }
  });

  // Initial send button state
  updateSendBtnState();

  // Suggested Prompt Chips, Quick-Scope Card & Trace/Chain of Thought Delegation
  if (chatColBody) {
    chatColBody.addEventListener('click', (e) => {
      // 0. Trace Collapsible Summary Trigger toggle
      const traceTrigger = e.target.closest('.sutra-trace-trigger');
      if (traceTrigger) {
        e.preventDefault();
        const collapsible = traceTrigger.closest('.sutra-trace-collapsible');
        if (collapsible) {
          collapsible.classList.toggle('is-open');
          const isOpen = collapsible.classList.contains('is-open');
          traceTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
          collapsible.setAttribute('data-state', isOpen ? 'open' : 'closed');
          appendLogMessage(`Chain of Thought ${isOpen ? 'expanded' : 'collapsed'}`, 'INFO');
        }
        return;
      }

      // Trace Step Row toggle (for thought text, code box, step detail, sources)
      const stepRow = e.target.closest('.sutra-trace-step-row');
      if (stepRow) {
        const stepItem = stepRow.closest('.sutra-trace-step-item');
        if (stepItem && (
          stepItem.querySelector('.sutra-trace-code-box') ||
          stepItem.querySelector('.sutra-trace-thought-text') ||
          stepItem.querySelector('.sutra-trace-sources-list') ||
          stepItem.querySelector('.sutra-trace-step-detail') ||
          stepItem.querySelector('.sutra-trace-badges-wrap')
        )) {
          stepItem.classList.toggle('is-detail-open');
        }
        return;
      }

      // 1. Suggestion text links (Per feedback: populates chat input so user can edit, add, or send)
      const suggestionLink = e.target.closest('.s08-suggestion-link');
      if (suggestionLink) {
        e.preventDefault();
        const promptText = suggestionLink.getAttribute('data-prompt') || suggestionLink.textContent.trim();
        if (chatTextarea && promptText) {
          chatTextarea.value = promptText;
          chatTextarea.style.height = 'auto';
          chatTextarea.style.height = Math.min(chatTextarea.scrollHeight, 120) + 'px';
          updateSendBtnState();
          chatTextarea.focus();
          chatTextarea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          appendLogMessage(`Suggestion populated into chat input: "${promptText.substring(0, 32)}..."`, 'INFO');
        }
        return;
      }

      // 2. Legacy prompt chips (also populate into chat input without auto-submitting)
      const chip = e.target.closest('.s08-prompt-chip');
      if (chip) {
        e.preventDefault();
        const promptText = chip.getAttribute('data-prompt') || chip.querySelector('span:last-child')?.textContent?.trim() || chip.textContent.trim();
        if (chatTextarea && promptText) {
          chatTextarea.value = promptText;
          chatTextarea.style.height = 'auto';
          chatTextarea.style.height = Math.min(chatTextarea.scrollHeight, 120) + 'px';
          updateSendBtnState();
          chatTextarea.focus();
        }
        return;
      }

      const scopeCard = e.target.closest('.s08-quick-scope-card');
      if (scopeCard) {
        const ws = scopeCard.getAttribute('data-ws');
        const wa = scopeCard.getAttribute('data-wa');
        const plan = scopeCard.getAttribute('data-plan') || 'Local';
        if (ws && wa) {
          setWorkspaceAndWorkArea(ws, wa, plan, true);
        }
        return;
      }
    });
  }

  // Attach button feedback
  if (chatAttachBtn) {
    chatAttachBtn.addEventListener('click', () => {
      appendLogMessage('Attachment picker triggered: file/tool upload ready', 'INFO');
      alert('Attach tools, data files, or Figma assets to your task.');
    });
  }

  // Mic button feedback
  if (chatMicBtn) {
    chatMicBtn.addEventListener('click', () => {
      chatMicBtn.classList.toggle('recording');
      const isRec = chatMicBtn.classList.contains('recording');
      chatMicBtn.style.color = isRec ? 'var(--color-status-error, #DC2626)' : '';
      if (isRec) {
        appendLogMessage('Voice input listening...', 'INFO');
        setTimeout(() => {
          if (chatTextarea) {
            chatTextarea.value = 'What is the loan disbursement forecast for this month?';
            updateSendBtnState();
          }
          chatMicBtn.classList.remove('recording');
          chatMicBtn.style.color = '';
          appendLogMessage('Voice transcript captured successfully', 'OK');
        }, 1500);
      }
    });
  }

  let lastUserPrompt = '';

  // --------------------------------------------------------------------------
  // SHADCN TRACE & CHAIN OF THOUGHT SVG & PLAN GENERATOR
  // Reference: https://ui.shadcn.com/docs/components/base/trace
  //            https://ui.shadcn.com/docs/ai-elements/base/chain-of-thought
  //            https://ui.shadcn.com/docs/ai-elements/base/chat
  // --------------------------------------------------------------------------

  function getTraceIconSvg(type, status = '') {
    if (status === 'running' || type === 'spinner') {
      return `<svg class="sutra-trace-spinner" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;
    }
    if (status === 'done' || type === 'check') {
      return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></svg>`;
    }
    if (status === 'error' || type === 'error') {
      return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    }
    if (type === 'globe') {
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`;
    }
    switch (type) {
      case 'file':
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`;
      case 'search':
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;
      case 'terminal':
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`;
      case 'tool':
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
      case 'db':
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>`;
      case 'shield':
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`;
      case 'branch':
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>`;
      case 'folder':
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`;
      case 'brain':
      default:
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>`;
    }
  }

  // Dynamic Context Generator: Adapts reasoning steps based on selected agent, user query, and task scope
  // Provides patterns matching both Snap 1 & 2 (Agent Work Log) and Snap 3 & 4 (Command & Reasoning Trace)
  function getChainOfThoughtPlan(agentName, userPrompt, wsName, waName) {
    const lower = (userPrompt || '').toLowerCase();
    const agent = (agentName || currentAgent || 'Agent General').trim();
    const ws = wsName || currentWorkspaceScope || 'agent-research';
    const wa = waName || currentWorkAreaScope || 'Development Sandbox';
    const plan = currentWorkspacePlan || 'Local';

    // Pattern 1: CI / Test / PNPM Install Failures (Matches Reference Images 1 & 2)
    if (lower.includes('ci') || lower.includes('pnpm') || lower.includes('install') || lower.includes('build fail') || lower.includes('lockfile')) {
      return {
        mode: 'trace',
        summaryTitleRunning: "Thinking...",
        summaryTitleDone: "Worked for 10s",
        totalDurationStr: "10.0s",
        liveThought: "CI installs with a frozen lockfile, so the install stops when package.json and pnpm-lock.yaml disagree. I should check what the last commit changed, then reproduce the install.\n\nCI install failures stem from lockfile discrepancies; investigating the latest commit to understand and reproduce the issue is necessary. The existing package dependencies need evaluation to verify whether a lockfile divergence or checksum mismatch caused the failure.",
        steps: [
          {
            type: 'command',
            title: "Ran pnpm --version",
            output: "10.18.0"
          },
          {
            type: 'command',
            title: "Ran git diff --stat HEAD~1 -- package.json pnpm-lock.yaml",
            output: "package.json | 2 +-\n1 file changed, 1 insertion(+), 1 deletion(-)"
          },
          {
            type: 'failed-command',
            title: "Failed to run pnpm install --frozen-lockfile",
            output: "ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with \"frozen-lockfile\" because pnpm-lock.yaml is not up to date with package.json"
          },
          {
            type: 'sources',
            title: "Used 2 sources",
            sources: [
              { title: "pnpm install | pnpm.io", url: "https://pnpm.io/cli/install" },
              { title: "Continuous Integration | pnpm.io", url: "https://pnpm.io/continuous-integration" }
            ]
          }
        ]
      };
    }

    // Pattern 1b: Capability / Permission Grant (Matches Reference 3)
    if (lower.includes('permission') || lower.includes('capability') || lower.includes('filesystem access') || lower.includes('grant') || lower.includes('mcp')) {
      return {
        mode: 'trace',
        summaryTitleRunning: "Thinking...",
        summaryTitleDone: "Worked for 8s",
        totalDurationStr: "8.0s",
        liveThought: "The agent requires filesystem capability grant to inspect project structure and run build tools. Rather than prompting on every individual action, I am scoping the capability boundary to the workspace with strict zero-network constraints.\n\nEvaluating sandbox isolation boundaries and checking MCP server declaration for filesystem-mcp. Preparing capability authorization payload with reach spelled out.",
        steps: [
          {
            type: 'command',
            title: "Inspected MCP manifest --server=filesystem-mcp",
            output: "server: filesystem-mcp\ncapabilities: [read, write]\nscope: workspace-isolated\nnetwork: disabled"
          },
          {
            type: 'command',
            title: "Ran sandbox-ctl verify-boundaries --isolation=container",
            output: "Sandbox boundary verified.\nRead/write: permitted under workspace\nNetwork: disabled"
          },
          {
            type: 'sources',
            title: "Used 1 source",
            sources: [
              { title: "MCP Security Contract | modelcontextprotocol.io", url: "https://modelcontextprotocol.io" }
            ]
          }
        ]
      };
    }

    // Pattern 2: Financial / Portfolio / Loan Disbursement Forecast
    if (lower.includes('loan disbursement') || lower.includes('forecast') || lower.includes('risk')) {
      return {
        mode: 'trace',
        summaryTitleRunning: "Thinking...",
        summaryTitleDone: "Worked for 10s",
        totalDurationStr: "10.0s",
        liveThought: "Analyzing historical loan disbursement velocity across portfolio cohorts to isolate default risk distributions and projected capital requirements for the current monthly cycle.\n\nI need to query the loan disbursement table, evaluate SME versus commercial exposure bands, and execute a Monte Carlo simulation across 10,000 iterations to determine 95% confidence intervals and tier-1 liquidity reserve requirements.",
        steps: [
          {
            type: 'command',
            title: "Ran psql -c \"SELECT cohort_id, SUM(disbursed_amount), avg_default_rate FROM loans GROUP BY cohort_id\"",
            output: "cohort_id | sum_amount  | avg_default\n----------+-------------+------------\n2026-Q1   | $14,280,000 | 0.042\n2026-Q2   | $18,450,000 | 0.038"
          },
          {
            type: 'command',
            title: `Ran python -m risk.sim --portfolio=${ws.replace(/\\s+/g, '')} --runs=10000`,
            output: "[Monte Carlo Engine] Completed 10,000 iterations.\nDisbursement Velocity: +12.4% MoM\nProjected Capital Requirement: $14.28M\nConfidence Interval (95%): $13.9M - $14.6M"
          },
          {
            type: 'sources',
            title: "Used 2 sources",
            sources: [
              { title: "Portfolio Data Mart | internal.db", url: "#" },
              { title: "Statutory Capital Reserves Policy | regulatory.internal", url: "#" }
            ]
          }
        ]
      };
    }

    // Pattern 3: Scope Selection & Runtime Sandbox Setup (Resolves Review Studio Item [1] context mismatch)
    const isScopePrompt = userPrompt === `${ws} / ${wa}` ||
                          userPrompt === ws ||
                          lower === 'agent-research / development sandbox' ||
                          lower.includes('development sandbox') ||
                          lower.includes('workspace setup');

    if (isScopePrompt) {
      return {
        mode: 'trace',
        summaryTitleRunning: "Thinking...",
        summaryTitleDone: "Worked for 10s",
        totalDurationStr: "10.0s",
        liveThought: `The user selected workspace scope "${ws}" within the "${wa}" environment.\n\nConnecting to the repository manifest to verify remote permissions and active branch integrity. Mounting the isolated container sandbox runtime with 4 vCPUs and 8GB RAM, then indexing workspace AST module exports and API routes to ensure 100% operational readiness.`,
        steps: [
          {
            type: 'command',
            title: `Ran git remote get-url origin (manifest: ${ws})`,
            output: `origin\thttps://github.com/enterprise/${ws}.git (fetch)\norigin\thttps://github.com/enterprise/${ws}.git (push)\nActive branch: main (commit 4f9b2a)`
          },
          {
            type: 'command',
            title: `Ran sandbox-ctl mount --scope="${ws}" --area="${wa}" --isolation=container`,
            output: `Sandbox container initialized.\nMount point: /workspace/sandbox\nNetwork: bridged (TLS 1.3)\nAllocated: 4 vCPUs | 8GB RAM`
          },
          {
            type: 'command',
            title: `Ran sutra-ast index --depth=full --manifest=agent.yaml`,
            output: `Indexed 42 module exports, 18 API routes, and 6 active agent definitions.\nWorkspace readiness: 100% OK`
          },
          {
            type: 'sources',
            title: "Used 2 sources",
            sources: [
              { title: `${ws} Manifest | repo.internal`, url: "#" },
              { title: `${wa} Security Policy | sandbox.internal`, url: "#" }
            ]
          }
        ]
      };
    }

    // Pattern 4: Code Modifications & Design System Sync (Matches Reference Snapshots)
    if (lower.includes('component') || lower.includes('token') || lower.includes('sync') || lower.includes('edit file') || lower.includes('css')) {
      return {
        mode: 'work-log',
        summaryTitleRunning: "Thinking...",
        summaryTitleDone: "Worked for 10s",
        totalDurationStr: "10.0s",
        liveThought: "The user requested synchronizing typography and color tokens with the design system.\n\nEvaluating how tokens and styles are structured across components.css and tokens.json. Identified 14 variable mappings requiring updates, including primary brand hues, neutral surfaces, and font line-heights. Calculating AST diffs and cross-referencing theme variables before updating workspace files.",
        steps: [
          {
            type: 'explore',
            title: "Explored 3 files, 1 folder, 14 searches"
          },
          {
            type: 'file-edit',
            badge: "{ }",
            badgeClass: "css",
            fileName: "components.css",
            add: "+369",
            del: "-0"
          },
          {
            type: 'explore',
            title: "Explored 1 file, 3 searches"
          },
          {
            type: 'file-edit',
            badge: "JS",
            badgeClass: "js",
            fileName: "main.js",
            add: "+771",
            del: "-169"
          },
          {
            type: 'file-edit',
            badge: "M↓",
            badgeClass: "md",
            fileName: "workspace_scope_and_query_interaction_decision_record.md",
            add: "+184",
            del: "-12"
          }
        ]
      };
    }

    // Pattern 5: Jira / Epic / Jira Automation
    if (lower.includes('epic') || lower.includes('jira') || lower.includes('jira') || lower.includes('ticket')) {
      return {
        mode: 'trace',
        summaryTitleRunning: "Thinking...",
        summaryTitleDone: "Worked for 10s",
        totalDurationStr: "10.0s",
        liveThought: "The user wants to generate and link an enterprise epic for Universal Application Login in Jira.\n\nConnecting to the enterprise issue tracker API gateway to validate OAuth permissions. Querying active sprint backlogs to ensure no duplicate authentication epics exist. Deconstructing the authentication flow into architecture specifications, OAuth2 endpoints, and UI deliverables before dispatching the epic creation payload.",
        steps: [
          {
            type: 'command',
            title: "Ran curl -H \"Authorization: Bearer ***\" https://jira.enterprise.internal/api/v2/epics/search?q=Universal+Login",
            output: "{\n  \"total\": 0,\n  \"results\": [],\n  \"status\": \"OK\"\n}"
          },
          {
            type: 'command',
            title: "Ran jira-cli epic create --project=IN --title=\"Universal Application Login\" --priority=High",
            output: "Created Epic: EPIC-104\nKey: IN-104\nStatus: Defined\nAssignee: Design Engineering Team"
          },
          {
            type: 'sources',
            title: "Used 1 source",
            sources: [
              { title: "Jira Enterprise API Gateway | jira.internal", url: "#" }
            ]
          }
        ]
      };
    }

    // Pattern 6: Architecture / Microservice / Spec Review
    if (lower.includes('architecture') || lower.includes('topology') || lower.includes('spec')) {
      return {
        mode: 'trace',
        summaryTitleRunning: "Thinking...",
        summaryTitleDone: "Worked for 10s",
        totalDurationStr: "10.0s",
        liveThought: "Parsing the OpenAPI specification to model service dependency topology, evaluate circuit breaker thresholds, and trace auth token verification latencies.\n\nTraversing workspace service definitions to audit upstream edge proxies against downstream authentication services and databases. Synthesizing service mesh health metrics and resilience configurations.",
        steps: [
          {
            type: 'command',
            title: "Ran openapi-lint validate openapi.yaml",
            output: "openapi.yaml: 0 errors, 0 warnings. 14 schemas, 28 operations loaded."
          },
          {
            type: 'command',
            title: "Ran k8s-mesh topology inspect --service=api-gateway",
            output: "Service: api-gateway (v2.4.1)\nUpstream: cloudflare-edge\nDownstream: [auth-service (P99: 12ms), accounts-db (P99: 24ms)]\nStatus: Healthy"
          },
          {
            type: 'sources',
            title: "Used 2 sources",
            sources: [
              { title: "OpenAPI Specification v3.1 | openapis.org", url: "https://www.openapis.org" },
              { title: "Service Mesh Observability | internal.mesh", url: "#" }
            ]
          }
        ]
      };
    }

    // General Fallback
    const shortPrompt = userPrompt.length > 28 ? userPrompt.substring(0, 26) + '...' : userPrompt;
    return {
      mode: 'trace',
      summaryTitleRunning: "Thinking...",
      summaryTitleDone: "Worked for 10s",
      totalDurationStr: "10.0s",
      liveThought: `Deconstructing prompt intent for "${shortPrompt}" within workspace scope ${ws} / ${wa}.\n\nRetrieving repository manifests and active environment configurations to contextualize recommendations. Parsing AST symbols and routing definitions to formulate accurate execution steps.`,
      steps: [
        {
          type: 'command',
          title: `Ran workspace-query --target="${ws}"`,
          output: `Manifest resolved: ${ws} (${plan})\nActive work area: ${wa}\nStatus: Ready`
        },
        {
          type: 'command',
          title: `Ran sutra-ast check --scope="${wa}"`,
          output: `Loaded AST routes: OK (0 syntax errors, 0 runtime warnings)`
        },
        {
          type: 'sources',
          title: "Used 1 source",
          sources: [
            { title: `${ws} Documentation | internal.docs`, url: "#" }
          ]
        }
      ]
    };
  }

  // Render Single Step in Running State (Spinner + shimmer on title)
  // Render Single Step in Running State (Spinner + shimmer on title)
  function renderSingleStepRunningHtml(step, idx) {
    let title = step.title;
    if (step.type === 'thought') {
      title = step.title ? `${step.title}...` : 'Formulating reasoning plan...';
    } else if (step.type === 'file-edit') {
      title = `Editing ${step.fileName}...`;
    } else if (step.type === 'explore') {
      title = `${step.title}...`;
    } else if (step.type === 'sources') {
      title = 'Fetching reference sources...';
    } else if (step.type === 'command') {
      title = `${step.title}...`;
    }

    return `
      <div class="sutra-trace-step-item" data-step-index="${idx}" data-status="running">
        <div class="sutra-trace-step-row" data-status="running">
          <span class="sutra-trace-step-icon is-running">${getTraceIconSvg('spinner', 'running')}</span>
          <span class="sutra-trace-step-title ${step.type === 'command' ? 'font-mono' : ''}" style="font-size:13px;">${escapeHTML(title)}</span>
        </div>
      </div>
    `;
  }

  // Render Single Step in Completed State (Checkmark/Error + Detail + Arrow adjacent to title)
  function renderSingleStepCompletedHtml(step, idx) {
    if (step.type === 'file-edit') {
      return `
        <div class="sutra-trace-step-item" data-step-index="${idx}">
          <div class="sutra-trace-file-row">
            <span class="sutra-file-action">Edited</span>
            <span class="sutra-file-badge ${escapeHTML(step.badgeClass || 'css')}">${escapeHTML(step.badge || '{}')}</span>
            <span class="sutra-file-name">${escapeHTML(step.fileName)}</span>
            <span class="sutra-diff-stat">
              <span class="sutra-diff-add">${escapeHTML(step.add || '+0')}</span>
              <span class="sutra-diff-del">${escapeHTML(step.del || '-0')}</span>
            </span>
          </div>
        </div>
      `;
    }
    if (step.type === 'explore') {
      return `
        <div class="sutra-trace-step-item" data-step-index="${idx}">
          <div class="sutra-trace-explore-row" role="button" tabindex="0">
            <span>${escapeHTML(step.title)}</span>
            <svg class="sutra-trace-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </div>
        </div>
      `;
    }
    if (step.type === 'thought') {
      return `
        <div class="sutra-trace-step-item is-detail-open" data-step-index="${idx}">
          <div class="sutra-trace-step-row" role="button" tabindex="0">
            <span class="sutra-trace-step-icon is-done">${getTraceIconSvg('check', 'done')}</span>
            <span class="sutra-trace-step-title">${escapeHTML(step.title)}</span>
            <svg class="sutra-trace-step-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
          <div class="sutra-trace-thought-text">${escapeHTML(step.content || '')}</div>
        </div>
      `;
    }
    if (step.type === 'command') {
      return `
        <div class="sutra-trace-step-item is-detail-open" data-step-index="${idx}">
          <div class="sutra-trace-step-row" role="button" tabindex="0">
            <span class="sutra-trace-step-icon is-done">${getTraceIconSvg('check', 'done')}</span>
            <span class="sutra-trace-step-title font-mono" style="font-size:13px;">${escapeHTML(step.title)}</span>
            <svg class="sutra-trace-step-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
          <div class="sutra-trace-code-box">${escapeHTML(step.output || '')}</div>
        </div>
      `;
    }
    if (step.type === 'failed-command') {
      return `
        <div class="sutra-trace-step-item is-failed is-detail-open" data-step-index="${idx}">
          <div class="sutra-trace-step-row is-failed" role="button" tabindex="0">
            <span class="sutra-trace-step-icon is-error">${getTraceIconSvg('error')}</span>
            <span class="sutra-trace-step-title" style="color:var(--color-status-error, #EF4444); font-size:13px;">${escapeHTML(step.title)}</span>
            <svg class="sutra-trace-step-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-status-error, #EF4444)" stroke-width="2.2">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
          <div class="sutra-trace-code-box is-error">${escapeHTML(step.output || '')}</div>
        </div>
      `;
    }
    if (step.type === 'sources') {
      return `
        <div class="sutra-trace-step-item is-detail-open" data-step-index="${idx}">
          <div class="sutra-trace-step-row" role="button" tabindex="0">
            <span class="sutra-trace-step-icon">${getTraceIconSvg('globe')}</span>
            <span class="sutra-trace-step-title" style="font-size:13px;">${escapeHTML(step.title)}</span>
            <svg class="sutra-trace-step-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
          <div class="sutra-trace-sources-list">
            ${(step.sources || []).map(s => `
              <a class="sutra-trace-source-link" href="${escapeHTML(s.url || '#')}" target="_blank" rel="noopener">
                <span class="sutra-trace-step-icon" style="width:13px;height:13px;">${getTraceIconSvg('globe')}</span>
                <span>${escapeHTML(s.title)}</span>
                <svg class="sutra-trace-source-arrow" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
              </a>
            `).join('')}
          </div>
        </div>
      `;
    }
    return `
      <div class="sutra-trace-step-item" data-step-index="${idx}">
        <div class="sutra-trace-step-row" role="button" tabindex="0">
          <span class="sutra-trace-step-icon is-done">${getTraceIconSvg('check', 'done')}</span>
          <span class="sutra-trace-step-title">${escapeHTML(step.title || '')}</span>
        </div>
      </div>
    `;
  }

  // Render HTML for Shadcn Trace & Chain of Thought - Completely transparent
  function renderTraceHtml(cotPlan, isRunning = true) {
    if (!cotPlan) return '';
    const summaryTitle = isRunning ? (cotPlan.summaryTitleRunning || 'Thinking...') : (cotPlan.summaryTitleDone || 'Worked for 10s');
    const statusAttr = isRunning ? 'data-status="running"' : '';
    const triggerIcon = isRunning ? getTraceIconSvg('spinner', 'running') : '';
    const triggerIconClass = isRunning ? 'sutra-trace-icon is-running' : '';
    const thoughtText = cotPlan.liveThought || '';

    return `
      <div class="sutra-trace" role="region" aria-label="Agent Trace">
        <div class="sutra-trace-collapsible is-open" data-state="open">
          <button class="sutra-trace-trigger" type="button" aria-expanded="true" ${statusAttr}>
            <div class="sutra-trace-line" ${statusAttr}>
              ${isRunning ? `<span class="${triggerIconClass}" aria-hidden="true">${triggerIcon}</span>` : ''}
              <span class="sutra-trace-title">${escapeHTML(summaryTitle)}</span>
            </div>
            <svg class="sutra-trace-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
          <div class="sutra-trace-content">
            ${thoughtText ? `
              <div class="sutra-trace-thought-stream">
                <div class="sutra-trace-thought-text">${isRunning ? '' : escapeHTML(thoughtText)}</div>
              </div>
            ` : ''}
            ${isRunning ? `
              <div class="sutra-trace-working-bar" data-status="running">
                <span class="sutra-trace-step-icon is-running">${getTraceIconSvg('spinner', 'running')}</span>
                <span class="sutra-trace-working-text">Working...</span>
              </div>
            ` : ''}
            <div class="sutra-trace-steps">
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Stream through Chain of Thought steps progressively across 10 seconds (User Requirement 1, 2, 3, 4)
  function streamChainOfThought(msgDiv, cotPlan, onComplete) {
    if (!cotPlan) {
      if (typeof onComplete === 'function') onComplete(false);
      return;
    }

    const trigger = msgDiv.querySelector('.sutra-trace-trigger');
    const triggerTitle = trigger ? trigger.querySelector('.sutra-trace-title') : null;
    const triggerIconSlot = trigger ? trigger.querySelector('.sutra-trace-icon') : null;
    const collapsible = msgDiv.querySelector('.sutra-trace-collapsible');
    const thoughtTextEl = msgDiv.querySelector('.sutra-trace-thought-text');
    const workingBar = msgDiv.querySelector('.sutra-trace-working-bar');
    const stepsWrap = msgDiv.querySelector('.sutra-trace-steps');

    if (trigger) trigger.setAttribute('data-status', 'running');
    if (triggerTitle) triggerTitle.textContent = 'Thinking...';
    if (collapsible) {
      collapsible.classList.add('is-open');
      collapsible.setAttribute('data-state', 'open');
    }

    let isHalted = false;
    let elapsedSeconds = 0;
    let thoughtStreamInterval = null;
    let stepInterval = null;

    // Cancellation handler invoked when user clicks the Stop button (■) or presses Escape
    function cancelExecution() {
      if (isHalted) return;
      isHalted = true;

      if (stepInterval) clearInterval(stepInterval);
      if (liveTimer) clearInterval(liveTimer);
      if (thoughtStreamInterval) clearInterval(thoughtStreamInterval);
      if (workingBar) workingBar.remove();

      // 1. Remove running state from trigger button and reflect stopped status
      if (trigger) {
        trigger.removeAttribute('data-status');
        const triggerLine = trigger.querySelector('.sutra-trace-line');
        if (triggerLine) triggerLine.removeAttribute('data-status');
      }
      if (triggerTitle) {
        triggerTitle.textContent = `Stopped after ${elapsedSeconds || 1}s`;
      }
      if (triggerIconSlot) {
        triggerIconSlot.classList.remove('is-running');
        triggerIconSlot.classList.add('is-error');
        triggerIconSlot.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="#EF4444" stroke="none"><rect x="5" y="5" width="14" height="14" rx="2.5"/></svg>`;
      }

      // 2. Mark the currently running step as stopped
      const runningStep = stepsWrap ? stepsWrap.querySelector('.sutra-trace-step-item[data-status="running"]') : null;
      if (runningStep) {
        runningStep.setAttribute('data-status', 'stopped');
        const iconSlot = runningStep.querySelector('.sutra-trace-step-icon');
        if (iconSlot) {
          iconSlot.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
        }
      }

      // 3. Revert send button to default arrow state
      setGeneratingState(false);
      appendLogMessage(`Agent execution halted by user after ${elapsedSeconds || 1}s`, 'INFO');

      // 4. Gracefully collapse trace section and reveal partial response
      setTimeout(() => {
        if (collapsible) {
          collapsible.classList.remove('is-open');
          collapsible.setAttribute('data-state', 'closed');
        }
        if (trigger) {
          trigger.setAttribute('aria-expanded', 'false');
        }

        setTimeout(() => {
          if (typeof onComplete === 'function') {
            onComplete(true);
          }
        }, 200);
      }, 300);
    }

    // Register active execution cancellation handler with dynamic Stop button state
    setGeneratingState(true, cancelExecution);

    // 1. Live dynamic timer ticking every second: Thinking (1s)... Thinking (2s)... up to 10s
    const liveTimer = setInterval(() => {
      elapsedSeconds++;
      if (triggerTitle && trigger && trigger.getAttribute('data-status') === 'running') {
        triggerTitle.textContent = `Thinking (${elapsedSeconds}s)...`;
      }
    }, 1000);

    // 2. Stream Chain of Thoughts reasoning text in real-time word by word (Reference Images 1, 2, 3)
    const fullThought = cotPlan.liveThought || '';
    if (thoughtTextEl && fullThought) {
      thoughtTextEl.textContent = '';
      const thoughtWords = fullThought.split(' ');
      let currentWordIdx = 0;
      // Stream words progressively across ~3.5 seconds
      const wordsPerTick = Math.max(1, Math.ceil(thoughtWords.length / 32));
      thoughtStreamInterval = setInterval(() => {
        if (isHalted) return;
        currentWordIdx += wordsPerTick;
        if (currentWordIdx < thoughtWords.length) {
          thoughtTextEl.textContent = thoughtWords.slice(0, currentWordIdx).join(' ');
        } else {
          thoughtTextEl.textContent = fullThought;
          clearInterval(thoughtStreamInterval);
        }
      }, 95);
    }

    // 3. Sequential Tool Actions & Execution Progression across 10s
    const steps = cotPlan.steps || [];
    const totalDurationMs = 10000; // 10 seconds total execution per user requirement 1
    const stepCount = steps.length || 1;
    const intervalMs = Math.floor(totalDurationMs / stepCount);

    let currentStepIdx = 0;

    if (stepsWrap) stepsWrap.innerHTML = '';

    function showStepRunning(idx) {
      if (!stepsWrap || idx >= steps.length || isHalted) return;
      const step = steps[idx];
      const runningHtml = renderSingleStepRunningHtml(step, idx);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = runningHtml;
      const stepEl = tempDiv.firstElementChild;
      stepsWrap.appendChild(stepEl);

      if (chatColBody) {
        chatColBody.scrollTo({ top: chatColBody.scrollHeight, behavior: 'smooth' });
      }
    }

    function resolveStepDone(idx) {
      if (!stepsWrap || idx >= steps.length || isHalted) return;
      const step = steps[idx];
      const existingEl = stepsWrap.querySelector(`.sutra-trace-step-item[data-step-index="${idx}"]`);
      const completedHtml = renderSingleStepCompletedHtml(step, idx);
      if (existingEl) {
        existingEl.outerHTML = completedHtml;
      } else {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = completedHtml;
        stepsWrap.appendChild(tempDiv.firstElementChild);
      }
    }

    // Start Step 0 in running state immediately
    showStepRunning(0);

    stepInterval = setInterval(() => {
      if (isHalted) {
        clearInterval(stepInterval);
        return;
      }

      resolveStepDone(currentStepIdx);
      currentStepIdx++;

      if (currentStepIdx < steps.length) {
        showStepRunning(currentStepIdx);
      } else {
        clearInterval(stepInterval);
        clearInterval(liveTimer);
        if (thoughtStreamInterval) clearInterval(thoughtStreamInterval);
        if (thoughtTextEl) thoughtTextEl.textContent = fullThought;
        if (workingBar) workingBar.remove();

        // Execution completed normally: revert Stop button back to Send
        setGeneratingState(false);

        // 1. Remove running state from trigger button (Solid text, NO shimmer per Review Studio Item [2])
        if (trigger) {
          trigger.removeAttribute('data-status');
          const triggerLine = trigger.querySelector('.sutra-trace-line');
          if (triggerLine) triggerLine.removeAttribute('data-status');
        }
        if (triggerIconSlot) {
          triggerIconSlot.remove();
        }
        if (triggerTitle) {
          triggerTitle.textContent = cotPlan.summaryTitleDone || 'Worked for 10s';
        }

        // 2. Auto-collapse trace section per User Requirement 3
        setTimeout(() => {
          if (collapsible) {
            collapsible.classList.remove('is-open');
            collapsible.setAttribute('data-state', 'closed');
          }
          if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
          }

          // 3. ONLY after trace collapses, reveal/generate output response per User Requirement 3
          setTimeout(() => {
            if (typeof onComplete === 'function') {
              onComplete(false);
            }
          }, 320);
        }, 400);
      }
    }, intervalMs);
  }

  function submitChatMessage() {
    if (!chatTextarea) return;
    const text = chatTextarea.value.trim();
    if (!text) return;

    lastUserPrompt = text;

    // Reset textarea & button state
    chatTextarea.value = '';
    chatTextarea.style.height = 'auto';
    updateSendBtnState();

    // Collapse and hide scope setup bar immediately upon query submission per user feedback
    const scopeBar = document.getElementById('s08-scope-setup-bar');
    if (scopeBar) scopeBar.classList.add('is-collapsed');
    if (chatColBody) chatColBody.classList.add('has-messages');

    // 1. Append User Message Bubble
    appendMessageBubble('user', text);

    // Update active task title in header if currently 'New task'
    if (s08CrumbCurrent && (s08CrumbCurrent.textContent === 'New task' || s08CrumbCurrent.textContent === 'API Authentication Flow')) {
      const shortTitle = text.length > 34 ? text.substring(0, 32) + '...' : text;
      s08CrumbCurrent.textContent = shortTitle;
    }

    appendLogMessage(`User prompt dispatched: "${text}"`, 'INFO');

    // 2. Simulated Agent Response
    setTimeout(() => {
      generateAgentResponse(text);
    }, 450);
  }

  function appendMessageBubble(sender, content, extraHtml = '', promptContext = '', cotPlan = null, onStreamingComplete = null) {
    if (!messagesStream) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `s08-chat-message ${sender}`;

    if (sender === 'user') {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      msgDiv.innerHTML = `
        <div class="s08-msg-bubble user">
          <div class="s08-msg-text">${escapeHTML(content)}</div>
        </div>
        <div class="s08-msg-user-actions">
          <span class="s08-msg-time">${timeStr}</span>
          <button class="s08-msg-action-btn s08-msg-copy-btn" type="button" aria-label="Copy prompt" title="Copy (⌘C)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
          </button>
          <button class="s08-msg-action-btn s08-msg-revert-btn" type="button" aria-label="Undo changes to this point" title="Undo changes to this point">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 14 4 9l5-5"/>
              <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/>
            </svg>
          </button>
        </div>
      `;

      // Copy prompt handler (Annotation 4: updates tooltip to Copied! and back)
      const copyBtn = msgDiv.querySelector('.s08-msg-copy-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          handleCopyFeedback(copyBtn, content, 'Copy (⌘C)');
          appendLogMessage('User prompt copied to clipboard', 'OK');
        });
      }

      // Revert prompt with confirmation dialog modal (Annotation 1 - Reference Snapshot 2)
      const revertBtn = msgDiv.querySelector('.s08-msg-revert-btn');
      if (revertBtn) {
        revertBtn.addEventListener('click', () => {
          openConfirmUndoModal(msgDiv, content);
        });
      }

    } else {
      const activeAgentName = currentAgent || 'Agent General';
      const textLen = (content || '').length;
      const targetPrompt = promptContext || lastUserPrompt || 'loan disbursement forecast';
      
      const traceHtml = cotPlan ? renderTraceHtml(cotPlan, true) : '';
      const textStyle = cotPlan ? 'display: none; opacity: 0; transition: opacity 0.3s ease;' : '';

      msgDiv.innerHTML = `
        <div class="s08-msg-agent-header">
          <span class="s08-msg-agent-badge">${escapeHTML(activeAgentName)}</span>
          <span class="s08-msg-time">Just now</span>
        </div>
        <div class="s08-msg-bubble agent">
          ${traceHtml}
          <div class="s08-msg-text" style="${textStyle}">${content}</div>
          ${extraHtml}
        </div>
        <div class="s08-msg-agent-footer">
          <div class="s08-msg-agent-actions">
            <!-- Copy response -->
            <button class="s08-msg-action-btn s08-agent-copy-btn" type="button" aria-label="Copy response" title="Copy response" data-custom-tooltip="Copy response">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            </button>

            <!-- Feedback: Good response (Clean full closed Lucide/Feather path per Annotation 3) -->
            <button class="s08-msg-action-btn s08-thumb-up-btn" type="button" aria-label="Good response" title="Good response">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
              </svg>
            </button>

            <!-- Feedback: Bad response (Clean full closed Lucide/Feather path per Annotation 3) -->
            <button class="s08-msg-action-btn s08-thumb-down-btn" type="button" aria-label="Bad response" title="Bad response">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/>
              </svg>
            </button>

            <!-- Regenerate -->
            <button class="s08-msg-action-btn s08-regenerate-btn" type="button" aria-label="Regenerate response" title="Regenerate response (⌘R)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M8 16H3v5"/>
              </svg>
            </button>
          </div>

          <!-- Message Timing telemetry stats row -->
          <div class="s08-msg-timing" data-custom-tooltip="Reasoning streaming in progress..." title="Reasoning streaming in progress...">
            <span class="timing-item"><span class="timing-key">ttft</span> <span class="timing-val">0.2s</span></span>
            <span class="timing-item"><span class="timing-key">total</span> <span class="timing-val">running...</span></span>
            <span class="timing-item"><span class="timing-key">tok/s</span> <span class="timing-val">--</span></span>
            <span class="timing-item"><span class="timing-key">tokens</span> <span class="timing-val">--</span></span>
            <span class="timing-item"><span class="timing-key">cost</span> <span class="timing-val">--</span></span>
          </div>
        </div>
      `;

      // Copy response handler
      const copyBtn = msgDiv.querySelector('.s08-agent-copy-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          const bubbleText = msgDiv.querySelector('.s08-msg-text')?.innerText || '';
          handleCopyFeedback(copyBtn, bubbleText, 'Copy response');
          appendLogMessage('Agent response copied to clipboard', 'OK');
        });
      }

      // Thumbs up / down feedback handlers
      const thumbUpBtn = msgDiv.querySelector('.s08-thumb-up-btn');
      const thumbDownBtn = msgDiv.querySelector('.s08-thumb-down-btn');

      if (thumbUpBtn && thumbDownBtn) {
        thumbUpBtn.addEventListener('click', () => {
          thumbUpBtn.classList.toggle('active');
          thumbUpBtn.classList.toggle('thumb-up');
          thumbDownBtn.classList.remove('active', 'thumb-down');
          const isPos = thumbUpBtn.classList.contains('active');
          appendLogMessage(isPos ? 'Feedback recorded: positive response (+1)' : 'Feedback cleared', 'OK');
        });

        thumbDownBtn.addEventListener('click', () => {
          if (thumbDownBtn.classList.contains('active')) {
            thumbDownBtn.classList.remove('active', 'thumb-down');
            appendLogMessage('Feedback cleared', 'INFO');
          } else {
            // Reference 1: A thumbs-down that asks why, so the signal arrives with a reason attached
            openFeedbackDialog(msgDiv, activeAgentName);
          }
        });
      }

      // Regenerate handler
      const regenBtn = msgDiv.querySelector('.s08-regenerate-btn');
      if (regenBtn) {
        regenBtn.addEventListener('click', () => {
          regenBtn.classList.add('rotating');
          appendLogMessage('Regenerating response for task...', 'INFO');
          setTimeout(() => {
            regenBtn.classList.remove('rotating');
            generateAgentResponse(targetPrompt, msgDiv);
          }, 450);
        });
      }

      // If cotPlan exists, start streaming progression!
      if (cotPlan) {
        streamChainOfThought(msgDiv, cotPlan, (wasCancelled = false) => {
          const msgText = msgDiv.querySelector('.s08-msg-text');
          if (msgText) {
            if (wasCancelled) {
              // When generation is stopped by user, DO NOT show response output! Display ONLY simple text per Review Studio Item [1]
              msgText.innerHTML = `
                <div class="s08-generation-stopped-notice">Generation stopped by user</div>
              `;
              // Hide copy and feedback rating buttons since no output was produced
              const copyBtn = msgDiv.querySelector('.s08-agent-copy-btn');
              if (copyBtn) copyBtn.style.display = 'none';
              const thumbUp = msgDiv.querySelector('.s08-thumb-up-btn');
              if (thumbUp) thumbUp.style.display = 'none';
              const thumbDown = msgDiv.querySelector('.s08-thumb-down-btn');
              if (thumbDown) thumbDown.style.display = 'none';
            }
            msgText.style.display = 'block';
            msgText.offsetHeight; // trigger reflow
            msgText.style.opacity = '1';
          }

          // Update telemetry stats
          const ttft = '0.2s';
          const totalTime = wasCancelled ? 'Halted' : (cotPlan.totalDurationStr || '10.0s');
          const tokSpeed = wasCancelled ? '--' : '76';
          const tokenCount = wasCancelled ? '--' : (textLen > 200 ? '1,204' : '842');
          const costEstimate = wasCancelled ? '--' : (textLen > 200 ? '$0.018' : '$0.012');
          const timingEl = msgDiv.querySelector('.s08-msg-timing');
          if (timingEl) {
            const tip = wasCancelled ? 'Generation halted by user before completion' : `Streaming telemetry metrics\nTTFT ${ttft} · Total ${totalTime} · ${tokSpeed} tok/s · ${tokenCount} tokens (${costEstimate})`;
            timingEl.setAttribute('data-custom-tooltip', tip);
            timingEl.setAttribute('title', tip);
            timingEl.innerHTML = `
              <span class="timing-item"><span class="timing-key">ttft</span> <span class="timing-val">${ttft}</span></span>
              <span class="timing-item"><span class="timing-key">total</span> <span class="timing-val">${totalTime}</span></span>
              <span class="timing-item"><span class="timing-key">tok/s</span> <span class="timing-val">${tokSpeed}</span></span>
              <span class="timing-item"><span class="timing-key">tokens</span> <span class="timing-val">${tokenCount}</span></span>
              <span class="timing-item"><span class="timing-key">cost</span> <span class="timing-val">${costEstimate}</span></span>
            `;
          }

          if (chatColBody) {
            chatColBody.scrollTo({
              top: chatColBody.scrollHeight,
              behavior: 'smooth'
            });
          }

          if (typeof onStreamingComplete === 'function' && !wasCancelled) {
            onStreamingComplete(wasCancelled);
          }
        });
      }
    }

    // Wrap each conversational turn (user prompt + assistant response) in its own parent container
    if (sender === 'user') {
      // Reference 2: Day Timestamps (Chronology in a long thread: days marked, times on hover)
      if (messagesStream && !messagesStream.querySelector('.s08-thread-day-divider')) {
        ensureThreadDayDivider('Today');
      }
      const turnContainer = document.createElement('div');
      turnContainer.className = 's08-conversation-turn';
      turnContainer.appendChild(msgDiv);
      messagesStream.appendChild(turnContainer);
    } else {
      let activeTurn = messagesStream.querySelector('.s08-conversation-turn:last-child');
      if (!activeTurn) {
        activeTurn = document.createElement('div');
        activeTurn.className = 's08-conversation-turn';
        messagesStream.appendChild(activeTurn);
      }
      activeTurn.appendChild(msgDiv);
    }

    // Auto-scroll chat body & mark has-messages so scope bar docks to top
    if (chatColBody) {
      chatColBody.classList.add('has-messages');
      chatColBody.scrollTo({
        top: chatColBody.scrollHeight,
        behavior: 'smooth'
      });
    }
  }

  // In-place replacement helper for regenerated responses
  function updateExistingAgentMessage(msgDiv, newHtml, targetPrompt, cotPlan = null, onPostAction = null) {
    const bubble = msgDiv.querySelector('.s08-msg-bubble');
    if (!bubble) return;

    if (cotPlan) {
      bubble.innerHTML = `
        ${renderTraceHtml(cotPlan, true)}
        <div class="s08-msg-text" style="display: none; opacity: 0; transition: opacity 0.3s ease;">${newHtml}</div>
      `;

      // Reset timing element
      const timingEl = msgDiv.querySelector('.s08-msg-timing');
      if (timingEl) {
        timingEl.innerHTML = `
          <span class="timing-item"><span class="timing-key">ttft</span> <span class="timing-val">0.2s</span></span>
          <span class="timing-item"><span class="timing-key">total</span> <span class="timing-val">running...</span></span>
          <span class="timing-item"><span class="timing-key">tok/s</span> <span class="timing-val">--</span></span>
          <span class="timing-item"><span class="timing-key">tokens</span> <span class="timing-val">--</span></span>
          <span class="timing-item"><span class="timing-key">cost</span> <span class="timing-val">--</span></span>
        `;
      }

      streamChainOfThought(msgDiv, cotPlan, (wasCancelled = false) => {
        const textDiv = bubble.querySelector('.s08-msg-text');
        if (textDiv) {
          if (wasCancelled) {
            // When cancelled by user, DO NOT show response output! Display ONLY simple text per Review Studio Item [1]
            textDiv.innerHTML = `
              <div class="s08-generation-stopped-notice">Generation stopped by user</div>
            `;
            // Hide copy and feedback rating buttons
            const copyBtn = msgDiv.querySelector('.s08-agent-copy-btn');
            if (copyBtn) copyBtn.style.display = 'none';
            const thumbUp = msgDiv.querySelector('.s08-thumb-up-btn');
            if (thumbUp) thumbUp.style.display = 'none';
            const thumbDown = msgDiv.querySelector('.s08-thumb-down-btn');
            if (thumbDown) thumbDown.style.display = 'none';
          }
          textDiv.style.display = 'block';
          textDiv.offsetHeight;
          textDiv.style.opacity = '1';
        }

        const totalTime = wasCancelled ? 'Halted' : (cotPlan.totalDurationStr || '10.0s');
        const tokSpeed = wasCancelled ? '--' : (88 + Math.floor(Math.random() * 25));
        const tokenCount = wasCancelled ? '--' : (270 + Math.floor(Math.random() * 90));
        const costEstimate = wasCancelled ? '--' : ('$' + (tokenCount * 0.000002).toFixed(5));
        if (timingEl) {
          const tip = wasCancelled ? 'Generation halted by user before completion' : `Streaming telemetry metrics\nTTFT 0.2s · Total ${totalTime} · ${tokSpeed} tok/s · ${tokenCount} tokens (${costEstimate})`;
          timingEl.setAttribute('data-custom-tooltip', tip);
          timingEl.setAttribute('title', tip);
          timingEl.innerHTML = `
            <span class="timing-item"><span class="timing-key">ttft</span> <span class="timing-val">0.2s</span></span>
            <span class="timing-item"><span class="timing-key">total</span> <span class="timing-val">${totalTime}</span></span>
            <span class="timing-item"><span class="timing-key">tok/s</span> <span class="timing-val">${tokSpeed}</span></span>
            <span class="timing-item"><span class="timing-key">tokens</span> <span class="timing-val">${tokenCount}</span></span>
            <span class="timing-item"><span class="timing-key">cost</span> <span class="timing-val">${costEstimate}</span></span>
          `;
        }

        if (chatColBody) {
          chatColBody.scrollTo({
            top: chatColBody.scrollHeight,
            behavior: 'smooth'
          });
        }

        if (typeof onPostAction === 'function' && !wasCancelled) {
          onPostAction(wasCancelled);
        }
      });
    } else {
      bubble.style.opacity = '0';
      setTimeout(() => {
        bubble.innerHTML = `<div class="s08-msg-text">${newHtml}</div>`;
        bubble.style.transition = 'opacity 0.24s ease';
        bubble.style.opacity = '1';
        if (typeof onPostAction === 'function') onPostAction();
      }, 80);
    }

    // Reset feedback thumb states
    const thumbUpBtn = msgDiv.querySelector('.s08-thumb-up-btn');
    const thumbDownBtn = msgDiv.querySelector('.s08-thumb-down-btn');
    if (thumbUpBtn) thumbUpBtn.classList.remove('active', 'thumb-up');
    if (thumbDownBtn) thumbDownBtn.classList.remove('active', 'thumb-down');
  }

  function generateAgentResponse(userPrompt, targetMsgDivToReplace = null) {
    const lower = userPrompt.toLowerCase();
    const wsName = currentWorkspaceScope || (scopeWsBadge && !scopeWsBadge.classList.contains('is-empty') ? scopeWsBadge.textContent : '');
    const waName = currentWorkAreaScope || (scopeWaBadge && !scopeWaBadge.classList.contains('is-empty') ? scopeWaBadge.textContent : '');
    const planName = currentWorkspacePlan || 'Local';

    const cotPlan = getChainOfThoughtPlan(currentAgent, userPrompt, wsName, waName);

    let responseHtml = '';
    let onPostAction = null;
    let logMsg = '';

    // 1. CI / PNPM / Build Failures (Directly matches "Why does pnpm install fail in CI?")
    if (lower.includes('ci') || lower.includes('pnpm') || lower.includes('install') || lower.includes('lockfile') || lower.includes('build fail')) {
      responseHtml = `
        <div class="s08-agent-md-response">
          <p>The CI build is failing during <code>pnpm install</code> because CI pipelines run with the <code>--frozen-lockfile</code> flag enabled by default. This flag strictly enforces that <code>pnpm-lock.yaml</code> must be fully up to date with <code>package.json</code>, terminating immediately if any discrepancy is detected.</p>

          <blockquote>
            <p><strong>Root Cause Diagnostic:</strong> <code>ERR_PNPM_OUTDATED_LOCKFILE</code><br>
            A recent commit modified dependencies in <code>package.json</code> without committing an updated <code>pnpm-lock.yaml</code>. Because the lockfile checksum does not match the manifest, CI aborts the build to prevent non-deterministic dependency installations.</p>
          </blockquote>

          <p><strong>Resolution Steps:</strong></p>
          <ol class="s08-md-steps-list">
            <li><strong>Regenerate lockfile locally:</strong> Run <code>pnpm install</code> on your branch to update dependency resolutions and integrity hashes in <code>pnpm-lock.yaml</code>.</li>
            <li><strong>Stage and commit:</strong> Stage the updated lockfile alongside your changes:
              <pre><code>git add pnpm-lock.yaml && git commit -m "chore: sync pnpm-lock.yaml with package.json"</code></pre>
            </li>
            <li><strong>Verify locally with frozen lockfile:</strong> Test the exact CI command before pushing:
              <pre><code>pnpm install --frozen-lockfile</code></pre>
            </li>
          </ol>

          <p><strong>Suggested next actions:</strong></p>
          <ul class="s08-md-suggestions-list">
            <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Run pnpm install to update pnpm-lock.yaml">Run pnpm install to update pnpm-lock.yaml</a></li>
            <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Inspect git diff for HEAD~1 package changes">Inspect git diff for HEAD~1 package changes</a></li>
            <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Verify CI workflow frozen-lockfile configuration">Verify CI workflow frozen-lockfile configuration</a></li>
            <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Review architecture spec and API topology">Review architecture spec and API topology</a></li>
          </ul>
        </div>
      `;
      logMsg = 'Diagnosed CI failure: ERR_PNPM_OUTDATED_LOCKFILE in pnpm-lock.yaml';

    // 2. Loan Disbursement & Portfolio Risk Forecast
    } else if (lower.includes('loan disbursement') || lower.includes('forecast') || lower.includes('risk')) {
      responseHtml = `
        <div class="s08-agent-md-response">
          <p>I have analyzed historical disbursement velocity across your portfolio and modeled the forecast for <strong>October 2026</strong>.</p>
          <div class="s08-forecast-summary-box">
            <div class="s08-forecast-metric">
              <span class="metric-lbl">Projected Disbursement</span>
              <span class="metric-val">$14.28M</span>
              <span class="metric-trend pos">+12.4% vs last mo</span>
            </div>
            <div class="s08-forecast-metric">
              <span class="metric-lbl">Active Applications</span>
              <span class="metric-val">1,248</span>
              <span class="metric-trend neutral">94% automated</span>
            </div>
          </div>
          <blockquote>
            <p><strong>Confidence Band (95%):</strong> <code>$13.9M – $14.6M</code> &nbsp;•&nbsp; SME & Commercial portfolios<br>
            Statutory capital reserve requirement: <code>$1.42M</code> (within Tier-1 safety bounds).</p>
          </blockquote>
          <p>A live interactive forecast breakdown has been rendered in your <strong>Browser</strong> tab.</p>

          <p><strong>Suggested next actions:</strong></p>
          <ul class="s08-md-suggestions-list">
            <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Run Monte Carlo simulation across delinquency distributions">Run Monte Carlo simulation across delinquency distributions</a></li>
            <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Why does pnpm install fail in CI?">Why does pnpm install fail in CI?</a></li>
            <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Create Epic EPIC-104 for Universal Login in Jira">Create Epic EPIC-104 for Universal Login in Jira</a></li>
            <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Review architecture spec and API topology">Review architecture spec and API topology</a></li>
          </ul>
        </div>
      `;

      onPostAction = () => {
        if (browserCanvasWrap) {
          browserCanvasWrap.innerHTML = `
            <div class="s08-browser-loaded-view">
              <div class="s08-forecast-board">
                <div class="s08-board-header">
                  <div>
                    <h3 class="s08-board-title">Loan Disbursement Forecast — October 2026</h3>
                    <p class="s08-board-sub">Real-time simulation powered by Acme Inc Risk Models</p>
                  </div>
                  <span class="s08-board-status-pill">Live Simulation</span>
                </div>
                <div class="s08-kpi-grid">
                  <div class="s08-kpi-card">
                    <div class="s08-kpi-title">Total Approved</div>
                    <div class="s08-kpi-number">$14,280,000</div>
                    <div class="s08-kpi-meta">+12.4% ahead of pace</div>
                  </div>
                  <div class="s08-kpi-card">
                    <div class="s08-kpi-title">Average Ticket Size</div>
                    <div class="s08-kpi-number">$11,440</div>
                    <div class="s08-kpi-meta">SME & Commercial loans</div>
                  </div>
                  <div class="s08-kpi-card">
                    <div class="s08-kpi-title">Default Risk Probability</div>
                    <div class="s08-kpi-number">0.42%</div>
                    <div class="s08-kpi-meta">Within tier-1 safety band</div>
                  </div>
                </div>
                <div class="s08-forecast-bars">
                  <div class="s08-bar-col"><div class="s08-bar-fill" style="height: 48%;"></div><span>W1 ($2.8M)</span></div>
                  <div class="s08-bar-col"><div class="s08-bar-fill" style="height: 62%;"></div><span>W2 ($3.6M)</span></div>
                  <div class="s08-bar-col"><div class="s08-bar-fill" style="height: 78%;"></div><span>W3 ($4.2M)</span></div>
                  <div class="s08-bar-col active"><div class="s08-bar-fill" style="height: 92%;"></div><span>W4 ($3.68M)</span></div>
                </div>
              </div>
            </div>
          `;
        }
        setActiveTab('browser');
      };
      logMsg = 'Forecast dataset calculated: $14.28M projected disbursement';

    // 3. Jira / Epic / Jira Automation
    } else if (lower.includes('epic') || lower.includes('jira') || lower.includes('universal login') || lower.includes('jira') || lower.includes('ticket')) {
      responseHtml = `
        <div class="s08-agent-md-response">
          <p><span style="color:var(--color-vendor-jira-blue, #0052CC); font-weight:700;">[Jira]</span> <strong>Epic EPIC-104 committed to Jira</strong>.</p>
          <blockquote>
            <p><strong>Universal Application Login</strong> &nbsp;•&nbsp; Status: <code>Defined</code><br>
            Jira ID: <code>IN-104</code> &nbsp;•&nbsp; Key: <a class="s08-jira-link" data-jira-key="EPIC-104" href="https://jira.enterprise.internal/epics/EPIC-104" style="color:var(--color-vendor-jira-blue, #0052CC); font-weight:700; text-decoration:none; cursor:pointer;">[EPIC-104 ↗]</a><br>
            Workspace: <code>${escapeHTML(wsName || 'Acme Inc')}</code> &nbsp;•&nbsp; Work Area: <code>${escapeHTML(waName || 'Design Engineering')}</code></p>
          </blockquote>
          <p>Click <a class="s08-jira-link" data-jira-key="EPIC-104" href="https://jira.enterprise.internal/epics/EPIC-104" style="color:var(--color-vendor-jira-blue, #0052CC); font-weight:700; text-decoration:underline; cursor:pointer;">[EPIC-104 ↗]</a> to inspect the live ticket in the embedded <strong>Browser</strong> tab, or explore the spec in the <strong>Editor</strong>.</p>

          <p><strong>Suggested next actions:</strong></p>
          <ul class="s08-md-suggestions-list">
            <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Generate acceptance criteria and test cases for EPIC-104">Generate acceptance criteria and test cases for EPIC-104</a></li>
            <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Why does pnpm install fail in CI?">Why does pnpm install fail in CI?</a></li>
            <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Review architecture spec and API topology">Review architecture spec and API topology</a></li>
            <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Sync typography and color tokens with design system">Sync typography and color tokens with design system</a></li>
          </ul>
        </div>
      `;

      onPostAction = () => {
        navigateBrowser('https://jira.enterprise.internal/epics/EPIC-104');
      };
      logMsg = 'Epic EPIC-104 created in Jira [IN-104]';

    // 4. Token & Design System Sync
    } else if (lower.includes('token') || lower.includes('typography') || lower.includes('color') || lower.includes('design system')) {
      responseHtml = `
        <div class="s08-agent-md-response">
          <p>Synced tokens across <strong>colors.json</strong> and <strong>typography.json</strong>. View the updated definitions in the <strong>Editor</strong> tab.</p>
          <blockquote>
            <p><strong>Token Diff:</strong> <code>48 variables updated</code> (32 colors, 16 typography scales)<br>
            WCAG 2.2 AAA color contrast verified across dark and light themes.</p>
          </blockquote>

          <p><strong>Suggested next actions:</strong></p>
          <ul class="s08-md-suggestions-list">
            <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Audit WCAG contrast ratios across dark mode surfaces">Audit WCAG contrast ratios across dark mode surfaces</a></li>
            <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Inspect diff in components.css and tokens.json">Inspect diff in components.css and tokens.json</a></li>
            <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Why does pnpm install fail in CI?">Why does pnpm install fail in CI?</a></li>
            <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Review architecture spec and API topology">Review architecture spec and API topology</a></li>
          </ul>
        </div>
      `;

      onPostAction = () => {
        openOrSwitchTab('editor');
      };
      logMsg = 'Tokens synchronizer: updated 48 design variables';

    // 5. Architecture / Service Topology / Spec Review
    } else if (lower.includes('architecture') || lower.includes('topology') || lower.includes('spec') || lower.includes('microservice') || lower.includes('openapi')) {
      responseHtml = `
        <div class="s08-agent-md-response">
          <p>I have audited the OpenAPI specification and inspected the live service mesh topology for <strong>api-gateway</strong>.</p>

          <blockquote>
            <p><strong>Topology Health:</strong> <code>14 schemas</code> &nbsp;•&nbsp; <code>28 operations</code> &nbsp;•&nbsp; Status: <code>Healthy</code><br>
            Upstream: <code>cloudflare-edge</code> &nbsp;•&nbsp; Downstream: <code>auth-service</code> (P99: 12ms), <code>accounts-db</code> (P99: 24ms)<br>
            Circuit breaker thresholds: 50% error rate over 10s window; auto-fallback enabled.</p>
          </blockquote>

          <p><strong>Key Observations:</strong></p>
          <ol class="s08-md-steps-list">
            <li><strong>Latency SLA:</strong> P99 response times across downstream authentication microservices remain within the 15ms target.</li>
            <li><strong>Schema Validation:</strong> 0 schema errors detected across OpenAPI 3.1 definitions.</li>
            <li><strong>Resilience:</strong> Rate-limiting headers and retry policies are actively enforced.</li>
          </ol>

          <p><strong>Suggested next actions:</strong></p>
          <ul class="s08-md-suggestions-list">
            <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Audit circuit breaker thresholds for auth-service">Audit circuit breaker thresholds for auth-service</a></li>
            <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Inspect OpenAPI 3.1 schema definitions in Editor">Inspect OpenAPI 3.1 schema definitions in Editor</a></li>
            <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Why does pnpm install fail in CI?">Why does pnpm install fail in CI?</a></li>
            <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="What is the loan disbursement forecast for this month?">What is the loan disbursement forecast for this month?</a></li>
          </ul>
        </div>
      `;

      onPostAction = () => {
        openOrSwitchTab('editor');
      };
      logMsg = 'Architecture review complete: OpenAPI 3.1 & service mesh healthy';

    // 5b. Permission Grant / Capability Scoping (Reference 3 - "Granting a capability rather than approving one action")
    } else if (lower.includes('permission') || lower.includes('capability') || lower.includes('filesystem access') || lower.includes('grant') || lower.includes('mcp')) {
      const permMountId = 's08-perm-mount-' + Date.now();
      responseHtml = `
        <div class="s08-agent-md-response">
          <p>The agent is requesting capability-based authorization to perform autonomous workspace modifications and execute verified tools.</p>
          <blockquote>
            <p><strong>Capability Grant:</strong> Granting a capability rather than approving one action at a time, with reach and safety boundaries explicitly spelled out.</p>
          </blockquote>
          <div class="s08-permission-mount" id="${permMountId}"></div>
          <p><strong>Suggested next actions:</strong></p>
          <ul class="s08-md-suggestions-list">
            <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Why does pnpm install fail in CI?">Why does pnpm install fail in CI?</a></li>
            <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="What is the loan disbursement forecast for this month?">What is the loan disbursement forecast for this month?</a></li>
          </ul>
        </div>
      `;

      onPostAction = () => {
        const mountEl = document.getElementById(permMountId);
        if (mountEl) {
          const card = createPermissionGrantCard({
            capability: 'Filesystem access',
            requester: 'requested by filesystem-mcp',
            grants: [
              'Read and write files under the workspace',
              'Run commands you have already approved',
              'No network access'
            ]
          });
          mountEl.appendChild(card);
        }
      };
      logMsg = 'Capability authorization requested: Filesystem access (filesystem-mcp)';

    // 6. Scope Selection, Specific Queries, or General Fallback
    } else {
      if (wsName && waName) {
        const isScopeQuery = userPrompt === `${wsName} / ${waName}` || userPrompt.includes(wsName);
        const introText = isScopeQuery
          ? `Workspace and work area context established for <strong>${escapeHTML(wsName)}</strong>.`
          : `I have processed your instruction: <em>"${escapeHTML(userPrompt)}"</em>.`;

        responseHtml = `
          <div class="s08-agent-md-response">
            <p>${introText}</p>
            
            <blockquote>
              <p><strong>Active Scope:</strong> <code>${escapeHTML(wsName)}</code> / <code>${escapeHTML(waName)}</code> (<em>${escapeHTML(planName)}</em>)<br>
              Task execution context is scoped under <strong>${escapeHTML(wsName)}</strong> in the <strong>${escapeHTML(waName)}</strong> work area. Connected environment is active with live telemetry and 4 loaded deliverables.</p>
            </blockquote>

            <p><strong>Suggested next actions:</strong></p>
            <ul class="s08-md-suggestions-list">
              <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Why does pnpm install fail in CI?">Why does pnpm install fail in CI?</a></li>
              <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="What is the loan disbursement forecast for this month?">What is the loan disbursement forecast for this month?</a></li>
              <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Create Epic EPIC-104 for Universal Login in Jira">Create Epic EPIC-104 for Universal Login in Jira</a></li>
              <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Review architecture spec and API topology">Review architecture spec and API topology</a></li>
              <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Sync typography and color tokens with design system">Sync typography and color tokens with design system</a></li>
            </ul>
          </div>
        `;
      } else {
        const isGreeting = lower === 'hi' || lower === 'hello' || lower === 'hey' || lower === '';
        if (isGreeting) {
          responseHtml = `
            <div class="s08-agent-md-response">
              <p>Hello! I am ready to collaborate with you. To tailor code generation, specs, and file artifacts to your project, please select an active <strong>Workspace</strong> and <strong>Work Area</strong> from the top-left sidebar or scope selector.</p>

              <p><strong>Suggested next actions:</strong></p>
              <ul class="s08-md-suggestions-list">
                <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Why does pnpm install fail in CI?">Why does pnpm install fail in CI?</a></li>
                <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="What is the loan disbursement forecast for this month?">What is the loan disbursement forecast for this month?</a></li>
                <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Create Epic EPIC-104 for Universal Login in Jira">Create Epic EPIC-104 for Universal Login in Jira</a></li>
                <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Review architecture spec and API topology">Review architecture spec and API topology</a></li>
                <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Sync typography and color tokens with design system">Sync typography and color tokens with design system</a></li>
              </ul>
            </div>
          `;
        } else {
          responseHtml = `
            <div class="s08-agent-md-response">
              <p>I have processed your query: <em>"${escapeHTML(userPrompt)}"</em>.</p>

              <blockquote>
                <p><strong>Execution Analysis:</strong> Reasoning trace completed.<br>
                To commit changes, write file artifacts, or run automated verification directly against repository code, select a <strong>Workspace</strong> and <strong>Work Area</strong> from the scope menu.</p>
              </blockquote>

              <p><strong>Suggested next actions:</strong></p>
              <ul class="s08-md-suggestions-list">
                <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Why does pnpm install fail in CI?">Why does pnpm install fail in CI?</a></li>
                <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Review architecture spec and API topology">Review architecture spec and API topology</a></li>
                <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="What is the loan disbursement forecast for this month?">What is the loan disbursement forecast for this month?</a></li>
                <li><a href="javascript:void(0)" class="s08-suggestion-link" data-prompt="Create Epic EPIC-104 for Universal Login in Jira">Create Epic EPIC-104 for Universal Login in Jira</a></li>
              </ul>
            </div>
          `;
        }
      }
      logMsg = `Execution complete for task: ${userPrompt.substring(0, 30)}`;
    }

    if (targetMsgDivToReplace) {
      updateExistingAgentMessage(targetMsgDivToReplace, responseHtml, userPrompt, cotPlan, onPostAction);
      appendLogMessage(`Response regenerated in-place for: ${userPrompt.substring(0, 30)}`, 'OK');
    } else {
      appendMessageBubble('agent', responseHtml, '', userPrompt, cotPlan, onPostAction);
      appendLogMessage(logMsg, 'OK');
    }
  }

  // --------------------------------------------------------------------------
  // Confirm Undo Modal Dialog Controller (Annotation 1 - Reference Snapshot 2)
  // --------------------------------------------------------------------------
  const confirmUndoModal = document.getElementById('s08-confirm-undo-modal');
  const undoModalClose = document.getElementById('s08-undo-modal-close');
  const undoModalCancel = document.getElementById('s08-undo-modal-cancel');
  const undoModalConfirm = document.getElementById('s08-undo-modal-confirm');
  const undoPromptPreview = document.getElementById('s08-undo-prompt-preview');
  const undoAgentPreview = document.getElementById('s08-undo-agent-preview');
  const undoTurnsBadge = document.getElementById('s08-undo-turns-badge');

  let pendingUndoTarget = null;
  let pendingUndoPrompt = '';

  function openConfirmUndoModal(targetMsgDiv, promptText) {
    if (!confirmUndoModal) return;
    const targetTurn = targetMsgDiv.closest('.s08-conversation-turn') || targetMsgDiv;
    pendingUndoTarget = targetTurn;
    pendingUndoPrompt = promptText;

    if (undoPromptPreview) {
      const short = promptText.length > 36 ? promptText.substring(0, 34) + '...' : promptText;
      undoPromptPreview.textContent = `"${short}"`;
    }

    if (undoAgentPreview && messagesStream && targetTurn) {
      // Calculate how many sibling turn containers will be removed
      let next = targetTurn.nextElementSibling;
      let count = 0;
      while (next) {
        count++;
        next = next.nextElementSibling;
      }
      undoAgentPreview.textContent = count > 0 
        ? `Output and ${count} subsequent turn${count > 1 ? 's' : ''} will be cleared`
        : 'Output generated for this query will be cleared';

      if (undoTurnsBadge) {
        const turns = count > 0 ? count : 1;
        undoTurnsBadge.textContent = `-${turns} turn${turns > 1 ? 's' : ''}`;
      }
    }

    confirmUndoModal.classList.add('is-open');
    confirmUndoModal.setAttribute('aria-hidden', 'false');
    if (undoModalConfirm) undoModalConfirm.focus();
  }

  function closeConfirmUndoModal() {
    if (!confirmUndoModal) return;
    confirmUndoModal.classList.remove('is-open');
    confirmUndoModal.setAttribute('aria-hidden', 'true');
    pendingUndoTarget = null;
    pendingUndoPrompt = '';
  }

  function executeConfirmUndo() {
    if (!pendingUndoTarget || !messagesStream) {
      closeConfirmUndoModal();
      return;
    }

    const promptToRestore = pendingUndoPrompt;
    
    // Remove targetTurn and all subsequent sibling turn containers
    let current = pendingUndoTarget.nextElementSibling;
    while (current) {
      const toRemove = current;
      current = current.nextElementSibling;
      toRemove.remove();
    }
    pendingUndoTarget.remove();

    // Restore prompt into chat composer
    if (chatTextarea && promptToRestore) {
      chatTextarea.value = promptToRestore;
      chatTextarea.style.height = 'auto';
      chatTextarea.style.height = Math.min(chatTextarea.scrollHeight, 120) + 'px';
      chatTextarea.focus();
    }

    // If stream is now empty, remove has-messages to restore center scope bar
    if (messagesStream.children.length === 0 && chatColBody) {
      chatColBody.classList.remove('has-messages');
    }

    appendLogMessage(`Conversation thread undone to turn: "${promptToRestore.substring(0, 30)}"`, 'OK');
    closeConfirmUndoModal();
  }

  if (undoModalClose) undoModalClose.addEventListener('click', closeConfirmUndoModal);
  if (undoModalCancel) undoModalCancel.addEventListener('click', closeConfirmUndoModal);
  if (undoModalConfirm) undoModalConfirm.addEventListener('click', executeConfirmUndo);

  if (confirmUndoModal) {
    confirmUndoModal.addEventListener('click', (e) => {
      if (e.target === confirmUndoModal) closeConfirmUndoModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!confirmUndoModal || !confirmUndoModal.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      closeConfirmUndoModal();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeConfirmUndo();
    }
  });

  // ==========================================================================
  // Reference 1: Feedback Dialog Controller ("A thumbs-down that asks why, so the signal arrives with a reason attached")
  // ==========================================================================
  const feedbackModal = document.getElementById('s08-feedback-dialog-modal');
  const feedbackCloseBtn = document.getElementById('s08-feedback-close-btn');
  const feedbackSubmitBtn = document.getElementById('s08-feedback-submit');
  const feedbackCommentInput = document.getElementById('s08-feedback-comment');
  const feedbackChips = document.querySelectorAll('.s08-feedback-tag-chip');

  let currentFeedbackTargetMsg = null;
  let currentFeedbackAgentName = '';

  function openFeedbackDialog(targetMsgDiv, agentName = 'Agent General') {
    if (!feedbackModal) return;
    currentFeedbackTargetMsg = targetMsgDiv;
    currentFeedbackAgentName = agentName;

    // Reset chips and textarea
    feedbackChips.forEach(chip => chip.classList.remove('selected'));
    if (feedbackCommentInput) feedbackCommentInput.value = '';

    feedbackModal.classList.add('is-open');
    feedbackModal.setAttribute('aria-hidden', 'false');

    // Focus first chip or comment input
    const firstChip = feedbackModal.querySelector('.s08-feedback-tag-chip');
    if (firstChip) firstChip.focus();
  }

  function closeFeedbackDialog() {
    if (!feedbackModal) return;
    feedbackModal.classList.remove('is-open');
    feedbackModal.setAttribute('aria-hidden', 'true');
    currentFeedbackTargetMsg = null;
    currentFeedbackAgentName = '';
  }

  function submitFeedback() {
    if (!currentFeedbackTargetMsg) {
      closeFeedbackDialog();
      return;
    }

    const selectedReasons = Array.from(feedbackModal.querySelectorAll('.s08-feedback-tag-chip.selected'))
      .map(c => c.getAttribute('data-reason') || c.textContent.trim());
    const comment = feedbackCommentInput ? feedbackCommentInput.value.trim() : '';

    const thumbDownBtn = currentFeedbackTargetMsg.querySelector('.s08-thumb-down-btn');
    const thumbUpBtn = currentFeedbackTargetMsg.querySelector('.s08-thumb-up-btn');

    if (thumbDownBtn) {
      thumbDownBtn.classList.add('active', 'thumb-down');
    }
    if (thumbUpBtn) {
      thumbUpBtn.classList.remove('active', 'thumb-up');
    }

    const reasonSummary = selectedReasons.length > 0 ? selectedReasons.join(', ') : 'Unspecified';
    const logDetails = comment ? `[${reasonSummary}] - "${comment}"` : `[${reasonSummary}]`;
    appendLogMessage(`Feedback submitted for ${currentFeedbackAgentName || 'Agent'}: ${logDetails}`, 'INFO');

    // Notify user with feedback toast banner
    showToastNotification('Feedback submitted. Thank you!', 'success');
    closeFeedbackDialog();
  }

  // Chip selection toggle
  feedbackChips.forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
    });
  });

  if (feedbackCloseBtn) feedbackCloseBtn.addEventListener('click', closeFeedbackDialog);
  if (feedbackSubmitBtn) feedbackSubmitBtn.addEventListener('click', submitFeedback);

  if (feedbackModal) {
    feedbackModal.addEventListener('click', (e) => {
      if (e.target === feedbackModal) closeFeedbackDialog();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!feedbackModal || !feedbackModal.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      closeFeedbackDialog();
    }
  });

  // ==========================================================================
  // Reference 2: Day Timestamps & Thread Chronology Controller
  // ==========================================================================
  function ensureThreadDayDivider(dayLabel = 'Today') {
    if (!messagesStream) return;
    const existing = messagesStream.querySelector(`.s08-thread-day-divider[data-day="${dayLabel}"]`);
    if (!existing) {
      const divider = document.createElement('div');
      divider.className = 's08-thread-day-divider';
      divider.setAttribute('data-day', dayLabel);
      divider.innerHTML = `<span class="s08-thread-day-label">${escapeHTML(dayLabel)}</span>`;
      messagesStream.appendChild(divider);
    }
  }

  // Lightweight Toast Notification Helper (Aligned with Sutra Design System)
  function showToastNotification(text, type = 'info') {
    let toast = document.getElementById('s08-toast-banner');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 's08-toast-banner';
      toast.className = 's08-toast-banner';
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.className = `s08-toast-banner is-visible ${type}`;
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2800);
  }

  // ==========================================================================
  // Reference 3: Permission Grant Card Controller & Component Factory
  // ("Granting a capability rather than approving one action, with the reach spelled out")
  // ==========================================================================
  function createPermissionGrantCard({
    capability = 'Filesystem access',
    requester = 'requested by filesystem-mcp',
    grants = [
      'Read and write files under the workspace',
      'Run commands you have already approved',
      'No network access'
    ],
    onResolve = null
  } = {}) {
    const card = document.createElement('div');
    card.className = 's08-permission-grant-card';

    const grantsHtml = grants.map(grant => {
      return `<li class="s08-permission-grant-item">${escapeHTML(grant)}</li>`;
    }).join('');

    card.innerHTML = `
      <div class="s08-permission-header">
        <div class="s08-permission-icon-wrap" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21 2-2 2m-1.5 1.5L14 9l-2-2-4 4 1.5 1.5L9 13l-1.5 1.5L6 13l-4 4 2 2 4-4 1.5 1.5 1.5-1.5 1.5 1.5 1.5-1.5 3.5 3.5 4-4-2-2 3.5-3.5Z"/>
            <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>
          </svg>
        </div>
        <div class="s08-permission-title-group">
          <h4 class="s08-permission-title">${escapeHTML(capability)}</h4>
          <span class="s08-permission-requester">${escapeHTML(requester)}</span>
        </div>
      </div>

      <div class="s08-permission-grants-heading">this grants</div>
      <ul class="s08-permission-grants-list">
        ${grantsHtml}
      </ul>

      <div class="s08-permission-actions">
        <button class="s08-perm-btn s08-perm-btn-deny" type="button">Deny</button>
        <button class="s08-perm-btn s08-perm-btn-session" type="button">This session</button>
        <button class="s08-perm-btn s08-perm-btn-always" type="button">Always</button>
      </div>
    `;

    const denyBtn = card.querySelector('.s08-perm-btn-deny');
    const sessionBtn = card.querySelector('.s08-perm-btn-session');
    const alwaysBtn = card.querySelector('.s08-perm-btn-always');
    const actionsGroup = card.querySelector('.s08-permission-actions');

    const resolvePermission = (tier) => {
      if (!actionsGroup) return;
      if (tier === 'deny') {
        actionsGroup.innerHTML = `<span class="s08-permission-resolved-badge denied">✕ Denied</span>`;
        appendLogMessage(`Permission denied for ${requester} (${capability})`, 'INFO');
        showToastNotification(`Permission denied for ${capability}`, 'info');
      } else if (tier === 'session') {
        actionsGroup.innerHTML = `<span class="s08-permission-resolved-badge">✓ Granted for this session</span>`;
        appendLogMessage(`Permission granted for this session: ${capability} (${requester})`, 'OK');
        showToastNotification(`Granted for this session: ${capability}`, 'success');
      } else if (tier === 'always') {
        actionsGroup.innerHTML = `<span class="s08-permission-resolved-badge">✓ Always granted</span>`;
        try {
          localStorage.setItem(`sutra_perm_${capability.toLowerCase().replace(/\\s+/g, '_')}`, 'always');
        } catch (e) {}
        appendLogMessage(`Capability permanently granted: ${capability} (${requester})`, 'OK');
        showToastNotification(`Capability permanently granted: ${capability}`, 'success');
      }
      if (typeof onResolve === 'function') onResolve(tier);
    };

    if (denyBtn) denyBtn.addEventListener('click', () => resolvePermission('deny'));
    if (sessionBtn) sessionBtn.addEventListener('click', () => resolvePermission('session'));
    if (alwaysBtn) alwaysBtn.addEventListener('click', () => resolvePermission('always'));

    return card;
  }

  // Expose on window for programmatic trigger & testing
  if (typeof window !== 'undefined') {
    if (!window.sutra) window.sutra = {};
    window.sutra.createPermissionGrantCard = createPermissionGrantCard;
    window.sutra.showPermissionGrant = function(options = {}) {
      if (!messagesStream) return;
      ensureThreadDayDivider('Today');
      const card = createPermissionGrantCard(options);
      const turnContainer = document.createElement('div');
      turnContainer.className = 's08-conversation-turn';
      turnContainer.appendChild(card);
      messagesStream.appendChild(turnContainer);
      if (chatColBody) {
        chatColBody.classList.add('has-messages');
        chatColBody.scrollTo({ top: chatColBody.scrollHeight, behavior: 'smooth' });
      }
      return card;
    };
    window.sutra.openFeedbackDialog = openFeedbackDialog;
    window.sutra.showToast = showToastNotification;
  }

  // --------------------------------------------------------------------------
  // Button Variation Group Showcase Controller (Design System Modal)
  // --------------------------------------------------------------------------
  const btnShowcaseModal = document.getElementById('sutra-button-showcase-modal');
  const btnShowcaseDockTrigger = document.getElementById('sutra-dock-buttons-btn');
  const btnShowcaseClose = document.getElementById('sutra-button-showcase-close');
  const btnShowcaseDismiss = document.getElementById('sutra-button-showcase-dismiss');

  function openButtonShowcase() {
    if (!btnShowcaseModal) return;
    btnShowcaseModal.classList.add('is-open');
    btnShowcaseModal.setAttribute('aria-hidden', 'false');
  }

  function closeButtonShowcase() {
    if (!btnShowcaseModal) return;
    btnShowcaseModal.classList.remove('is-open');
    btnShowcaseModal.setAttribute('aria-hidden', 'true');
  }

  if (btnShowcaseDockTrigger) {
    btnShowcaseDockTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      openButtonShowcase();
    });
  }
  if (btnShowcaseClose) btnShowcaseClose.addEventListener('click', closeButtonShowcase);
  if (btnShowcaseDismiss) btnShowcaseDismiss.addEventListener('click', closeButtonShowcase);
  if (btnShowcaseModal) {
    btnShowcaseModal.addEventListener('click', (e) => {
      if (e.target === btnShowcaseModal) closeButtonShowcase();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (btnShowcaseModal && btnShowcaseModal.classList.contains('is-open') && e.key === 'Escape') {
      closeButtonShowcase();
    }
  });

  // --------------------------------------------------------------------------
  // Surface Theme Switcher Controller (Crisp, Contrast Dock, Warm, Dark)
  // --------------------------------------------------------------------------
  const surfaceThemeBtn = document.getElementById('sutra-dock-theme-btn');
  const surfaceThemeMenu = document.getElementById('sutra-surface-menu');
  const surfaceOptions = document.querySelectorAll('.sutra-surface-option');

  function applySurfaceTheme(themeName) {
    if (!themeName) themeName = 'crisp';
    
    // Set data attribute on documentElement
    if (themeName === 'crisp') {
      document.documentElement.removeAttribute('data-surface-theme');
      document.documentElement.removeAttribute('data-theme');
      document.body.classList.remove('theme-dark');
    } else if (themeName === 'contrast') {
      document.documentElement.setAttribute('data-surface-theme', 'contrast');
      document.documentElement.removeAttribute('data-theme');
      document.body.classList.remove('theme-dark');
    } else if (themeName === 'warm') {
      document.documentElement.setAttribute('data-surface-theme', 'warm');
      document.documentElement.removeAttribute('data-theme');
      document.body.classList.remove('theme-dark');
    } else if (themeName === 'dark') {
      document.documentElement.setAttribute('data-surface-theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('theme-dark');
    }

    // Update active state in menu
    surfaceOptions.forEach(opt => {
      const match = opt.getAttribute('data-surface') === themeName;
      opt.classList.toggle('active', match);
    });

    try {
      localStorage.setItem('sutra-surface-theme', themeName);
    } catch (e) {}
  }

  // Restore saved theme on initial load
  try {
    const savedTheme = localStorage.getItem('sutra-surface-theme');
    if (savedTheme) {
      applySurfaceTheme(savedTheme);
    }
  } catch (e) {}

  if (surfaceThemeBtn && surfaceThemeMenu) {
    const iconDock = surfaceThemeBtn.closest('.sutra-icon-dock');
    const updateDockMenuState = (isOpen) => {
      if (iconDock) {
        iconDock.classList.toggle('has-open-menu', isOpen);
      }
    };

    surfaceThemeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = surfaceThemeMenu.classList.toggle('is-open');
      surfaceThemeBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      updateDockMenuState(isOpen);
    });

    surfaceOptions.forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const theme = opt.getAttribute('data-surface');
        applySurfaceTheme(theme);
        surfaceThemeMenu.classList.remove('is-open');
        surfaceThemeBtn.setAttribute('aria-expanded', 'false');
        updateDockMenuState(false);
      });
    });

    document.addEventListener('click', (e) => {
      if (surfaceThemeMenu.classList.contains('is-open') && !surfaceThemeMenu.contains(e.target) && e.target !== surfaceThemeBtn) {
        surfaceThemeMenu.classList.remove('is-open');
        surfaceThemeBtn.setAttribute('aria-expanded', 'false');
        updateDockMenuState(false);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && surfaceThemeMenu.classList.contains('is-open')) {
        surfaceThemeMenu.classList.remove('is-open');
        surfaceThemeBtn.setAttribute('aria-expanded', 'false');
        updateDockMenuState(false);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 1. Projects Controller (Above Recent Chats, Left-Aligned, CRUD & Folders)
  // --------------------------------------------------------------------------
  const projectsGroup = document.getElementById('s08-projects-group');
  const projectsHeader = document.getElementById('s08-projects-header');
  const collapseProjectsBtn = document.getElementById('s08-collapse-projects-btn');
  const addProjectBtn = document.getElementById('s08-add-project-btn');
  const newProjectWrap = document.getElementById('s08-new-project-wrap');
  const newProjectInput = document.getElementById('s08-new-project-input');
  const saveProjectBtn = document.getElementById('s08-save-project-btn');
  const cancelProjectBtn = document.getElementById('s08-cancel-project-btn');
  const projectsList = document.getElementById('s08-projects-list');

  // Toggle Projects Section Collapse
  function toggleProjectsCollapse() {
    if (!projectsGroup) return;
    projectsGroup.classList.toggle('collapsed');
    const isCollapsed = projectsGroup.classList.contains('collapsed');
    if (collapseProjectsBtn) {
      collapseProjectsBtn.setAttribute('title', isCollapsed ? 'Expand section' : 'Collapse section');
      collapseProjectsBtn.setAttribute('aria-expanded', !isCollapsed);
    }
    // Accordion behavior: if Projects is opened, collapse Recent Tasks to keep content above fold globally
    if (!isCollapsed && recentChatsGroup) {
      recentChatsGroup.classList.add('collapsed');
      if (collapseChatsBtn) {
        collapseChatsBtn.setAttribute('title', 'Expand section');
        collapseChatsBtn.setAttribute('aria-expanded', 'false');
      }
    }
  }

  if (projectsHeader) {
    projectsHeader.addEventListener('click', (e) => {
      if (e.target.closest('#s08-add-project-btn')) return;
      toggleProjectsCollapse();
    });
  }

  // Show inline New Project Input
  if (addProjectBtn && newProjectWrap && newProjectInput) {
    addProjectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (projectsGroup && projectsGroup.classList.contains('collapsed')) {
        projectsGroup.classList.remove('collapsed');
        if (collapseProjectsBtn) {
          collapseProjectsBtn.setAttribute('title', 'Collapse section');
          collapseProjectsBtn.setAttribute('aria-expanded', 'true');
        }
        if (recentChatsGroup) {
          recentChatsGroup.classList.add('collapsed');
          if (collapseChatsBtn) {
            collapseChatsBtn.setAttribute('title', 'Expand section');
            collapseChatsBtn.setAttribute('aria-expanded', 'false');
          }
        }
      }
      newProjectWrap.style.display = 'flex';
      newProjectInput.value = '';
      newProjectInput.focus();
    });
  }

  function hideNewProjectForm() {
    if (newProjectWrap) {
      newProjectWrap.style.display = 'none';
    }
    if (newProjectInput) {
      newProjectInput.value = '';
    }
  }

  if (cancelProjectBtn) {
    cancelProjectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hideNewProjectForm();
    });
  }

  if (newProjectInput) {
    newProjectInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveNewProject();
      } else if (e.key === 'Escape') {
        hideNewProjectForm();
      }
    });
  }

  if (saveProjectBtn) {
    saveProjectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      saveNewProject();
    });
  }

  function saveNewProject() {
    if (!newProjectInput || !projectsList) return;
    const name = newProjectInput.value.trim() || 'New Project';
    const projectId = 'proj-' + Date.now();

    const groupDiv = document.createElement('div');
    groupDiv.className = 's08-project-group open';
    groupDiv.setAttribute('data-project-id', projectId);
    groupDiv.setAttribute('data-project-name', name);

    groupDiv.innerHTML = `
      <div class="s08-project-item">
        <button class="s08-project-chevron-btn" type="button" aria-label="Toggle nested tasks">
          <svg class="s08-project-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </button>
        <span class="s08-project-name">${escapeHTML(name)}</span>
        <span class="s08-project-count">0</span>
        <div class="s08-project-actions">
          <button class="s08-project-action-btn s08-project-kebab-btn" type="button" aria-label="Folder options" title="Folder options" aria-haspopup="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="1.5"/>
              <circle cx="12" cy="12" r="1.5"/>
              <circle cx="19" cy="12" r="1.5"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="s08-project-chats"><div class="s08-project-chats-inner"></div></div>
    `;

    projectsList.prepend(groupDiv);
    hideNewProjectForm();
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  // Folder Kebab Menu Controller (Annotation 6: Progressive disclosure & Delete Folder)
  let currentActiveFolder = null;
  const folderKebabMenu = document.getElementById('s08-folder-kebab-menu');
  const menuFolderAddTask = document.getElementById('menu-folder-add-task');
  const menuFolderRename = document.getElementById('menu-folder-rename');
  const menuFolderDelete = document.getElementById('menu-folder-delete');

  function openFolderKebabMenu(btn, projectGroup) {
    if (!folderKebabMenu) return;
    closeFolderKebabMenu();
    if (typeof closeKebabMenu === 'function') closeKebabMenu();

    currentActiveFolder = projectGroup;
    const projectItem = projectGroup.querySelector('.s08-project-item');
    if (projectItem) projectItem.classList.add('menu-open');

    const rect = btn.getBoundingClientRect();
    const menuWidth = 186;
    const menuHeight = 130;

    let left = rect.right - menuWidth;
    if (left < 12) left = rect.left;
    if (left + menuWidth > window.innerWidth - 12) {
      left = window.innerWidth - menuWidth - 12;
    }

    let top = rect.bottom + 4;
    if (top + menuHeight > window.innerHeight - 12) {
      top = rect.top - menuHeight - 4;
    }

    folderKebabMenu.style.top = `${top}px`;
    folderKebabMenu.style.left = `${left}px`;
    folderKebabMenu.classList.add('open');
  }

  function closeFolderKebabMenu() {
    if (!folderKebabMenu) return;
    folderKebabMenu.classList.remove('open');
    if (currentActiveFolder) {
      const projectItem = currentActiveFolder.querySelector('.s08-project-item');
      if (projectItem) projectItem.classList.remove('menu-open');
      currentActiveFolder = null;
    }
  }

  document.addEventListener('click', (e) => {
    if (folderKebabMenu && folderKebabMenu.classList.contains('open') && !folderKebabMenu.contains(e.target) && !e.target.closest('.s08-project-kebab-btn')) {
      closeFolderKebabMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeFolderKebabMenu();
    }
  });

  if (menuFolderAddTask) {
    menuFolderAddTask.addEventListener('click', () => {
      if (!currentActiveFolder) return;
      const projectGroup = currentActiveFolder;
      closeFolderKebabMenu();
      const chatTitle = prompt('New task title in folder:', 'Untitled Task');
      if (chatTitle && chatTitle.trim()) {
        const cleanTitle = chatTitle.trim();
        const chatsContainer = projectGroup.querySelector('.s08-project-chats');
        const countSpan = projectGroup.querySelector('.s08-project-count');
        if (chatsContainer) {
          const chatDiv = document.createElement('div');
          chatDiv.className = 's08-chat-item active';
          chatDiv.setAttribute('data-id', 'pchat-' + Date.now());
          chatDiv.setAttribute('data-title', cleanTitle);
          chatDiv.innerHTML = `
            <span class="s08-chat-title">${escapeHTML(cleanTitle)}</span>
            <span class="s08-chat-time">Just now</span>
            <div class="s08-chat-actions">
              <button class="s08-chat-action-btn s08-pin-btn" type="button" aria-label="Pin task" title="Pin task">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
              </button>
              <button class="s08-chat-action-btn s08-kebab-btn" type="button" aria-label="More options" title="More options" aria-haspopup="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
              </button>
            </div>
          `;
          document.querySelectorAll('.s08-chat-item').forEach(i => i.classList.remove('active'));
          chatsContainer.prepend(chatDiv);
          const projectName = projectGroup.getAttribute('data-project-name') || projectGroup.querySelector('.s08-project-name')?.textContent?.trim() || 'Project';
          updateBreadcrumbs(cleanTitle, projectName);
          if (countSpan) {
            const currentCount = parseInt(countSpan.textContent, 10) || 0;
            countSpan.textContent = String(currentCount + 1);
          }
          projectGroup.classList.add('open');
        }
      }
    });
  }

  if (menuFolderRename) {
    menuFolderRename.addEventListener('click', () => {
      if (!currentActiveFolder) return;
      const projectGroup = currentActiveFolder;
      closeFolderKebabMenu();
      const nameSpan = projectGroup.querySelector('.s08-project-name');
      const currentName = nameSpan ? nameSpan.textContent.trim() : '';
      const newName = prompt('Rename folder:', currentName);
      if (newName && newName.trim()) {
        const cleanName = newName.trim();
        if (nameSpan) nameSpan.textContent = cleanName;
        projectGroup.setAttribute('data-project-name', cleanName);
        appendLogMessage(`Project folder renamed to "${cleanName}"`, 'INFO');
      }
    });
  }

  if (menuFolderDelete) {
    menuFolderDelete.addEventListener('click', () => {
      if (!currentActiveFolder) return;
      const projectGroup = currentActiveFolder;
      closeFolderKebabMenu();
      const nameSpan = projectGroup.querySelector('.s08-project-name');
      const folderName = nameSpan ? nameSpan.textContent.trim() : 'Project';
      if (confirm(`Delete project folder "${folderName}" and all its tasks? This action cannot be undone.`)) {
        projectGroup.style.transition = 'all 0.25s ease';
        projectGroup.style.opacity = '0';
        projectGroup.style.transform = 'scale(0.96)';
        setTimeout(() => {
          projectGroup.remove();
          appendLogMessage(`Project folder "${folderName}" deleted`, 'INFO');
          // If deleted project contained the active chat, reset breadcrumbs
          updateBreadcrumbs('New task', null);
        }, 250);
      }
    });
  }

  // Delegated Projects interactions (Chevron toggle, kebab menu, add conversation)
  if (projectsList) {
    projectsList.addEventListener('click', (e) => {
      // 1. Kebab button clicked on folder item
      const folderKebabBtn = e.target.closest('.s08-project-kebab-btn');
      if (folderKebabBtn) {
        e.stopPropagation();
        const projectGroup = folderKebabBtn.closest('.s08-project-group');
        if (folderKebabMenu && folderKebabMenu.classList.contains('open') && currentActiveFolder === projectGroup) {
          closeFolderKebabMenu();
        } else {
          openFolderKebabMenu(folderKebabBtn, projectGroup);
        }
        return;
      }

      // 2. Legacy rename/add buttons if any remain
      const renameBtn = e.target.closest('.s08-project-rename-btn');
      if (renameBtn) {
        e.stopPropagation();
        const projectGroup = renameBtn.closest('.s08-project-group');
        const nameSpan = projectGroup ? projectGroup.querySelector('.s08-project-name') : null;
        const currentName = nameSpan ? nameSpan.textContent.trim() : '';
        const newName = prompt('Rename project:', currentName);
        if (newName && newName.trim()) {
          const cleanName = newName.trim();
          if (nameSpan) nameSpan.textContent = cleanName;
          if (projectGroup) projectGroup.setAttribute('data-project-name', cleanName);
        }
        return;
      }

      const addChatBtn = e.target.closest('.s08-project-add-chat-btn');
      if (addChatBtn) {
        e.stopPropagation();
        const projectGroup = addChatBtn.closest('.s08-project-group');
        if (!projectGroup) return;
        const chatTitle = prompt('New task title in project:', 'Untitled Task');
        if (chatTitle && chatTitle.trim()) {
          const cleanTitle = chatTitle.trim();
          const chatsContainer = projectGroup.querySelector('.s08-project-chats');
          const countSpan = projectGroup.querySelector('.s08-project-count');
          if (chatsContainer) {
            const chatDiv = document.createElement('div');
            chatDiv.className = 's08-chat-item active';
            chatDiv.setAttribute('data-id', 'pchat-' + Date.now());
            chatDiv.setAttribute('data-title', cleanTitle);
            chatDiv.innerHTML = `
              <span class="s08-chat-title">${escapeHTML(cleanTitle)}</span>
              <span class="s08-chat-time">Just now</span>
              <div class="s08-chat-actions">
                <button class="s08-chat-action-btn s08-pin-btn" type="button" aria-label="Pin task" title="Pin task">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
                </button>
                <button class="s08-chat-action-btn s08-kebab-btn" type="button" aria-label="More options" title="More options" aria-haspopup="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
                </button>
              </div>
            `;
            // Deactivate all chats and activate new one
            document.querySelectorAll('.s08-chat-item').forEach(i => i.classList.remove('active'));
            (chatsContainer.querySelector('.s08-project-chats-inner') || chatsContainer).prepend(chatDiv);
            
            const projectName = projectGroup.getAttribute('data-project-name') || projectGroup.querySelector('.s08-project-name')?.textContent?.trim() || 'Project';
            updateBreadcrumbs(cleanTitle, projectName);

            // Increment count
            if (countSpan) {
              const currentCount = parseInt(countSpan.textContent, 10) || 0;
              countSpan.textContent = String(currentCount + 1);
            }
            projectGroup.classList.add('open');
          }
        }
        return;
      }

      // Chevron toggle or clicking project item header
      const projectItem = e.target.closest('.s08-project-item');
      if (projectItem && !e.target.closest('.s08-project-actions')) {
        const projectGroup = projectItem.closest('.s08-project-group');
        if (projectGroup) {
          const wasOpen = projectGroup.classList.contains('open');
          // Close other project folders so only the selected folder is active/open
          document.querySelectorAll('.s08-project-group').forEach(g => g.classList.remove('open'));
          if (!wasOpen) {
            projectGroup.classList.add('open');
          }
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // 2. Recent Conversations Controller (Collapsible, Search, Sort, Date Groups)
  // --------------------------------------------------------------------------
  const recentChatsGroup = document.getElementById('s08-recent-chats-group');
  const chatsHeader = document.getElementById('s08-chats-header');
  const collapseChatsBtn = document.getElementById('s08-collapse-chats-btn');
  const searchChatsBtn = document.getElementById('s08-search-chats-btn');
  const sortChatsBtn = document.getElementById('s08-sort-chats-btn');
  const addChatHeaderBtn = document.getElementById('s08-add-chat-header-btn');
  const newChatTopBtn = document.getElementById('s08-new-chat-btn');
  const chatSearchWrap = document.getElementById('s08-chat-search-wrap');
  const chatSearchInput = document.getElementById('s08-chat-search-input');
  const chatsList = document.getElementById('s08-chats-list');
  const viewMoreChatsBtn = document.getElementById('s08-view-more-chats-btn');
  const chatsOverflow = document.getElementById('s08-chats-overflow');
  const viewMoreText = document.getElementById('s08-view-more-text');
  const kebabMenu = document.getElementById('s08-kebab-menu');
  const menuPinLabel = document.getElementById('menu-pin-label');
  
  let currentActiveChat = null;
  let currentSortMode = 0;

  // New Task Action: Creates a task at the global level
  function createNewGlobalChat(customTitle) {
    const cleanTitle = (customTitle && customTitle.trim()) ? customTitle.trim() : 'New task';

    const todayContainer = document.getElementById('s08-date-chats-today');
    if (!todayContainer) return;

    // Deselect other chats
    document.querySelectorAll('.s08-chat-item').forEach(i => i.classList.remove('active'));

    // Create new chat element
    const chatDiv = document.createElement('div');
    chatDiv.className = 's08-chat-item active';
    chatDiv.setAttribute('data-id', 'chat-' + Date.now());
    chatDiv.setAttribute('data-title', cleanTitle);
    chatDiv.setAttribute('data-pinned', 'false');
    chatDiv.innerHTML = `
      <span class="s08-chat-title">${escapeHTML(cleanTitle)}</span>
      <span class="s08-chat-time">Just now</span>
      <div class="s08-chat-actions">
        <button class="s08-chat-action-btn s08-pin-btn" type="button" aria-label="Pin task" title="Pin task">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
        </button>
        <button class="s08-chat-action-btn s08-kebab-btn" type="button" aria-label="More options" title="More options" aria-haspopup="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
        </button>
      </div>
    `;

    todayContainer.prepend(chatDiv);

    // Close any open project folders so global task is clear
    document.querySelectorAll('.s08-project-group').forEach(g => g.classList.remove('open'));

    // Clear messages stream and reset centering for new task (Annotation 9)
    if (messagesStream) messagesStream.innerHTML = '';
    if (chatColBody) chatColBody.classList.remove('has-messages');
    const scopeBar = document.getElementById('s08-scope-setup-bar');
    if (scopeBar) scopeBar.classList.remove('is-collapsed');

    // Reset workspace and workarea to empty state for fresh task
    setWorkspaceAndWorkArea('', '', '', false);

    // Update breadcrumbs to global level (only chat title)
    updateBreadcrumbs(cleanTitle, null);
  }

  if (newChatTopBtn) {
    newChatTopBtn.addEventListener('click', () => createNewGlobalChat());
  }

  if (addChatHeaderBtn) {
    addChatHeaderBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      createNewGlobalChat();
    });
  }

  // Keyboard shortcut: Cmd+N / Ctrl+N for New Task
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
      const workspaceView = document.getElementById('sutra-workspace-view');
      if (workspaceView && workspaceView.style.display !== 'none') {
        e.preventDefault();
        createNewGlobalChat();
      }
    }
  });

  // Toggle Recent Chats Collapse
  function toggleRecentChatsCollapse() {
    if (!recentChatsGroup) return;
    recentChatsGroup.classList.toggle('collapsed');
    const isCollapsed = recentChatsGroup.classList.contains('collapsed');
    if (collapseChatsBtn) {
      collapseChatsBtn.setAttribute('title', isCollapsed ? 'Expand section' : 'Collapse section');
      collapseChatsBtn.setAttribute('aria-expanded', !isCollapsed);
    }
    // Accordion behavior: if Recent Tasks is opened, collapse Projects to keep content above fold globally
    if (!isCollapsed && projectsGroup) {
      projectsGroup.classList.add('collapsed');
      if (collapseProjectsBtn) {
        collapseProjectsBtn.setAttribute('title', 'Expand section');
        collapseProjectsBtn.setAttribute('aria-expanded', 'false');
      }
    }
  }

  if (chatsHeader) {
    chatsHeader.addEventListener('click', (e) => {
      if (e.target.closest('#s08-search-chats-btn') || e.target.closest('#s08-sort-chats-btn') || e.target.closest('#s08-add-chat-header-btn')) {
        return;
      }
      toggleRecentChatsCollapse();
    });
  }

  // View More / View Less Toggle for Recent Chats (show 6-8 default, view all on demand)
  if (viewMoreChatsBtn && chatsOverflow) {
    viewMoreChatsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = viewMoreChatsBtn.classList.contains('expanded');
      if (isExpanded) {
        chatsOverflow.style.display = 'none';
        viewMoreChatsBtn.classList.remove('expanded');
        if (viewMoreText) viewMoreText.textContent = 'View all (11)';
      } else {
        chatsOverflow.style.display = 'flex';
        viewMoreChatsBtn.classList.add('expanded');
        if (viewMoreText) viewMoreText.textContent = 'Show less';
      }
    });
  }

  // Search Box Toggle & Real-time Filter
  if (searchChatsBtn && chatSearchWrap && chatSearchInput) {
    searchChatsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (recentChatsGroup && recentChatsGroup.classList.contains('collapsed')) {
        recentChatsGroup.classList.remove('collapsed');
      }
      chatSearchWrap.classList.toggle('open');
      searchChatsBtn.classList.toggle('active', chatSearchWrap.classList.contains('open'));
      if (chatSearchWrap.classList.contains('open')) {
        chatSearchInput.focus();
      } else {
        chatSearchInput.value = '';
        filterRecentChats('');
      }
    });

    chatSearchInput.addEventListener('input', (e) => {
      filterRecentChats(e.target.value.trim().toLowerCase());
    });

    chatSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        chatSearchWrap.classList.remove('open');
        searchChatsBtn.classList.remove('active');
        chatSearchInput.value = '';
        filterRecentChats('');
      }
    });
  }

  function filterRecentChats(query) {
    if (chatsList) {
      if (query) {
        chatsList.classList.add('searching');
      } else {
        chatsList.classList.remove('searching');
      }
    }

    const chatItems = document.querySelectorAll('.s08-chat-item');
    chatItems.forEach(item => {
      const title = (item.getAttribute('data-title') || '').toLowerCase();
      if (!query || title.includes(query)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });

    // Also handle date headers visibility
    const dateHeaders = document.querySelectorAll('.s08-date-header');
    dateHeaders.forEach(header => {
      header.style.display = query ? 'none' : 'block';
    });

    if (query && chatsOverflow) {
      chatsOverflow.style.display = 'flex';
    } else if (!query && chatsOverflow && !viewMoreChatsBtn?.classList.contains('expanded')) {
      chatsOverflow.style.display = 'none';
    }
  }

  // Sort on Click / Hover
  if (sortChatsBtn && chatsList) {
    sortChatsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentSortMode = (currentSortMode + 1) % 3;
      const chatItems = Array.from(chatsList.querySelectorAll('.s08-chat-item'));

      const todayCont = document.getElementById('s08-date-chats-today');
      const yesterdayCont = document.getElementById('s08-date-chats-yesterday');
      const prev7Cont = document.getElementById('s08-date-chats-prev7');
      const overflowCont = document.getElementById('s08-date-chats-overflow');

      if (currentSortMode === 0) {
        // Mode 0: Default chronological grouped timeline
        sortChatsBtn.setAttribute('title', 'Sort tasks');
        chatsList.classList.remove('sorting');

        chatItems.sort((a, b) => {
          const idA = parseInt(a.getAttribute('data-id') || '0', 10);
          const idB = parseInt(b.getAttribute('data-id') || '0', 10);
          return idA - idB;
        });

        chatItems.forEach(item => {
          const id = parseInt(item.getAttribute('data-id') || '0', 10);
          if (id <= 3 && todayCont) todayCont.appendChild(item);
          else if (id <= 5 && yesterdayCont) yesterdayCont.appendChild(item);
          else if (id === 6 && prev7Cont) prev7Cont.appendChild(item);
          else if (overflowCont) overflowCont.appendChild(item);
        });

        const isExpanded = viewMoreChatsBtn?.classList.contains('expanded');
        if (chatsOverflow) chatsOverflow.style.display = isExpanded ? 'flex' : 'none';
        return;
      }

      // Mode 1 (A-Z) or Mode 2 (Z-A): Flat alphabetical view
      chatsList.classList.add('sorting');

      if (currentSortMode === 1) {
        sortChatsBtn.setAttribute('title', 'Sorted: A-Z');
        chatItems.sort((a, b) => {
          const tA = (a.getAttribute('data-title') || '').toLowerCase();
          const tB = (b.getAttribute('data-title') || '').toLowerCase();
          return tA.localeCompare(tB);
        });
      } else if (currentSortMode === 2) {
        sortChatsBtn.setAttribute('title', 'Sorted: Z-A');
        chatItems.sort((a, b) => {
          const tA = (a.getAttribute('data-title') || '').toLowerCase();
          const tB = (b.getAttribute('data-title') || '').toLowerCase();
          return tB.localeCompare(tA);
        });
      }

      const isExpanded = viewMoreChatsBtn?.classList.contains('expanded');
      if (!isExpanded && overflowCont) {
        const defaultVisible = chatItems.slice(0, 6);
        const overflowItems = chatItems.slice(6);
        if (todayCont) defaultVisible.forEach(item => todayCont.appendChild(item));
        overflowItems.forEach(item => overflowCont.appendChild(item));
      } else {
        if (todayCont) chatItems.forEach(item => todayCont.appendChild(item));
      }
    });
  }

  // Toggle Pin on Chat Item
  function togglePin(item, pinBtn) {
    const isPinned = !item.classList.contains('pinned');
    item.classList.toggle('pinned', isPinned);
    item.setAttribute('data-pinned', isPinned ? 'true' : 'false');

    if (pinBtn) {
      pinBtn.classList.toggle('is-pinned', isPinned);
      const tipText = isPinned ? 'Unpin task' : 'Pin task';
      pinBtn.setAttribute('title', tipText);
      pinBtn.setAttribute('aria-label', tipText);
      pinBtn.setAttribute('data-custom-tooltip', tipText);
      const svg = pinBtn.querySelector('svg');
      if (svg) {
        svg.setAttribute('fill', isPinned ? 'currentColor' : 'none');
        svg.setAttribute('stroke-width', '1.5');
      }
    }

    // Reorder pinned item to top of its parent list
    if (isPinned && item.parentElement) {
      item.parentElement.prepend(item);
    }
  }

  // Delegated Pin, Kebab, and Selection across whole Sidebar
  if (s08Sidebar) {
    s08Sidebar.addEventListener('click', (e) => {
      // 1. Pin button clicked
      const pinBtn = e.target.closest('.s08-pin-btn');
      if (pinBtn) {
        e.stopPropagation();
        const chatItem = pinBtn.closest('.s08-chat-item');
        if (chatItem) togglePin(chatItem, pinBtn);
        return;
      }

      // 2. Kebab button clicked
      const kebabBtn = e.target.closest('.s08-kebab-btn');
      if (kebabBtn) {
        e.stopPropagation();
        const chatItem = kebabBtn.closest('.s08-chat-item');
        if (!chatItem) return;

        if (kebabMenu && kebabMenu.classList.contains('open') && currentActiveChat === chatItem) {
          closeKebabMenu();
        } else {
          openKebabMenu(kebabBtn, chatItem);
        }
        return;
      }

      // 3. Chat item selected
      const chatItem = e.target.closest('.s08-chat-item');
      if (chatItem && !e.target.closest('.s08-chat-actions')) {
        document.querySelectorAll('.s08-chat-item').forEach(i => i.classList.remove('active'));
        chatItem.classList.add('active');
        const title = chatItem.getAttribute('data-title') || chatItem.querySelector('.s08-chat-title')?.textContent?.trim() || 'Untitled';
        
        // Detect if chat item belongs to a project folder or is at the global level
        const projectGroup = chatItem.closest('.s08-project-group');
        if (projectGroup) {
          const projectName = projectGroup.getAttribute('data-project-name') || projectGroup.querySelector('.s08-project-name')?.textContent?.trim() || 'Project';
          updateBreadcrumbs(title, projectName);
          if (s08ScopeWaVal) s08ScopeWaVal.textContent = projectName;
        } else {
          // Global conversation: show ONLY chat indication
          updateBreadcrumbs(title, null);
          if (s08ScopeWaVal) s08ScopeWaVal.textContent = 'Global Workspace';
        }

        if (s08ScopeTaskVal) s08ScopeTaskVal.textContent = title;

        if (s08RightTasksList) {
          s08RightTasksList.querySelectorAll('.s08-right-task-row').forEach(row => {
            const rowTitle = row.getAttribute('data-task-title') || row.querySelector('.s08-right-task-title')?.textContent?.trim();
            if (rowTitle && rowTitle.toLowerCase() === title.toLowerCase()) {
              row.classList.add('active');
            } else {
              row.classList.remove('active');
            }
          });
        }
      }
    });
  }

  // Kebab Menu Popover
  function openKebabMenu(btn, item) {
    if (!kebabMenu) return;
    
    closeKebabMenu();

    currentActiveChat = item;
    item.classList.add('menu-open');

    const isPinned = item.classList.contains('pinned');
    if (menuPinLabel) {
      menuPinLabel.textContent = isPinned ? 'Unpin' : 'Pin';
    }

    const rect = btn.getBoundingClientRect();
    const menuWidth = 196;
    const menuHeight = 232;

    let left = rect.right - menuWidth;
    if (left < 12) {
      left = rect.left;
    }
    if (left + menuWidth > window.innerWidth - 12) {
      left = window.innerWidth - menuWidth - 12;
    }

    let top = rect.bottom + 4;
    if (top + menuHeight > window.innerHeight - 12) {
      top = rect.top - menuHeight - 4;
      if (top < 12) top = Math.max(12, window.innerHeight - menuHeight - 12);
    }

    kebabMenu.style.top = `${top}px`;
    kebabMenu.style.left = `${left}px`;
    kebabMenu.classList.add('open');
  }

  function closeKebabMenu() {
    if (!kebabMenu) return;
    kebabMenu.classList.remove('open');
    if (currentActiveChat) {
      currentActiveChat.classList.remove('menu-open');
      currentActiveChat = null;
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && kebabMenu && kebabMenu.classList.contains('open')) {
      closeKebabMenu();
    }
  });

  // Dismiss kebab menu when clicking anywhere outside
  document.addEventListener('click', (e) => {
    if (kebabMenu && kebabMenu.classList.contains('open')) {
      if (!kebabMenu.contains(e.target) && !e.target.closest('.s08-kebab-btn')) {
        closeKebabMenu();
      }
    }
  });

  // 7. Kebab Menu Actions
  const actionRename = document.getElementById('menu-action-rename');
  const actionPin = document.getElementById('menu-action-pin');
  const actionShare = document.getElementById('menu-action-share');
  const actionArchive = document.getElementById('menu-action-archive');
  const actionDelete = document.getElementById('menu-action-delete');
  const actionMove = document.getElementById('menu-action-move');

  if (actionRename) {
    actionRename.addEventListener('click', () => {
      if (!currentActiveChat) return;
      const item = currentActiveChat;
      closeKebabMenu();
      const currentTitle = item.getAttribute('data-title') || '';
      const newTitle = prompt('Rename task:', currentTitle);
      if (newTitle && newTitle.trim()) {
        const clean = newTitle.trim();
        item.setAttribute('data-title', clean);
        const titleSpan = item.querySelector('.s08-chat-title');
        if (titleSpan) titleSpan.textContent = clean;
        if (item.classList.contains('active') && s08CrumbCurrent) {
          s08CrumbCurrent.textContent = clean;
        }
      }
    });
  }

  if (actionPin) {
    actionPin.addEventListener('click', () => {
      if (!currentActiveChat) return;
      const item = currentActiveChat;
      const pinBtn = item.querySelector('.s08-pin-btn');
      closeKebabMenu();
      togglePin(item, pinBtn);
    });
  }

  if (actionShare) {
    actionShare.addEventListener('click', () => {
      if (!currentActiveChat) return;
      const item = currentActiveChat;
      closeKebabMenu();
      const title = item.getAttribute('data-title');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.origin + window.location.pathname + '?chat=' + encodeURIComponent(title));
      }
      alert('Share link for "' + title + '" copied to clipboard!');
    });
  }

  if (actionArchive) {
    actionArchive.addEventListener('click', () => {
      if (!currentActiveChat) return;
      const item = currentActiveChat;
      closeKebabMenu();
      item.style.transition = 'all var(--duration-normal, 240ms) var(--ease-apple-exit, ease)';
      item.style.opacity = '0.35';
      item.style.transform = 'scale(0.97)';
      setTimeout(() => {
        item.style.display = 'none';
      }, 240);
    });
  }

  if (actionDelete) {
    actionDelete.addEventListener('click', () => {
      if (!currentActiveChat) return;
      const item = currentActiveChat;
      closeKebabMenu();
      const title = item.getAttribute('data-title');
      if (confirm('Delete task "' + title + '"? This cannot be undone.')) {
        item.style.transition = 'all var(--duration-normal, 240ms) var(--ease-apple-exit, ease)';
        item.style.opacity = '0';
        item.style.height = '0';
        item.style.padding = '0';
        item.style.margin = '0';
        item.style.overflow = 'hidden';
        setTimeout(() => {
          item.remove();
        }, 240);
      }
    });
  }

  if (actionMove) {
    actionMove.addEventListener('click', () => {
      if (!currentActiveChat) return;
      const item = currentActiveChat;
      closeKebabMenu();
      const title = item.getAttribute('data-title');
      alert('Move "' + title + '" to project: Choose a project from the sidebar Projects section.');
    });
  }

  // Initialize agent tab state and views on startup
  updateAgentTabTitles(currentAgent || 'Agent General');

  // Phase 11: Synchronous Workspace State Hydration & URL Deep-Linking
  if (typeof hydrateWorkspaceState === 'function') {
    hydrateWorkspaceState();
  }
}


