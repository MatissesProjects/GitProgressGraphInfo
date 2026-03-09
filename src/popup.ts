import { GitHeatSettings, CustomAvatarSettings, AdvancedStats } from './types';

document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loading')!;
  const error = document.getElementById('error')!;
  const stats = document.getElementById('stats')!;
  const settingsPanel = document.getElementById('settings-panel')!;
  const toggleSettingsBtn = document.getElementById('toggle-settings')!;
  const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
  const colorModeSelect = document.getElementById('color-mode-select') as HTMLSelectElement;
  const customColors = document.getElementById('custom-colors')!;
  const startColorInput = document.getElementById('custom-start') as HTMLInputElement;
  const stopColorInput = document.getElementById('custom-stop') as HTMLInputElement;
  const sortableList = document.getElementById('sortable-grid-order')!;

  const defaultOrder = [
    'gh-streak', 'gh-best-month', 'gh-worst-month', 'gh-best-week', 'gh-worst-week', 'gh-current-week', 'gh-dominant-weekday', 'gh-most-active-day', 'gh-max-commits',
    'gh-velocity', 'gh-velocity-above', 'gh-velocity-below', 'gh-consistency', 'gh-weekend',
    'gh-island', 'gh-slump-island', 'gh-above-avg-island', 'gh-slump',
    'gh-best-day', 'gh-worst-day', 'gh-power-day', 'gh-peak-day', 'gh-current-weekday',
    'gh-stars', 'gh-pr', 'gh-issue-created', 'gh-langs', 'gh-network'
  ];

  const labelMap: Record<string, string> = {
    'gh-streak': 'Current / Best Streak',
    'gh-best-month': 'Best Month',
    'gh-worst-month': 'Worst Month',
    'gh-best-week': 'Best Week',
    'gh-worst-week': 'Worst Week',
    'gh-current-week': 'Current Week',
    'gh-dominant-weekday': 'Dominant Weekday',
    'gh-most-active-day': 'Most Active Day',
    'gh-max-commits': 'Max Daily Commits',
    'gh-velocity': 'Average Velocity',
    'gh-velocity-above': 'Above Average Days',
    'gh-velocity-below': 'Below Average Days',
    'gh-consistency': 'Consistency %',
    'gh-weekend': 'Weekend Score %',
    'gh-island': 'Biggest Island (L2+)',
    'gh-slump-island': 'Worst Island (0-1)',
    'gh-above-avg-island': 'Longest Above Avg Island',
    'gh-slump': 'Longest Slump',
    'gh-best-day': 'Best Weekday',
    'gh-worst-day': 'Worst Weekday',
    'gh-power-day': 'Most Productive (Avg)',
    'gh-peak-day': 'Peak Frequency (L2+)',
    'gh-current-weekday': 'Current Weekday',
    'gh-stars': 'Pinned Stars / Forks',
    'gh-pr': 'PR Activity (O/M/R)',
    'gh-issue-created': 'Issues / Created Repos',
    'gh-langs': 'Top Languages',
    'gh-network': 'Network'
  };

  const renderSortableList = (order: string[]) => {
    sortableList.innerHTML = '';
    order.forEach(id => {
      const li = document.createElement('div');
      li.className = 'sortable-item';
      li.draggable = true;
      li.dataset.id = id;
      li.innerHTML = `
        <span class="drag-handle">⋮⋮</span>
        <span class="sortable-label">${labelMap[id] || id}</span>
      `;
      sortableList.appendChild(li);
    });
  };

  const setupSortable = () => {
    let dragSrcEl: HTMLElement | null = null;

    sortableList.addEventListener('dragstart', (e: DragEvent) => {
      dragSrcEl = e.target as HTMLElement;
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', dragSrcEl.innerHTML);
      }
      dragSrcEl.classList.add('dragging');
    });

    sortableList.addEventListener('dragover', (e: DragEvent) => {
      if (e.preventDefault) e.preventDefault();
      return false;
    });

    sortableList.addEventListener('drop', async (e: DragEvent) => {
      if (e.stopPropagation) e.stopPropagation();
      const target = (e.target as HTMLElement).closest('.sortable-item') as HTMLElement;
      if (dragSrcEl && target && dragSrcEl !== target) {
        const allItems = Array.from(sortableList.querySelectorAll('.sortable-item'));
        const fromIdx = allItems.indexOf(dragSrcEl);
        const toIdx = allItems.indexOf(target);
        
        if (fromIdx < toIdx) {
          target.after(dragSrcEl);
        } else {
          target.before(dragSrcEl);
        }
        
        const newOrder = Array.from(sortableList.querySelectorAll('.sortable-item')).map(el => (el as HTMLElement).dataset.id!);
        await chrome.storage.local.set({ gridOrder: newOrder });
      }
      return false;
    });

    sortableList.addEventListener('dragend', () => {
      if (dragSrcEl) dragSrcEl.classList.remove('dragging');
    });
  };

  const loadSettings = async () => {
    const s = await chrome.storage.local.get(null) as GitHeatSettings;
    themeSelect.value = s.theme || 'green';
    colorModeSelect.value = s.colorMode || 'rgb';
    customColors.style.display = themeSelect.value === 'custom' ? 'flex' : 'none';
    startColorInput.value = s.customStart || '#4a207e';
    stopColorInput.value = s.customStop || '#04ff00';

    const setChecked = (id: string, val: boolean | undefined) => {
      const el = document.getElementById(id) as HTMLInputElement;
      if (el) el.checked = val !== false;
    };

    setChecked('toggle-grid', s.showGrid);
    setChecked('toggle-active-repos', s.showActiveRepos);
    setChecked('toggle-created-repos', s.showCreatedRepos);
    setChecked('toggle-achievements', s.showAchievements);
    setChecked('toggle-persona', s.showPersona);
    setChecked('toggle-footer', s.showFooter);
    setChecked('toggle-legend-numbers', s.showLegendNumbers);
    setChecked('toggle-trends', s.showTrends);
    setChecked('toggle-pulse-hash', s.showPulseHash);
    setChecked('toggle-ticker', s.showTicker);
    setChecked('toggle-avatar', s.showAvatar);
    setChecked('toggle-combo', s.showCombo);
    setChecked('toggle-xp-bar', s.showXPBar);
    setChecked('toggle-skill-tree', s.showSkillTree);

    setChecked('toggle-total', s.showTotal);
    setChecked('toggle-streak', s.showStreak);
    setChecked('toggle-velocity', s.showVelocity);
    setChecked('toggle-consistency', s.showConsistency);
    setChecked('toggle-weekend', s.showWeekend);
    setChecked('toggle-slump', s.showSlump);
    setChecked('toggle-best-day', s.showBestDay);
    setChecked('toggle-worst-day', s.showWorstDay);
    setChecked('toggle-most-active-day', s.showMostActiveDay);
    setChecked('toggle-current-weekday', s.showCurrentWeekday);
    setChecked('toggle-max-commits', s.showMaxCommits);
    setChecked('toggle-island', s.showIsland);
    setChecked('toggle-slump-island', s.showSlumpIsland);
    setChecked('toggle-above-avg-island', s.showAboveAvgIsland);
    setChecked('toggle-power-day', s.showPowerDay);
    setChecked('toggle-peak-day', s.showPeakDay);
    setChecked('toggle-stars', s.showStars);
    setChecked('toggle-pr', s.showPR);
    setChecked('toggle-issue-created', s.showIssueCreated);
    setChecked('toggle-langs', s.showLangs);
    setChecked('toggle-network', s.showNetwork);
    setChecked('toggle-best-month', s.showBestMonth);
    setChecked('toggle-worst-month', s.showWorstMonth);
    setChecked('toggle-best-week', s.showBestWeek);
    setChecked('toggle-worst-week', s.showWorstWeek);
    setChecked('toggle-current-week', s.showCurrentWeek);
    setChecked('toggle-dominant-weekday', s.showDominantWeekday);

    renderSortableList(s.gridOrder || defaultOrder);
    setupSortable();
  };

  const saveSetting = async (key: string, val: boolean | string | string[]) => {
    await chrome.storage.local.set({ [key]: val });
  };

  document.querySelectorAll('.settings-section input[type="checkbox"]').forEach(el => {
    el.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const key = target.id.replace('toggle-', 'show').split('-').map((word, i) => i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)).join('');
      saveSetting(key, target.checked);
    });
  });

  themeSelect.addEventListener('change', () => {
    customColors.style.display = themeSelect.value === 'custom' ? 'flex' : 'none';
    saveSetting('theme', themeSelect.value);
  });

  colorModeSelect.addEventListener('change', () => saveSetting('colorMode', colorModeSelect.value));
  startColorInput.addEventListener('change', () => saveSetting('customStart', startColorInput.value));
  stopColorInput.addEventListener('change', () => saveSetting('customStop', stopColorInput.value));

  toggleSettingsBtn.addEventListener('click', () => {
    const isVisible = settingsPanel.style.display === 'block';
    settingsPanel.style.display = isVisible ? 'none' : 'block';
    toggleSettingsBtn.textContent = isVisible ? '⚙️ Settings' : '✖ Close Settings';
  });

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]?.id) return;

    chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_STATS' }, (response) => {
      loading.style.display = 'none';
      if (response?.success) {
        const adv: AdvancedStats = response.advanced;
        stats.style.display = 'block';
        
        document.getElementById('total-commits')!.textContent = adv.total.toString();
        document.getElementById('current-streak')!.textContent = `${adv.streak} / ${adv.maxStreak} days`;
        
        const velTrendHtml = adv.velocityTrend !== 0 ? ` <span style="color: ${adv.velocityTrend > 0 ? '#1a7f37' : '#cf222e'}; font-weight: bold;" title="Velocity Trend (Recent vs YTD)">${adv.velocityIcon}${Math.abs(adv.velocityTrend)}%</span>` : '';
        const accelHtml = adv.acceleration !== 0 ? ` <span style="color: ${adv.acceleration > 0 ? '#1a7f37' : '#cf222e'}; font-size: 0.9em; opacity: 0.9;" title="Acceleration (Recent vs Prev Week)">${adv.accelerationIcon}${Math.abs(adv.acceleration)}% acc</span>` : '';
        document.getElementById('velocity')!.innerHTML = `${adv.velocity} <span style="font-size: 0.8em; opacity: 0.8;">c/d</span>${velTrendHtml}${accelHtml}`;
        
        document.getElementById('pr-stats')!.textContent = `${adv.pullRequests} / ${adv.mergedPullRequests} / ${adv.pullRequestReviews}`;
        document.getElementById('consistency')!.textContent = `${adv.consistency}%`;
        document.getElementById('weekend-score')!.textContent = `${adv.weekendScore}%`;
        
        const bestMonthTrendHtml = adv.bestMonthTrend !== 0 ? ` <span style="color: ${adv.bestMonthTrend > 0 ? '#1a7f37' : '#cf222e'}; font-weight: bold;" title="Best month vs average month score">${adv.bestMonthIcon}${Math.abs(adv.bestMonthTrend)}%</span>` : '';
        document.getElementById('best-month')!.innerHTML = `${adv.bestMonthName} (Score: ${adv.bestMonthStats.score})${bestMonthTrendHtml}`;
        
        const worstMonthTrendHtml = adv.worstMonthTrend !== 0 ? ` <span style="color: ${adv.worstMonthTrend > 0 ? '#1a7f37' : '#cf222e'}; font-weight: bold;" title="Worst month vs average month score">${adv.worstMonthIcon}${Math.abs(adv.worstMonthTrend)}%</span>` : '';
        const worstMonthEl = document.getElementById('worst-month')!;
        worstMonthEl.innerHTML = `${adv.worstMonthName} (Score: ${adv.worstMonthStats.score})${worstMonthTrendHtml}`;
        worstMonthEl.title = `Calculation: Commits × Consistency × Max Streak. Avg Score: ${Math.round(adv.avgMonthScore || 0)}`;

        const bestWeekTrendHtml = adv.bestWeekTrend !== 0 ? ` <span style="color: ${adv.bestWeekTrend > 0 ? '#1a7f37' : '#cf222e'}; font-weight: bold;" title="Best week vs average week score">${adv.bestWeekIcon}${Math.abs(adv.bestWeekTrend)}%</span>` : '';
        document.getElementById('best-week')!.innerHTML = `${adv.bestWeekName} (Score: ${adv.bestWeekStats.score})${bestWeekTrendHtml}`;
        
        const worstWeekTrendHtml = adv.worstWeekTrend !== 0 ? ` <span style="color: ${adv.worstWeekTrend > 0 ? '#1a7f37' : '#cf222e'}; font-weight: bold;" title="Worst week vs average week score">${adv.worstWeekIcon}${Math.abs(adv.worstWeekTrend)}%</span>` : '';
        const worstWeekEl = document.getElementById('worst-week')!;
        worstWeekEl.innerHTML = `${adv.worstWeekName} (Score: ${adv.worstWeekStats.score})${worstWeekTrendHtml}`;
        worstWeekEl.title = `Calculation: Commits × Consistency × Max Streak. Avg Score: ${Math.round(adv.avgWeekScore || 0)}`;

        document.getElementById('current-week')!.innerHTML = `Score: ${adv.currentWeekStats.score}`;
        document.getElementById('dominant-weekday')!.textContent = `${adv.dominantWeekday} (${adv.dominantWeekdayWins} weeks)`;

        const repoList = document.getElementById('top-repos')!;
        repoList.innerHTML = '';
        adv.topRepos.forEach((r: {name:string; commits:number}) => {
          const div = document.createElement('div');
          div.className = 'repo-item';
          div.innerHTML = `<span>${r.name}</span><strong>${r.commits}</strong>`;
          repoList.appendChild(div);
        });

        const createdList = document.getElementById('created-repos')!;
        createdList.innerHTML = '';
        adv.createdRepoList.slice(0, 5).forEach((r: {name:string; date:string}) => {
          const div = document.createElement('div');
          div.className = 'repo-item';
          div.innerHTML = `<span>${r.name}</span><small>${r.date}</small>`;
          createdList.appendChild(div);
        });

        const achievementList = document.getElementById('achievement-list')!;
        achievementList.innerHTML = '';
        adv.achievements.forEach((a: string) => {
          const span = document.createElement('span');
          span.className = 'achievement-badge';
          span.textContent = a;
          achievementList.appendChild(span);
        });

        loadSettings();
      } else {
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
