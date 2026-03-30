import { ContributionDay, PinnedProject, TimelineActivity, SocialStats, AdvancedStats, StatScore, TooltipStat, YearlyStats, BattleStats, CustomAvatarSettings } from '../types';
import { calculateRPGStats, getPersona, calculateBattleStats } from './rpg';
import { parseAvailableYears, parseContributionGraph } from './scraper';

export async function fetchYearData(year: number): Promise<ContributionDay[] | null> {
  const url = `${window.location.origin}${window.location.pathname}?tab=overview&from=${year}-01-01&to=${year}-12-31`;
  try {
    const resp = await fetch(url);
    const html = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return parseContributionGraph(doc);
  } catch (e) {
    console.error(`GitHeat: Failed to fetch data for ${year}`, e);
    return null;
  }
}

export async function calculateYearlyStats(year: number, data: ContributionDay[], pinned: PinnedProject[], timeline: TimelineActivity, achievements: string[], socials: SocialStats, customAvatarSettings?: any): Promise<YearlyStats> {
  const thresholds = calculateThresholds(data);
  const percentiles = calculatePercentiles(data);
  const advanced = await calculateAdvancedStats(data, pinned, timeline, achievements, socials, true, percentiles, customAvatarSettings);
  const total = data.reduce((sum, d) => sum + d.count, 0);
  
  return { year, total, thresholds, percentiles, advanced };
}

export async function compareYears(pinned: PinnedProject[], timeline: TimelineActivity, achievements: string[], socials: SocialStats, customAvatarSettings?: any): Promise<YearlyStats[]> {
  const years = parseAvailableYears();
  const results: YearlyStats[] = [];
  
  // We'll fetch up to the last 5 years to keep it fast
  const targetYears = years.slice(0, 5);
  
  for (const year of targetYears) {
    const data = await fetchYearData(year);
    if (data) {
      const stats = await calculateYearlyStats(year, data, pinned, timeline, achievements, socials, customAvatarSettings);
      results.push(stats);
    }
  }
  
  return results;
}

export function calculateThresholds(data: ContributionDay[]) {
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

export function calculatePercentiles(data: ContributionDay[]) {
  const counts = data.filter(d => d.count > 0).map(d => d.count).sort((a, b) => a - b);
  if (counts.length === 0) return {};

  const markers = [10, 20, 30, 40, 50, 60, 70, 75, 80, 85, 90, 95, 98, 99];
  const percentiles: Record<number, number> = {};
  
  markers.forEach(m => {
    const index = Math.floor((m / 100) * counts.length);
    percentiles[m] = counts[Math.min(index, counts.length - 1)];
  });

  let last = 1;
  markers.forEach(m => {
    if (percentiles[m] <= last) {
      percentiles[m] = last + 1;
    }
    last = percentiles[m];
  });

  return percentiles;
}

export function findIsland(targetData: ContributionDay[], thresholdFn: (d: ContributionDay) => boolean, dateMap: Map<string, ContributionDay>, periodEndStr: string, wrapAround: boolean = true) {
  const visited = new Set<string>();
  let biggest: string[] = [];
  
  const offsets = wrapAround ? [-1, 1, -7, 7] : [-1, 1];

  targetData.filter(thresholdFn).forEach(day => {
    if (!visited.has(day.date)) {
      const current: string[] = [], queue = [day.date];
      visited.add(day.date);
      while (queue.length > 0) {
        const curr = queue.shift()!;
        current.push(curr);
        const d = new Date(curr + 'T00:00:00');
        offsets.forEach(diff => {
          const n = new Date(d); n.setDate(d.getDate() + diff);
          const s = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
          const node = dateMap.get(s);
          if (node && node.date <= periodEndStr && thresholdFn(node) && !visited.has(s)) {
            visited.add(s);
            queue.push(s);
          }
        });
      }
      if (current.length > biggest.length) biggest = current;
    }
  });
  return biggest;
}

export async function calculateAdvancedStats(
  data: ContributionDay[], 
  pinned: PinnedProject[] = [], 
  timeline: TimelineActivity, 
  achievements: string[] = [], 
  socials: SocialStats, 
  wrapAround: boolean = true, 
  percentiles?: Record<number, number>,
  customAvatarSettings?: CustomAvatarSettings
): Promise<AdvancedStats> {
  const now = new Date();
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
  
  const lastDayInData = sortedData[sortedData.length - 1];
  const yearFromData = new Date(lastDayInData.date + 'T00:00:00').getFullYear();
  const isCurrentYear = yearFromData === now.getFullYear();
  
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const periodEndStr = isCurrentYear ? todayStr : lastDayInData.date;
  const ytdStartStr = `${yearFromData}-01-01`;
  
  const pastAndPresentData = sortedData.filter(d => d.date <= periodEndStr);
  const dateMap = new Map(data.map(d => [d.date, d]));

  const p = percentiles && Object.keys(percentiles).length > 0 ? percentiles : calculatePercentiles(pastAndPresentData);
  const pMarkers = [10, 20, 30, 40, 50, 60, 70, 75, 80, 85, 90, 95, 98, 99];
  
  const getLevel = (count: number) => {
    if (count <= 0) return 0;
    if (count === 1) return 1;
    for (let i = pMarkers.length - 1; i >= 0; i--) {
      const m = pMarkers[i];
      if (count >= (p[m] || 999)) return i + 2;
    }
    return 1;
  };

  const ytdDays = pastAndPresentData.filter(d => d.date >= ytdStartStr);
  const pulseHash = ytdDays.map(d => getLevel(d.count).toString(16).toUpperCase()).reverse().join('');

  const base = calculateBaseStats(pastAndPresentData, ytdStartStr, periodEndStr);
  
  const ytdTotalContributions = base.ytdWeekendContributions + base.ytdWeekdayContributions;
  let weekendScore = "0", velocity = "0", consistency = "0", weekendVolumeShare = 0;
  
  if (base.ytdTotalDays > 0) {
    weekendScore = base.ytdTotalWeekendDays > 0 ? Math.round((base.ytdActiveWeekendDays / base.ytdTotalWeekendDays) * 100).toString() : "0";
    velocity = base.ytdActiveDays > 0 ? (ytdTotalContributions / base.ytdActiveDays).toFixed(1) : "0";
    consistency = ((base.ytdActiveDays / base.ytdTotalDays) * 100).toFixed(1);
    weekendVolumeShare = ytdTotalContributions > 0 ? (base.ytdWeekendContributions / ytdTotalContributions) : 0;
  } else {
    const totalVol = pastAndPresentData.reduce((sum, d) => sum + d.count, 0);
    const activeDaysCount = pastAndPresentData.filter(d => d.count > 0).length;
    const weekendDaysData = pastAndPresentData.filter(d => {
      const day = new Date(d.date + 'T00:00:00').getDay();
      return day === 0 || day === 6;
    });
    const activeWeekendDaysCount = weekendDaysData.filter(d => d.count > 0).length;
    weekendScore = weekendDaysData.length > 0 ? Math.round((activeWeekendDaysCount / weekendDaysData.length) * 100).toString() : "0";
    velocity = activeDaysCount > 0 ? (totalVol / activeDaysCount).toFixed(1) : "0";
    consistency = ((activeDaysCount / pastAndPresentData.length) * 100).toFixed(1);
    const totalWeekendVol = weekendDaysData.reduce((sum, d) => sum + d.count, 0);
    weekendVolumeShare = totalVol > 0 ? (totalWeekendVol / totalVol) : 0;
  }

  const totalStars = pinned.reduce((sum, p) => sum + p.stars, 0);
  const totalForks = pinned.reduce((sum, p) => sum + p.forks, 0);
  const langFreq: Record<string, number> = {};
  pinned.forEach(p => { if (p.language !== "Unknown") langFreq[p.language] = (langFreq[p.language] || 0) + 1; });
  const topLangs = Object.entries(langFreq).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]);

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let bestDayIndex = 0, maxWeekdayCount = -1, worstDayIndex = 0, minWeekdayCount = Infinity;
  for (let i = 0; i < 7; i++) {
    if (base.weekdayCounts[i] > maxWeekdayCount) { maxWeekdayCount = base.weekdayCounts[i]; bestDayIndex = i; }
    if (base.weekdayCounts[i] < minWeekdayCount) { minWeekdayCount = base.weekdayCounts[i]; worstDayIndex = i; }
  }

  let mostActiveDay = "N/A", mostActiveDayCount = 0, mostActiveDayWeekday = -1;
  pastAndPresentData.forEach(day => {
    if (day.count > mostActiveDayCount) {
      mostActiveDayCount = day.count; mostActiveDay = day.date;
      mostActiveDayWeekday = new Date(day.date + 'T00:00:00').getDay();
    }
  });

  const timeBased = calculateTimeBasedStats(pastAndPresentData);
  const todayCount = data.find(d => d.date === todayStr)?.count || 0;
  const avgVel = parseFloat(velocity);

  const biggestIslandDates = findIsland(pastAndPresentData, d => d.level >= 2, dateMap, periodEndStr, wrapAround);
  const biggestSlumpIslandDates = findIsland(pastAndPresentData, d => d.count <= 1, dateMap, periodEndStr, wrapAround);
  const biggestAboveAvgIslandDates = findIsland(pastAndPresentData, d => d.count >= avgVel && d.count > 0, dateMap, periodEndStr, wrapAround);

  const weekdayHighActivityCounts: Record<number, number> = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
  const weekdayTotalDays: Record<number, number> = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
  pastAndPresentData.forEach(day => {
    if (day.date >= ytdStartStr && day.date <= periodEndStr) {
      const wd = new Date(day.date + 'T00:00:00').getDay();
      weekdayTotalDays[wd]++;
      if (day.level >= 2) weekdayHighActivityCounts[wd]++;
    }
  });

  let powerDayIndex = 0, maxAvg = -1, peakWeekdayIndex = 0, maxHighFreq = -1;
  for (let i = 0; i < 7; i++) {
    const avg = weekdayTotalDays[i] > 0 ? (base.weekdayCounts[i] / weekdayTotalDays[i]) : 0;
    if (avg > maxAvg) { maxAvg = avg; powerDayIndex = i; }
    if (weekdayHighActivityCounts[i] > maxHighFreq) { maxHighFreq = weekdayHighActivityCounts[i]; peakWeekdayIndex = i; }
  }

  // Velocity & Acceleration
  const sorted = [...pastAndPresentData].sort((a, b) => b.date.localeCompare(a.date));
  let velocityTrend = 0, velocityIcon = '';
  let acceleration = 0, accelerationIcon = '';
  const overallVel = parseFloat(velocity);
  
  if (sorted.length >= 14 && overallVel > 0) {
    const recent7 = sorted.slice(0, 7);
    const prev7 = sorted.slice(7, 14);
    const rAct = recent7.filter(d => d.count > 0);
    const rVel = rAct.length > 0 ? recent7.reduce((s, d) => s + d.count, 0) / rAct.length : 0;
    const pAct = prev7.filter(d => d.count > 0);
    const pVel = pAct.length > 0 ? prev7.reduce((s, d) => s + d.count, 0) / pAct.length : 0;
    velocityTrend = Math.round(((rVel - overallVel) / overallVel) * 100);
    velocityIcon = velocityTrend > 0 ? '▲' : (velocityTrend < 0 ? '▼' : '');
    if (pVel > 0) {
      acceleration = Math.round(((rVel - pVel) / pVel) * 100);
      accelerationIcon = acceleration > 0 ? '▲' : (acceleration < 0 ? '▼' : '');
    } else if (rVel > 0) {
      acceleration = 100; accelerationIcon = '▲';
    }
  } else if (sorted.length >= 7 && overallVel > 0) {
    const cw = sorted.slice(0, 7);
    const cAct = cw.filter(d => d.count > 0);
    const cVel = cAct.length > 0 ? cw.reduce((s, d) => s + d.count, 0) / cAct.length : 0;
    velocityTrend = Math.round(((cVel - overallVel) / overallVel) * 100);
    velocityIcon = velocityTrend > 0 ? '▲' : (velocityTrend < 0 ? '▼' : '');
  }

  const targetDaysForVelocity = base.ytdTotalDays > 0 ? pastAndPresentData.filter(d => d.date >= ytdStartStr) : pastAndPresentData;
  const aboveVelocityDates = targetDaysForVelocity.filter(d => d.count >= avgVel && d.count > 0).map(d => d.date);
  const belowVelocityDates = targetDaysForVelocity.filter(d => d.count > 0 && d.count < avgVel).map(d => d.date);

  const currentWeekdayIdx = isCurrentYear ? now.getDay() : -1;
  let currentWeekdayTrend = 0, currentWeekdayIcon = '', currentWeekdayAvgVal = 0;
  if (currentWeekdayIdx >= 0) {
    currentWeekdayAvgVal = weekdayTotalDays[currentWeekdayIdx] > 0 ? (base.weekdayCounts[currentWeekdayIdx] / weekdayTotalDays[currentWeekdayIdx]) : 0;
    if (currentWeekdayAvgVal > 0) {
      currentWeekdayTrend = Math.round(((todayCount - currentWeekdayAvgVal) / currentWeekdayAvgVal) * 100);
      currentWeekdayIcon = currentWeekdayTrend > 0 ? '▲' : (currentWeekdayTrend < 0 ? '▼' : '');
    } else if (todayCount > 0) {
      currentWeekdayTrend = 100; currentWeekdayIcon = '▲';
    }
  }

  const bestWeekdayAvgVal = weekdayTotalDays[bestDayIndex] > 0 ? (base.weekdayCounts[bestDayIndex] / weekdayTotalDays[bestDayIndex]) : 0;
  const worstWeekdayAvgVal = weekdayTotalDays[worstDayIndex] > 0 ? (base.weekdayCounts[worstDayIndex] / weekdayTotalDays[worstDayIndex]) : 0;

  const totalCommits = Object.values(base.weekdayCounts).reduce((a, b) => a + b, 0);
  const overallWeekdayAvg = totalCommits / 7;
  let bestWeekdayTrend = 0, bestWeekdayIcon = '';
  if (overallWeekdayAvg > 0) {
    bestWeekdayTrend = Math.round(((maxWeekdayCount - overallWeekdayAvg) / overallWeekdayAvg) * 100);
    bestWeekdayIcon = bestWeekdayTrend > 0 ? '▲' : (bestWeekdayTrend < 0 ? '▼' : '');
  }

  const statsForTooltips: { velocity: TooltipStat; consistency: TooltipStat; weekend: TooltipStat } = {
    consistency: { count: base.ytdActiveDays, active: base.ytdActiveDays, total: (base.ytdTotalDays > 0 ? base.ytdTotalDays : pastAndPresentData.length) },
    velocity: { count: ytdTotalContributions, active: base.ytdActiveDays, total: (base.ytdTotalDays > 0 ? base.ytdTotalDays : pastAndPresentData.length) },
    weekend: { count: base.ytdWeekendContributions, active: base.ytdActiveWeekendDays, total: base.ytdTotalWeekendDays }
  };

  const rpg = await calculateRPGStats(pastAndPresentData, timeline, todayCount, base.currentStreak, velocity, totalStars, socials, pinned, base.longestStreak, customAvatarSettings);
  const persona = getPersona(weekendVolumeShare, consistency, velocity, parseInt(weekendScore), totalStars);
  const battleStats = calculateBattleStats(rpg.level, velocity, consistency, totalStars);

  const advanced: AdvancedStats = {
    ...base, ...timeBased, ...rpg,
    isYTD: true, targetYear: yearFromData, total: ytdTotalContributions,
    weekendScore, velocity, consistency, persona,
    bestDay: daysOfWeek[bestDayIndex], bestDayIndex, bestDayCount: maxWeekdayCount, bestWeekdayAvg: bestWeekdayAvgVal.toFixed(1),
    worstDay: daysOfWeek[worstDayIndex], worstDayIndex, worstDayCount: minWeekdayCount, worstWeekdayAvg: worstWeekdayAvgVal.toFixed(1),
    currentWeekday: daysOfWeek[isCurrentYear ? now.getDay() : 0], currentWeekdayIndex: isCurrentYear ? now.getDay() : 0, currentWeekdayCount: todayCount,
    currentWeekdayAvg: currentWeekdayAvgVal.toFixed(1),
    todayCount, mostActiveDay, mostActiveDayCount, mostActiveDayWeekday,
    powerDay: daysOfWeek[powerDayIndex], powerDayIndex, powerDayAvg: maxAvg.toFixed(1),
    peakWeekday: daysOfWeek[peakWeekdayIndex], peakWeekdayIndex, peakWeekdayCount: maxHighFreq,
    biggestIslandSize: biggestIslandDates.length, biggestIslandDates,
    biggestSlumpIslandSize: biggestSlumpIslandDates.length, biggestSlumpIslandDates,
    biggestAboveAvgIslandSize: biggestAboveAvgIslandDates.length, biggestAboveAvgIslandDates,
    aboveVelocityDates, belowVelocityDates,
    statsForTooltips,
    velocityTrend, velocityIcon, acceleration, accelerationIcon,
    currentWeekdayTrend, currentWeekdayIcon, bestWeekdayTrend, bestWeekdayIcon,
    totalStars, totalForks, topLangs,
    topRepos: timeline.topRepos.slice(0, 3), createdRepos: timeline.createdRepos, createdRepoList: timeline.createdRepoList,
    issuesOpened: timeline.issuesOpened, pullRequests: timeline.pullRequests, pullRequestReviews: timeline.pullRequestReviews, mergedPullRequests: timeline.mergedPullRequests,
    achievements: achievements.slice(0, 4), socials,
    pulseHash, ytdDailyCounts: ytdDays.map(d => ({ date: d.date, count: d.count })),
    skills: [], // Placeholder for now
    battleStats
  };

  return advanced;
}

export function calculateBaseStats(pastAndPresentData: ContributionDay[], ytdStartStr: string, periodEndStr: string) {
  let activeDays = 0, ytdTotalDays = 0, ytdTotalWeekendDays = 0, ytdActiveDays = 0, ytdActiveWeekendDays = 0;
  let ytdWeekendContributions = 0, ytdWeekdayContributions = 0;
  const weekdayCounts: Record<number, number> = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
  
  let currentStreak = 0, currentStreakDates: string[] = [];
  let longestStreak = 0, longestStreakDates: string[] = [], tempStreak = 0, tempStreakDates: string[] = [];
  let longestSlump = 0, longestSlumpDates: string[] = [], tempSlump = 0, tempSlumpDates: string[] = [];

  pastAndPresentData.forEach(day => {
    const dateObj = new Date(day.date + 'T00:00:00');
    const weekday = dateObj.getDay();
    const isWeekend = (weekday === 0 || weekday === 6);
    const isYTD = day.date >= ytdStartStr && day.date <= periodEndStr;

    if (isYTD) { ytdTotalDays++; if (isWeekend) ytdTotalWeekendDays++; }

    if (day.count > 0) {
      activeDays++; tempStreak++; tempStreakDates.push(day.date);
      if (tempSlump > longestSlump) {
        longestSlump = tempSlump;
        longestSlumpDates = [...tempSlumpDates];
      }
      tempSlump = 0;
      tempSlumpDates = [];
      if (isYTD) {
        ytdActiveDays++;
        if (isWeekend) { ytdActiveWeekendDays++; ytdWeekendContributions += day.count; }
        else { ytdWeekdayContributions += day.count; }
        weekdayCounts[weekday] += day.count;
      }
    } else {
      if (tempStreak > longestStreak) { longestStreak = tempStreak; longestStreakDates = [...tempStreakDates]; }
      tempStreak = 0; tempStreakDates = []; 
      tempSlump++;
      tempSlumpDates.push(day.date);
    }
  });

  if (tempStreak > longestStreak) { longestStreak = tempStreak; longestStreakDates = [...tempStreakDates]; }
  if (tempSlump > longestSlump) { longestSlump = tempSlump; longestSlumpDates = [...tempSlumpDates]; }

  for (let i = pastAndPresentData.length - 1; i >= 0; i--) {
    const day = pastAndPresentData[i];
    if (day.count > 0) { currentStreak++; currentStreakDates.unshift(day.date); }
    else if (day.date !== periodEndStr) break;
  }

  return {
    activeDays, ytdTotalDays, ytdTotalWeekendDays, ytdActiveDays, ytdActiveWeekendDays,
    ytdWeekendContributions, ytdWeekdayContributions, weekdayCounts,
    currentStreak, currentStreakDates, longestStreak, longestStreakDates, longestSlump, longestSlumpDates
  };
}

export function calculateTimeBasedStats(pastAndPresentData: ContributionDay[]) {
  const monthData: Record<string, { count: number; activeDays: number; totalDays: number; maxStreak: number; tempStreak: number; dates: string[] }> = {};
  pastAndPresentData.forEach(day => {
    const monthKey = day.date.substring(0, 7);
    if (!monthData[monthKey]) monthData[monthKey] = { count: 0, activeDays: 0, totalDays: 0, maxStreak: 0, tempStreak: 0, dates: [] };
    const m = monthData[monthKey];
    m.totalDays++; m.dates.push(day.date);
    if (day.count > 0) {
      m.count += day.count; m.activeDays++; m.tempStreak++;
      if (m.tempStreak > m.maxStreak) m.maxStreak = m.tempStreak;
    } else m.tempStreak = 0;
  });

  let bestMonthName = "N/A", bestMonthScore = -1, bestMonthDates: string[] = [], bestMonthStats: StatScore = { score: 0, count: 0, consistency: "0", streak: 0 };
  let worstMonthName = "N/A", worstMonthScore = Infinity, worstMonthDates: string[] = [], worstMonthStats: StatScore = { score: 0, count: 0, consistency: "0", streak: 0 };
  const allMonthScores: number[] = [];
  
  const monthEntries = Object.entries(monthData);
  monthEntries.forEach(([month, data]) => {
    const consistency = data.activeDays / data.totalDays;
    const score = Math.round(data.count * consistency * (data.maxStreak || 1));
    if (score > 0) allMonthScores.push(score);
    
    if (score > bestMonthScore) {
      bestMonthScore = score;
      bestMonthName = new Date(month + '-01T00:00:00').toLocaleString('default', { month: 'long', year: 'numeric' });
      bestMonthDates = data.dates;
      bestMonthStats = { score, count: data.count, consistency: (consistency * 100).toFixed(1), streak: data.maxStreak };
    }
    if (score < worstMonthScore && score >= 0) { worstMonthScore = score; }
  });

  const worstMonths = monthEntries.filter(([month, data]) => {
    const consistency = data.activeDays / data.totalDays;
    const score = Math.round(data.count * consistency * (data.maxStreak || 1));
    return score === worstMonthScore;
  });

  if (worstMonths.length > 0) {
    if (worstMonths.length === 1) {
      const [month, data] = worstMonths[0];
      worstMonthName = new Date(month + '-01T00:00:00').toLocaleString('default', { month: 'long', year: 'numeric' });
      worstMonthDates = data.dates;
      const consistency = data.activeDays / data.totalDays;
      worstMonthStats = { score: worstMonthScore, count: data.count, consistency: (consistency * 100).toFixed(1), streak: data.maxStreak };
    } else {
      worstMonthName = `${worstMonths.length} Months`;
      worstMonthDates = worstMonths.flatMap(([_, data]) => data.dates);
      worstMonthStats = { score: worstMonthScore, count: 0, consistency: "0", streak: 0 };
    }
  }

  const avgMonthScore = allMonthScores.length > 0 ? allMonthScores.reduce((a, b) => a + b, 0) / allMonthScores.length : 0;
  let bestMonthTrend = 0, bestMonthIcon = '';
  if (avgMonthScore > 0) {
    bestMonthTrend = Math.round(((bestMonthScore - avgMonthScore) / avgMonthScore) * 100);
    bestMonthIcon = bestMonthTrend > 0 ? '▲' : (bestMonthTrend < 0 ? '▼' : '');
  }
  let worstMonthTrend = 0, worstMonthIcon = '';
  if (avgMonthScore > 0) {
    worstMonthTrend = Math.round(((worstMonthStats.score - avgMonthScore) / avgMonthScore) * 100);
    worstMonthIcon = worstMonthTrend > 0 ? '▲' : (worstMonthTrend < 0 ? '▼' : '');
  }

  const weekData: Record<string, { count: number; activeDays: number; maxStreak: number; tempStreak: number; dates: string[]; dayCounts: Record<number, number> }> = {};
  pastAndPresentData.forEach(day => {
    const date = new Date(day.date + 'T00:00:00');
    const dayOfWeek = date.getDay();
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - dayOfWeek);
    const weekKey = sunday.toISOString().split('T')[0];
    if (!weekData[weekKey]) weekData[weekKey] = { count: 0, activeDays: 0, maxStreak: 0, tempStreak: 0, dates: [], dayCounts: {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0} };
    const w = weekData[weekKey];
    w.dates.push(day.date);
    w.dayCounts[dayOfWeek] += day.count;
    if (day.count > 0) {
      w.count += day.count; w.activeDays++; w.tempStreak++;
      if (w.tempStreak > w.maxStreak) w.maxStreak = w.tempStreak;
    } else w.tempStreak = 0;
  });

  const weeklyWinners: number[] = [];
  Object.values(weekData).forEach((w) => {
    let max = -1, winner = -1;
    for (let i = 0; i < 7; i++) { if (w.dayCounts[i] > max) { max = w.dayCounts[i]; winner = i; } }
    if (max > 0) weeklyWinners.push(winner);
  });

  const winnerCounts: Record<number, number> = {};
  weeklyWinners.forEach(w => winnerCounts[w] = (winnerCounts[w] || 0) + 1);
  let dominantWeekdayIndex = -1, maxWins = 0;
  Object.entries(winnerCounts).forEach(([idx, wins]) => { if (wins > maxWins) { maxWins = wins; dominantWeekdayIndex = parseInt(idx); } });
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dominantWeekday = dominantWeekdayIndex >= 0 ? daysOfWeek[dominantWeekdayIndex] : "N/A";

  let bestWeekName = "N/A", bestWeekScore = -1, bestWeekDates: string[] = [], bestWeekStats: StatScore = { score: 0, count: 0, consistency: "0", streak: 0 };
  let worstWeekName = "N/A", worstWeekScore = Infinity, worstWeekDates: string[] = [], worstWeekStats: StatScore = { score: 0, count: 0, consistency: "0", streak: 0 };
  const allWeekScores: number[] = [];
  const weekEntries = Object.entries(weekData);
  weekEntries.forEach(([weekStart, data]) => {
    const elapsed = data.dates.length;
    const consistency = data.activeDays / elapsed;
    const score = Math.round(data.count * consistency * (data.maxStreak || 1));
    if (score > 0) allWeekScores.push(score);
    if (score > bestWeekScore) {
      bestWeekScore = score;
      const start = new Date(weekStart + 'T00:00:00'), end = new Date(start);
      end.setDate(start.getDate() + 6);
      bestWeekName = `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
      bestWeekDates = data.dates;
      bestWeekStats = { score, count: data.count, consistency: (consistency * 100).toFixed(1), streak: data.maxStreak };
    }
    if (score < worstWeekScore && score >= 0) { worstWeekScore = score; }
  });

  const worstWeeks = weekEntries.filter(([weekStart, data]) => {
    const elapsed = data.dates.length;
    const consistency = data.activeDays / elapsed;
    const score = Math.round(data.count * consistency * (data.maxStreak || 1));
    return score === worstWeekScore;
  });

  if (worstWeeks.length > 0) {
    if (worstWeeks.length === 1) {
      const [weekStart, data] = worstWeeks[0];
      const start = new Date(weekStart + 'T00:00:00'), end = new Date(start);
      end.setDate(start.getDate() + 6);
      worstWeekName = `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
      worstWeekDates = data.dates;
      const elapsed = data.dates.length;
      worstWeekStats = { score: worstWeekScore, count: data.count, consistency: ((data.activeDays / elapsed) * 100).toFixed(1), streak: data.maxStreak };
    } else {
      worstWeekName = `${worstWeeks.length} Weeks`;
      worstWeekDates = worstWeeks.flatMap(([_, data]) => data.dates);
      worstWeekStats = { score: worstWeekScore, count: 0, consistency: "0", streak: 0 };
    }
  }

  const avgWeekScore = allWeekScores.length > 0 ? allWeekScores.reduce((a, b) => a + b, 0) / allWeekScores.length : 0;
  let bestWeekTrend = 0, bestWeekIcon = '';
  if (avgWeekScore > 0) {
    bestWeekTrend = Math.round(((bestWeekScore - avgWeekScore) / avgWeekScore) * 100);
    bestWeekIcon = bestWeekTrend > 0 ? '▲' : (bestWeekTrend < 0 ? '▼' : '');
  }
  let worstWeekTrend = 0, worstWeekIcon = '';
  if (avgWeekScore > 0) {
    worstWeekTrend = Math.round(((worstWeekStats.score - avgWeekScore) / avgWeekScore) * 100);
    worstWeekIcon = worstWeekTrend > 0 ? '▲' : (worstWeekTrend < 0 ? '▼' : '');
  }

  const now = new Date();
  const currentSunday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  currentSunday.setDate(currentSunday.getDate() - currentSunday.getDay());
  const currentWeekKey = currentSunday.toISOString().split('T')[0];
  const currentW = weekData[currentWeekKey] || { count: 0, activeDays: 0, maxStreak: 0, tempStreak: 0, dates: [], dayCounts: {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0} };
  const elapsedDaysInWeek = now.getDay() + 1;
  const currentWeekScore = Math.round(currentW.count * (currentW.activeDays / elapsedDaysInWeek) * (currentW.maxStreak || 1));
  const currentWeekStats: StatScore = { score: currentWeekScore, count: currentW.count, consistency: ((currentW.activeDays / elapsedDaysInWeek) * 100).toFixed(1), streak: currentW.maxStreak };

  return { 
    bestMonthName, bestMonthDates, bestMonthStats, 
    worstMonthName, worstMonthDates, worstMonthStats, 
    bestWeekName, bestWeekDates, bestWeekStats, 
    worstWeekName, worstWeekDates, worstWeekStats,
    currentWeekStats, currentWeekDates: currentW.dates, 
    dominantWeekday, dominantWeekdayWins: maxWins, 
    bestMonthTrend, bestMonthIcon, 
    worstMonthTrend, worstMonthIcon, 
    bestWeekTrend, bestWeekIcon,
    worstWeekTrend, worstWeekIcon,
    avgMonthScore, avgWeekScore
  };
}
