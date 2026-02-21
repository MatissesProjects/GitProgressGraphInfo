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

    // 1. Commits / Most Active Repos
    // Example: "Created 290 commits in 5 repositories"
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

    // 2. Created Repositories Section
    // Header: "Created 4 repositories"
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

    // 3. Parse Issues
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

    // 4. Parse Pull Requests (Opened, Merged, Reviewed)
    if (bodyText.includes('pull request')) {
      // 4a. Opened / Proposed
      const proposedMatch = bodyText.match(/(?:Proposed|Opened) (\d+) (?:other )?pull request/i);
      if (proposedMatch) {
        pullRequests += parseInt(proposedMatch[1], 10);
      } else if (bodyText.includes('Opened a pull request') || bodyText.includes('Proposed a pull request')) {
        pullRequests += 1;
      }

      // 4b. Merged
      const mergedMatch = bodyText.match(/Merged (\d+) (?:other )?pull request/i);
      if (mergedMatch) {
        mergedPullRequests += parseInt(mergedMatch[1], 10);
      } else if (bodyText.includes('Merged a pull request')) {
        mergedPullRequests += 1;
      }

      // 4c. Reviewed
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
      // Clean up alt text: "Achievement: Pull Shark" -> "Pull Shark"
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
    
    // Stars and Forks
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
  console.log("GitHeat: Starting to parse contribution graph...");

  const days = document.querySelectorAll('.ContributionCalendar-day');
  const contributionData: ContributionDay[] = [];

  days.forEach((day) => {
    const date = day.getAttribute('data-date');
    const level = parseInt(day.getAttribute('data-level') || '0', 10);
    
    if (date) {
      // Find the contribution count.
      let count = 0;
      
      // Method 1: Check for tool-tip element (Modern GitHub)
      const id = day.getAttribute('id');
      if (id) {
        const tooltip = document.querySelector(`tool-tip[for="${id}"]`);
        if (tooltip) {
          count = parseCountText(tooltip.textContent || "");
        }
      }

      // Method 2: Check aria-label or title as fallback
      if (count === 0 && level > 0) {
        const ariaLabel = day.getAttribute('aria-label');
        const title = day.getAttribute('title');
        count = parseCountText(ariaLabel || title || "");
      }

      // Method 3: Check for sr-only text inside or nearby
      // (Some versions of GitHub have hidden text for screen readers)

      contributionData.push({ date, level, count });
    }
  });

  if (contributionData.length === 0) {
    // console.warn("GitHeat: No contribution data found. Is this a GitHub profile page?");
    return null;
  }

  console.log(`GitHeat: Parsed ${contributionData.length} days.`);
  return contributionData;
}

function parseCountText(text: string): number {
  if (!text) return 0;
  // Matches "12 contributions", "1 contribution", "No contributions"
  if (text.toLowerCase().includes("no contribution")) return 0;
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function calculateThresholds(data: ContributionDay[]) {
  const levels: Record<number, number[]> = {
    1: [],
    2: [],
    3: [],
    4: []
  };

  data.forEach(day => {
    if (day.level > 0 && day.count > 0) {
      levels[day.level].push(day.count);
    }
  });

  const thresholds: Record<number, { min: number; max: number }> = {};

  for (let l = 1; l <= 4; l++) {
    const counts = levels[l].sort((a, b) => a - b);
    if (counts.length > 0) {
      thresholds[l] = {
        min: counts[0],
        max: counts[counts.length - 1]
      };
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
      // Context invalidated
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

  // Recolor main graph days
  days.forEach((day: any) => {
    const date = day.getAttribute('data-date');
    const dayData = data.find(d => d.date === date);
    if (dayData && dayData.count > 0) {
      const level = getGranularLevel(dayData.count);
      const color = colors[level];
      
      // Only apply inline styles if NOT highlighted, 
      // or we handle it via CSS class specificity.
      // To be safe, we'll use setProperty.
      day.style.setProperty('background-color', color, 'important');
      day.style.setProperty('fill', color, 'important');
      
      // Remove the hardcoded outline: none if it's highlighted
      if (day.classList.contains('gh-highlight')) {
        day.style.outline = '';
        day.style.border = '';
      } else {
        day.style.outline = 'none';
        day.style.border = 'none';
      }
    }
  });

  // Recolor the legend squares (Less -> More)
  const footer = document.querySelector('.ContributionCalendar-footer');
  if (footer) {
    const legendSquares = footer.querySelectorAll('.ContributionCalendar-day');
    legendSquares.forEach((sq: any, i) => {
      // Legend usually has 5 squares (0, 1, 2, 3, 4)
      // Map these to our 12-level scale: 0=0, 1=3, 2=6, 3=9, 4=11
      const levelMap = [0, 3, 6, 9, 11];
      const color = colors[levelMap[i]];
      if (color) {
        sq.style.setProperty('background-color', color, 'important');
        sq.style.setProperty('fill', color, 'important');
      }
    });
  }

  // Update injected stats colors
  const statsPanel = document.getElementById('git-heat-stats');
  if (statsPanel) {
    // 1. Color the granular legend bar
    const legendSquares = statsPanel.querySelectorAll('.square-legend');
    legendSquares.forEach((sq: any, i) => {
      const color = colors[i];
      if (color) {
        sq.style.setProperty('background-color', color, 'important');
      }
    });

    // 2. Color the threshold badges
    const badges = statsPanel.querySelectorAll('.badge');
    const badgeLevels = [3, 6, 9, 11]; // L1, L2, L3, L4 mapped to 12-scale
    badges.forEach((badge: any, i) => {
      const color = colors[badgeLevels[i]];
      if (color) {
        badge.style.setProperty('background-color', color, 'important');
      }
    });
  }
}

async function applyVisibility() {
  if (!chrome.runtime?.id) return;
  const settings = await chrome.storage.local.get([
    'showGrid', 'showActiveRepos', 'showCreatedRepos', 'showAchievements', 'showPersona', 'showFooter', 'showLegendNumbers',
    'showTotal', 'showStreak', 'showVelocity', 'showConsistency', 'showWeekend', 'showSlump', 'showBestDay', 'showWorstDay', 'showMostActiveDay', 'showMaxCommits', 'showTodayCount', 'showCurrentWeekday', 'showStars', 'showPR', 'showIssueCreated', 'showLangs', 'showNetwork'
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

  // Granular Grid Toggles
  const toggleMap: Record<string, any> = {
    'gh-total': settings.showTotal,
    'gh-today': settings.showTodayCount,
    'gh-streak': settings.showStreak,
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

  // Toggle legend labels
  document.querySelectorAll('.git-heat-legend-label').forEach((el: any) => {
    el.style.display = (settings.showLegendNumbers !== false) ? 'inline' : 'none';
  });

  // If all detailed sections are hidden, hide the container too
  if (detailed) {
    const anyDetailedVisible = (settings.showActiveRepos !== false) || 
                              (settings.showCreatedRepos !== false) || 
                              (settings.showAchievements !== false);
    detailed.style.display = anyDetailedVisible ? 'flex' : 'none';
  }
}

function calculateAdvancedStats(data: ContributionDay[], pinned: PinnedProject[] = [], timeline: TimelineActivity, achievements: string[] = [], socials: SocialStats) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const todayStr = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const ytdStartStr = `${currentYear}-01-01`;
  
  let currentStreak = 0;
  let currentStreakDates: string[] = [];
  let longestStreak = 0;
  let longestStreakDates: string[] = [];
  let tempStreak = 0;
  let tempStreakDates: string[] = [];
  let activeDays = 0;
  let longestSlump = 0;
  let tempSlump = 0;
  
  // YTD specific metrics
  let ytdWeekendContributions = 0;
  let ytdWeekdayContributions = 0;
  let ytdActiveWeekendDays = 0;
  let ytdTotalWeekendDays = 0;
  let ytdActiveDays = 0;
  let ytdTotalDays = 0;

  const weekdayCounts: Record<number, number> = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };

  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const pastAndPresentData = sortedData.filter(d => d.date <= todayStr);

  pastAndPresentData.forEach(day => {
    const dateObj = new Date(day.date + 'T00:00:00');
    const weekday = dateObj.getDay();
    const isWeekend = (weekday === 0 || weekday === 6);
    const isYTD = day.date >= ytdStartStr;

    if (isYTD) {
      ytdTotalDays++;
      if (isWeekend) ytdTotalWeekendDays++;
    }

    if (day.count > 0) {
      activeDays++;
      tempStreak++;
      tempStreakDates.push(day.date);
      if (tempSlump > longestSlump) longestSlump = tempSlump;
      tempSlump = 0;

      if (isYTD) {
        ytdActiveDays++;
        if (isWeekend) {
          ytdActiveWeekendDays++;
          ytdWeekendContributions += day.count;
        } else {
          ytdWeekdayContributions += day.count;
        }
      }
      
      weekdayCounts[weekday] += day.count;
    } else {
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
        longestStreakDates = [...tempStreakDates];
      }
      tempStreak = 0;
      tempStreakDates = [];
      tempSlump++;
    }
  });
  
  if (tempStreak > longestStreak) {
    longestStreak = tempStreak;
    longestStreakDates = [...tempStreakDates];
  }
  if (tempSlump > longestSlump) longestSlump = tempSlump;
  
  // Calculate current streak
  for (let i = pastAndPresentData.length - 1; i >= 0; i--) {
    const day = pastAndPresentData[i];
    if (day.count > 0) {
      currentStreak++;
      currentStreakDates.unshift(day.date);
    } else if (day.date !== todayStr) {
      break;
    }
  }

  // Calculate Weekend Score (Frequency)
  let weekendScore = 0;
  let weekendVolumeShare = 0;
  let velocity = "0";
  let consistency = "0";
  
  const ytdTotalContributions = ytdWeekendContributions + ytdWeekdayContributions;
  
  if (ytdTotalDays > 0) {
    // We have YTD data (current year)
    weekendScore = ytdTotalWeekendDays > 0 ? Math.round((ytdActiveWeekendDays / ytdTotalWeekendDays) * 100) : 0;
    weekendVolumeShare = ytdTotalContributions > 0 ? (ytdWeekendContributions / ytdTotalContributions) : 0;
    velocity = ytdActiveDays > 0 ? (ytdTotalContributions / ytdActiveDays).toFixed(1) : "0";
    consistency = ((ytdActiveDays / ytdTotalDays) * 100).toFixed(1);
  } else {
    // Fallback to full dataset (e.g. looking at a past year)
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

  // Pinned Data Insights
  const totalStars = pinned.reduce((sum, p) => sum + p.stars, 0);
  const totalForks = pinned.reduce((sum, p) => sum + p.forks, 0);
  const langFreq: Record<string, number> = {};
  pinned.forEach(p => {
    if (p.language !== "Unknown") langFreq[p.language] = (langFreq[p.language] || 0) + 1;
  });
  const topLangs = Object.entries(langFreq).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]);

  // Determine Persona
  let persona = "Consistent Coder";
  if (weekendVolumeShare > 0.4) persona = "Weekend Warrior";
  else if (parseFloat(consistency) < 20) persona = "Burst Developer";
  else if (parseFloat(velocity) > 15) persona = "High-Volume Architect";
  else if (weekendScore > 80) persona = "Unstoppable Force";
  else if (totalStars > 100) persona = "Popular Maintainer";

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  let bestDayIndex = 0;
  let maxWeekdayCount = -1;
  let worstDayIndex = 0;
  let minWeekdayCount = Infinity;

  for (let i = 0; i < 7; i++) {
    if (weekdayCounts[i] > maxWeekdayCount) {
      maxWeekdayCount = weekdayCounts[i];
      bestDayIndex = i;
    }
    if (weekdayCounts[i] < minWeekdayCount) {
      minWeekdayCount = weekdayCounts[i];
      worstDayIndex = i;
    }
  }

  // Find Most Active Day (Specific Date)
  let mostActiveDay = "N/A";
  let mostActiveDayCount = 0;
  let mostActiveDayWeekday = -1;
  pastAndPresentData.forEach(day => {
    if (day.count > mostActiveDayCount) {
      mostActiveDayCount = day.count;
      mostActiveDay = day.date;
      mostActiveDayWeekday = new Date(day.date + 'T00:00:00').getDay();
    }
  });

  // Today's specific metrics
  const todayWeekday = now.getDay();
  const todayCount = data.find(d => d.date === todayStr)?.count || 0;

  // Find Largest Contiguous Island (Level 2, 3 & 4)
  const highActivityDays = data.filter(d => d.level >= 2);
  const dateMap = new Map(data.map(d => [d.date, d]));
  const visited = new Set<string>();
  let biggestIslandDates: string[] = [];

  const getNeighbors = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const neighbors: string[] = [];
    
    // Day before/after (Up/Down in grid)
    const prevDay = new Date(d);
    prevDay.setDate(d.getDate() - 1);
    const nextDay = new Date(d);
    nextDay.setDate(d.getDate() + 1);
    
    // Week before/after (Left/Right in grid)
    const prevWeek = new Date(d);
    prevWeek.setDate(d.getDate() - 7);
    const nextWeek = new Date(d);
    nextWeek.setDate(d.getDate() + 7);

    const format = (date: Date) => date.toISOString().split('T')[0];
    
    [prevDay, nextDay, prevWeek, nextWeek].forEach(n => {
      const s = format(n);
      if (dateMap.has(s) && dateMap.get(s)!.level >= 2) {
        neighbors.push(s);
      }
    });
    return neighbors;
  };

  highActivityDays.forEach(day => {
    if (!visited.has(day.date)) {
      const currentIsland: string[] = [];
      const queue = [day.date];
      visited.add(day.date);

      while (queue.length > 0) {
        const current = queue.shift()!;
        currentIsland.push(current);
        
        getNeighbors(current).forEach(neighbor => {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        });
      }

      if (currentIsland.length > biggestIslandDates.length) {
        biggestIslandDates = currentIsland;
      }
    }
  });

  // Calculate Weekday Averages and Peak Frequency
  const weekdayHighActivityCounts: Record<number, number> = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
  const weekdayTotalDays: Record<number, number> = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };

  pastAndPresentData.forEach(day => {
    const d = new Date(day.date + 'T00:00:00');
    const wd = d.getDay();
    weekdayTotalDays[wd]++;
    if (day.level >= 2) weekdayHighActivityCounts[wd]++;
  });

  let powerDayIndex = 0;
  let maxAvg = -1;
  let peakWeekdayIndex = 0;
  let maxHighFreq = -1;

  for (let i = 0; i < 7; i++) {
    const avg = weekdayTotalDays[i] > 0 ? (weekdayCounts[i] / weekdayTotalDays[i]) : 0;
    if (avg > maxAvg) {
      maxAvg = avg;
      powerDayIndex = i;
    }
    if (weekdayHighActivityCounts[i] > maxHighFreq) {
      maxHighFreq = weekdayHighActivityCounts[i];
      peakWeekdayIndex = i;
    }
  }

  return {
    currentStreak,
    currentStreakDates,
    longestStreak,
    longestStreakDates,
    longestSlump,
    consistency,
    velocity,
    weekendScore,
    persona,
    bestDay: daysOfWeek[bestDayIndex],
    bestDayIndex,
    bestDayCount: maxWeekdayCount,
    worstDay: daysOfWeek[worstDayIndex],
    worstDayIndex,
    worstDayCount: minWeekdayCount,
    currentWeekday: daysOfWeek[todayWeekday],
    currentWeekdayIndex: todayWeekday,
    currentWeekdayCount: weekdayCounts[todayWeekday],
    todayCount,
    mostActiveDay,
    mostActiveDayCount,
    mostActiveDayWeekday,
    powerDay: daysOfWeek[powerDayIndex],
    powerDayIndex,
    powerDayAvg: maxAvg.toFixed(1),
    peakWeekday: daysOfWeek[peakWeekdayIndex],
    peakWeekdayIndex,
    peakWeekdayCount: maxHighFreq,
    biggestIslandSize: biggestIslandDates.length,
    biggestIslandDates,
    activeDays,
    isYTD: ytdTotalDays > 0,
    totalStars,
    totalForks,
    topLangs,
    topRepos: timeline.topRepos.slice(0, 3),
    createdRepos: timeline.createdRepos,
    createdRepoList: timeline.createdRepoList,
    issuesOpened: timeline.issuesOpened,
    pullRequests: timeline.pullRequests,
    pullRequestReviews: timeline.pullRequestReviews,
    mergedPullRequests: timeline.mergedPullRequests,
    achievements: achievements.slice(0, 4),
    socials
  };
}

function init() {
  console.log("GitHeat: Initializing...");
  
  // Helper to check if extension context is still valid
  const isContextValid = () => !!chrome.runtime?.id;

  // Listen for messages from the popup
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
          const ytdStartStr = `${currentYear}-01-01`;
          const ytdData = data.filter(d => d.date >= ytdStartStr);
          if (ytdData.length > 0) {
            total = ytdData.reduce((sum, day) => sum + day.count, 0);
          }
        }
        
        sendResponse({ thresholds, percentiles, total, advanced, success: true });
      } else {
        sendResponse({ success: false, error: "No graph found" });
      }
    }
    return true; // Keep channel open for async
  });

  // Listen for storage changes to update theme instantly
  chrome.storage.onChanged.addListener(async (changes) => {
    if (!isContextValid()) return;
    
    // Handle visibility changes
    const visibilityKeys = [
      'showGrid', 'showActiveRepos', 'showCreatedRepos', 'showAchievements', 
      'showPersona', 'showFooter', 'showLegendNumbers',
      'showTotal', 'showStreak', 'showVelocity', 'showConsistency',
      'showWeekend', 'showSlump', 'showBestDay', 'showWorstDay',
      'showMostActiveDay', 'showTodayCount', 'showCurrentWeekday', 'showMaxCommits',
      'showStars', 'showPR', 'showIssueCreated', 'showLangs', 'showNetwork'
    ];

    if (visibilityKeys.some(key => changes[key])) {
      applyVisibility();
    }

    if (changes.gridOrder) {
      runAnalysis().catch(() => {});
    }

    if (changes.theme || changes.customStart || changes.customStop) {
      const data = parseContributionGraph();
      if (data) {
        const percentiles = calculatePercentiles(data);
        const thresholds = calculateThresholds(data);
        try {
          const settings = await chrome.storage.local.get('theme');
          await applyDeepRecoloring(data, percentiles, (settings.theme as string) || 'green', thresholds);
        } catch (e) {
          // Context might have been invalidated during await
        }
      }
    }
  });

  // Concurrency guard
  let isAnalysisRunning = false;

  // Wait for the graph to load for injection
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
        const thresholds = calculateThresholds(data);
        const percentiles = calculatePercentiles(data);
        
        const settings = await chrome.storage.local.get(['theme', 'gridOrder']);
        const theme = (settings.theme as string) || 'green';
        const gridOrder = (settings.gridOrder as string[]) || null;
        const advanced = calculateAdvancedStats(data, pinned, timeline, achievements, socials);
        
        injectStats(thresholds, data, advanced, gridOrder);
        extendLegend(thresholds);
        await applyDeepRecoloring(data, percentiles, theme, thresholds);
        await applyVisibility();
      }
    } catch (e) {
      console.log("GitHeat: Analysis skipped or failed (likely extension context invalidated)");
    } finally {
      isAnalysisRunning = false;
    }
  };

  const observer = new MutationObserver((mutations) => {
    if (!isContextValid()) {
      observer.disconnect();
      return;
    }
    
    // Check if the graph container was added or updated
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        const graph = document.querySelector('.js-yearly-contributions');
        if (graph) {
          // If our stats panel is missing, it means the year was likely switched
          if (!document.getElementById('git-heat-stats')) {
            console.log("GitHeat: Graph update detected, re-running analysis...");
            runAnalysis().catch(() => {
              // Ignore errors from invalidated context
            });
          }
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial run
  runAnalysis().catch(() => {
    // Ignore errors from invalidated context
  });
}

function injectStats(thresholds: any, data: ContributionDay[], advanced: any, savedOrder: string[] | null = null) {
  const container = document.querySelector('.js-yearly-contributions');
  if (!container) return;

  const existing = document.getElementById('git-heat-stats');
  if (existing) existing.remove();

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentYear = now.getFullYear();
  const ytdStartStr = `${currentYear}-01-01`;
  const ytdData = data.filter(d => d.date >= ytdStartStr);
  const totalContributions = (advanced.isYTD && ytdData.length > 0) 
    ? ytdData.reduce((sum, day) => sum + day.count, 0)
    : data.reduce((sum, day) => sum + day.count, 0);

  const statsDiv = document.createElement('div');
  statsDiv.id = 'git-heat-stats';
  statsDiv.className = 'git-heat-panel border color-border-muted color-bg-subtle rounded-2 p-3 mb-3';
  statsDiv.style.marginTop = '16px';

  const titleSuffix = advanced.isYTD ? '(YTD)' : '(Year)';

  const defaultOrder = [
    'gh-total', 'gh-today', 'gh-streak', 'gh-island', 'gh-velocity', 'gh-consistency', 
    'gh-weekend', 'gh-slump', 'gh-best-day', 'gh-worst-day', 'gh-current-weekday',
    'gh-power-day', 'gh-peak-day',
    'gh-most-active-day', 'gh-max-commits', 'gh-stars', 'gh-pr', 'gh-issue-created',
    'gh-langs', 'gh-network'
  ];

  let gridOrder = savedOrder || defaultOrder;
  // Ensure all current items are present, even if not in saved order
  defaultOrder.forEach(id => {
    if (!gridOrder.includes(id)) gridOrder.push(id);
  });

  const itemMap: Record<string, string> = {
    'gh-total': `
      <div class="stat-card" id="gh-total">
        <span class="color-fg-muted d-block text-small">Total ${titleSuffix}</span>
        <strong class="f3-light">${totalContributions.toLocaleString()}</strong>
      </div>`,
    'gh-today': `
      <div class="stat-card highlightable" id="gh-today" data-date="${todayStr}">
        <span class="color-fg-muted d-block text-small">Today's Contribs</span>
        <strong class="f3-light">${advanced.todayCount}</strong>
      </div>`,
    'gh-streak': `
      <div class="stat-card highlightable" id="gh-streak" 
           data-current-streak="${advanced.currentStreakDates.join(',')}" 
           data-longest-streak="${advanced.longestStreakDates.join(',')}">
        <span class="color-fg-muted d-block text-small">Current / Best Streak</span>
        <strong class="f3-light">${advanced.currentStreak} / ${advanced.longestStreak} days</strong>
      </div>`,
    'gh-island': `
      <div class="stat-card highlightable" id="gh-island" data-island="${advanced.biggestIslandDates.join(',')}">
        <span class="color-fg-muted d-block text-small">Biggest Island (L2+)</span>
        <strong class="f3-light">${advanced.biggestIslandSize} days</strong>
      </div>`,
    'gh-velocity': `
      <div class="stat-card" id="gh-velocity">
        <span class="color-fg-muted d-block text-small">Average Velocity</span>
        <strong class="f3-light">${advanced.velocity} commits/day</strong>
      </div>`,
    'gh-consistency': `
      <div class="stat-card" id="gh-consistency">
        <span class="color-fg-muted d-block text-small">Consistency</span>
        <strong class="f3-light">${advanced.consistency}%</strong>
      </div>`,
    'gh-weekend': `
      <div class="stat-card" id="gh-weekend">
        <span class="color-fg-muted d-block text-small">Weekend Score</span>
        <strong class="f3-light">${advanced.weekendScore}%</strong>
      </div>`,
    'gh-slump': `
      <div class="stat-card" id="gh-slump">
        <span class="color-fg-muted d-block text-small">Longest Slump</span>
        <strong class="f3-light">${advanced.longestSlump} days</strong>
      </div>`,
    'gh-best-day': `
      <div class="stat-card highlightable" id="gh-best-day" data-weekday="${advanced.bestDayIndex}">
        <span class="color-fg-muted d-block text-small">Best Weekday</span>
        <strong class="f3-light">${advanced.bestDay} (${advanced.bestDayCount})</strong>
      </div>`,
    'gh-worst-day': `
      <div class="stat-card highlightable" id="gh-worst-day" data-weekday="${advanced.worstDayIndex}">
        <span class="color-fg-muted d-block text-small">Worst Weekday</span>
        <strong class="f3-light">${advanced.worstDay} (${advanced.worstDayCount})</strong>
      </div>`,
    'gh-current-weekday': `
      <div class="stat-card highlightable" id="gh-current-weekday" data-weekday="${advanced.currentWeekdayIndex}">
        <span class="color-fg-muted d-block text-small">Current Weekday (${advanced.currentWeekday})</span>
        <strong class="f3-light">${advanced.currentWeekdayCount}</strong>
      </div>`,
    'gh-power-day': `
      <div class="stat-card highlightable" id="gh-power-day" data-weekday="${advanced.powerDayIndex}">
        <span class="color-fg-muted d-block text-small">Most Productive (Avg)</span>
        <strong class="f3-light">${advanced.powerDay} (${advanced.powerDayAvg})</strong>
      </div>`,
    'gh-peak-day': `
      <div class="stat-card highlightable" id="gh-peak-day" data-weekday="${advanced.peakWeekdayIndex}">
        <span class="color-fg-muted d-block text-small">Peak Frequency (L2+)</span>
        <strong class="f3-light">${advanced.peakWeekday} (${advanced.peakWeekdayCount})</strong>
      </div>`,
    'gh-most-active-day': `
      <div class="stat-card highlightable" id="gh-most-active-day" data-date="${advanced.mostActiveDay}" data-weekday="${advanced.mostActiveDayWeekday}">
        <span class="color-fg-muted d-block text-small">Most Active Day</span>
        <strong class="f3-light">${advanced.mostActiveDay}</strong>
      </div>`,
    'gh-max-commits': `
      <div class="stat-card highlightable" id="gh-max-commits" data-date="${advanced.mostActiveDay}" data-weekday="${advanced.mostActiveDayWeekday}">
        <span class="color-fg-muted d-block text-small">Max Daily Commits</span>
        <strong class="f3-light">${advanced.mostActiveDayCount}</strong>
      </div>`,
    'gh-stars': `
      <div class="stat-card" id="gh-stars">
        <span class="color-fg-muted d-block text-small">Pinned Stars / Forks</span>
        <strong class="f3-light">${advanced.totalStars} / ${advanced.totalForks}</strong>
      </div>`,
    'gh-pr': `
      <div class="stat-card" id="gh-pr">
        <span class="color-fg-muted d-block text-small">PR Activity (O/M/R)</span>
        <strong class="f3-light">${advanced.pullRequests} / ${advanced.mergedPullRequests} / ${advanced.pullRequestReviews}</strong>
      </div>`,
    'gh-issue-created': `
      <div class="stat-card" id="gh-issue-created">
        <span class="color-fg-muted d-block text-small">Issues / Created Repos</span>
        <strong class="f3-light">${advanced.issuesOpened} / ${advanced.createdRepos}</strong>
      </div>`,
    'gh-langs': `
      <div class="stat-card" id="gh-langs">
        <span class="color-fg-muted d-block text-small">Top Languages</span>
        <strong class="f3-light">${advanced.topLangs.join(', ') || 'N/A'}</strong>
      </div>`,
    'gh-network': `
      <div class="stat-card" id="gh-network">
        <span class="color-fg-muted d-block text-small">Network</span>
        <strong class="f3-light">${advanced.socials.followers} Followers / ${advanced.socials.organizations} Orgs</strong>
      </div>`
  };

  const gridHtml = gridOrder.map(id => itemMap[id] || '').join('');

  statsDiv.innerHTML = `
    <div class="d-flex flex-justify-between flex-items-center mb-3">
      <div class="d-flex flex-items-center gap-2">
        <h3 class="h4 mb-0">GitHeat Analytics ${titleSuffix}</h3>
        <span id="gh-persona" class="Label Label--info">${advanced.persona}</span>
      </div>
      <span class="Label Label--secondary">Deep Dive Mode</span>
    </div>
    
    <div class="git-heat-grid" id="gh-grid-stats">
      ${gridHtml}
    </div>

    <div class="mt-3 pt-3 border-top color-border-muted d-flex flex-wrap gap-4" id="gh-detailed-stats">
      <div style="flex: 1; min-width: 200px;" id="gh-active-repos">
        <span class="color-fg-muted text-small d-block mb-2">Most Active Repos (Commits)</span>
        <div class="d-flex flex-column gap-1">
          ${advanced.topRepos.map((r: any) => `
            <div class="d-flex flex-justify-between text-small">
              <span>${r.name}</span>
            </div>
          `).join('') || '<span class="text-small color-fg-muted">No recent activity found</span>'}
        </div>
      </div>
      <div style="flex: 1; min-width: 200px;" id="gh-created-repos">
        <span class="color-fg-muted text-small d-block mb-2">Created Repositories</span>
        <div class="d-flex flex-column gap-1">
          ${advanced.createdRepoList.slice(0, 5).map((r: any) => `
            <div class="d-flex flex-justify-between text-small">
              <span>${r.name}</span>
            </div>
          `).join('') || '<span class="text-small color-fg-muted">No repos created</span>'}
        </div>
      </div>
      <div style="flex: 1; min-width: 200px;" id="gh-achievements">
        <span class="color-fg-muted text-small d-block mb-2">Recent Achievements</span>
        <div class="d-flex flex-wrap gap-1">
          ${advanced.achievements.map((a: string) => `
            <span class="Label Label--secondary" title="${a}">${a}</span>
          `).join('') || '<span class="text-small color-fg-muted">None found</span>'}
        </div>
      </div>
    </div>

    <div class="mt-3 pt-3 border-top color-border-muted" id="gh-footer">
      <div class="d-flex flex-items-center flex-wrap">
        <span class="color-fg-muted text-small mr-2">Deep Scale: </span>
        <div id="granular-legend" class="d-flex gap-1 mr-3">
          <!-- 12 squares will be injected here -->
          <div class="square-legend" style="background-color: var(--color-calendar-graph-day-bg)"></div>
          <div class="square-legend level-1"></div>
          <div class="square-legend level-2"></div>
          <div class="square-legend level-3"></div>
          <div class="square-legend level-4"></div>
          <div class="square-legend level-5"></div>
          <div class="square-legend level-6"></div>
          <div class="square-legend level-7"></div>
          <div class="square-legend level-8"></div>
          <div class="square-legend level-9"></div>
          <div class="square-legend level-10"></div>
          <div class="square-legend level-11"></div>
        </div>
        <div class="d-flex flex-items-center flex-wrap gap-2 ml-auto">
          <span class="color-fg-muted text-small mr-1">Thresholds: </span>
          <span class="badge" style="border: 1px solid var(--color-border-default)">L1: ${thresholds[1]?.min ?? '?'}-${thresholds[1]?.max ?? '?'}</span>
          <span class="badge" style="border: 1px solid var(--color-border-default)">L2: ${thresholds[2]?.min ?? '?'}-${thresholds[2]?.max ?? '?'}</span>
          <span class="badge" style="border: 1px solid var(--color-border-default)">L3: ${thresholds[3]?.min ?? '?'}-${thresholds[3]?.max ?? '?'}</span>
          <span class="badge" style="border: 1px solid var(--color-border-default)">L4: ${thresholds[4]?.min ?? '?'}+</span>
        </div>
      </div>
    </div>
  `;

  container.prepend(statsDiv);

  // Add Highlight Logic
  const highlightDates = (dates: string[], className: string = 'gh-highlight') => {
    dates.forEach(date => {
      const dayEl = (document.querySelector(`.ContributionCalendar-day[data-date="${date}"]`) as HTMLElement);
      if (dayEl) {
        dayEl.classList.add(className);
        dayEl.style.outline = '';
        dayEl.style.border = '';
      }
    });
  };

  const highlightWeekday = (weekdayIndex: number, startDate?: string, endDate?: string) => {
    const days = document.querySelectorAll('.ContributionCalendar-day[data-date]');
    days.forEach((day: any) => {
      const date = day.getAttribute('data-date');
      if (!date) return;
      if (startDate && date < startDate) return;
      if (endDate && date > endDate) return;

      const d = new Date(date + 'T00:00:00');
      if (d.getDay() === weekdayIndex) {
        day.classList.add('gh-highlight');
        day.style.outline = '';
        day.style.border = '';
      }
    });
  };

  const clearHighlights = () => {
    document.querySelectorAll('.gh-highlight, .gh-highlight-special').forEach((el: any) => {
      el.classList.remove('gh-highlight', 'gh-highlight-special');
      // If it's a contribution day with count > 0, restore the outline: none
      const level = parseInt(el.getAttribute('data-level') || '0', 10);
      if (level > 0) {
        el.style.outline = 'none';
        el.style.border = 'none';
      }
    });
  };

  const todayCard = statsDiv.querySelector('#gh-today');
  if (todayCard) {
    todayCard.addEventListener('mouseenter', () => {
      todayCard.classList.add('highlighting');
      highlightDates([todayStr]);
    });
    todayCard.addEventListener('mouseleave', () => {
      todayCard.classList.remove('highlighting');
      clearHighlights();
    });
  }

  const streakCard = statsDiv.querySelector('#gh-streak');
  if (streakCard) {
    streakCard.addEventListener('mouseenter', () => {
      streakCard.classList.add('highlighting');
      const longest = (streakCard as HTMLElement).dataset.longestStreak?.split(',') || [];
      const current = (streakCard as HTMLElement).dataset.currentStreak?.split(',') || [];
      highlightDates([...new Set([...longest, ...current])]);
    });
    streakCard.addEventListener('mouseleave', () => {
      streakCard.classList.remove('highlighting');
      clearHighlights();
    });
  }

  const islandCard = statsDiv.querySelector('#gh-island');
  if (islandCard) {
    islandCard.addEventListener('mouseenter', () => {
      islandCard.classList.add('highlighting');
      const dates = (islandCard as HTMLElement).dataset.island?.split(',') || [];
      highlightDates(dates, 'gh-highlight-special');
    });
    islandCard.addEventListener('mouseleave', () => {
      islandCard.classList.remove('highlighting');
      clearHighlights();
    });
  }

  const bestDayCard = statsDiv.querySelector('#gh-best-day');
  if (bestDayCard) {
    bestDayCard.addEventListener('mouseenter', () => {
      bestDayCard.classList.add('highlighting');
      const idx = parseInt((bestDayCard as HTMLElement).dataset.weekday || '0', 10);
      highlightWeekday(idx, advanced.isYTD ? ytdStartStr : undefined, todayStr);
    });
    bestDayCard.addEventListener('mouseleave', () => {
      bestDayCard.classList.remove('highlighting');
      clearHighlights();
    });
  }

  const worstDayCard = statsDiv.querySelector('#gh-worst-day');
  if (worstDayCard) {
    worstDayCard.addEventListener('mouseenter', () => {
      worstDayCard.classList.add('highlighting');
      const idx = parseInt((worstDayCard as HTMLElement).dataset.weekday || '0', 10);
      highlightWeekday(idx, advanced.isYTD ? ytdStartStr : undefined, todayStr);
    });
    worstDayCard.addEventListener('mouseleave', () => {
      worstDayCard.classList.remove('highlighting');
      clearHighlights();
    });
  }

  const currentWeekdayCard = statsDiv.querySelector('#gh-current-weekday');
  if (currentWeekdayCard) {
    currentWeekdayCard.addEventListener('mouseenter', () => {
      currentWeekdayCard.classList.add('highlighting');
      const idx = parseInt((currentWeekdayCard as HTMLElement).dataset.weekday || '0', 10);
      highlightWeekday(idx, advanced.isYTD ? ytdStartStr : undefined, todayStr);
    });
    currentWeekdayCard.addEventListener('mouseleave', () => {
      currentWeekdayCard.classList.remove('highlighting');
      clearHighlights();
    });
  }

  const powerDayCard = statsDiv.querySelector('#gh-power-day');
  if (powerDayCard) {
    powerDayCard.addEventListener('mouseenter', () => {
      powerDayCard.classList.add('highlighting');
      const idx = parseInt((powerDayCard as HTMLElement).dataset.weekday || '0', 10);
      highlightWeekday(idx, advanced.isYTD ? ytdStartStr : undefined, todayStr);
    });
    powerDayCard.addEventListener('mouseleave', () => {
      powerDayCard.classList.remove('highlighting');
      clearHighlights();
    });
  }

  const peakDayCard = statsDiv.querySelector('#gh-peak-day');
  if (peakDayCard) {
    peakDayCard.addEventListener('mouseenter', () => {
      peakDayCard.classList.add('highlighting');
      const idx = parseInt((peakDayCard as HTMLElement).dataset.weekday || '0', 10);
      highlightWeekday(idx, advanced.isYTD ? ytdStartStr : undefined, todayStr);
    });
    peakDayCard.addEventListener('mouseleave', () => {
      peakDayCard.classList.remove('highlighting');
      clearHighlights();
    });
  }

  const mostActiveDayCard = statsDiv.querySelector('#gh-most-active-day');
  if (mostActiveDayCard) {
    mostActiveDayCard.addEventListener('mouseenter', () => {
      mostActiveDayCard.classList.add('highlighting');
      const date = (mostActiveDayCard as HTMLElement).dataset.date;
      if (date) highlightDates([date], 'gh-highlight-special');
    });
    mostActiveDayCard.addEventListener('mouseleave', () => {
      mostActiveDayCard.classList.remove('highlighting');
      clearHighlights();
    });
  }

  const maxCommitsCard = statsDiv.querySelector('#gh-max-commits');
  if (maxCommitsCard) {
    maxCommitsCard.addEventListener('mouseenter', () => {
      maxCommitsCard.classList.add('highlighting');
      const date = (maxCommitsCard as HTMLElement).dataset.date;
      if (date) highlightDates([date], 'gh-highlight-special');
    });
    maxCommitsCard.addEventListener('mouseleave', () => {
      maxCommitsCard.classList.remove('highlighting');
      clearHighlights();
    });
  }
}

function extendLegend(thresholds: any) {
  // GitHub legend is usually at the bottom of the graph
  const legend = document.querySelector('.ContributionCalendar-footer');
  if (!legend) return;

  // Clear existing GitHeat labels
  legend.querySelectorAll('.git-heat-legend-label').forEach(el => el.remove());

  const squares = legend.querySelectorAll('.ContributionCalendar-day');
  squares.forEach(square => {
    const level = parseInt(square.getAttribute('data-level') || '0', 10);
    if (level > 0 && thresholds[level]) {
      const range = level === 4 ? `${thresholds[level].min}+` : `${thresholds[level].min}-${thresholds[level].max}`;
      const span = document.createElement('span');
      span.className = 'text-small color-fg-muted ml-1 git-heat-legend-label';
      span.style.fontSize = '10px';
      span.style.marginLeft = '2px';
      span.style.marginRight = '4px';
      span.textContent = range;
      square.after(span);
    }
  });
}

init();
