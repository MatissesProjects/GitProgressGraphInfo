import { ContributionDay, AdvancedStats } from '../types';
import { getCodingClass } from './rpg';

export async function applyVisibility() {
  try {
    const settings = await chrome.storage.local.get([
      'showGrid', 'showActiveRepos', 'showCreatedRepos', 'showAchievements', 'showPersona', 'showFooter', 'showLegendNumbers',
      'showTotal', 'showTodayCount', 'showStreak', 'showVelocity', 'showVelocityAbove', 'showVelocityBelow', 'showConsistency', 'showWeekend', 'showSlump', 'showBestDay', 'showWorstDay', 
      'showMostActiveDay', 'showTodayCount', 'showCurrentWeekday', 'showMaxCommits', 'showIsland', 'showSlumpIsland', 
      'showPowerDay', 'showPeakDay', 'showStars', 'showPR', 'showIssueCreated', 'showLangs', 'showNetwork', 'showBestMonth', 'showWorstMonth', 'showBestWeek', 'showLevel', 'showDominantWeekday', 'showTrends', 'showPulseHash', 'showTicker', 'showAvatar', 'showGearHead', 'showGearWeapon', 'showGearShield', 'showGearCompanion', 'showCombo', 'showXPBar', 'showSkillTree'
    ]);

    const grid = document.getElementById('gh-grid-stats');
    const detailed = document.getElementById('gh-detailed-stats');
    const activeRepos = document.getElementById('gh-active-repos');
    const createdRepos = document.getElementById('gh-created-repos');
    const achievements = document.getElementById('gh-achievements');
    const persona = document.getElementById('gh-persona');
    const footer = document.getElementById('gh-footer');
    const headerLevel = document.getElementById('gh-header-level');
    const pulseSignature = document.getElementById('gh-pulse-signature');
    const tickerGraph = document.getElementById('gh-ticker-container');
    const avatar = document.querySelector('.gh-avatar-wrapper') as HTMLElement;
    const thresholdsContainer = document.getElementById('gh-thresholds-container');
    const comboBadge = document.querySelector('.gh-combo-badge') as HTMLElement;
    const xpBar = document.querySelector('.gh-progress-container') as HTMLElement;
    const xpText = document.querySelector('.gh-xp-text') as HTMLElement;
    const skillTree = document.getElementById('gh-skill-tree');

    if (grid) grid.style.display = (settings.showGrid !== false) ? 'grid' : 'none';
    if (activeRepos) activeRepos.style.display = (settings.showActiveRepos !== false) ? 'block' : 'none';
    if (createdRepos) createdRepos.style.display = (settings.showCreatedRepos !== false) ? 'block' : 'none';
    if (achievements) achievements.style.display = (settings.showAchievements !== false) ? 'block' : 'none';
    if (persona) persona.style.display = (settings.showPersona !== false) ? 'inline-block' : 'none';
    if (footer) footer.style.display = (settings.showFooter !== false) ? 'block' : 'none';
    if (headerLevel) headerLevel.style.display = (settings.showLevel !== false) ? 'flex' : 'none';
    if (pulseSignature) pulseSignature.style.display = (settings.showPulseHash !== false) ? 'block' : 'none';
    if (tickerGraph) tickerGraph.style.display = (settings.showTicker !== false) ? 'block' : 'none';
    if (avatar) avatar.style.display = (settings.showAvatar !== false) ? 'block' : 'none';
    if (thresholdsContainer) thresholdsContainer.style.display = (settings.showLegendNumbers !== false) ? 'flex' : 'none';
    
    if (comboBadge) comboBadge.style.display = (settings.showCombo !== false) ? 'block' : 'none';
    if (xpBar) xpBar.style.display = (settings.showXPBar !== false) ? 'block' : 'none';
    if (xpText) xpText.style.display = (settings.showXPBar !== false) ? 'block' : 'none';
    if (skillTree) skillTree.style.display = (settings.showSkillTree !== false) ? 'block' : 'none';

    // Gear toggles
    if (avatar) {
      const head = avatar.querySelector('div:nth-child(3)') as HTMLElement; // Headgear is 3rd child
      const weapon = avatar.querySelector('div:nth-child(4)') as HTMLElement; // Weapon is 4th
      const shield = avatar.querySelector('div:nth-child(5)') as HTMLElement; // Shield is 5th
      const companion = avatar.querySelector('div:nth-child(1)') as HTMLElement; // Companion is 1st

      if (head) head.style.display = (settings.showGearHead !== false) ? 'block' : 'none';
      if (weapon) weapon.style.display = (settings.showGearWeapon !== false) ? 'block' : 'none';
      if (shield) shield.style.display = (settings.showGearShield !== false) ? 'block' : 'none';
      if (companion) companion.style.display = (settings.showGearCompanion !== false) ? 'block' : 'none';
    }

    const toggleMap: Record<string, any> = {
      'gh-total': settings.showTotal,
      'gh-today': settings.showTodayCount,
      'gh-streak': settings.showStreak,
      'gh-best-month': settings.showBestMonth,
      'gh-worst-month': settings.showWorstMonth,
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
      'gh-network': settings.showNetwork,
      'gh-pulse-signature': settings.showPulseHash
    };

    Object.entries(toggleMap).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.style.display = (val !== false) ? 'block' : 'none';
    });

    const legendLabels = document.querySelectorAll('.git-heat-legend-label');
    legendLabels.forEach((el: any) => {
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

function renderTickerGraph(data: { date: string; count: number }[], thresholds: any) {
  if (data.length < 2) return '';
  const width = 800;
  const height = 80; // Increased height for better intensity visualization
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (d.count / maxCount) * height;
    return `${x},${y}`;
  }).join(' ');

  // Create horizontal quadrant lines for the 4 main levels
  const quadrantLines = [1, 2, 3, 4].map(l => {
    if (!thresholds[l]) return '';
    const y = height - (Math.min(thresholds[l].min, maxCount) / maxCount) * height;
    return `
      <line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="var(--color-border-muted)" stroke-width="0.5" stroke-dasharray="4,4" />
      <text x="${width - 5}" y="${y - 2}" text-anchor="end" font-size="7" fill="var(--color-fg-muted)" opacity="0.8">L${l}</text>
    `;
  }).join('');

  // Horizontal stops for the line gradient (maps color to each specific day)
  const lineStops = data.map((d, i) => {
    const offset = (i / (Math.max(1, data.length - 1))) * 100;
    let level = 0;
    if (d.count > 0) {
      level = 1;
      if (thresholds[2] && d.count >= thresholds[2].min) level = 2;
      if (thresholds[3] && d.count >= thresholds[3].min) level = 3;
      if (thresholds[4] && d.count >= thresholds[4].min) level = 4;
    }
    // We use L1 as the baseline for the ticker fill even on level 0 days, but with very low opacity
    const colorVar = `var(--color-calendar-graph-day-L${Math.max(1, level)}-bg, #40c463)`;
    const stopOpacity = level === 0 ? 0.15 : 1;
    return `<stop offset="${offset}%" stop-color="${colorVar}" stop-opacity="${stopOpacity}" />`;
  }).join('');

  // Calculate Average Velocity line
  const counts = data.filter(d => d.count > 0).map(d => d.count);
  const avgVelocityValue = counts.length > 0 ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
  const avgY = height - (Math.min(avgVelocityValue, maxCount) / maxCount) * height;
  const avgLineHtml = avgVelocityValue > 0 ? `
    <line x1="0" y1="${avgY}" x2="${width}" y2="${avgY}" stroke="var(--color-accent-fg)" stroke-width="1" stroke-dasharray="2,2" opacity="0.5" />
    <text x="5" y="${avgY - 2}" font-size="6" fill="var(--color-accent-fg)" opacity="0.7">AVG VELOCITY (${avgVelocityValue.toFixed(1)})</text>
  ` : '';

  return `
    <div id="gh-ticker-container" class="mb-2" style="border-top: 1px solid var(--color-border-muted); padding-top: 8px;">
      <span class="color-fg-muted text-small d-block mb-1">Activity Intensity Ticker (Vertical Heat Zones)</span>
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="overflow: visible; background: var(--color-canvas-default); border-radius: 4px; border: 1px solid var(--color-border-muted);">
        <defs>
          <linearGradient id="ticker-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            ${lineStops}
          </linearGradient>
          <linearGradient id="pulse-area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="white" style="stop-opacity:1" />
            <stop offset="100%" stop-color="white" style="stop-opacity:0.2" />
          </linearGradient>
          <mask id="gh-ticker-area-mask">
            <rect width="100%" height="100%" fill="url(#pulse-area-gradient)" />
          </mask>
        </defs>
        <g id="gh-ticker-quadrants">${quadrantLines}${avgLineHtml}</g>
        <path class="gh-ticker-area" d="M 0,${height} L ${points} L ${width},${height} Z" fill="url(#ticker-line-gradient)" mask="url(#gh-ticker-area-mask)" style="filter: saturate(1.5) brightness(1.2);" />
        <path class="gh-ticker-path" d="M ${points}" fill="none" stroke="var(--color-fg-default, #1f2328)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));" />
      </svg>
    </div>
  `;
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
    'gh-streak', 'gh-best-month', 'gh-worst-month', 'gh-best-week', 'gh-current-week', 'gh-dominant-weekday', 'gh-most-active-day', 'gh-max-commits',
    'gh-velocity', 'gh-velocity-above', 'gh-velocity-below', 'gh-consistency', 'gh-weekend',
    'gh-island', 'gh-slump-island', 'gh-slump',
    'gh-best-day', 'gh-worst-day', 'gh-power-day', 'gh-peak-day', 'gh-current-weekday',
    'gh-stars', 'gh-pr', 'gh-issue-created', 'gh-langs', 'gh-network'
  ];
  let gridOrder = savedOrder || defaultOrder;
  defaultOrder.forEach(id => { if (!gridOrder.includes(id)) gridOrder.push(id); });

  const itemMap: Record<string, string> = {
    'gh-streak': `<div class="stat-card highlightable" id="gh-streak" data-current-streak="${(advanced.currentStreakDates || []).join(',')}" data-longest-streak="${(advanced.longestStreakDates || []).join(',')}"><span class="color-fg-muted d-block text-small">Current / Best Streak</span><strong class="f3-light">${advanced.currentStreak} / ${advanced.longestStreak} days</strong></div>`,
    'gh-best-month': `<div class="stat-card highlightable" id="gh-best-month" data-month-dates="${(advanced.bestMonthDates || []).join(',')}" title="Best month score vs average month score. (${advanced.bestMonthStats.count} commits, ${advanced.bestMonthStats.consistency}% consistency, ${advanced.bestMonthStats.streak} day streak)">
      <span class="color-fg-muted d-block text-small">Best Month (${advanced.bestMonthName})</span>
      <div class="d-flex flex-items-center gap-1">
        <strong class="f3-light">Score: ${advanced.bestMonthStats.score}</strong>
        ${(showTrends !== false && advanced.bestMonthTrend !== 0) ? `
          <span class="${advanced.bestMonthTrend > 0 ? 'color-fg-success' : 'color-fg-danger'} text-small font-weight-bold" style="white-space: nowrap;">
            ${advanced.bestMonthIcon} ${Math.abs(advanced.bestMonthTrend)}%
          </span>` : ''}
      </div>
    </div>`,
    'gh-worst-month': `<div class="stat-card highlightable" id="gh-worst-month" data-month-dates="${(advanced.worstMonthDates || []).join(',')}">
      <span class="color-fg-muted d-block text-small">Worst Month (${advanced.worstMonthName})</span>
      <strong class="f3-light">Score: ${advanced.worstMonthStats.score}</strong>
    </div>`,
    'gh-best-week': `<div class="stat-card highlightable" id="gh-best-week" data-week-dates="${(advanced.bestWeekDates || []).join(',')}" title="Best week score vs average week score. (${advanced.bestWeekStats.count} commits, ${advanced.bestWeekStats.consistency}% consistency, ${advanced.bestWeekStats.streak} day streak)">
      <span class="color-fg-muted d-block text-small">Best Week (${advanced.bestWeekName})</span>
      <div class="d-flex flex-items-center gap-1">
        <strong class="f3-light">Score: ${advanced.bestWeekStats.score}</strong>
        ${(showTrends !== false && advanced.bestWeekTrend !== 0) ? `
          <span class="${advanced.bestWeekTrend > 0 ? 'color-fg-success' : 'color-fg-danger'} text-small font-weight-bold" style="white-space: nowrap;">
            ${advanced.bestWeekIcon} ${Math.abs(advanced.bestWeekTrend)}%
          </span>` : ''}
      </div>
    </div>`,
    'gh-current-week': `<div class="stat-card highlightable" id="gh-current-week" data-week-dates="${(advanced.currentWeekDates || []).join(',')}" title="Your performance this week so far. (${advanced.currentWeekStats.count} commits, ${advanced.currentWeekStats.consistency}% consistency, ${advanced.currentWeekStats.streak} day streak)">
      <span class="color-fg-muted d-block text-small">Current Week</span>
      <strong class="f3-light">Score: ${advanced.currentWeekStats.score}</strong>
    </div>`,
    'gh-dominant-weekday': `<div class="stat-card" id="gh-dominant-weekday"><span class="color-fg-muted d-block text-small">Dominant Weekday</span><strong class="f3-light">${advanced.dominantWeekday} (${advanced.dominantWeekdayWins} weeks)</strong></div>`,
    'gh-island': `<div class="stat-card highlightable" id="gh-island" data-island="${(advanced.biggestIslandDates || []).join(',')}"><span class="color-fg-muted d-block text-small">Biggest Island (L2+)</span><strong class="f3-light">${advanced.biggestIslandSize} days</strong></div>`,
    'gh-slump-island': `<div class="stat-card highlightable" id="gh-slump-island" data-island="${(advanced.biggestSlumpIslandDates || []).join(',')}"><span class="color-fg-muted d-block text-small">Worst Island (0-1)</span><strong class="f3-light">${advanced.biggestSlumpIslandSize} days</strong></div>`,
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
    'gh-slump': `<div class="stat-card highlightable" id="gh-slump" title="${(advanced.longestSlumpDates || []).length > 0 ? (advanced.longestSlumpDates[0] + ' to ' + advanced.longestSlumpDates[advanced.longestSlumpDates.length - 1]) : 'N/A'}"><span class="color-fg-muted d-block text-small">Longest Slump</span><strong class="f3-light">${advanced.longestSlump} days</strong></div>`,
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
    'gh-langs': `<div class="stat-card" id="gh-langs"><span class="color-fg-muted d-block text-small">Top Languages</span><strong class="f3-light">${(advanced.topLangs || []).join(', ') || 'N/A'}</strong></div>`,
    'gh-network': `<div class="stat-card" id="gh-network"><span class="color-fg-muted d-block text-small">Network</span><strong class="f3-light">${advanced.socials.followers} Followers / ${advanced.socials.organizations} Orgs</strong></div>`
  };

  const rpgClasses = getCodingClass(advanced);
  const tickerHtml = renderTickerGraph(advanced.ytdDailyCounts, thresholds);

  statsDiv.innerHTML = `
    <div class="d-flex flex-justify-between flex-items-start mb-2" style="gap: 15px;">
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
        ${advanced.avatar ? `
          <div class="gh-avatar-wrapper" title="${advanced.avatar.description}" style="position: relative; width: 65px; height: 55px; cursor: help; user-select: none; margin-right: 5px;">
            <!-- Companion -->
            <div style="position: absolute; left: -15px; bottom: -5px; font-size: 22px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2)); z-index: 1;">
              ${advanced.avatar.companion}
            </div>
            <!-- Base Character -->
            <div style="position: absolute; left: 50%; top: 55%; transform: translate(-50%, -35%); font-size: 34px; z-index: 2;">
              ${advanced.avatar.base}
            </div>
            <!-- Headgear -->
            <div style="position: absolute; left: 50%; top: -6px; transform: translateX(-50%); font-size: 26px; z-index: 5; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
              ${advanced.avatar.headgear}
            </div>
            <!-- Weapon (Left Hand) -->
            <div style="position: absolute; left: -8px; top: 62%; transform: translateY(-50%) rotate(-10deg); font-size: 28px; z-index: 4; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));">
              ${advanced.avatar.weapon}
            </div>
            <!-- Shield (Right Hand) -->
            <div style="position: absolute; right: -2px; top: 55%; transform: translateY(-50%) rotate(10deg); font-size: 28px; z-index: 4; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));">
              ${advanced.avatar.shield}
            </div>
          </div>
        ` : ''}

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

    ${tickerHtml}

    <div id="gh-skill-tree" class="mb-2 p-2 border rounded-2 color-bg-default" style="display: none;">
      <div class="d-flex flex-justify-between flex-items-center mb-1">
        <span class="color-fg-muted text-small font-weight-bold">SKILL TREE</span>
        <span class="text-small color-fg-accent" style="cursor: help;" title="Unlock skills by completing specific GitHub milestones.">? How to unlock</span>
      </div>
      <div class="d-flex flex-wrap gap-2">
        ${(advanced.skills || []).map((s: any) => `
          <div class="skill-node ${s.unlocked ? 'unlocked' : 'locked'}" 
               title="${s.name}: ${s.description}\nRequirement: ${s.requirement}"
               style="display: flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 12px; font-size: 11px; border: 1px solid ${s.unlocked ? 'var(--color-success-emphasis)' : 'var(--color-border-muted)'}; background: ${s.unlocked ? 'var(--color-success-subtle)' : 'transparent'}; opacity: ${s.unlocked ? '1' : '0.5'}; cursor: help;">
            <span>${s.icon}</span>
            <span style="font-weight: ${s.unlocked ? '600' : 'normal'};">${s.name}</span>
            ${s.unlocked ? '<span style="font-size: 9px; color: var(--color-success-fg);">✓</span>' : ''}
          </div>
        `).join('')}
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
      <div id="gh-pulse-signature" class="mb-2" style="min-height: 14px;" title="A unique hexadecimal signature built from your daily contribution levels since Jan 1st. Reversed: Most recent day first. 0=Empty, 1-F=Deep Scale Level.">
        <span class="color-fg-muted" style="font-size: 9px; font-family: monospace; letter-spacing: 1px; word-break: break-all; line-height: 1.4; display: block;">
          SIG: 0x${advanced.pulseHash.split('').map((char: string) => {
            const level = parseInt(char, 16);
            return `<span class="gh-sig-char" data-level="${level}">${char}</span>`;
          }).join('')}
        </span>
      </div>
      <div class="d-flex flex-items-center flex-wrap mt-1">
        <span class="color-fg-muted text-small mr-2">Deep Scale: </span>
        <div id="granular-legend" class="d-flex gap-1 mr-3">
          ${Array.from({ length: 15 }).map((_, i) => `<div class="square-legend level-${i+1}"></div>`).join('')}
        </div>
        <div id="gh-thresholds-container" class="d-flex flex-items-center flex-wrap gap-2 ml-auto">
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
    // 1. Highlight Graph Days
    document.querySelectorAll(`.ContributionCalendar-day[data-granular-level="${level}"][data-date]`).forEach((day: any) => {
      day.classList.add('gh-highlight');
      day.style.outline = '';
      day.style.border = '';
    });
    // 2. Highlight SIG characters
    document.querySelectorAll(`.gh-sig-char[data-level="${level}"]`).forEach((char: any) => {
      char.classList.add('highlighting');
    });
    // 3. Highlight Legend Square
    const sq = statsDiv.querySelector(`.square-legend.level-${level}`);
    if (sq) sq.classList.add('highlighting');
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
    document.querySelectorAll('.square-legend, .gh-sig-char').forEach((el: any) => {
      el.classList.remove('highlighting');
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
      highlightGranularLevel(level); 
    });
    sq.addEventListener('mouseleave', () => { 
      clearHighlights(); 
    });
  });

  // Add hover for SIG characters
  statsDiv.querySelectorAll('.gh-sig-char').forEach((char: any) => {
    char.addEventListener('mouseenter', () => {
      const level = parseInt(char.getAttribute('data-level') || '0', 10);
      highlightGranularLevel(level);
    });
    char.addEventListener('mouseleave', () => {
      clearHighlights();
    });
  });

  const startOfYear = `${advanced.targetYear}-01-01`;
  const endOfTargetPeriod = advanced.targetYear === now.getFullYear() ? todayStr : `${advanced.targetYear}-12-31`;

  addHover('#gh-today', () => highlightDates([todayStr]));
  addHover('#gh-streak', () => highlightDates([...new Set([...advanced.longestStreakDates, ...advanced.currentStreakDates])]));
  addHover('#gh-best-month', () => highlightDates(advanced.bestMonthDates));
  addHover('#gh-worst-month', () => highlightDates(advanced.worstMonthDates));
  addHover('#gh-best-week', () => highlightDates(advanced.bestWeekDates));
  addHover('#gh-current-week', () => highlightDates(advanced.currentWeekDates));
  addHover('#gh-island', () => highlightDates(advanced.biggestIslandDates, 'gh-highlight-special'));
  addHover('#gh-slump-island', () => highlightDates(advanced.biggestSlumpIslandDates, 'gh-highlight-sad'));
  addHover('#gh-velocity-above', () => highlightDates(advanced.aboveVelocityDates, 'gh-highlight-special'));
  addHover('#gh-velocity-below', () => highlightDates(advanced.belowVelocityDates, 'gh-highlight-sad'));
  addHover('#gh-slump', () => highlightDates(advanced.longestSlumpDates, 'gh-highlight-sad'));
  addHover('#gh-best-day', () => highlightWeekday(advanced.bestDayIndex, startOfYear, endOfTargetPeriod));
  addHover('#gh-worst-day', () => highlightWeekday(advanced.worstDayIndex, startOfYear, endOfTargetPeriod));
  addHover('#gh-current-weekday', () => highlightWeekday(advanced.currentWeekdayIndex, startOfYear, endOfTargetPeriod));
  addHover('#gh-power-day', () => highlightWeekday(advanced.powerDayIndex, startOfYear, endOfTargetPeriod));
  addHover('#gh-peak-day', () => highlightWeekday(advanced.peakWeekdayIndex, startOfYear, endOfTargetPeriod));
  addHover('#gh-most-active-day', () => highlightDates([advanced.mostActiveDay], 'gh-highlight-special'));
  addHover('#gh-max-commits', () => highlightDates([advanced.mostActiveDay], 'gh-highlight-special'));
  
  // Bidirectional highlighting: Hover graph day -> Highlight legend square
  document.querySelectorAll('.ContributionCalendar-day').forEach((day: any) => {
    if (day._githeatListener) return;
    day._githeatListener = true;
    day.addEventListener('mouseenter', () => {
      const level = day.getAttribute('data-granular-level');
      if (level) {
        const sq = document.querySelector(`.square-legend.level-${level}`);
        if (sq) sq.classList.add('highlighting');
      }
    });
    day.addEventListener('mouseleave', () => {
      document.querySelectorAll('.square-legend').forEach(sq => sq.classList.remove('highlighting'));
    });
  });

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

export async function extendLegend(thresholds: any) {
  const legend = document.querySelector('.ContributionCalendar-footer');
  if (!legend) return;
  
  const settings = await chrome.storage.local.get(['showLegendNumbers']);
  const show = settings.showLegendNumbers !== false;

  legend.querySelectorAll('.git-heat-legend-label').forEach(el => el.remove());
  
  if (!show) return;

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
