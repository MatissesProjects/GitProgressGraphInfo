import { ContributionDay } from '../types';

export async function applyVisibility() {
  const settings = await chrome.storage.local.get([
    'showGrid', 'showActiveRepos', 'showCreatedRepos', 'showAchievements', 'showPersona', 'showFooter', 'showLegendNumbers',
    'showTotal', 'showStreak', 'showVelocity', 'showConsistency', 'showWeekend', 'showSlump', 'showBestDay', 'showWorstDay', 
    'showMostActiveDay', 'showTodayCount', 'showCurrentWeekday', 'showMaxCommits', 'showIsland', 'showSlumpIsland', 
    'showPowerDay', 'showPeakDay', 'showStars', 'showPR', 'showIssueCreated', 'showLangs', 'showNetwork', 'showBestMonth', 'showBestWeek', 'showLevel'
  ]);

  const grid = document.getElementById('gh-grid-stats');
  const detailed = document.getElementById('gh-detailed-stats');
  const activeRepos = document.getElementById('gh-active-repos');
  const createdRepos = document.getElementById('gh-created-repos');
  const achievements = document.getElementById('gh-achievements');
  const persona = document.getElementById('gh-persona');
  const footer = document.getElementById('gh-footer');
  const headerLevel = document.getElementById('gh-header-level');

  if (grid) grid.style.display = (settings.showGrid !== false) ? 'grid' : 'none';
  if (activeRepos) activeRepos.style.display = (settings.showActiveRepos !== false) ? 'block' : 'none';
  if (createdRepos) createdRepos.style.display = (settings.showCreatedRepos !== false) ? 'block' : 'none';
  if (achievements) achievements.style.display = (settings.showAchievements !== false) ? 'block' : 'none';
  if (persona) persona.style.display = (settings.showPersona !== false) ? 'inline-block' : 'none';
  if (footer) footer.style.display = (settings.showFooter !== false) ? 'block' : 'none';
  if (headerLevel) headerLevel.style.display = (settings.showLevel !== false) ? 'flex' : 'none';

  const toggleMap: Record<string, any> = {
    'gh-total': settings.showTotal,
    'gh-today': settings.showTodayCount,
    'gh-streak': settings.showStreak,
    'gh-best-month': settings.showBestMonth,
    'gh-best-week': settings.showBestWeek,
    'gh-island': settings.showIsland,
    'gh-slump-island': settings.showSlumpIsland,
    'gh-velocity': settings.showVelocity,
    'gh-consistency': settings.showConsistency,
    'gh-weekend': settings.showWeekend,
    'gh-slump': settings.showSlump,
    'gh-best-day': settings.showBestDay,
    'gh-worst-day': settings.showWorstDay,
    'gh-current-weekday': settings.showCurrentWeekday,
    'gh-power-day': settings.showPowerDay,
    'gh-peak-day': settings.showPeakDay,
    'gh-most-active-day': settings.showMostActiveDay,
    'gh-max-commits': settings.showMaxCommits,
    'gh-stars': settings.showStars,
    'gh-pr': settings.showPR,
    'gh-issue-created': settings.showIssueCreated,
    'gh-langs': settings.showLangs,
    'gh-network': settings.showNetwork
  };

  Object.entries(toggleMap).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.style.display = (val !== false) ? 'block' : 'none';
  });

  document.querySelectorAll('.git-heat-legend-label').forEach((el: any) => {
    el.style.display = (settings.showLegendNumbers !== false) ? 'inline' : 'none';
  });

  if (detailed) {
    const anyDetailedVisible = (settings.showActiveRepos !== false) || (settings.showCreatedRepos !== false) || (settings.showAchievements !== false);
    detailed.style.display = anyDetailedVisible ? 'flex' : 'none';
  }
}

export function injectStats(thresholds: any, percentiles: any, data: ContributionDay[], advanced: any, savedOrder: string[] | null = null) {
  const container = document.querySelector('.js-yearly-contributions');
  if (!container) return;
  const existing = document.getElementById('git-heat-stats');
  if (existing) existing.remove();

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const ytdData = data.filter(d => d.date >= `${now.getFullYear()}-01-01`);
  const totalContributions = (advanced.isYTD && ytdData.length > 0) ? ytdData.reduce((sum, day) => sum + day.count, 0) : data.reduce((sum, day) => sum + day.count, 0);

  const statsDiv = document.createElement('div');
  statsDiv.id = 'git-heat-stats';
  statsDiv.className = 'git-heat-panel border color-border-muted color-bg-subtle rounded-2 p-3 mb-3';
  statsDiv.style.marginTop = '16px';
  const titleSuffix = advanced.isYTD ? '(YTD)' : '(Year)';

  const defaultOrder = ['gh-total', 'gh-today', 'gh-streak', 'gh-level', 'gh-slump', 'gh-best-month', 'gh-best-week', 'gh-island', 'gh-slump-island', 'gh-velocity', 'gh-consistency', 'gh-weekend', 'gh-best-day', 'gh-worst-day', 'gh-power-day', 'gh-peak-day', 'gh-most-active-day', 'gh-max-commits', 'gh-stars', 'gh-pr', 'gh-issue-created', 'gh-langs', 'gh-network'];
  let gridOrder = savedOrder || defaultOrder;
  defaultOrder.forEach(id => { if (!gridOrder.includes(id)) gridOrder.push(id); });

  const itemMap: Record<string, string> = {
    'gh-total': `<div class="stat-card" id="gh-total"><span class="color-fg-muted d-block text-small">Total ${titleSuffix}</span><strong class="f3-light">${totalContributions.toLocaleString()}</strong></div>`,
    'gh-today': `<div class="stat-card highlightable" id="gh-today" data-date="${todayStr}"><span class="color-fg-muted d-block text-small">Today's Contribs</span><strong class="f3-light">${advanced.todayCount}</strong></div>`,
    'gh-streak': `<div class="stat-card highlightable" id="gh-streak" data-current-streak="${advanced.currentStreakDates.join(',')}" data-longest-streak="${advanced.longestStreakDates.join(',')}"><span class="color-fg-muted d-block text-small">Current / Best Streak</span><strong class="f3-light">${advanced.currentStreak} / ${advanced.longestStreak} days</strong></div>`,
    'gh-best-month': `<div class="stat-card highlightable" id="gh-best-month" data-month-dates="${advanced.bestMonthDates.join(',')}" title="${advanced.bestMonthStats.count} commits, ${advanced.bestMonthStats.consistency}% consistency, ${advanced.bestMonthStats.streak} day streak"><span class="color-fg-muted d-block text-small">Best Month (${advanced.bestMonthName})</span><strong class="f3-light">Score: ${advanced.bestMonthStats.score}</strong></div>`,
    'gh-best-week': `<div class="stat-card highlightable" id="gh-best-week" data-week-dates="${advanced.bestWeekDates.join(',')}" title="${advanced.bestWeekStats.count} commits, ${advanced.bestWeekStats.consistency}% consistency, ${advanced.bestWeekStats.streak} day streak"><span class="color-fg-muted d-block text-small">Best Week (${advanced.bestWeekName})</span><strong class="f3-light">Score: ${advanced.bestWeekStats.score}</strong></div>`,
    'gh-island': `<div class="stat-card highlightable" id="gh-island" data-island="${advanced.biggestIslandDates.join(',')}"><span class="color-fg-muted d-block text-small">Biggest Island (L2+)</span><strong class="f3-light">${advanced.biggestIslandSize} days</strong></div>`,
    'gh-slump-island': `<div class="stat-card highlightable" id="gh-slump-island" data-island="${advanced.biggestSlumpIslandDates.join(',')}"><span class="color-fg-muted d-block text-small">Worst Island (0-1)</span><strong class="f3-light">${advanced.biggestSlumpIslandSize} days</strong></div>`,
    'gh-velocity': `<div class="stat-card" id="gh-velocity" title="${advanced.statsForTooltips.velocity.count} total commits / ${advanced.statsForTooltips.velocity.active} active days"><span class="color-fg-muted d-block text-small">Average Velocity</span><strong class="f3-light">${advanced.velocity} commits/day</strong></div>`,
    'gh-consistency': `<div class="stat-card" id="gh-consistency" title="${advanced.statsForTooltips.consistency.active} / ${advanced.statsForTooltips.consistency.total} days active"><span class="color-fg-muted d-block text-small">Consistency</span><strong class="f3-light">${advanced.consistency}%</strong></div>`,
    'gh-weekend': `<div class="stat-card" id="gh-weekend" title="${advanced.statsForTooltips.weekend.active} / ${advanced.statsForTooltips.weekend.total} weekend days active"><span class="color-fg-muted d-block text-small">Weekend Score</span><strong class="f3-light">${advanced.weekendScore}%</strong></div>`,
    'gh-slump': `<div class="stat-card" id="gh-slump" title="${advanced.longestSlumpDates.length > 0 ? (advanced.longestSlumpDates[0] + ' to ' + advanced.longestSlumpDates[advanced.longestSlumpDates.length - 1]) : 'N/A'}"><span class="color-fg-muted d-block text-small">Longest Slump</span><strong class="f3-light">${advanced.longestSlump} days</strong></div>`,
    'gh-best-day': `<div class="stat-card highlightable" id="gh-best-day" data-weekday="${advanced.bestDayIndex}"><span class="color-fg-muted d-block text-small">Best Weekday</span><strong class="f3-light">${advanced.bestDay} (${advanced.bestDayCount})</strong></div>`,
    'gh-worst-day': `<div class="stat-card highlightable" id="gh-worst-day" data-weekday="${advanced.worstDayIndex}"><span class="color-fg-muted d-block text-small">Worst Weekday</span><strong class="f3-light">${advanced.worstDay} (${advanced.worstDayCount})</strong></div>`,
    'gh-current-weekday': `<div class="stat-card highlightable" id="gh-current-weekday" data-weekday="${advanced.currentWeekdayIndex}"><span class="color-fg-muted d-block text-small">Current Weekday (${advanced.currentWeekday})</span><strong class="f3-light">${advanced.currentWeekdayCount}</strong></div>`,
    'gh-power-day': `<div class="stat-card highlightable" id="gh-power-day" data-weekday="${advanced.powerDayIndex}"><span class="color-fg-muted d-block text-small">Most Productive (Avg)</span><strong class="f3-light">${advanced.powerDay} (${advanced.powerDayAvg})</strong></div>`,
    'gh-peak-day': `<div class="stat-card highlightable" id="gh-peak-day" data-weekday="${advanced.peakWeekdayIndex}"><span class="color-fg-muted d-block text-small">Peak Frequency (L2+)</span><strong class="f3-light">${advanced.peakWeekday} (${advanced.peakWeekdayCount})</strong></div>`,
    'gh-most-active-day': `<div class="stat-card highlightable" id="gh-most-active-day" data-date="${advanced.mostActiveDay}" data-weekday="${advanced.mostActiveDayWeekday}"><span class="color-fg-muted d-block text-small">Most Active Day</span><strong class="f3-light">${advanced.mostActiveDay}</strong></div>`,
    'gh-max-commits': `<div class="stat-card highlightable" id="gh-max-commits" data-date="${advanced.mostActiveDay}" data-weekday="${advanced.mostActiveDayWeekday}"><span class="color-fg-muted d-block text-small">Max Daily Commits</span><strong class="f3-light">${advanced.mostActiveDayCount}</strong></div>`,
    'gh-stars': `<div class="stat-card" id="gh-stars"><span class="color-fg-muted d-block text-small">Pinned Stars / Forks</span><strong class="f3-light">${advanced.totalStars} / ${advanced.totalForks}</strong></div>`,
    'gh-pr': `<div class="stat-card" id="gh-pr"><span class="color-fg-muted d-block text-small">PR Activity (O/M/R)</span><strong class="f3-light">${advanced.pullRequests} / ${advanced.mergedPullRequests} / ${advanced.pullRequestReviews}</strong></div>`,
    'gh-issue-created': `<div class="stat-card" id="gh-issue-created"><span class="color-fg-muted d-block text-small">Issues / Created Repos</span><strong class="f3-light">${advanced.issuesOpened} / ${advanced.createdRepos}</strong></div>`,
    'gh-langs': `<div class="stat-card" id="gh-langs"><span class="color-fg-muted d-block text-small">Top Languages</span><strong class="f3-light">${advanced.topLangs.join(', ') || 'N/A'}</strong></div>`,
    'gh-network': `<div class="stat-card" id="gh-network"><span class="color-fg-muted d-block text-small">Network</span><strong class="f3-light">${advanced.socials.followers} Followers / ${advanced.socials.organizations} Orgs</strong></div>`
  };

  const p = percentiles;
  const legendRanges = [
    "0 commits",
    `1 to ${p[20] > 1 ? p[20]-1 : 1} commits`,
    `${p[20]} to ${p[30] > p[20] ? p[30]-1 : p[20]} commits`,
    `${p[30]} to ${p[40] > p[30] ? p[40]-1 : p[30]} commits`,
    `${p[40]} to ${p[50] > p[40] ? p[50]-1 : p[40]} commits`,
    `${p[50]} to ${p[60] > p[50] ? p[60]-1 : p[50]} commits`,
    `${p[60]} to ${p[70] > p[60] ? p[70]-1 : p[60]} commits`,
    `${p[70]} to ${p[80] > p[70] ? p[80]-1 : p[70]} commits`,
    `${p[80]} to ${p[90] > p[80] ? p[90]-1 : p[80]} commits`,
    `${p[90]} to ${p[95] > p[90] ? p[95]-1 : p[90]} commits`,
    `${p[95]} to ${p[99] > p[95] ? p[99]-1 : p[95]} commits`,
    `${p[99]}+ commits`
  ];

  statsDiv.innerHTML = `
    <div class="d-flex flex-justify-between flex-items-center mb-3">
      <div class="d-flex flex-items-center gap-2">
        <h3 class="h4 mb-0">GitHeat Analytics ${titleSuffix}</h3>
        <span id="gh-persona" class="Label Label--info">${advanced.persona}</span>
      </div>
      
      <div id="gh-header-level" class="gh-level-header">
        <div class="d-flex flex-items-center gap-2">
          <span class="gh-level-badge">LVL ${advanced.level}</span>
          <span class="gh-level-title">${advanced.levelTitle}</span>
          ${advanced.todayCombo >= 2 ? `
            <div class="gh-combo-badge" title="${advanced.todayComboMath}">
              <div style="line-height: 1;">${advanced.todayCombo}x COMBO</div>
              <div style="font-size: 9px; opacity: 0.95; margin-top: 1px; font-weight: 700;">${advanced.todayComboReason}</div>
            </div>` : ''}
        </div>
        <div class="gh-progress-container" title="${advanced.totalXP} XP earned (commits + bonuses). ${advanced.xpToNext} to level up.">
          <div class="gh-progress-bar" style="width: ${advanced.progressPercent}%;"></div>
        </div>
        <span class="gh-xp-text">${advanced.levelProgressXP} / ${advanced.levelTotalXP} XP</span>
      </div>

    </div>
    <div class="git-heat-grid" id="gh-grid-stats">${gridOrder.map(id => itemMap[id] || '').join('')}</div>
    <div class="mt-3 pt-3 border-top color-border-muted d-flex flex-wrap gap-4" id="gh-detailed-stats">
      <div style="flex: 1; min-width: 200px;" id="gh-active-repos">
        <span class="color-fg-muted text-small d-block mb-2">Most Active Repos (Commits)</span>
        <div class="d-flex flex-column gap-1">${advanced.topRepos.slice(0, 3).map((r: any) => `<div class="d-flex flex-justify-between text-small"><span>${r.name}</span></div>`).join('') || '<span class="text-small color-fg-muted">No recent activity found</span>'}</div>
      </div>
      <div style="flex: 1; min-width: 200px;" id="gh-created-repos">
        <span class="color-fg-muted text-small d-block mb-2">Created Repositories</span>
        <div class="d-flex flex-column gap-1">${advanced.createdRepoList.slice(0, 3).map((r: any) => `<div class="d-flex flex-justify-between text-small"><span>${r.name}</span></div>`).join('') || '<span class="text-small color-fg-muted">No repos created</span>'}</div>
      </div>
      <div style="flex: 1; min-width: 200px;" id="gh-achievements">
        <span class="color-fg-muted text-small d-block mb-2">Recent Achievements</span>
        <div class="d-flex flex-wrap gap-1">${advanced.achievements.map((a: string) => `<span class="Label Label--secondary" title="${a}">${a}</span>`).join('') || '<span class="text-small color-fg-muted">None found</span>'}</div>
      </div>
    </div>
    <div class="mt-3 pt-3 border-top color-border-muted" id="gh-footer">
      <div class="d-flex flex-items-center flex-wrap">
        <span class="color-fg-muted text-small mr-2">Deep Scale: </span>
        <div id="granular-legend" class="d-flex gap-1 mr-3">
          ${legendRanges.map((range, i) => `<div class="square-legend ${i > 0 ? `level-${i}` : ''}" title="${range}" style="${i === 0 ? 'background-color: var(--color-calendar-graph-day-bg)' : ''}"></div>`).join('')}
        </div>
        <div class="d-flex flex-items-center flex-wrap gap-2 ml-auto"><span class="color-fg-muted text-small mr-1">Thresholds: </span><span class="badge" style="border: 1px solid var(--color-border-default)">L1: ${thresholds[1]?.min ?? '?'}-${thresholds[1]?.max ?? '?'}</span><span class="badge" style="border: 1px solid var(--color-border-default)">L2: ${thresholds[2]?.min ?? '?'}-${thresholds[2]?.max ?? '?'}</span><span class="badge" style="border: 1px solid var(--color-border-default)">L3: ${thresholds[3]?.min ?? '?'}-${thresholds[3]?.max ?? '?'}</span><span class="badge" style="border: 1px solid var(--color-border-default)">L4: ${thresholds[4]?.min ?? '?'}+</span></div>
      </div>
    </div>`;
  container.prepend(statsDiv);

  const highlightDates = (dates: string[], className: string = 'gh-highlight') => {
    dates.forEach(date => {
      const dayEl = (document.querySelector(`.ContributionCalendar-day[data-date="${date}"]`) as HTMLElement);
      if (dayEl) { dayEl.classList.add(className); dayEl.style.outline = ''; dayEl.style.border = ''; }
    });
  };

  const highlightWeekday = (weekdayIndex: number, startDate?: string, endDate?: string) => {
    document.querySelectorAll('.ContributionCalendar-day[data-date]').forEach((day: any) => {
      const date = day.getAttribute('data-date');
      if (!date || (startDate && date < startDate) || (endDate && date > endDate)) return;
      if (new Date(date + 'T00:00:00').getDay() === weekdayIndex) { day.classList.add('gh-highlight'); day.style.outline = ''; day.style.border = ''; }
    });
  };

  const clearHighlights = () => {
    document.querySelectorAll('.gh-highlight, .gh-highlight-special, .gh-highlight-sad').forEach((el: any) => {
      el.classList.remove('gh-highlight', 'gh-highlight-special', 'gh-highlight-sad');
      if (parseInt(el.getAttribute('data-level') || '0', 10) > 0) { el.style.outline = 'none'; el.style.border = 'none'; }
    });
  };

  const addHover = (id: string, fn: () => void) => {
    const el = statsDiv.querySelector(id);
    if (el) { el.addEventListener('mouseenter', () => { el.classList.add('highlighting'); fn(); }); el.addEventListener('mouseleave', () => { el.classList.remove('highlighting'); clearHighlights(); }); }
  };

  addHover('#gh-today', () => highlightDates([todayStr]));
  addHover('#gh-streak', () => highlightDates([...new Set([...advanced.longestStreakDates, ...advanced.currentStreakDates])]));
  addHover('#gh-best-month', () => highlightDates(advanced.bestMonthDates));
  addHover('#gh-best-week', () => highlightDates(advanced.bestWeekDates));
  addHover('#gh-island', () => highlightDates(advanced.biggestIslandDates, 'gh-highlight-special'));
  addHover('#gh-slump-island', () => highlightDates(advanced.biggestSlumpIslandDates, 'gh-highlight-sad'));
  addHover('#gh-best-day', () => highlightWeekday(advanced.bestDayIndex, advanced.isYTD ? `${now.getFullYear()}-01-01` : undefined, todayStr));
  addHover('#gh-worst-day', () => highlightWeekday(advanced.worstDayIndex, advanced.isYTD ? `${now.getFullYear()}-01-01` : undefined, todayStr));
  addHover('#gh-current-weekday', () => highlightWeekday(advanced.currentWeekdayIndex, advanced.isYTD ? `${now.getFullYear()}-01-01` : undefined, todayStr));
  addHover('#gh-power-day', () => highlightWeekday(advanced.powerDayIndex, advanced.isYTD ? `${now.getFullYear()}-01-01` : undefined, todayStr));
  addHover('#gh-peak-day', () => highlightWeekday(advanced.peakWeekdayIndex, advanced.isYTD ? `${now.getFullYear()}-01-01` : undefined, todayStr));
  addHover('#gh-most-active-day', () => highlightDates([advanced.mostActiveDay], 'gh-highlight-special'));
  addHover('#gh-max-commits', () => highlightDates([advanced.mostActiveDay], 'gh-highlight-special'));
}

export function extendLegend(thresholds: any) {
  const legend = document.querySelector('.ContributionCalendar-footer');
  if (!legend) return;
  legend.querySelectorAll('.git-heat-legend-label').forEach(el => el.remove());
  legend.querySelectorAll('.ContributionCalendar-day').forEach(square => {
    const level = parseInt(square.getAttribute('data-level') || '0', 10);
    if (level > 0 && thresholds[level]) {
      const range = level === 4 ? `${thresholds[level].min}+` : `${thresholds[level].min}-${thresholds[level].max}`;
      const span = document.createElement('span');
      span.className = 'text-small color-fg-muted ml-1 git-heat-legend-label';
      span.style.cssText = 'font-size: 10px; margin-left: 2px; margin-right: 4px;';
      span.textContent = range;
      square.after(span);
    }
  });
}
