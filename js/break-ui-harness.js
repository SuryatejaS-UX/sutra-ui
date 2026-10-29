/**
 * Sutra UI — break-ui Adversarial Stress Testing Harness
 * Dev-only boundary fixture swapper & state segmented controller
 */
(function() {
  'use strict';

  // Available test states
  const STATES = [
    { id: 'demo', label: 'Demo Data' },
    { id: 'worst', label: 'Worst Case (2-Col Squeeze)' },
    { id: 'four-tabs', label: '4-Tabs Concurrency' },
    { id: 'three-pane', label: '3-Pane Layout' },
    { id: 'zero-tabs', label: 'Zero Tabs (Empty)' }
  ];

  function getActiveStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const dataVal = (params.get('data') || 'demo').toLowerCase().trim();
    const found = STATES.find(s => s.id === dataVal);
    return found ? found.id : 'demo';
  }

  function setActiveStateInUrl(stateId) {
    const url = new URL(window.location.href);
    if (!stateId || stateId === 'demo') {
      url.searchParams.delete('data');
    } else {
      url.searchParams.set('data', stateId);
    }
    window.history.replaceState({}, '', url.toString());
  }

  // Clean adversarial DOM overrides and restore clean workspace state
  function cleanAdversarialContent() {
    const messagesStream = document.getElementById('s08-messages-stream');
    const crumbCurrent = document.getElementById('s08-crumb-current');
    const scopeWsBadge = document.getElementById('s08-scope-ws-badge');
    const scopeWaBadge = document.getElementById('s08-scope-wa-badge');
    const chatTextarea = document.getElementById('s08-chat-textarea');
    const agentPillLabel = document.getElementById('s08-agent-pill-label');
    const agentPillBtn = document.getElementById('s08-agent-pill-btn');

    // Reset breadcrumb to clean default
    if (crumbCurrent) {
      crumbCurrent.textContent = 'API Authentication Flow';
      crumbCurrent.removeAttribute('data-custom-tooltip');
      crumbCurrent.removeAttribute('title');
      crumbCurrent.removeAttribute('aria-label');
    }

    // Reset scope badges to clean state
    if (scopeWsBadge) {
      scopeWsBadge.textContent = 'Select Workspace';
      scopeWsBadge.classList.add('is-empty');
    }
    if (scopeWaBadge) {
      scopeWaBadge.textContent = 'Folder';
      scopeWaBadge.classList.add('is-empty');
    }

    // Reset textarea placeholder
    if (chatTextarea) {
      chatTextarea.placeholder = 'e.g. What is the loan disbursement forecast for this month?';
    }

    // Reset agent pill label and tooltip
    const activeAgent = (window.__sutraState && window.__sutraState.currentAgent) ? window.__sutraState.currentAgent.name : 'Agent General';
    if (agentPillLabel) {
      agentPillLabel.textContent = activeAgent.length > 16 ? activeAgent.slice(0, 16) + '...' : activeAgent;
    }
    if (agentPillBtn) {
      agentPillBtn.setAttribute('data-custom-tooltip', activeAgent);
      agentPillBtn.setAttribute('title', activeAgent);
      agentPillBtn.setAttribute('aria-label', `Active Agent: ${activeAgent}`);
      agentPillBtn.setAttribute('data-agent', activeAgent);
    }

    // Clear adversarial mock messages from stream
    if (messagesStream) {
      messagesStream.innerHTML = '';
    }
  }

  // Close break-ui dev toggle & remove testing parameters from URL
  function closeBreakUi() {
    sessionStorage.removeItem('sutra_break_ui_active');
    const existing = document.getElementById('break-ui-dev-toggle');
    if (existing) existing.remove();

    // Clean URL params
    const url = new URL(window.location.href);
    url.searchParams.delete('data');
    url.searchParams.delete('breakui');
    window.history.replaceState({}, '', url.toString());

    // Clean adversarial content
    cleanAdversarialContent();
  }

  // Create dev-only segmented toggle at bottom center
  function injectBreakUiToggle(activeId) {
    const existing = document.getElementById('break-ui-dev-toggle');
    if (existing) existing.remove();

    const container = document.createElement('aside');
    container.id = 'break-ui-dev-toggle';
    container.setAttribute('aria-label', 'break-ui Dev State Switcher');
    container.style.cssText = `
      position: fixed;
      bottom: 14px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 3px;
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 9999px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      font-weight: 500;
      user-select: none;
    `;

    const titleBadge = document.createElement('span');
    titleBadge.textContent = 'break-ui:';
    titleBadge.style.cssText = `
      color: #94A3B8;
      padding: 0 8px 0 6px;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      font-size: 10px;
    `;
    container.appendChild(titleBadge);

    STATES.forEach(state => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = state.label;
      btn.setAttribute('data-state', state.id);
      const isActive = state.id === activeId;
      btn.style.cssText = `
        border: none;
        outline: none;
        cursor: pointer;
        padding: 4px 10px;
        border-radius: 9999px;
        font-size: 11px;
        font-family: inherit;
        transition: all 0.15s ease;
        background: ${isActive ? '#FFFFFF' : 'transparent'};
        color: ${isActive ? '#0F172A' : '#E2E8F0'};
        font-weight: ${isActive ? '600' : '500'};
        box-shadow: ${isActive ? '0 1px 3px rgba(0, 0, 0, 0.15)' : 'none'};
      `;

      btn.addEventListener('mouseenter', () => {
        if (btn.getAttribute('data-state') !== getActiveStateFromUrl()) {
          btn.style.background = 'rgba(255, 255, 255, 0.15)';
          btn.style.color = '#FFFFFF';
        }
      });
      btn.addEventListener('mouseleave', () => {
        if (btn.getAttribute('data-state') !== getActiveStateFromUrl()) {
          btn.style.background = 'transparent';
          btn.style.color = '#E2E8F0';
        }
      });

      btn.addEventListener('click', () => {
        applyState(state.id);
      });

      container.appendChild(btn);
    });

    // Separator line
    const sep = document.createElement('div');
    sep.style.cssText = 'width: 1px; height: 16px; background: rgba(255, 255, 255, 0.2); margin: 0 4px;';
    container.appendChild(sep);

    // Close button (clean up break ui and hide toolbar)
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Exit break-ui mode & clean UI');
    closeBtn.title = 'Exit break-ui mode (Ctrl+Shift+B to reopen)';
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      border: none;
      outline: none;
      cursor: pointer;
      width: 22px;
      height: 22px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 9999px;
      font-size: 11px;
      line-height: 1;
      transition: all 0.15s ease;
      background: transparent;
      color: #94A3B8;
      padding: 0;
      margin-right: 2px;
    `;
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(239, 68, 68, 0.25)';
      closeBtn.style.color = '#FCA5A5';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'transparent';
      closeBtn.style.color = '#94A3B8';
    });
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeBreakUi();
    });
    container.appendChild(closeBtn);

    document.body.appendChild(container);
  }

  // Ensure workspace view is open
  function ensureWorkspaceActive() {
    const dockWorkspaceBtn = document.querySelectorAll('.sutra-dock-btn')?.[1] || document.querySelectorAll('.sutra-nav-dock .sutra-dock-item')?.[1];
    if (dockWorkspaceBtn) {
      dockWorkspaceBtn.click();
    } else {
      const workspaceView = document.getElementById('sutra-workspace-view');
      const catalogueView = document.getElementById('sutra-catalogue-view');
      if (catalogueView) catalogueView.style.display = 'none';
      if (workspaceView) workspaceView.style.display = 'flex';
    }
  }

  // Open a specific tab via the Add Tab Menu items
  function triggerOpenTab(tabKey) {
    const addTabMenu = document.getElementById('s08-add-tab-menu');
    if (!addTabMenu) return;
    const item = addTabMenu.querySelector(`.s08-tab-menu-item[data-tab-name="${tabKey}"]`);
    if (item) {
      item.click();
    }
  }

  // Close all open tabs
  function closeAllTabs() {
    const pills = document.querySelectorAll('#s08-tab-pills-list .s08-tab-pill');
    pills.forEach(pill => {
      const closeBtn = pill.querySelector('.s08-tab-close-icon');
      if (closeBtn) closeBtn.click();
    });
  }

  // Apply State Fixtures
  function applyState(stateId) {
    setActiveStateInUrl(stateId);
    injectBreakUiToggle(stateId);
    ensureWorkspaceActive();

    const messagesStream = document.getElementById('s08-messages-stream');
    const crumbCurrent = document.getElementById('s08-crumb-current');
    const scopeWsBadge = document.getElementById('s08-scope-ws-badge');
    const scopeWaBadge = document.getElementById('s08-scope-wa-badge');
    const chatTextarea = document.getElementById('s08-chat-textarea');
    const agentPillLabel = document.getElementById('s08-agent-pill-label');

    const agentPillBtn = document.getElementById('s08-agent-pill-btn');

    if (stateId === 'demo') {
      // 1. Reset breadcrumbs and scope
      if (crumbCurrent) {
        crumbCurrent.textContent = 'API Authentication Flow';
        crumbCurrent.removeAttribute('data-custom-tooltip');
        crumbCurrent.removeAttribute('title');
      }
      if (scopeWsBadge) scopeWsBadge.textContent = 'Select Workspace';
      if (scopeWaBadge) scopeWaBadge.textContent = 'Folder';
      if (chatTextarea) chatTextarea.placeholder = 'e.g. What is the loan disbursement forecast for this month?';
      if (agentPillLabel) agentPillLabel.textContent = 'Agent General';
      if (agentPillBtn) {
        agentPillBtn.setAttribute('data-custom-tooltip', 'Agent General');
        agentPillBtn.setAttribute('title', 'Agent General');
        agentPillBtn.setAttribute('aria-label', 'Active Agent: Agent General');
        agentPillBtn.setAttribute('data-agent', 'Agent General');
      }

      // 2. Open default single tab (sources / files)
      closeAllTabs();
      triggerOpenTab('sources');

    } else if (stateId === 'worst') {
      // Worst Case: 2-Column Squeeze + Long Unbreakable Data
      if (crumbCurrent) {
        const fullTitle = 'Refactor Multi-Tenant Distributed Telemetry Collector & Resiliency Circuit Breaker for Enterprise Infrastructure';
        // User request: decrease character length, add ellipses, render tooltip in 2 lines
        const shortTitle = 'Refactor Multi-Tenant Distributed...';
        crumbCurrent.textContent = shortTitle;
        crumbCurrent.setAttribute('title', fullTitle);
        crumbCurrent.setAttribute('data-custom-tooltip', 'Refactor Multi-Tenant Distributed Telemetry Collector &\nResiliency Circuit Breaker for Enterprise Infrastructure');
        crumbCurrent.setAttribute('aria-label', fullTitle);
      }
      if (scopeWsBadge) {
        scopeWsBadge.textContent = 'northwind-industries-cloud-enterprise-monorepo';
        scopeWsBadge.classList.remove('is-empty');
      }
      if (scopeWaBadge) {
        scopeWaBadge.textContent = 'production-kubernetes-orchestration-environment';
        scopeWaBadge.classList.remove('is-empty');
      }
      if (chatTextarea) {
        chatTextarea.placeholder = 'e.g. Inspect the Kubernetes deployment pod logs for bartholomew.fitzgerald@northwind-industries-holdings.example.com';
      }
      const worstAgentName = 'Autonomous FinOps Specialist';
      if (agentPillLabel) {
        // User request: truncate after 16 characters + ...
        agentPillLabel.textContent = worstAgentName.length > 16 ? worstAgentName.slice(0, 16) + '...' : worstAgentName;
      }
      if (agentPillBtn) {
        // User request: tooltip should show full name
        agentPillBtn.setAttribute('data-custom-tooltip', worstAgentName);
        agentPillBtn.setAttribute('title', worstAgentName);
        agentPillBtn.setAttribute('aria-label', `Active Agent: ${worstAgentName}`);
        agentPillBtn.setAttribute('data-agent', worstAgentName);
      }

      // Populate extreme messages in conversation
      if (messagesStream) {
        messagesStream.innerHTML = `
          <div class="s08-conversation-turn">
            <div class="s08-chat-message user">
              <div class="s08-msg-bubble user">
                <div class="s08-msg-text">Please inspect fatal stack trace for commit 9f8e7d6c5b4a4c3d8e2f1a0b9c8d7e6f3b2a1c0e deployed on https://staging-preview.northwind-industries-holdings.example.com/workspaces/acme/projects/q3-launch/metrics?view=expanded&filter=unresolved_incidents</div>
              </div>
              <div class="s08-msg-user-actions">
                <span class="s08-msg-time">11:42 PM</span>
                <button class="s08-msg-action-btn" type="button" title="Copy"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></button>
              </div>
            </div>

            <div class="s08-chat-message agent">
              <div class="s08-msg-agent-header">
                <span class="s08-msg-agent-badge">Agent General</span>
                <span class="s08-msg-time">Just now</span>
              </div>
              <div class="s08-msg-bubble agent">
                <div class="s08-msg-text">
                  <p>Identified high crash rate in downstream collector pipeline. Below is the multi-region cluster latency breakdown matrix:</p>
                  <div style="overflow-x: auto; margin: 10px 0; border: 1px solid #E2E8F0; border-radius: 6px; max-width: 100%; box-sizing: border-box;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left; min-width: 480px;">
                      <thead>
                        <tr style="background: #F8FAFC; border-bottom: 1px solid #E2E8F0;">
                          <th style="padding: 6px 8px;">Microservice Name</th>
                          <th style="padding: 6px 8px;">Cluster Pod ID</th>
                          <th style="padding: 6px 8px;">P99 Latency</th>
                          <th style="padding: 6px 8px;">Throughput</th>
                          <th style="padding: 6px 8px;">Error Rate</th>
                          <th style="padding: 6px 8px;">Health</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style="border-bottom: 1px solid #F1F5F9;">
                          <td style="padding: 6px 8px;">telemetry-collector-core</td>
                          <td style="padding: 6px 8px;">pod-us-east-1a-8f9d</td>
                          <td style="padding: 6px 8px;">1,840ms</td>
                          <td style="padding: 6px 8px;">28,950 req/s</td>
                          <td style="padding: 6px 8px; color: #EF4444;">12.8%</td>
                          <td style="padding: 6px 8px; color: #EF4444; font-weight: 600;">CRITICAL</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 8px;">billing-orchestration-svc</td>
                          <td style="padding: 6px 8px;">pod-us-east-1c-1a0b</td>
                          <td style="padding: 6px 8px;">2,450ms</td>
                          <td style="padding: 6px 8px;">3,100 req/s</td>
                          <td style="padding: 6px 8px; color: #DC2626;">48.2%</td>
                          <td style="padding: 6px 8px; color: #DC2626; font-weight: 600;">CIRCUIT_BROKEN</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div class="s08-msg-agent-footer">
                <div class="s08-msg-agent-actions">
                  <button class="s08-msg-action-btn" type="button" title="Copy"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></button>
                  <button class="s08-msg-action-btn" type="button" title="Good"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg></button>
                  <button class="s08-msg-action-btn" type="button" title="Bad"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/></svg></button>
                  <button class="s08-msg-action-btn" type="button" title="Regenerate"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg></button>
                </div>
                <div class="s08-msg-timing">
                  <span class="timing-item"><span class="timing-key">ttft</span> <span class="timing-val">0.38s</span></span>
                  <span class="timing-item"><span class="timing-key">total</span> <span class="timing-val">4.82s</span></span>
                  <span class="timing-item"><span class="timing-key">tok/s</span> <span class="timing-val">82</span></span>
                  <span class="timing-item"><span class="timing-key">tokens</span> <span class="timing-val">3,428</span></span>
                  <span class="timing-item"><span class="timing-key">cost</span> <span class="timing-val">$0.052</span></span>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      // Open 2 tabs to activate 2-column layout
      closeAllTabs();
      triggerOpenTab('sources');
      triggerOpenTab('browser');

    } else if (stateId === 'four-tabs') {
      // 4-Tabs Concurrency Stress Test
      closeAllTabs();
      triggerOpenTab('sources');
      triggerOpenTab('browser');
      triggerOpenTab('log viewer');
      triggerOpenTab('editor');

      // Expand labels to test tab strip horizontal wrapping/scrolling with ellipsis
      const pills = document.querySelectorAll('#s08-tab-pills-list .s08-tab-pill');
      pills.forEach(pill => {
        const name = pill.getAttribute('data-tab-name');
        const label = pill.querySelector('.s08-tab-pill-label');
        if (label) {
          if (name === 'sources') {
            label.textContent = 'Distributed-Tracing-Spec.v2.4.json';
            pill.setAttribute('title', 'Distributed-Tracing-Spec.v2.4.json');
            pill.setAttribute('data-custom-tooltip', 'Distributed-Tracing-Spec.v2.4.json');
          }
          if (name === 'browser') {
            label.textContent = 'localhost:3000/analytics';
            pill.setAttribute('title', 'http://localhost:3000/staging/analytics');
            pill.setAttribute('data-custom-tooltip', 'http://localhost:3000/staging/analytics');
          }
          if (name === 'log viewer') {
            label.textContent = 'Cluster Pod Stream';
            pill.setAttribute('title', 'Kubernetes Cluster Pod Stream');
            pill.setAttribute('data-custom-tooltip', 'Kubernetes Cluster Pod Stream');
          }
          if (name === 'editor') {
            label.textContent = 'orchestration.config.yaml';
            pill.setAttribute('title', 'production.orchestration.config.yaml');
            pill.setAttribute('data-custom-tooltip', 'production.orchestration.config.yaml');
          }
        }
      });

      // Focus editor to prove it displays in the Stage!
      const editorPill = document.querySelector('#s08-tab-pills-list .s08-tab-pill[data-tab-name="editor"]');
      if (editorPill) editorPill.click();

    } else if (stateId === 'three-pane') {
      // 3-Pane Multi-Layout Stress
      closeAllTabs();
      triggerOpenTab('sources');
      triggerOpenTab('browser');
      triggerOpenTab('log viewer');

      // Populate 35+ log entries in Log Viewer
      const logContent = document.querySelector('.s08-logs-content');
      if (logContent) {
        let logsHtml = '';
        for (let i = 1; i <= 35; i++) {
          const tag = i % 5 === 0 ? 'ERR' : (i % 3 === 0 ? 'WARN' : 'INFO');
          logsHtml += `
            <div class="s08-log-row ${tag === 'ERR' ? 'err' : (tag === 'WARN' ? 'warn' : 'info')}">
              <span class="log-t">[23:40:${String(i).padStart(2, '0')}]</span>
              <span class="log-tag">${tag}</span>
              <span>[ClusterWorker#${i}] Connection refused: failed to heartbeat worker node ip-10-0-128-${i}.ec2.internal:9092: connection timeout after 5000ms</span>
            </div>
          `;
        }
        logContent.innerHTML = logsHtml;
      }

    } else if (stateId === 'zero-tabs') {
      // Zero Tabs Boundary State
      closeAllTabs();
    }
  }

  // Initialize on load
  function init() {
    const params = new URLSearchParams(window.location.search);
    const hasDataParam = params.has('data');
    const hasBreakUiParam = params.has('breakui');
    const isSessionActive = sessionStorage.getItem('sutra_break_ui_active') === 'true';
    const dataVal = (params.get('data') || '').toLowerCase().trim();
    const isStressState = ['worst', 'four-tabs', 'three-pane', 'zero-tabs'].includes(dataVal);

    // Attach global keyboard shortcut Ctrl+Shift+B / Cmd+Shift+B to toggle break-ui harness
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'B' || e.key === 'b')) {
        e.preventDefault();
        toggleBreakUi();
      }
    });

    // If neither URL param nor session flag is present, remain completely dormant
    if (!hasDataParam && !hasBreakUiParam && !isSessionActive) {
      return;
    }

    // Active session or parameter present: inject dev toggle
    sessionStorage.setItem('sutra_break_ui_active', 'true');
    injectBreakUiToggle(dataVal || 'demo');

    // Only apply adversarial state overrides on boot if explicitly requested via ?data= (worst, four-tabs, three-pane, zero-tabs)
    // For normal user sessions, do not wipe out open tabs
    if (hasDataParam && isStressState) {
      setTimeout(() => {
        applyState(dataVal);
      }, 200);
    }
  }

  function toggleBreakUi() {
    const existing = document.getElementById('break-ui-dev-toggle');
    if (existing) {
      closeBreakUi();
    } else {
      sessionStorage.setItem('sutra_break_ui_active', 'true');
      const activeState = getActiveStateFromUrl();
      injectBreakUiToggle(activeState);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose global for manual console testing or external developer tooling
  window.__breakUi = {
    applyState,
    cleanAdversarialContent,
    close: closeBreakUi,
    toggle: toggleBreakUi,
    STATES
  };
})();
