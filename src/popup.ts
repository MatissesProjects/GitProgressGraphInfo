import { GitHeatSettings, AdvancedStats } from './types';

document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const content = document.getElementById('content');
  
  const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
  const colorModeSelect = document.getElementById('color-mode-select') as HTMLSelectElement;
  const customColors = document.getElementById('custom-colors');
  const startColorInput = document.getElementById('color-start') as HTMLInputElement;
  const stopColorInput = document.getElementById('color-stop') as HTMLInputElement;
  const sortableList = document.getElementById('sortable-grid-list');

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
    if (!sortableList) return;
    sortableList.innerHTML = '';
    order.forEach(id => {
      const li = document.createElement('div');
      li.className = 'sortable-item';
      li.draggable = true;
      li.dataset.id = id;
      li.style.cssText = "display: flex; align-items: center; gap: 8px; padding: 4px 8px; background: #fff; border: 1px solid #d0d7de; border-radius: 4px; margin-bottom: 2px; cursor: move; font-size: 11px;";
      li.innerHTML = `
        <span class="drag-handle" style="color: #8c959f;">⋮⋮</span>
        <span class="sortable-label">${labelMap[id] || id}</span>
      `;
      sortableList.appendChild(li);
    });
  };

  const setupSortable = () => {
    if (!sortableList) return;
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
    if (themeSelect) themeSelect.value = s.theme || 'green';
    if (colorModeSelect) colorModeSelect.value = s.colorMode || 'rgb';
    if (customColors) customColors.style.display = themeSelect.value === 'custom' ? 'block' : 'none';
    if (startColorInput) startColorInput.value = s.customStart || '#ebedf0';
    if (stopColorInput) stopColorInput.value = s.customStop || '#216e39';

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
    setChecked('toggle-gear-head', s.showGearHead);
    setChecked('toggle-gear-weapon', s.showGearWeapon);
    setChecked('toggle-gear-shield', s.showGearShield);
    setChecked('toggle-gear-companion', s.showGearCompanion);

    setChecked('toggle-total', s.showTotal);
    setChecked('toggle-today', s.showTodayCount);
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

  document.querySelectorAll('.visibility-toggles input[type="checkbox"]').forEach(el => {
    el.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const key = target.id.replace('toggle-', 'show').split('-').map((word, i) => i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)).join('');
      saveSetting(key, target.checked);
    });
  });

  if (themeSelect) {
    themeSelect.addEventListener('change', () => {
      if (customColors) customColors.style.display = themeSelect.value === 'custom' ? 'block' : 'none';
      saveSetting('theme', themeSelect.value);
    });
  }

  if (colorModeSelect) colorModeSelect.addEventListener('change', () => saveSetting('colorMode', colorModeSelect.value));
  if (startColorInput) startColorInput.addEventListener('change', () => saveSetting('customStart', startColorInput.value));
  if (stopColorInput) stopColorInput.addEventListener('change', () => saveSetting('customStop', stopColorInput.value));

  const resetBtn = document.getElementById('reset-reorder');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      await chrome.storage.local.set({ gridOrder: defaultOrder });
      renderSortableList(defaultOrder);
    });
  }

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]?.id) return;

    chrome.tabs.sendMessage(tabs[0].id, { action: 'getStats' }, (response) => {
      if (loading) loading.style.display = 'none';
      if (response?.success) {
        const adv: AdvancedStats = response.advanced;
        const thresholds = response.thresholds;
        
        if (content) content.style.display = 'block';
        
        const setVal = (id: string, val: string | number) => {
          const el = document.getElementById(id);
          if (el) el.textContent = val.toString();
        };

        const setHtml = (id: string, html: string) => {
          const el = document.getElementById(id);
          if (el) el.innerHTML = html;
        };

        setVal('total-count', adv.total);
        setVal('today-count', adv.todayCount);
        setVal('rpg-level', `${adv.level} (${adv.levelTitle})`);
        setVal('current-streak', `${adv.streak} / ${adv.maxStreak} days`);
        setVal('longest-streak', `${adv.maxStreak} days`);
        setVal('longest-slump', `${adv.longestSlump} days`);
        setVal('consistency', `${adv.consistency}%`);
        setVal('weekend-score', `${adv.weekendScore}%`);
        setVal('dominant-weekday', `${adv.dominantWeekday} (${adv.dominantWeekdayWins} wins)`);
        setVal('pr-stats', `${adv.pullRequests} / ${adv.mergedPullRequests} / ${adv.pullRequestReviews}`);
        setVal('issue-repo-stats', `${adv.issuesOpened} / ${adv.createdRepos}`);
        setVal('socials', `${adv.socials.followers} followers / ${adv.socials.organizations} orgs`);
        setVal('top-langs', adv.topLangs.join(', ') || 'N/A');
        setVal('pinned-stats', `${adv.totalStars} stars / ${adv.totalForks} forks`);
        
        setHtml('persona-badge', adv.persona);
        setHtml('velocity', `${adv.velocity} <small>c/d</small> ${adv.velocityIcon}${Math.abs(adv.velocityTrend)}%`);
        setHtml('best-month', `${adv.bestMonthName} (Score: ${adv.bestMonthStats.score})`);
        setHtml('worst-month', `${adv.worstMonthName} (Score: ${adv.worstMonthStats.score})`);
        setHtml('best-week', `${adv.bestWeekName} (Score: ${adv.bestWeekStats.score})`);
        setHtml('worst-week', `${adv.worstWeekName} (Score: ${adv.worstWeekStats.score})`);
        setHtml('current-week', `Score: ${adv.currentWeekStats.score}`);
        setHtml('best-day', `${adv.bestDay} (${adv.bestDayCount})`);
        setHtml('worst-day', `${adv.worstDay} (${adv.worstDayCount})`);
        setHtml('current-weekday', `${adv.currentWeekday} (${adv.currentWeekdayCount})`);
        setHtml('power-day', `${adv.powerDay} (${adv.powerDayAvg})`);
        setHtml('peak-day', `${adv.peakWeekday} (${adv.peakWeekdayCount})`);
        setHtml('biggest-island', `${adv.biggestIslandSize} days`);
        setHtml('slump-island', `${adv.biggestSlumpIslandSize} days`);
        setHtml('biggest-above-avg-island', `${adv.biggestAboveAvgIslandSize} days`);
        setHtml('most-active-day', `${adv.mostActiveDay} (${adv.mostActiveDayCount} commits)`);
        setVal('max-commits', adv.mostActiveDayCount);

        // Update Level Ranges
        if (thresholds) {
          for (let l = 1; l <= 4; l++) {
            const t = thresholds[l];
            if (t) {
              const range = l === 4 ? `${t.min}+` : (t.min === t.max ? `${t.min}` : `${t.min}-${t.max}`);
              setVal(`l${l}-range`, range);
            }
          }
        }

        const repoList = document.getElementById('repo-list');
        if (repoList) {
          repoList.innerHTML = '';
          adv.topRepos.forEach(r => {
            const div = document.createElement('div');
            div.className = 'stat-row';
            div.style.fontSize = '12px';
            div.innerHTML = `<span>${r.name}</span><strong>${r.commits}</strong>`;
            repoList.appendChild(div);
          });
        }

        const createdList = document.getElementById('created-repo-list');
        if (createdList) {
          createdList.innerHTML = '';
          adv.createdRepoList.slice(0, 5).forEach(r => {
            const div = document.createElement('div');
            div.className = 'stat-row';
            div.style.fontSize = '12px';
            div.innerHTML = `<span>${r.name}</span><small style="color: #57606a;">${r.date || ''}</small>`;
            createdList.appendChild(div);
          });
        }

        const achievementList = document.getElementById('achievement-list');
        if (achievementList) {
          achievementList.innerHTML = '';
          adv.achievements.forEach(a => {
            const span = document.createElement('span');
            span.className = 'Label Label--secondary';
            span.style.cssText = "padding: 2px 8px; font-size: 10px; border-radius: 10px; background: #f6f8fa; border: 1px solid #d0d7de;";
            span.textContent = a;
            achievementList.appendChild(span);
          });
        }

        loadSettings();
      } else {
        if (error) {
          error.textContent = response?.error || "Could not find contribution graph. Make sure you are on a GitHub profile page.";
          error.style.display = 'block';
        }
        if (loading) loading.style.display = 'none';
      }
    });
  } catch (err: any) {
    if (loading) loading.style.display = 'none';
    if (error) {
      error.textContent = err.message;
      error.style.display = 'block';
    }
  }
});
