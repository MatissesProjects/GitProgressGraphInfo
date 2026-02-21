interface ContributionDay {
  date: string;
  level: number;
  count: number;
}

interface PinnedProject {
  name: string;
  stars: number;
  forks: number;
  language: string;
  languageColor: string;
}

interface RepoActivity {
  name: string;
  commits: number;
}

interface CreatedRepo {
  name: string;
  language: string;
}

interface TimelineActivity {
  topRepos: RepoActivity[];
  createdRepos: number;
  createdRepoList: CreatedRepo[];
  issuesOpened: number;
  pullRequests: number;
  pullRequestReviews: number;
  mergedPullRequests: number;
}

interface SocialStats {
  followers: number;
  following: number;
  organizations: number;
}

function parseActivityTimeline(): TimelineActivity {
  const repoCommits: Record<string, number> = {};
  let createdRepos = 0;
  let createdRepoList: CreatedRepo[] = [];
  let issuesOpened = 0;
  let pullRequests = 0;
  let pullRequestReviews = 0;
  let mergedPullRequests = 0;
  
  const activityItems = document.querySelectorAll('.TimelineItem');
  
  activityItems.forEach(item => {
    const body = item.querySelector('.TimelineItem-body');
    if (!body) return;

    const bodyText = body.textContent?.trim() || "";

    if (bodyText.includes('commits in')) {
      const listItems = body.querySelectorAll('li');
      listItems.forEach(li => {
        const link = li.querySelector('a');
        if (link) {
          const repoName = link.textContent?.trim() || "";
          const liText = li.textContent?.trim() || "";
          const commitMatch = liText.match(/(\d+)\s+commit/);
          if (commitMatch && repoName && repoName.includes('/')) {
            repoCommits[repoName] = (repoCommits[repoName] || 0) + parseInt(commitMatch[1], 10);
          }
        }
      });
    }

    if (bodyText.includes('Created') && bodyText.includes('repositor') && !bodyText.includes('commits in')) {
      const match = bodyText.match(/Created (\d+) repositor/i);
      if (match) {
        createdRepos += parseInt(match[1], 10);
      } else if (bodyText.includes('Created a repository')) {
        createdRepos += 1;
      }
      
      const listItems = body.querySelectorAll('li, div.py-1');
      listItems.forEach(li => {
        const link = li.querySelector('a');
        if (link) {
          const name = link.textContent?.trim() || "";
          if (name && name.includes('/') && !name.includes(' ')) {
            const language = li.querySelector('[itemprop="programmingLanguage"]')?.textContent?.trim() || "";
            if (!createdRepoList.some(r => r.name === name)) {
              createdRepoList.push({ name, language });
            }
          }
        }
      });
    }

    if (bodyText.includes('Opened') && bodyText.includes('issue')) {
      const match = bodyText.match(/Opened (\d+) (?:other )?issue/i);
      if (match) {
        issuesOpened += parseInt(match[1], 10);
      } else if (bodyText.includes('Opened an issue')) {
        issuesOpened += 1;
      }
    }
    if (bodyText.includes('Created an issue')) {
      issuesOpened += 1;
    }

    if (bodyText.includes('pull request')) {
      const proposedMatch = bodyText.match(/(?:Proposed|Opened) (\d+) (?:other )?pull request/i);
      if (proposedMatch) {
        pullRequests += parseInt(proposedMatch[1], 10);
      } else if (bodyText.includes('Opened a pull request') || bodyText.includes('Proposed a pull request')) {
        pullRequests += 1;
      }

      const mergedMatch = bodyText.match(/Merged (\d+) (?:other )?pull request/i);
      if (mergedMatch) {
        mergedPullRequests += parseInt(mergedMatch[1], 10);
      } else if (bodyText.includes('Merged a pull request')) {
        mergedPullRequests += 1;
      }

      const reviewedMatch = bodyText.match(/Reviewed (\d+) (?:other )?pull request/i);
      if (reviewedMatch) {
        pullRequestReviews += parseInt(reviewedMatch[1], 10);
      } else if (bodyText.includes('Reviewed a pull request')) {
        pullRequestReviews += 1;
      }
    }
  });

  const topRepos = Object.entries(repoCommits)
    .map(([name, commits]) => ({ name, commits }))
    .sort((a, b) => b.commits - a.commits);

  return { 
    topRepos, 
    createdRepos, 
    createdRepoList, 
    issuesOpened, 
    pullRequests, 
    pullRequestReviews, 
    mergedPullRequests 
  };
}

function parseAchievements(): string[] {
  const achievements: string[] = [];
  const badges = document.querySelectorAll('.achievement-badge-sidebar, .js-achievement-badge-card img');
  badges.forEach(badge => {
    const alt = badge.getAttribute('alt') || "";
    if (alt && !achievements.includes(alt)) {
      achievements.push(alt.replace("Achievement: ", ""));
    }
  });
  return achievements;
}

function parseSocials(): SocialStats {
  const followersText = document.querySelector('a[href*="?tab=followers"] span')?.textContent?.trim() || "0";
  const followingText = document.querySelector('a[href*="?tab=following"] span')?.textContent?.trim() || "0";
  const orgs = document.querySelectorAll('.avatar-group-item').length;

  const parseNum = (txt: string) => {
    if (txt.includes('k')) return parseFloat(txt) * 1000;
    return parseInt(txt.replace(/,/g, ''), 10) || 0;
  };

  return {
    followers: parseNum(followersText),
    following: parseNum(followingText),
    organizations: orgs
  };
}

function parsePinnedProjects(): PinnedProject[] {
  const projects: PinnedProject[] = [];
  const pinnedItems = document.querySelectorAll('.pinned-item-list-item-content');

  pinnedItems.forEach((item) => {
    const name = item.querySelector('a.Link')?.textContent?.trim() || "";
    const language = item.querySelector('[itemprop="programmingLanguage"]')?.textContent?.trim() || "Unknown";
    const languageColor = (item.querySelector('.repo-language-color') as HTMLElement)?.style?.backgroundColor || "";
    
    let stars = 0;
    let forks = 0;
    
    const links = item.querySelectorAll('a.pinned-item-meta');
    links.forEach(link => {
      const text = link.textContent?.trim() || "";
      const href = link.getAttribute('href') || "";
      const count = parseInt(text.replace(/,/g, ''), 10) || 0;
      
      if (href.includes('/stargazers')) {
        stars = count;
      } else if (href.includes('/forks') || href.includes('/network/members')) {
        forks = count;
      }
    });

    if (name) {
      projects.push({ name, stars, forks, language, languageColor });
    }
  });

  return projects;
}

function parseContributionGraph() {
  const days = document.querySelectorAll('.ContributionCalendar-day');
  const contributionData: ContributionDay[] = [];

  days.forEach((day) => {
    const date = day.getAttribute('data-date');
    const level = parseInt(day.getAttribute('data-level') || '0', 10);
    
    if (date) {
      let count = 0;
      const id = day.getAttribute('id');
      if (id) {
        const tooltip = document.querySelector(`tool-tip[for="${id}"]`);
        if (tooltip) {
          count = parseCountText(tooltip.textContent || "");
        }
      }

      if (count === 0 && level > 0) {
        const ariaLabel = day.getAttribute('aria-label');
        const title = day.getAttribute('title');
        count = parseCountText(ariaLabel || title || "");
      }

      contributionData.push({ date, level, count });
    }
  });

  if (contributionData.length === 0) {
    return null;
  }

  return contributionData;
}

function parseCountText(text: string): number {
  if (!text) return 0;
  if (text.toLowerCase().includes("no contribution")) return 0;
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function calculateThresholds(data: ContributionDay[]) {
  const thresholds: Record<number, { min: number; max: number }> = {};
  const levels: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [] };

  data.forEach(day => {
    if (day.level > 0 && day.count > 0) {
      levels[day.level].push(day.count);
    }
  });

  for (let l = 1; l <= 4; l++) {
    const counts = levels[l].sort((a, b) => a - b);
    if (counts.length > 0) {
      thresholds[l] = { min: counts[0], max: counts[counts.length - 1] };
    }
  }
  return thresholds;
}

function calculatePercentiles(data: ContributionDay[]) {
  const activeDays = data.filter(d => d.count > 0).map(d => d.count).sort((a, b) => a - b);
  if (activeDays.length === 0) return {};

  const percentiles: Record<number, number> = {};
  const markers = [10, 25, 50, 75, 90, 95, 99];
  
  markers.forEach(m => {
    const index = Math.ceil((m / 100) * activeDays.length) - 1;
    percentiles[m] = activeDays[Math.min(index, activeDays.length - 1)];
  });

  return percentiles;
}

// Color Themes
const THEMES: Record<string, string[]> = {
  flame: [
    '#ebedf0', '#ffeecc', '#ffdd99', '#ffcc66', '#ffbb44', '#ff9922', 
    '#ff7711', '#ff5500', '#dd3300', '#bb1100', '#880000', '#550000'
  ],
  green: [
    '#ebedf0', '#e6ffed', '#d1f2d9', '#9be9a8', '#7bc96f', '#40c463',
    '#30a14e', '#216e39', '#196127', '#124d1f', '#0c3a17', '#06250e'
  ]
};

function interpolateColor(color1: string, color2: string, factor: number) {
  const hex = (x: number) => {
    const s = x.toString(16);
    return s.length === 1 ? '0' + s : s;
  };

  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);

  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);

  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));

  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function generateCustomScale(start: string, stop: string): string[] {
  const scale = [start];
  for (let i = 1; i <= 11; i++) {
    scale.push(interpolateColor(start, stop, i / 11));
  }
  return scale;
}

async function applyDeepRecoloring(data: ContributionDay[], percentiles: Record<number, number>, themeName: string = 'green', thresholds: any) {
  const days = document.querySelectorAll('.ContributionCalendar-day');
  
  let colors: string[];
  if (themeName === 'custom') {
    if (!chrome.runtime?.id) return;
    try {
      const settings = await chrome.storage.local.get(['customStart', 'customStop']);
      colors = generateCustomScale((settings.customStart as string) || '#ebedf0', (settings.customStop as string) || '#216e39');
    } catch (e) {
      return;
    }
  } else {
    colors = THEMES[themeName] || THEMES.green;
  }
  
  const getGranularLevel = (count: number) => {
    if (count === 0) return 0;
    if (count >= (percentiles[99] || 999)) return 11;
    if (count >= (percentiles[95] || 999)) return 10;
    if (count >= (percentiles[90] || 999)) return 9;
    if (count >= (percentiles[75] || 999)) return 8;
    if (count >= (percentiles[50] || 999)) return 5;
    if (count >= (percentiles[25] || 999)) return 3;
    if (count >= (percentiles[10] || 999)) return 1;
    return 1;
  };

  days.forEach((day: any) => {
    const date = day.getAttribute('data-date');
    const dayData = data.find(d => d.date === date);
    if (dayData && dayData.count > 0) {
      const level = getGranularLevel(dayData.count);
      const color = colors[level];
      day.style.setProperty('background-color', color, 'important');
      day.style.setProperty('fill', color, 'important');
      
      if (day.classList.contains('gh-highlight') || day.classList.contains('gh-highlight-special') || day.classList.contains('gh-highlight-sad')) {
        day.style.outline = '';
        day.style.border = '';
      } else {
        day.style.outline = 'none';
        day.style.border = 'none';
      }
    }
  });

  const footer = document.querySelector('.ContributionCalendar-footer');
  if (footer) {
    const legendSquares = footer.querySelectorAll('.ContributionCalendar-day');
    legendSquares.forEach((sq: any, i) => {
      const levelMap = [0, 3, 6, 9, 11];
      const color = colors[levelMap[i]];
      if (color) {
        sq.style.setProperty('background-color', color, 'important');
        sq.style.setProperty('fill', color, 'important');
      }
    });
  }

  const statsPanel = document.getElementById('git-heat-stats');
  if (statsPanel) {
    const legendSquares = statsPanel.querySelectorAll('.square-legend');
    legendSquares.forEach((sq: any, i) => {
      const color = colors[i];
      if (color) sq.style.setProperty('background-color', color, 'important');
    });

    const badges = statsPanel.querySelectorAll('.badge');
    const badgeLevels = [3, 6, 9, 11];
    badges.forEach((badge: any, i) => {
      const color = colors[badgeLevels[i]];
      if (color) badge.style.setProperty('background-color', color, 'important');
    });
  }
}

async function applyVisibility() {
  if (!chrome.runtime?.id) return;
  const settings = await chrome.storage.local.get([
    'showGrid', 'showActiveRepos', 'showCreatedRepos', 'showAchievements', 'showPersona', 'showFooter', 'showLegendNumbers',
    'showTotal', 'showStreak', 'showVelocity', 'showConsistency', 'showWeekend', 'showSlump', 'showBestDay', 'showWorstDay', 
    'showMostActiveDay', 'showTodayCount', 'showCurrentWeekday', 'showMaxCommits', 'showIsland', 'showSlumpIsland', 
    'showPowerDay', 'showPeakDay', 'showStars', 'showPR', 'showIssueCreated', 'showLangs', 'showNetwork', 'showBestMonth'
  ]);

  const grid = document.getElementById('gh-grid-stats');
  const detailed = document.getElementById('gh-detailed-stats');
  const activeRepos = document.getElementById('gh-active-repos');
  const createdRepos = document.getElementById('gh-created-repos');
  const achievements = document.getElementById('gh-achievements');
  const persona = document.getElementById('gh-persona');
  const footer = document.getElementById('gh-footer');

  if (grid) grid.style.display = (settings.showGrid !== false) ? 'grid' : 'none';
  if (activeRepos) activeRepos.style.display = (settings.showActiveRepos !== false) ? 'block' : 'none';
  if (createdRepos) createdRepos.style.display = (settings.showCreatedRepos !== false) ? 'block' : 'none';
  if (achievements) achievements.style.display = (settings.showAchievements !== false) ? 'block' : 'none';
  if (persona) persona.style.display = (settings.showPersona !== false) ? 'inline-block' : 'none';
  if (footer) footer.style.display = (settings.showFooter !== false) ? 'block' : 'none';

  const toggleMap: Record<string, any> = {
    'gh-total': settings.showTotal,
    'gh-today': settings.showTodayCount,
    'gh-streak': settings.showStreak,
    'gh-best-month': settings.showBestMonth,
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

function calculateAdvancedStats(data: ContributionDay[], pinned: PinnedProject[] = [], timeline: TimelineActivity, achievements: string[] = [], socials: SocialStats) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const ytdStartStr = `${now.getFullYear()}-01-01`;
  
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const pastAndPresentData = sortedData.filter(d => d.date <= todayStr);
  const dateMap = new Map(data.map(d => [d.date, d]));

  let currentStreak = 0, currentStreakDates: string[] = [], longestStreak = 0, longestStreakDates: string[] = [];
  let tempStreak = 0, tempStreakDates: string[] = [], activeDays = 0, longestSlump = 0, tempSlump = 0;
  let ytdWeekendContributions = 0, ytdWeekdayContributions = 0, ytdActiveWeekendDays = 0, ytdTotalWeekendDays = 0, ytdActiveDays = 0, ytdTotalDays = 0;
  const weekdayCounts: Record<number, number> = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };

  pastAndPresentData.forEach(day => {
    const dateObj = new Date(day.date + 'T00:00:00');
    const weekday = dateObj.getDay();
    const isWeekend = (weekday === 0 || weekday === 6);
    const isYTD = day.date >= ytdStartStr;

    if (isYTD) { ytdTotalDays++; if (isWeekend) ytdTotalWeekendDays++; }

    if (day.count > 0) {
      activeDays++; tempStreak++; tempStreakDates.push(day.date);
      if (tempSlump > longestSlump) longestSlump = tempSlump;
      tempSlump = 0;
      if (isYTD) {
        ytdActiveDays++;
        if (isWeekend) { ytdActiveWeekendDays++; ytdWeekendContributions += day.count; }
        else { ytdWeekdayContributions += day.count; }
      }
      weekdayCounts[weekday] += day.count;
    } else {
      if (tempStreak > longestStreak) { longestStreak = tempStreak; longestStreakDates = [...tempStreakDates]; }
      tempStreak = 0; tempStreakDates = []; tempSlump++;
    }
  });
  
  if (tempStreak > longestStreak) { longestStreak = tempStreak; longestStreakDates = [...tempStreakDates]; }
  if (tempSlump > longestSlump) longestSlump = tempSlump;
  
  for (let i = pastAndPresentData.length - 1; i >= 0; i--) {
    const day = pastAndPresentData[i];
    if (day.count > 0) { currentStreak++; currentStreakDates.unshift(day.date); }
    else if (day.date !== todayStr) break;
  }

  const ytdTotalContributions = ytdWeekendContributions + ytdWeekdayContributions;
  let weekendScore = 0, weekendVolumeShare = 0, velocity = "0", consistency = "0";
  
  if (ytdTotalDays > 0) {
    weekendScore = ytdTotalWeekendDays > 0 ? Math.round((ytdActiveWeekendDays / ytdTotalWeekendDays) * 100) : 0;
    weekendVolumeShare = ytdTotalContributions > 0 ? (ytdWeekendContributions / ytdTotalContributions) : 0;
    velocity = ytdActiveDays > 0 ? (ytdTotalContributions / ytdActiveDays).toFixed(1) : "0";
    consistency = ((ytdActiveDays / ytdTotalDays) * 100).toFixed(1);
  } else {
    const weekendDaysData = pastAndPresentData.filter(d => {
      const day = new Date(d.date + 'T00:00:00').getDay();
      return day === 0 || day === 6;
    });
    const activeWeekendDaysCount = weekendDaysData.filter(d => d.count > 0).length;
    weekendScore = weekendDaysData.length > 0 ? Math.round((activeWeekendDaysCount / weekendDaysData.length) * 100) : 0;
    const totalWeekendVol = weekendDaysData.reduce((sum, d) => sum + d.count, 0);
    const totalVol = pastAndPresentData.reduce((sum, d) => sum + d.count, 0);
    weekendVolumeShare = totalVol > 0 ? (totalWeekendVol / totalVol) : 0;
    velocity = activeDays > 0 ? (totalVol / activeDays).toFixed(1) : "0";
    consistency = ((activeDays / pastAndPresentData.length) * 100).toFixed(1);
  }

  const totalStars = pinned.reduce((sum, p) => sum + p.stars, 0);
  const totalForks = pinned.reduce((sum, p) => sum + p.forks, 0);
  const langFreq: Record<string, number> = {};
  pinned.forEach(p => { if (p.language !== "Unknown") langFreq[p.language] = (langFreq[p.language] || 0) + 1; });
  const topLangs = Object.entries(langFreq).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]);

  let persona = "Consistent Coder";
  if (weekendVolumeShare > 0.4) persona = "Weekend Warrior";
  else if (parseFloat(consistency) < 20) persona = "Burst Developer";
  else if (parseFloat(velocity) > 15) persona = "High-Volume Architect";
  else if (weekendScore > 80) persona = "Unstoppable Force";
  else if (totalStars > 100) persona = "Popular Maintainer";

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  let bestDayIndex = 0, maxWeekdayCount = -1, worstDayIndex = 0, minWeekdayCount = Infinity;
  for (let i = 0; i < 7; i++) {
    if (weekdayCounts[i] > maxWeekdayCount) { maxWeekdayCount = weekdayCounts[i]; bestDayIndex = i; }
    if (weekdayCounts[i] < minWeekdayCount) { minWeekdayCount = weekdayCounts[i]; worstDayIndex = i; }
  }

  let mostActiveDay = "N/A", mostActiveDayCount = 0, mostActiveDayWeekday = -1;
  pastAndPresentData.forEach(day => {
    if (day.count > mostActiveDayCount) {
      mostActiveDayCount = day.count; mostActiveDay = day.date;
      mostActiveDayWeekday = new Date(day.date + 'T00:00:00').getDay();
    }
  });

  // Calculate Best Month
  const monthData: Record<string, { count: number, activeDays: number, totalDays: number, maxStreak: number, tempStreak: number, dates: string[] }> = {};
  pastAndPresentData.forEach(day => {
    const monthKey = day.date.substring(0, 7); // YYYY-MM
    if (!monthData[monthKey]) {
      monthData[monthKey] = { count: 0, activeDays: 0, totalDays: 0, maxStreak: 0, tempStreak: 0, dates: [] };
    }
    const m = monthData[monthKey];
    m.totalDays++;
    m.dates.push(day.date);
    if (day.count > 0) {
      m.count += day.count;
      m.activeDays++;
      m.tempStreak++;
      if (m.tempStreak > m.maxStreak) m.maxStreak = m.tempStreak;
    } else {
      m.tempStreak = 0;
    }
  });

  let bestMonthName = "N/A", bestMonthScore = -1, bestMonthDates: string[] = [], bestMonthStats = { score: 0 };
  Object.entries(monthData).forEach(([month, data]) => {
    const consistency = data.activeDays / data.totalDays;
    // Score formula: commits * consistency * streak
    const score = Math.round(data.count * consistency * (data.maxStreak || 1));
    if (score > bestMonthScore) {
      bestMonthScore = score;
      bestMonthName = new Date(month + '-01T00:00:00').toLocaleString('default', { month: 'long', year: 'numeric' });
      bestMonthDates = data.dates;
      bestMonthStats = { score };
    }
  });

  const todayWeekday = now.getDay();
  const todayCount = data.find(d => d.date === todayStr)?.count || 0;

  // Islands (Restricted to past and present data to avoid future empty days)
  const findIsland = (targetData: ContributionDay[], thresholdFn: (d: ContributionDay) => boolean) => {
    const visited = new Set<string>();
    let biggest: string[] = [];
    
    targetData.filter(thresholdFn).forEach(day => {
      if (!visited.has(day.date)) {
        const current: string[] = [], queue = [day.date];
        visited.add(day.date);
        while (queue.length > 0) {
          const curr = queue.shift()!;
          current.push(curr);
          const d = new Date(curr + 'T00:00:00');
          [-1, 1, -7, 7].forEach(diff => {
            const n = new Date(d); n.setDate(d.getDate() + diff);
            const s = n.toISOString().split('T')[0];
            const node = dateMap.get(s);
            // Only consider neighbors that are in the past/present data AND match the threshold
            if (node && node.date <= todayStr && thresholdFn(node) && !visited.has(s)) {
              visited.add(s);
              queue.push(s);
            }
          });
        }
        if (current.length > biggest.length) biggest = current;
      }
    });
    return biggest;
  };

  const biggestIslandDates = findIsland(pastAndPresentData, d => d.level >= 2);
  const biggestSlumpIslandDates = findIsland(pastAndPresentData, d => d.count <= 1);

  const weekdayHighActivityCounts: Record<number, number> = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
  const weekdayTotalDays: Record<number, number> = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
  pastAndPresentData.forEach(day => {
    const wd = new Date(day.date + 'T00:00:00').getDay();
    weekdayTotalDays[wd]++;
    if (day.level >= 2) weekdayHighActivityCounts[wd]++;
  });

  let powerDayIndex = 0, maxAvg = -1, peakWeekdayIndex = 0, maxHighFreq = -1;
  for (let i = 0; i < 7; i++) {
    const avg = weekdayTotalDays[i] > 0 ? (weekdayCounts[i] / weekdayTotalDays[i]) : 0;
    if (avg > maxAvg) { maxAvg = avg; powerDayIndex = i; }
    if (weekdayHighActivityCounts[i] > maxHighFreq) { maxHighFreq = weekdayHighActivityCounts[i]; peakWeekdayIndex = i; }
  }

  return {
    currentStreak, currentStreakDates, longestStreak, longestStreakDates, longestSlump, consistency, velocity, weekendScore, persona,
    bestDay: daysOfWeek[bestDayIndex], bestDayIndex, bestDayCount: maxWeekdayCount,
    worstDay: daysOfWeek[worstDayIndex], worstDayIndex, worstDayCount: minWeekdayCount,
    currentWeekday: daysOfWeek[todayWeekday], currentWeekdayIndex: todayWeekday, currentWeekdayCount: weekdayCounts[todayWeekday],
    todayCount, mostActiveDay, mostActiveDayCount, mostActiveDayWeekday,
    powerDay: daysOfWeek[powerDayIndex], powerDayIndex, powerDayAvg: maxAvg.toFixed(1),
    peakWeekday: daysOfWeek[peakWeekdayIndex], peakWeekdayIndex, peakWeekdayCount: maxHighFreq,
    biggestIslandSize: biggestIslandDates.length, biggestIslandDates,
    biggestSlumpIslandSize: biggestSlumpIslandDates.length, biggestSlumpIslandDates,
    bestMonthName, bestMonthDates, bestMonthStats,
    activeDays, isYTD: ytdTotalDays > 0, totalStars, totalForks, topLangs,
    topRepos: timeline.topRepos.slice(0, 3), createdRepos: timeline.createdRepos, createdRepoList: timeline.createdRepoList,
    issuesOpened: timeline.issuesOpened, pullRequests: timeline.pullRequests, pullRequestReviews: timeline.pullRequestReviews, mergedPullRequests: timeline.mergedPullRequests,
    achievements: achievements.slice(0, 4), socials
  };
}
function init() {
  console.log("GitHeat: Initializing...");
  const isContextValid = () => !!chrome.runtime?.id;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!isContextValid()) return;
    if (request.action === "getStats") {
      const data = parseContributionGraph();
      const pinned = parsePinnedProjects();
      const timeline = parseActivityTimeline();
      const achievements = parseAchievements();
      const socials = parseSocials();
      if (data) {
        const thresholds = calculateThresholds(data);
        const percentiles = calculatePercentiles(data);
        const advanced = calculateAdvancedStats(data, pinned, timeline, achievements, socials);
        let total = data.reduce((sum, day) => sum + day.count, 0);
        if (advanced.isYTD) {
          const currentYear = new Date().getFullYear();
          const ytdData = data.filter(d => d.date >= `${currentYear}-01-01`);
          if (ytdData.length > 0) total = ytdData.reduce((sum, day) => sum + day.count, 0);
        }
        sendResponse({ thresholds, percentiles, total, advanced, success: true });
      } else {
        sendResponse({ success: false, error: "No graph found" });
      }
    }
    return true;
  });

  chrome.storage.onChanged.addListener(async (changes) => {
    if (!isContextValid()) return;
    const visibilityKeys = ['showGrid', 'showActiveRepos', 'showCreatedRepos', 'showAchievements', 'showPersona', 'showFooter', 'showLegendNumbers', 'showTotal', 'showStreak', 'showVelocity', 'showConsistency', 'showWeekend', 'showSlump', 'showBestDay', 'showWorstDay', 'showMostActiveDay', 'showTodayCount', 'showCurrentWeekday', 'showMaxCommits', 'showIsland', 'showSlumpIsland', 'showPowerDay', 'showPeakDay', 'showStars', 'showPR', 'showIssueCreated', 'showLangs', 'showNetwork'];
    if (visibilityKeys.some(key => changes[key])) applyVisibility();
    if (changes.gridOrder) runAnalysis().catch(() => {});
    if (changes.theme || changes.customStart || changes.customStop) {
      const data = parseContributionGraph();
      if (data) {
        const p = calculatePercentiles(data);
        const t = calculateThresholds(data);
        const s = await chrome.storage.local.get('theme');
        await applyDeepRecoloring(data, p, (s.theme as string) || 'green', t);
      }
    }
  });

  let isAnalysisRunning = false;
  const runAnalysis = async () => {
    if (!isContextValid() || isAnalysisRunning) return;
    isAnalysisRunning = true;
    try {
      const data = parseContributionGraph();
      const pinned = parsePinnedProjects();
      const timeline = parseActivityTimeline();
      const achievements = parseAchievements();
      const socials = parseSocials();
      if (data) {
        const t = calculateThresholds(data), p = calculatePercentiles(data);
        const s = await chrome.storage.local.get(['theme', 'gridOrder']);
        const theme = (s.theme as string) || 'green', order = (s.gridOrder as string[]) || null;
        const advanced = calculateAdvancedStats(data, pinned, timeline, achievements, socials);
        injectStats(t, data, advanced, order);
        extendLegend(t);
        await applyDeepRecoloring(data, p, theme, t);
        await applyVisibility();
      }
    } catch (e) {} finally { isAnalysisRunning = false; }
  };

  const observer = new MutationObserver((mutations) => {
    if (!isContextValid()) { observer.disconnect(); return; }
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        if (document.querySelector('.js-yearly-contributions') && !document.getElementById('git-heat-stats')) {
          runAnalysis().catch(() => {});
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  runAnalysis().catch(() => {});
}

function injectStats(thresholds: any, data: ContributionDay[], advanced: any, savedOrder: string[] | null = null) {
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

  const defaultOrder = ['gh-total', 'gh-today', 'gh-streak', 'gh-best-month', 'gh-island', 'gh-slump-island', 'gh-velocity', 'gh-consistency', 'gh-weekend', 'gh-slump', 'gh-best-day', 'gh-worst-day', 'gh-current-weekday', 'gh-power-day', 'gh-peak-day', 'gh-most-active-day', 'gh-max-commits', 'gh-stars', 'gh-pr', 'gh-issue-created', 'gh-langs', 'gh-network'];
  let gridOrder = savedOrder || defaultOrder;
  defaultOrder.forEach(id => { if (!gridOrder.includes(id)) gridOrder.push(id); });

  const itemMap: Record<string, string> = {
    'gh-total': `<div class="stat-card" id="gh-total"><span class="color-fg-muted d-block text-small">Total ${titleSuffix}</span><strong class="f3-light">${totalContributions.toLocaleString()}</strong></div>`,
    'gh-today': `<div class="stat-card highlightable" id="gh-today" data-date="${todayStr}"><span class="color-fg-muted d-block text-small">Today's Contribs</span><strong class="f3-light">${advanced.todayCount}</strong></div>`,
    'gh-streak': `<div class="stat-card highlightable" id="gh-streak" data-current-streak="${advanced.currentStreakDates.join(',')}" data-longest-streak="${advanced.longestStreakDates.join(',')}"><span class="color-fg-muted d-block text-small">Current / Best Streak</span><strong class="f3-light">${advanced.currentStreak} / ${advanced.longestStreak} days</strong></div>`,
    'gh-best-month': `<div class="stat-card highlightable" id="gh-best-month" data-month-dates="${advanced.bestMonthDates.join(',')}"><span class="color-fg-muted d-block text-small">Best Month (${advanced.bestMonthName})</span><strong class="f3-light">Score: ${advanced.bestMonthStats.score}</strong></div>`,
    'gh-island': `<div class="stat-card highlightable" id="gh-island" data-island="${advanced.biggestIslandDates.join(',')}"><span class="color-fg-muted d-block text-small">Biggest Island (L2+)</span><strong class="f3-light">${advanced.biggestIslandSize} days</strong></div>`,
    'gh-slump-island': `<div class="stat-card highlightable" id="gh-slump-island" data-island="${advanced.biggestSlumpIslandDates.join(',')}"><span class="color-fg-muted d-block text-small">Worst Island (0-1)</span><strong class="f3-light">${advanced.biggestSlumpIslandSize} days</strong></div>`,
    'gh-velocity': `<div class="stat-card" id="gh-velocity"><span class="color-fg-muted d-block text-small">Average Velocity</span><strong class="f3-light">${advanced.velocity} commits/day</strong></div>`,
    'gh-consistency': `<div class="stat-card" id="gh-consistency"><span class="color-fg-muted d-block text-small">Consistency</span><strong class="f3-light">${advanced.consistency}%</strong></div>`,
    'gh-weekend': `<div class="stat-card" id="gh-weekend"><span class="color-fg-muted d-block text-small">Weekend Score</span><strong class="f3-light">${advanced.weekendScore}%</strong></div>`,
    'gh-slump': `<div class="stat-card" id="gh-slump"><span class="color-fg-muted d-block text-small">Longest Slump</span><strong class="f3-light">${advanced.longestSlump} days</strong></div>`,
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

  statsDiv.innerHTML = `<div class="d-flex flex-justify-between flex-items-center mb-3"><div class="d-flex flex-items-center gap-2"><h3 class="h4 mb-0">GitHeat Analytics ${titleSuffix}</h3><span id="gh-persona" class="Label Label--info">${advanced.persona}</span></div><span class="Label Label--secondary">Deep Dive Mode</span></div><div class="git-heat-grid" id="gh-grid-stats">${gridOrder.map(id => itemMap[id] || '').join('')}</div><div class="mt-3 pt-3 border-top color-border-muted d-flex flex-wrap gap-4" id="gh-detailed-stats"><div style="flex: 1; min-width: 200px;" id="gh-active-repos"><span class="color-fg-muted text-small d-block mb-2">Most Active Repos (Commits)</span><div class="d-flex flex-column gap-1">${advanced.topRepos.map((r: any) => `<div class="d-flex flex-justify-between text-small"><span>${r.name}</span></div>`).join('') || '<span class="text-small color-fg-muted">No recent activity found</span>'}</div></div><div style="flex: 1; min-width: 200px;" id="gh-created-repos"><span class="color-fg-muted text-small d-block mb-2">Created Repositories</span><div class="d-flex flex-column gap-1">${advanced.createdRepoList.slice(0, 5).map((r: any) => `<div class="d-flex flex-justify-between text-small"><span>${r.name}</span></div>`).join('') || '<span class="text-small color-fg-muted">No repos created</span>'}</div></div><div style="flex: 1; min-width: 200px;" id="gh-achievements"><span class="color-fg-muted text-small d-block mb-2">Recent Achievements</span><div class="d-flex flex-wrap gap-1">${advanced.achievements.map((a: string) => `<span class="Label Label--secondary" title="${a}">${a}</span>`).join('') || '<span class="text-small color-fg-muted">None found</span>'}</div></div></div><div class="mt-3 pt-3 border-top color-border-muted" id="gh-footer"><div class="d-flex flex-items-center flex-wrap"><span class="color-fg-muted text-small mr-2">Deep Scale: </span><div id="granular-legend" class="d-flex gap-1 mr-3"><div class="square-legend" style="background-color: var(--color-calendar-graph-day-bg)"></div><div class="square-legend level-1"></div><div class="square-legend level-2"></div><div class="square-legend level-3"></div><div class="square-legend level-4"></div><div class="square-legend level-5"></div><div class="square-legend level-6"></div><div class="square-legend level-7"></div><div class="square-legend level-8"></div><div class="square-legend level-9"></div><div class="square-legend level-10"></div><div class="square-legend level-11"></div></div><div class="d-flex flex-items-center flex-wrap gap-2 ml-auto"><span class="color-fg-muted text-small mr-1">Thresholds: </span><span class="badge" style="border: 1px solid var(--color-border-default)">L1: ${thresholds[1]?.min ?? '?'}-${thresholds[1]?.max ?? '?'}</span><span class="badge" style="border: 1px solid var(--color-border-default)">L2: ${thresholds[2]?.min ?? '?'}-${thresholds[2]?.max ?? '?'}</span><span class="badge" style="border: 1px solid var(--color-border-default)">L3: ${thresholds[3]?.min ?? '?'}-${thresholds[3]?.max ?? '?'}</span><span class="badge" style="border: 1px solid var(--color-border-default)">L4: ${thresholds[4]?.min ?? '?'}+</span></div></div></div>`;
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

function extendLegend(thresholds: any) {
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

init();
