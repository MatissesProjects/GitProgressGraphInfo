document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loading')!;
  const error = document.getElementById('error')!;
  const content = document.getElementById('content')!;
  const totalCount = document.getElementById('total-count')!;
  const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
  const customColors = document.getElementById('custom-colors') as HTMLDivElement;
  const colorStart = document.getElementById('color-start') as HTMLInputElement;
  const colorStop = document.getElementById('color-stop') as HTMLInputElement;

  // Visibility Toggles - Sections
  const toggleGrid = document.getElementById('toggle-grid') as HTMLInputElement;
  const togglePersona = document.getElementById('toggle-persona') as HTMLInputElement;
  const toggleActiveRepos = document.getElementById('toggle-active-repos') as HTMLInputElement;
  const toggleCreatedRepos = document.getElementById('toggle-created-repos') as HTMLInputElement;
  const toggleAchievements = document.getElementById('toggle-achievements') as HTMLInputElement;
  const toggleFooter = document.getElementById('toggle-footer') as HTMLInputElement;
  const toggleLegendNums = document.getElementById('toggle-legend-numbers') as HTMLInputElement;

  // Visibility Toggles - Grid Items
  const toggleTotal = document.getElementById('toggle-total') as HTMLInputElement;
  const toggleToday = document.getElementById('toggle-today') as HTMLInputElement;
  const toggleStreak = document.getElementById('toggle-streak') as HTMLInputElement;
  const toggleIsland = document.getElementById('toggle-island') as HTMLInputElement;
  const toggleVelocity = document.getElementById('toggle-velocity') as HTMLInputElement;
  const toggleConsistency = document.getElementById('toggle-consistency') as HTMLInputElement;
  const toggleWeekend = document.getElementById('toggle-weekend') as HTMLInputElement;
  const toggleSlump = document.getElementById('toggle-slump') as HTMLInputElement;
  const toggleBestDay = document.getElementById('toggle-best-day') as HTMLInputElement;
  const toggleWorstDay = document.getElementById('toggle-worst-day') as HTMLInputElement;
  const toggleCurrentWeekday = document.getElementById('toggle-current-weekday') as HTMLInputElement;
  const toggleMostActiveDay = document.getElementById('toggle-most-active-day') as HTMLInputElement;
  const toggleMaxCommits = document.getElementById('toggle-max-commits') as HTMLInputElement;
  const toggleStars = document.getElementById('toggle-stars') as HTMLInputElement;
  const togglePR = document.getElementById('toggle-pr') as HTMLInputElement;
  const toggleIssueCreated = document.getElementById('toggle-issue-created') as HTMLInputElement;
  const toggleLangs = document.getElementById('toggle-langs') as HTMLInputElement;
  const toggleNetwork = document.getElementById('toggle-network') as HTMLInputElement;

  const sortableList = document.getElementById('sortable-grid-list')!;

  const ITEM_LABELS: Record<string, string> = {
    'gh-total': 'Total Contributions',
    'gh-today': 'Today\'s Contribs',
    'gh-streak': 'Current / Best Streak',
    'gh-island': 'Biggest Island',
    'gh-velocity': 'Average Velocity',
    'gh-consistency': 'Consistency %',
    'gh-weekend': 'Weekend Score',
    'gh-slump': 'Longest Slump',
    'gh-best-day': 'Best Weekday',
    'gh-worst-day': 'Worst Weekday',
    'gh-current-weekday': 'Current Weekday',
    'gh-most-active-day': 'Most Active Day',
    'gh-max-commits': 'Max Daily Commits',
    'gh-stars': 'Pinned Stars / Forks',
    'gh-pr': 'PR Activity',
    'gh-issue-created': 'Issues / Created Repos',
    'gh-langs': 'Top Languages',
    'gh-network': 'Network Stats'
  };

  const defaultOrder = Object.keys(ITEM_LABELS);

  // Load saved theme and colors
  const settings = await chrome.storage.local.get([
    'theme', 'customStart', 'customStop', 
    'showGrid', 'showActiveRepos', 'showCreatedRepos', 'showAchievements',
    'showPersona', 'showFooter', 'showLegendNumbers',
    'showTotal', 'showTodayCount', 'showStreak', 'showVelocity', 'showConsistency', 'showWeekend', 'showSlump', 'showBestDay', 'showWorstDay', 'showCurrentWeekday', 'showMostActiveDay', 'showMaxCommits', 'showIsland', 'showStars', 'showPR', 'showIssueCreated', 'showLangs', 'showNetwork',
    'gridOrder'
  ]);

  let currentOrder: string[] = (settings.gridOrder as string[]) || defaultOrder;
  // Ensure all current items are present
  defaultOrder.forEach(id => {
    if (!currentOrder.includes(id)) currentOrder.push(id);
  });

  const renderSortableList = () => {
    sortableList.innerHTML = '';
    currentOrder.forEach((id: string) => {
      const label = ITEM_LABELS[id];
      if (!label) return;

      const item = document.createElement('div');
      item.className = 'sortable-item';
      item.draggable = true;
      item.dataset.id = id;
      item.style.cssText = `
        padding: 4px 8px;
        background: #ffffff;
        border: 1px solid #d0d7de;
        border-radius: 4px;
        font-size: 10px;
        cursor: grab;
        display: flex;
        align-items: center;
        gap: 8px;
      `;
      item.innerHTML = `
        <span style="color: #57606a;">⋮⋮</span>
        <span>${label}</span>
      `;

      item.addEventListener('dragstart', () => {
        item.classList.add('dragging');
        item.style.opacity = '0.5';
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        item.style.opacity = '1';
        saveOrder();
      });

      sortableList.appendChild(item);
    });
  };

  sortableList.addEventListener('dragover', (e: any) => {
    e.preventDefault();
    const draggingItem = sortableList.querySelector('.dragging')!;
    const siblings = [...sortableList.querySelectorAll('.sortable-item:not(.dragging)')];
    
    let nextSibling = siblings.find(sibling => {
      return e.clientY <= (sibling as HTMLElement).offsetTop + (sibling as HTMLElement).offsetHeight / 2;
    });

    sortableList.insertBefore(draggingItem, nextSibling as Node);
  });

  const saveOrder = () => {
    const items = [...sortableList.querySelectorAll('.sortable-item')];
    currentOrder = items.map(item => (item as HTMLElement).dataset.id!);
    chrome.storage.local.set({ gridOrder: currentOrder });
  };

  renderSortableList();

  if (settings.theme) {
    themeSelect.value = settings.theme as string;
    if (themeSelect.value === 'custom') {
      customColors.style.display = 'block';
    }
  }
  if (settings.customStart) colorStart.value = settings.customStart as string;
  if (settings.customStop) colorStop.value = settings.customStop as string;

  // Set toggle states
  const setChecked = (el: HTMLInputElement, val: any) => el.checked = val !== false;
  
  setChecked(toggleGrid, settings.showGrid);
  setChecked(togglePersona, settings.showPersona);
  setChecked(toggleActiveRepos, settings.showActiveRepos);
  setChecked(toggleCreatedRepos, settings.showCreatedRepos);
  setChecked(toggleAchievements, settings.showAchievements);
  setChecked(toggleFooter, settings.showFooter);
  setChecked(toggleLegendNums, settings.showLegendNumbers);

  setChecked(toggleTotal, settings.showTotal);
  setChecked(toggleToday, settings.showTodayCount);
  setChecked(toggleStreak, settings.showStreak);
  setChecked(toggleIsland, settings.showIsland);
  setChecked(toggleVelocity, settings.showVelocity);
  setChecked(toggleConsistency, settings.showConsistency);
  setChecked(toggleWeekend, settings.showWeekend);
  setChecked(toggleSlump, settings.showSlump);
  setChecked(toggleBestDay, settings.showBestDay);
  setChecked(toggleWorstDay, settings.showWorstDay);
  setChecked(toggleCurrentWeekday, settings.showCurrentWeekday);
  setChecked(toggleMostActiveDay, settings.showMostActiveDay);
  setChecked(toggleMaxCommits, settings.showMaxCommits);
  setChecked(toggleStars, settings.showStars);
  setChecked(togglePR, settings.showPR);
  setChecked(toggleIssueCreated, settings.showIssueCreated);
  setChecked(toggleLangs, settings.showLangs);
  setChecked(toggleNetwork, settings.showNetwork);

  themeSelect.addEventListener('change', async () => {
    await chrome.storage.local.set({ theme: themeSelect.value });
    customColors.style.display = themeSelect.value === 'custom' ? 'block' : 'none';
  });

  const saveColors = async () => {
    await chrome.storage.local.set({ 
      customStart: colorStart.value,
      customStop: colorStop.value 
    });
  };

  colorStart.addEventListener('input', saveColors);
  colorStop.addEventListener('input', saveColors);

  // Toggle Event Listeners
  const addToggleListener = (el: HTMLInputElement, key: string) => {
    el.addEventListener('change', () => chrome.storage.local.set({ [key]: el.checked }));
  };

  addToggleListener(toggleGrid, 'showGrid');
  addToggleListener(togglePersona, 'showPersona');
  addToggleListener(toggleActiveRepos, 'showActiveRepos');
  addToggleListener(toggleCreatedRepos, 'showCreatedRepos');
  addToggleListener(toggleAchievements, 'showAchievements');
  addToggleListener(toggleFooter, 'showFooter');
  addToggleListener(toggleLegendNums, 'showLegendNumbers');

  addToggleListener(toggleTotal, 'showTotal');
  addToggleListener(toggleToday, 'showTodayCount');
  addToggleListener(toggleStreak, 'showStreak');
  addToggleListener(toggleIsland, 'showIsland');
  addToggleListener(toggleVelocity, 'showVelocity');
  addToggleListener(toggleConsistency, 'showConsistency');
  addToggleListener(toggleWeekend, 'showWeekend');
  addToggleListener(toggleSlump, 'showSlump');
  addToggleListener(toggleBestDay, 'showBestDay');
  addToggleListener(toggleWorstDay, 'showWorstDay');
  addToggleListener(toggleCurrentWeekday, 'showCurrentWeekday');
  addToggleListener(toggleMostActiveDay, 'showMostActiveDay');
  addToggleListener(toggleMaxCommits, 'showMaxCommits');
  addToggleListener(toggleStars, 'showStars');
  addToggleListener(togglePR, 'showPR');
  addToggleListener(toggleIssueCreated, 'showIssueCreated');
  addToggleListener(toggleLangs, 'showLangs');
  addToggleListener(toggleNetwork, 'showNetwork');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id || !tab.url?.includes('github.com')) {
      throw new Error("Not a GitHub page");
    }

    chrome.tabs.sendMessage(tab.id, { action: "getStats" }, (response) => {
      if (chrome.runtime.lastError) {
        loading.style.display = 'none';
        error.textContent = "Please refresh the page to activate GitHeat.";
        error.style.display = 'block';
        return;
      }

      if (response && response.success) {
        loading.style.display = 'none';
        content.style.display = 'block';
        
        const adv = response.advanced;
        const titleSuffix = adv.isYTD ? '(YTD)' : '(Year)';
        
        // Update Total label
        const totalLabel = totalCount.previousElementSibling;
        if (totalLabel) {
          totalLabel.textContent = `Total ${titleSuffix}:`;
        }
        
        totalCount.textContent = response.total.toLocaleString();
        document.getElementById('today-count')!.textContent = adv.todayCount.toLocaleString();
        
        const t = response.thresholds;
        document.getElementById('l1-range')!.textContent = `${t[1]?.min ?? '?'}-${t[1]?.max ?? '?'}`;
        document.getElementById('l2-range')!.textContent = `${t[2]?.min ?? '?'}-${t[2]?.max ?? '?'}`;
        document.getElementById('l3-range')!.textContent = `${t[3]?.min ?? '?'}-${t[3]?.max ?? '?'}`;
        document.getElementById('l4-range')!.textContent = `${t[4]?.min ?? '?'}+`;

        // Render Percentiles
        const raritySection = document.getElementById('rarity-section')!;
        const p = response.percentiles;
        const markers = [99, 95, 90, 75, 50];
        
        const existingRows = raritySection.querySelectorAll('.rarity-row');
        existingRows.forEach(r => r.remove());

        markers.forEach(m => {
          if (p[m] !== undefined) {
            const row = document.createElement('div');
            row.className = 'rarity-row';
            row.innerHTML = `
              <span class="rarity-label">Top ${100-m}%:</span>
              <div class="rarity-bar">
                <div class="rarity-fill" style="width: ${m}%"></div>
              </div>
              <span class="rarity-value">${p[m]}+</span>
            `;
            raritySection.appendChild(row);
          }
        });

        // Render Advanced Stats
        document.getElementById('persona-badge')!.textContent = adv.persona;
        document.getElementById('current-streak')!.textContent = `${adv.currentStreak} days`;
        document.getElementById('longest-streak')!.textContent = `${adv.longestStreak} days`;
        document.getElementById('longest-slump')!.textContent = `${adv.longestSlump} days`;
        document.getElementById('consistency')!.textContent = `${adv.consistency}%`;
        document.getElementById('velocity')!.textContent = `${adv.velocity} c/d`;
        document.getElementById('pr-stats')!.textContent = `${adv.pullRequests} / ${adv.mergedPullRequests} / ${adv.pullRequestReviews}`;
        document.getElementById('issue-repo-stats')!.textContent = `${adv.issuesOpened} / ${adv.createdRepos}`;
        document.getElementById('weekend-score')!.textContent = `${adv.weekendScore}%`;
        document.getElementById('best-day')!.textContent = `${adv.bestDay} (${adv.bestDayCount})`;
        document.getElementById('worst-day')!.textContent = `${adv.worstDay} (${adv.worstDayCount})`;
        document.getElementById('current-weekday')!.textContent = `${adv.currentWeekday} (${adv.currentWeekdayCount})`;
        document.getElementById('most-active-day')!.textContent = `${adv.mostActiveDay}`;
        document.getElementById('max-commits')!.textContent = `${adv.mostActiveDayCount}`;
        document.getElementById('pinned-stats')!.textContent = `${adv.totalStars} / ${adv.totalForks}`;
        document.getElementById('top-langs')!.textContent = adv.topLangs.join(', ') || 'N/A';
        document.getElementById('socials')!.textContent = `${adv.socials.followers} Follow / ${adv.socials.organizations} Orgs`;

        // Render Top Repos
        const repoList = document.getElementById('repo-list')!;
        repoList.innerHTML = '';
        adv.topRepos.forEach((r: any) => {
          const div = document.createElement('div');
          div.className = 'stat-row';
          div.style.fontSize = '12px';
          div.innerHTML = `<span>${r.name}</span>`;
          repoList.appendChild(div);
        });

        // Render Created Repos
        const createdRepoList = document.getElementById('created-repo-list')!;
        createdRepoList.innerHTML = '';
        if (adv.createdRepoList && adv.createdRepoList.length > 0) {
          adv.createdRepoList.slice(0, 5).forEach((r: any) => {
            const div = document.createElement('div');
            div.className = 'stat-row';
            div.style.fontSize = '12px';
            div.innerHTML = `<span>${r.name}</span>`;
            createdRepoList.appendChild(div);
          });
        } else {
          createdRepoList.innerHTML = '<span style="font-size: 11px; color: #57606a;">No repos created</span>';
        }

        // Render Achievements
        const achList = document.getElementById('achievement-list')!;
        achList.innerHTML = '';
        adv.achievements.forEach((a: string) => {
          const span = document.createElement('span');
          span.style.fontSize = '10px';
          span.style.padding = '2px 4px';
          span.style.background = '#f6f8fa';
          span.style.border = '1px solid #d0d7de';
          span.style.borderRadius = '4px';
          span.textContent = a;
          achList.appendChild(span);
        });
      } else {
        loading.style.display = 'none';
        error.textContent = response?.error || "Could not find contribution graph.";
        error.style.display = 'block';
      }
    });
  } catch (err: any) {
    loading.style.display = 'none';
    error.textContent = err.message;
    error.style.display = 'block';
  }
});
