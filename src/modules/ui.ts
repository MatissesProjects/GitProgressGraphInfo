import { ContributionDay, AdvancedStats } from '../types';
import { getCodingClass } from './rpg';

export async function applyVisibility() {
  try {
    const settings = await chrome.storage.local.get([
      'showGrid', 'showActiveRepos', 'showCreatedRepos', 'showAchievements', 'showPersona', 'showFooter', 'showLegendNumbers',
      'showTotal', 'showStreak', 'showVelocity', 'showVelocityAbove', 'showVelocityBelow', 'showConsistency', 'showWeekend', 'showSlump', 'showBestDay', 'showWorstDay', 
      'showMostActiveDay', 'showTodayCount', 'showCurrentWeekday', 'showMaxCommits', 'showIsland', 'showSlumpIsland', 
      'showPowerDay', 'showPeakDay', 'showStars', 'showPR', 'showIssueCreated', 'showLangs', 'showNetwork', 'showBestMonth', 'showBestWeek', 'showLevel', 'showDominantWeekday', 'showTrends'
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
      'gh-dominant-weekday': settings.showDominantWeekday,
      'gh-island': settings.showIsland,
      'gh-slump-island': settings.showSlumpIsland,
      'gh-velocity': settings.showVelocity,
      'gh-velocity-above': settings.showVelocityAbove,
      'gh-velocity-below': settings.showVelocityBelow,
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
  } catch (e) {
    console.error("GitHeat: Error applying visibility", e);
  }
}

export function injectStats(thresholds: any, percentiles: any, data: ContributionDay[], advanced: any, savedOrder: string[] | null = null, showTrends: boolean = true) {
  console.log("GitHeat: Injecting Stats (v1.3)...");
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
  statsDiv.className = 'git-heat-panel border color-border-muted color-bg-subtle rounded-2 p-2 mb-2';
  statsDiv.style.marginTop = '8px';
  const titleSuffix = advanced.isYTD ? '(YTD)' : '(Year)';

  const defaultOrder = [
    'gh-streak', 'gh-best-month', 'gh-best-week', 'gh-dominant-weekday', 'gh-most-active-day', 'gh-max-commits',
    'gh-velocity', 'gh-velocity-above', 'gh-velocity-below', 'gh-consistency', 'gh-weekend',
    'gh-island', 'gh-slump-island', 'gh-slump',
    'gh-best-day', 'gh-worst-day', 'gh-power-day', 'gh-peak-day', 'gh-current-weekday',
    'gh-stars', 'gh-pr', 'gh-issue-created', 'gh-langs', 'gh-network'
  ];
  let gridOrder = savedOrder || defaultOrder;
  defaultOrder.forEach(id => { if (!gridOrder.includes(id)) gridOrder.push(id); });

  const itemMap: Record<string, string> = {
    'gh-streak': `<div class="stat-card highlightable" id="gh-streak" data-current-streak="${advanced.currentStreakDates.join(',')}" data-longest-streak="${advanced.longestStreakDates.join(',')}"><span class="color-fg-muted d-block text-small">Current / Best Streak</span><strong class="f3-light">${advanced.currentStreak} / ${advanced.longestStreak} days</strong></div>`,
    'gh-best-month': `<div class="stat-card highlightable" id="gh-best-month" data-month-dates="${advanced.bestMonthDates.join(',')}" title="Best month score vs average month score. (${advanced.bestMonthStats.count} commits, ${advanced.bestMonthStats.consistency}% consistency, ${advanced.bestMonthStats.streak} day streak)">
      <span class="color-fg-muted d-block text-small">Best Month (${advanced.bestMonthName})</span>
      <div class="d-flex flex-items-center gap-1">
        <strong class="f3-light">Score: ${advanced.bestMonthStats.score}</strong>
        ${(showTrends !== false && advanced.bestMonthTrend !== 0) ? `
          <span class="${advanced.bestMonthTrend > 0 ? 'color-fg-success' : 'color-fg-danger'} text-small font-weight-bold" style="white-space: nowrap;">
            ${advanced.bestMonthIcon} ${Math.abs(advanced.bestMonthTrend)}%
          </span>` : ''}
      </div>
    </div>`,
    'gh-best-week': `<div class="stat-card highlightable" id="gh-best-week" data-week-dates="${advanced.bestWeekDates.join(',')}" title="Best week score vs average week score. (${advanced.bestWeekStats.count} commits, ${advanced.bestWeekStats.consistency}% consistency, ${advanced.bestWeekStats.streak} day streak)">
      <span class="color-fg-muted d-block text-small">Best Week (${advanced.bestWeekName})</span>
      <div class="d-flex flex-items-center gap-1">
        <strong class="f3-light">Score: ${advanced.bestWeekStats.score}</strong>
        ${(showTrends !== false && advanced.bestWeekTrend !== 0) ? `
          <span class="${advanced.bestWeekTrend > 0 ? 'color-fg-success' : 'color-fg-danger'} text-small font-weight-bold" style="white-space: nowrap;">
            ${advanced.bestWeekIcon} ${Math.abs(advanced.bestWeekTrend)}%
          </span>` : ''}
      </div>
    </div>`,
    'gh-dominant-weekday': `<div class="stat-card" id="gh-dominant-weekday"><span class="color-fg-muted d-block text-small">Dominant Weekday</span><strong class="f3-light">${advanced.dominantWeekday} (${advanced.dominantWeekdayWins} weeks)</strong></div>`,
    'gh-island': `<div class="stat-card highlightable" id="gh-island" data-island="${advanced.biggestIslandDates.join(',')}"><span class="color-fg-muted d-block text-small">Biggest Island (L2+)</span><strong class="f3-light">${advanced.biggestIslandSize} days</strong></div>`,
    'gh-slump-island': `<div class="stat-card highlightable" id="gh-slump-island" data-island="${advanced.biggestSlumpIslandDates.join(',')}"><span class="color-fg-muted d-block text-small">Worst Island (0-1)</span><strong class="f3-light">${advanced.biggestSlumpIslandSize} days</strong></div>`,
    'gh-velocity': `<div class="stat-card" id="gh-velocity" title="Avg commits per active day (${advanced.statsForTooltips.velocity.count} total / ${advanced.statsForTooltips.velocity.active} active). Trend compares the last 7 days vs the 7 days prior.">
      <span class="color-fg-muted d-block text-small">Average Velocity</span>
      <div class="d-flex flex-items-center gap-1">
        <strong class="f3-light">${advanced.velocity} commits/day</strong>
        ${(showTrends !== false && advanced.velocityTrend !== 0) ? `
          <span class="${advanced.velocityTrend > 0 ? 'color-fg-success' : 'color-fg-danger'} text-small font-weight-bold" style="white-space: nowrap;">
            ${advanced.velocityIcon} ${Math.abs(advanced.velocityTrend)}%
          </span>` : ''}
      </div>
    </div>`,
    'gh-velocity-above': `<div class="stat-card highlightable" id="gh-velocity-above"><span class="color-fg-muted d-block text-small">Above Average Days</span><strong class="f3-light">${advanced.aboveVelocityDates.length} days</strong></div>`,
    'gh-velocity-below': `<div class="stat-card highlightable" id="gh-velocity-below"><span class="color-fg-muted d-block text-small">Below Average Days</span><strong class="f3-light">${advanced.belowVelocityDates.length} days</strong></div>`,
    'gh-consistency': `<div class="stat-card" id="gh-consistency" title="${advanced.statsForTooltips.consistency.active} / ${advanced.statsForTooltips.consistency.total} days active"><span class="color-fg-muted d-block text-small">Consistency</span><strong class="f3-light">${advanced.consistency}%</strong></div>`,
    'gh-weekend': `<div class="stat-card" id="gh-weekend" title="${advanced.statsForTooltips.weekend.active} / ${advanced.statsForTooltips.weekend.total} weekend days active"><span class="color-fg-muted d-block text-small">Weekend Score</span><strong class="f3-light">${advanced.weekendScore}%</strong></div>`,
    'gh-slump': `<div class="stat-card highlightable" id="gh-slump" title="${advanced.longestSlumpDates.length > 0 ? (advanced.longestSlumpDates[0] + ' to ' + advanced.longestSlumpDates[advanced.longestSlumpDates.length - 1]) : 'N/A'}"><span class="color-fg-muted d-block text-small">Longest Slump</span><strong class="f3-light">${advanced.longestSlump} days</strong></div>`,
    'gh-best-day': `<div class="stat-card highlightable" id="gh-best-day" data-weekday="${advanced.bestDayIndex}" title="Avg for this day vs overall avg across all weekdays.">
      <span class="color-fg-muted d-block text-small">Best Weekday</span>
      <div class="d-flex flex-items-center gap-1">
        <strong class="f3-light">${advanced.bestDay} (${advanced.bestDayCount})</strong>
        ${(showTrends !== false && advanced.bestWeekdayTrend !== 0) ? `
          <span class="${advanced.bestWeekdayTrend > 0 ? 'color-fg-success' : 'color-fg-danger'} text-small font-weight-bold" style="white-space: nowrap;">
            ${advanced.bestWeekdayIcon} ${Math.abs(advanced.bestWeekdayTrend)}%
          </span>` : ''}
      </div>
    </div>`,
    'gh-worst-day': `<div class="stat-card highlightable" id="gh-worst-day" data-weekday="${advanced.worstDayIndex}"><span class="color-fg-muted d-block text-small">Worst Weekday</span><strong class="f3-light">${advanced.worstDay} (${advanced.worstDayCount})</strong></div>`,
    'gh-current-weekday': `<div class="stat-card highlightable" id="gh-current-weekday" data-weekday="${advanced.currentWeekdayIndex}" title="Today's count vs the average count for this specific weekday.">
      <span class="color-fg-muted d-block text-small">Current Weekday (${advanced.currentWeekday})</span>
      <div class="d-flex flex-items-center gap-1">
        <strong class="f3-light">${advanced.currentWeekdayCount}</strong>
        ${(showTrends !== false && advanced.currentWeekdayTrend !== 0) ? `
          <span class="${advanced.currentWeekdayTrend > 0 ? 'color-fg-success' : 'color-fg-danger'} text-small font-weight-bold" style="white-space: nowrap;">
            ${advanced.currentWeekdayIcon} ${Math.abs(advanced.currentWeekdayTrend)}%
          </span>` : ''}
      </div>
    </div>`,
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
  const p10 = Math.max(2, p[10] || 2);
  const legendRanges = [
    p10 === 2 ? "1 commit" : `1 to ${p10 - 1} commits`,
    `${p10} to ${p[20] > p10 ? p[20]-1 : p10} commits`,
    `${p[20]} to ${p[30] > p[20] ? p[30]-1 : p[20]} commits`,
    `${p[30]} to ${p[40] > p[30] ? p[40]-1 : p[30]} commits`,
    `${p[40]} to ${p[50] > p[40] ? p[50]-1 : p[40]} commits`,
    `${p[50]} to ${p[60] > p[50] ? p[60]-1 : p[50]} commits`,
    `${p[60]} to ${p[70] > p[60] ? p[70]-1 : p[60]} commits`,
    `${p[70]} to ${p[75] > p[70] ? p[75]-1 : p[70]} commits`,
    `${p[75]} to ${p[80] > p[75] ? p[80]-1 : p[75]} commits`,
    `${p[80]} to ${p[85] > p[80] ? p[85]-1 : p[80]} commits`,
    `${p[85]} to ${p[90] > p[85] ? p[90]-1 : p[85]} commits`,
    `${p[90]} to ${p[95] > p[90] ? p[95]-1 : p[90]} commits`,
    `${p[95]} to ${p[98] > p[95] ? p[98]-1 : p[95]} commits`,
    `${p[98]} to ${p[99] > p[98] ? p[99]-1 : p[98]} commits`,
    `${p[99]}+ commits`
  ];

  const rpgClasses = getCodingClass(advanced);

  statsDiv.innerHTML = `
    <div class="d-flex flex-justify-between flex-items-start mb-3" style="gap: 15px;">
      <div class="d-flex flex-column" style="flex: 1; min-width: 0;">
        <div class="d-flex flex-items-center flex-wrap gap-2">
          <h3 class="h4 mb-0" style="white-space: nowrap;">GitHeat Analytics ${titleSuffix}</h3>
          <span id="gh-persona" class="Label Label--info" style="white-space: nowrap; cursor: help;" title="Your general coding persona based on recent activity.">Persona: ${advanced.persona}</span>
        </div>
        
        ${rpgClasses.length > 0 ? `
          <div class="d-flex flex-items-center flex-wrap gap-1 mt-1">
            <span class="color-fg-muted text-small" style="white-space: nowrap;">Class:</span>
            ${rpgClasses.map(c => `
              <span class="Label Label--secondary" style="cursor: help; display: inline-flex; align-items: center; gap: 4px;" title="${c.description}">
                <span>${c.icon}</span> ${c.name}
              </span>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <div class="d-flex flex-items-center" style="gap: 12px; flex-shrink: 0;">
        ${advanced.todayCombo >= 2 ? `
          <div class="gh-combo-badge" title="${advanced.todayComboMath}">
            <div style="line-height: 1;">${advanced.todayCombo}x COMBO</div>
            <div style="font-size: 9px; opacity: 0.95; margin-top: 1px; font-weight: 700;">${advanced.todayComboReason}</div>
          </div>` : ''}
        
        <div id="gh-header-level" class="gh-level-header" style="margin: 0; width: 180px;">
          <div class="d-flex flex-items-center gap-2">
            <span class="gh-level-badge">LVL ${advanced.level}</span>
            <span class="gh-level-title">${advanced.levelTitle}</span>
          </div>
          <div class="gh-progress-container" title="${advanced.totalXP} XP earned (commits + bonuses). ${advanced.xpToNext} to level up.">
            <div class="gh-progress-bar" style="width: ${advanced.progressPercent}%;"></div>
          </div>
          <span class="gh-xp-text" style="font-size: 8px;">${advanced.levelProgressXP} / ${advanced.levelTotalXP} XP</span>
        </div>
      </div>
    </div>
        
      </div>
    </div>
    <div class="git-heat-grid" id="gh-grid-stats">${gridOrder.map(id => itemMap[id] || '').join('')}</div>
    <div class="mt-2 pt-2 border-top color-border-muted d-flex flex-wrap gap-3" id="gh-detailed-stats">
      <div style="flex: 1; min-width: 160px;" id="gh-active-repos">
        <span class="color-fg-muted text-small d-block mb-1">Most Active Repos (Commits)</span>
        <div class="d-flex flex-column gap-1">${advanced.topRepos.slice(0, 3).map((r: any) => `<div class="d-flex flex-justify-between text-small"><span>${r.name}</span></div>`).join('') || '<span class="text-small color-fg-muted">No recent activity found</span>'}</div>
      </div>
      <div style="flex: 1; min-width: 160px;" id="gh-created-repos">
        <span class="color-fg-muted text-small d-block mb-1">Created Repositories</span>
        <div class="d-flex flex-column gap-1">${advanced.createdRepoList.slice(0, 3).map((r: any) => `<div class="d-flex flex-justify-between text-small"><span>${r.name}</span></div>`).join('') || '<span class="text-small color-fg-muted">No repos created</span>'}</div>
      </div>
      <div style="flex: 1; min-width: 160px;" id="gh-achievements">
        <span class="color-fg-muted text-small d-block mb-1">Recent Achievements</span>
        <div class="d-flex flex-wrap gap-1">${advanced.achievements.map((a: string) => `<span class="Label Label--secondary" title="${a}">${a}</span>`).join('') || '<span class="text-small color-fg-muted">None found</span>'}</div>
      </div>
    </div>
    <div class="mt-2 pt-2 border-top color-border-muted" id="gh-footer">
      <div class="d-flex flex-items-center flex-wrap">
        <span class="color-fg-muted text-small mr-2">Deep Scale: </span>
        <div id="granular-legend" class="d-flex gap-1 mr-3">
          ${legendRanges.map((range, i) => `<div class="square-legend level-${i+1}" title="${range}"></div>`).join('')}
        </div>
        <div class="d-flex flex-items-center flex-wrap gap-2 ml-auto">
          <span class="color-fg-muted text-small mr-1">Thresholds: </span>
          <span id="gh-thresh-1" class="badge highlightable" style="border: 1px solid var(--color-border-default); cursor: pointer;">L1: ${thresholds[1]?.min ?? '?'}-${thresholds[1]?.max ?? '?'}</span>
          <span id="gh-thresh-2" class="badge highlightable" style="border: 1px solid var(--color-border-default); cursor: pointer;">L2: ${thresholds[2]?.min ?? '?'}-${thresholds[2]?.max ?? '?'}</span>
          <span id="gh-thresh-3" class="badge highlightable" style="border: 1px solid var(--color-border-default); cursor: pointer;">L3: ${thresholds[3]?.min ?? '?'}-${thresholds[3]?.max ?? '?'}</span>
          <span id="gh-thresh-4" class="badge highlightable" style="border: 1px solid var(--color-border-default); cursor: pointer;">L4: ${thresholds[4]?.min ?? '?'}+</span>
        </div>
      </div>
    </div>`;
  container.prepend(statsDiv);

  const highlightDates = (dates: string[], className: string = 'gh-highlight') => {
    dates.forEach(date => {
      const dayEl = (document.querySelector(`.ContributionCalendar-day[data-date="${date}"]`) as HTMLElement);
      if (dayEl) { dayEl.classList.add(className); dayEl.style.outline = ''; dayEl.style.border = ''; }
    });
  };

  const highlightGranularLevel = (level: number) => {
    document.querySelectorAll(`.ContributionCalendar-day[data-granular-level="${level}"][data-date]`).forEach((day: any) => {
      day.classList.add('gh-highlight');
      day.style.outline = '';
      day.style.border = '';
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
      el.style.outline = 'none';
      el.style.border = 'none';
    });
  };

  const addHover = (id: string, fn: () => void) => {
    const el = statsDiv.querySelector(id);
    if (el) { el.addEventListener('mouseenter', () => { el.classList.add('highlighting'); fn(); }); el.addEventListener('mouseleave', () => { el.classList.remove('highlighting'); clearHighlights(); }); }
  };

  // Add hover for granular legend squares
  statsDiv.querySelectorAll('.square-legend').forEach((sq, i) => {
    const level = i + 1;
    sq.addEventListener('mouseenter', () => { 
      sq.classList.add('highlighting'); 
      highlightGranularLevel(level); 
    });
    sq.addEventListener('mouseleave', () => { 
      sq.classList.remove('highlighting'); 
      clearHighlights(); 
    });
  });

  addHover('#gh-today', () => highlightDates([todayStr]));
  addHover('#gh-streak', () => highlightDates([...new Set([...advanced.longestStreakDates, ...advanced.currentStreakDates])]));
  addHover('#gh-best-month', () => highlightDates(advanced.bestMonthDates));
  addHover('#gh-best-week', () => highlightDates(advanced.bestWeekDates));
  addHover('#gh-island', () => highlightDates(advanced.biggestIslandDates, 'gh-highlight-special'));
  addHover('#gh-slump-island', () => highlightDates(advanced.biggestSlumpIslandDates, 'gh-highlight-sad'));
  addHover('#gh-velocity-above', () => highlightDates(advanced.aboveVelocityDates, 'gh-highlight-special'));
  addHover('#gh-velocity-below', () => highlightDates(advanced.belowVelocityDates, 'gh-highlight-sad'));
  addHover('#gh-slump', () => highlightDates(advanced.longestSlumpDates, 'gh-highlight-sad'));
  addHover('#gh-best-day', () => highlightWeekday(advanced.bestDayIndex, advanced.isYTD ? `${now.getFullYear()}-01-01` : undefined, todayStr));
  addHover('#gh-worst-day', () => highlightWeekday(advanced.worstDayIndex, advanced.isYTD ? `${now.getFullYear()}-01-01` : undefined, todayStr));
  addHover('#gh-current-weekday', () => highlightWeekday(advanced.currentWeekdayIndex, advanced.isYTD ? `${now.getFullYear()}-01-01` : undefined, todayStr));
  addHover('#gh-power-day', () => highlightWeekday(advanced.powerDayIndex, advanced.isYTD ? `${now.getFullYear()}-01-01` : undefined, todayStr));
  addHover('#gh-peak-day', () => highlightWeekday(advanced.peakWeekdayIndex, advanced.isYTD ? `${now.getFullYear()}-01-01` : undefined, todayStr));
  addHover('#gh-most-active-day', () => highlightDates([advanced.mostActiveDay], 'gh-highlight-special'));
  addHover('#gh-max-commits', () => highlightDates([advanced.mostActiveDay], 'gh-highlight-special'));
  addHover('#gh-thresh-1', () => {
    document.querySelectorAll(`.ContributionCalendar-day[data-level="1"][data-date]`).forEach((day: any) => {
      day.classList.add('gh-highlight');
      day.style.outline = '';
      day.style.border = '';
    });
  });
  addHover('#gh-thresh-2', () => {
    document.querySelectorAll(`.ContributionCalendar-day[data-level="2"][data-date]`).forEach((day: any) => {
      day.classList.add('gh-highlight');
      day.style.outline = '';
      day.style.border = '';
    });
  });
  addHover('#gh-thresh-3', () => {
    document.querySelectorAll(`.ContributionCalendar-day[data-level="3"][data-date]`).forEach((day: any) => {
      day.classList.add('gh-highlight');
      day.style.outline = '';
      day.style.border = '';
    });
  });
  addHover('#gh-thresh-4', () => {
    document.querySelectorAll(`.ContributionCalendar-day[data-level="4"][data-date]`).forEach((day: any) => {
      day.classList.add('gh-highlight');
      day.style.outline = '';
      day.style.border = '';
    });
  });
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
