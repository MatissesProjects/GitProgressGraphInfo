import { GitHeatSettings, AdvancedStats, CustomAvatarSettings } from './types';

document.addEventListener('DOMContentLoaded', async () => {
  console.log("GitHeat Popup: Loaded");
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const content = document.getElementById('content');
  
  const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
  const colorModeSelect = document.getElementById('color-mode-select') as HTMLSelectElement;
  const customColors = document.getElementById('custom-colors');
  const startColorInput = document.getElementById('color-start') as HTMLInputElement;
  const stopColorInput = document.getElementById('color-stop') as HTMLInputElement;
  const speedSlider = document.getElementById('animation-speed') as HTMLInputElement;
  const speedVal = document.getElementById('speed-val');
  const animationStyleSelect = document.getElementById('animation-style') as HTMLSelectElement;
  const sortableList = document.getElementById('sortable-grid-list');

  const gearBases = ['🧙', '🧙‍♂️', '🧙‍♀️', '🧑‍💻', '👩‍💻', '🧔‍♂️', '🧝', '🧝‍♂️', '🧝‍♀️', '🧛', '🧛‍♂️', '🧛‍♀️'];
  const gearHeads = ['👑', '🎓', '⛑️', '👒', '🧢', '🪖'];
  const gearWeapons = ['🪄', '🗡️', '🏹', '🪓', '⚔️', '⚒️', '🔫'];
  const gearShields = ['🛡️', '💠', '🧼', '📁', '📦', '🔋'];
  const gearCompanions = ['🐱', '🐕', '🦊', '🐼', '🐨', '🤖', '👻', '👾', '🐉'];

  const populateGear = (id: string, items: string[], current: string | undefined) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';
    
    const noneDiv = document.createElement('label');
    noneDiv.style.display = 'flex';
    noneDiv.style.alignItems = 'center';
    noneDiv.style.gap = '5px';
    noneDiv.innerHTML = `<input type="radio" name="${id}" value="" ${!current ? 'checked' : ''}> Auto (Progression)`;
    el.appendChild(noneDiv);

    items.forEach(item => {
      const div = document.createElement('label');
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.gap = '5px';
      div.innerHTML = `<input type="radio" name="${id}" value="${item}" ${current === item ? 'checked' : ''}> ${item}`;
      el.appendChild(div);
    });
  };

  const toggleKeyMap: Record<string, keyof GitHeatSettings> = {
    'toggle-grid': 'showGrid',
    'toggle-persona': 'showPersona',
    'toggle-active-repos': 'showActiveRepos',
    'toggle-created-repos': 'showCreatedRepos',
    'toggle-achievements': 'showAchievements',
    'toggle-footer': 'showFooter',
    'toggle-legend-numbers': 'showLegendNumbers',
    'toggle-trends': 'showTrends',
    'toggle-avatar': 'showAvatar',
    'toggle-gear-head': 'showGearHead',
    'toggle-gear-weapon': 'showGearWeapon',
    'toggle-gear-shield': 'showGearShield',
    'toggle-gear-companion': 'showGearCompanion',
    'toggle-combo': 'showCombo',
    'toggle-xp-bar': 'showXPBar',
    'toggle-skill-tree': 'showSkillTree',
    'toggle-color-animation': 'showColorAnimation',
    'toggle-pulse-hash': 'showPulseHash',
    'toggle-ticker': 'showTicker',
    'toggle-total': 'showTotal',
    'toggle-today': 'showTodayCount',
    'toggle-streak': 'showStreak',
    'toggle-level': 'showLevel',
    'toggle-best-month': 'showBestMonth',
    'toggle-worst-month': 'showWorstMonth',
    'toggle-best-week': 'showBestWeek',
    'toggle-worst-week': 'showWorstWeek',
    'toggle-current-week': 'showCurrentWeek',
    'toggle-dominant-weekday': 'showDominantWeekday',
    'toggle-island': 'showIsland',
    'toggle-slump-island': 'showSlumpIsland',
    'toggle-above-avg-island': 'showAboveAvgIsland',
    'toggle-velocity': 'showVelocity',
    'toggle-velocity-above': 'showVelocityAbove',
    'toggle-velocity-below': 'showVelocityBelow',
    'toggle-consistency': 'showConsistency',
    'toggle-weekend': 'showWeekend',
    'toggle-slump': 'showSlump',
    'toggle-best-day': 'showBestDay',
    'toggle-worst-day': 'showWorstDay',
    'toggle-current-weekday': 'showCurrentWeekday',
    'toggle-power-day': 'showPowerDay',
    'toggle-peak-day': 'showPeakDay',
    'toggle-most-active-day': 'showMostActiveDay',
    'toggle-max-commits': 'showMaxCommits',
    'toggle-stars': 'showStars',
    'toggle-pr': 'showPR',
    'toggle-issue-created': 'showIssueCreated',
    'toggle-langs': 'showLangs',
    'toggle-network': 'showNetwork'
  };

  const defaultOrder = [
    'gh-level', 'gh-streak', 'gh-best-month', 'gh-worst-month', 'gh-best-week', 'gh-worst-week', 'gh-current-week', 'gh-dominant-weekday', 'gh-most-active-day', 'gh-max-commits',
    'gh-velocity', 'gh-velocity-above', 'gh-velocity-below', 'gh-consistency', 'gh-weekend',
    'gh-island', 'gh-slump-island', 'gh-above-avg-island', 'gh-slump',
    'gh-best-day', 'gh-worst-day', 'gh-power-day', 'gh-peak-day', 'gh-current-weekday',
    'gh-stars', 'gh-pr', 'gh-issue-created', 'gh-langs', 'gh-network'
  ];

  const labelMap: Record<string, string> = {
    'gh-level': 'RPG Level',
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
    
    // Ensure all default items are in the order
    const finalOrder = [...order];
    defaultOrder.forEach(id => {
      if (!finalOrder.includes(id)) finalOrder.push(id);
    });

    finalOrder.forEach(id => {
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
    const s = await chrome.storage.local.get(null);
    if (themeSelect) themeSelect.value = s.theme || 'green';
    if (colorModeSelect) colorModeSelect.value = s.colorMode || 'rgb';
    if (customColors) customColors.style.display = themeSelect.value === 'custom' ? 'block' : 'none';
    if (startColorInput) startColorInput.value = s.customStart || '#ebedf0';
    if (stopColorInput) stopColorInput.value = s.customStop || '#216e39';

    Object.entries(toggleKeyMap).forEach(([id, key]) => {
      const el = document.getElementById(id) as HTMLInputElement;
      if (el) el.checked = s[key] !== false;
    });

    if (speedSlider) {
      speedSlider.value = (s.animationSpeed || 8).toString();
      if (speedVal) speedVal.textContent = `${speedSlider.value}s`;
    }

    if (animationStyleSelect) {
      animationStyleSelect.value = s.animationStyle || 'hue';
    }

    const custom = s.customAvatar || {};
    populateGear('custom-bases', gearBases, custom.base);
    populateGear('custom-headgear', gearHeads, custom.headgear);
    populateGear('custom-weapons', gearWeapons, custom.weapon);
    populateGear('custom-shields', gearShields, custom.shield);
    populateGear('custom-companions', gearCompanions, custom.companion);

    renderSortableList(s.gridOrder || defaultOrder);
    setupSortable();
  };

  const saveSetting = async (key: string, val: any) => {
    console.log(`GitHeat Popup: Saving setting ${key} = ${val}`);
    await chrome.storage.local.set({ [key]: val });
  };

  document.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.type === 'checkbox' && toggleKeyMap[target.id]) {
      const key = toggleKeyMap[target.id];
      saveSetting(key, target.checked);
    }
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

  if (animationStyleSelect) {
    animationStyleSelect.addEventListener('change', () => {
      saveSetting('animationStyle', animationStyleSelect.value);
    });
  }

  if (speedSlider) {
    speedSlider.addEventListener('input', () => {
      if (speedVal) speedVal.textContent = `${speedSlider.value}s`;
    });
    speedSlider.addEventListener('change', () => {
      saveSetting('animationSpeed', parseInt(speedSlider.value, 10));
    });
  }

  const saveAvatarBtn = document.getElementById('save-avatar-custom');
  if (saveAvatarBtn) {
    saveAvatarBtn.addEventListener('click', async () => {
      const getRadio = (name: string) => (document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement)?.value || '';
      const customAvatar: CustomAvatarSettings = {
        base: getRadio('custom-bases'),
        headgear: getRadio('custom-headgear'),
        weapon: getRadio('custom-weapons'),
        shield: getRadio('custom-shields'),
        companion: getRadio('custom-companions')
      };
      await saveSetting('customAvatar', customAvatar);
      saveAvatarBtn.textContent = 'Saved!';
      setTimeout(() => { saveAvatarBtn.textContent = 'Save Custom Gear'; }, 1500);
    });
  }

  const resetBtn = document.getElementById('reset-reorder');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      await chrome.storage.local.set({ gridOrder: defaultOrder });
      renderSortableList(defaultOrder);
    });
  }

  await loadSettings();

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
