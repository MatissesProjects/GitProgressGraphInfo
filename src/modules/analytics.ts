import { ContributionDay, PinnedProject, TimelineActivity, SocialStats } from '../types';
import { calculateRPGStats, getPersona } from './rpg';

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
  const activeDays = data.filter(d => d.count > 0).map(d => d.count).sort((a, b) => a - b);
  if (activeDays.length === 0) return {};

  const percentiles: Record<number, number> = {};
  const markers = [20, 30, 40, 50, 60, 70, 80, 90, 95, 99];
  
  markers.forEach(m => {
    const index = Math.ceil((m / 100) * activeDays.length) - 1;
    percentiles[m] = activeDays[Math.min(index, activeDays.length - 1)];
  });

  return percentiles;
}

export function findIsland(targetData: ContributionDay[], thresholdFn: (d: ContributionDay) => boolean, dateMap: Map<string, ContributionDay>, todayStr: string) {
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
}

export function calculateAdvancedStats(data: ContributionDay[], pinned: PinnedProject[] = [], timeline: TimelineActivity, achievements: string[] = [], socials: SocialStats) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const ytdStartStr = `${now.getFullYear()}-01-01`;
  
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const pastAndPresentData = sortedData.filter(d => d.date <= todayStr);
  const dateMap = new Map(data.map(d => [d.date, d]));

  const base = calculateBaseStats(pastAndPresentData, ytdStartStr, todayStr);
  
  const ytdTotalContributions = base.ytdWeekendContributions + base.ytdWeekdayContributions;
  let weekendScore = 0, weekendVolumeShare = 0, velocity = "0", consistency = "0";
  
  if (base.ytdTotalDays > 0) {
    weekendScore = base.ytdTotalWeekendDays > 0 ? Math.round((base.ytdActiveWeekendDays / base.ytdTotalWeekendDays) * 100) : 0;
    weekendVolumeShare = ytdTotalContributions > 0 ? (base.ytdWeekendContributions / ytdTotalContributions) : 0;
    velocity = base.ytdActiveDays > 0 ? (ytdTotalContributions / base.ytdActiveDays).toFixed(1) : "0";
    consistency = ((base.ytdActiveDays / base.ytdTotalDays) * 100).toFixed(1);
  } else {
    const totalVol = pastAndPresentData.reduce((sum, d) => sum + d.count, 0);
    const weekendDaysData = pastAndPresentData.filter(d => {
      const day = new Date(d.date + 'T00:00:00').getDay();
      return day === 0 || day === 6;
    });
    const activeWeekendDaysCount = weekendDaysData.filter(d => d.count > 0).length;
    weekendScore = weekendDaysData.length > 0 ? Math.round((activeWeekendDaysCount / weekendDaysData.length) * 100) : 0;
    const totalWeekendVol = weekendDaysData.reduce((sum, d) => sum + d.count, 0);
    weekendVolumeShare = totalVol > 0 ? (totalWeekendVol / totalVol) : 0;
    velocity = base.activeDays > 0 ? (totalVol / base.activeDays).toFixed(1) : "0";
    consistency = ((base.activeDays / pastAndPresentData.length) * 100).toFixed(1);
  }

  const totalStars = pinned.reduce((sum, p) => sum + p.stars, 0);
  const totalForks = pinned.reduce((sum, p) => sum + p.forks, 0);
  const langFreq: Record<string, number> = {};
  pinned.forEach(p => { if (p.language !== "Unknown") langFreq[p.language] = (langFreq[p.language] || 0) + 1; });
  const topLangs = Object.entries(langFreq).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]);

  const persona = getPersona(weekendVolumeShare, consistency, velocity, weekendScore, totalStars);

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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

  const biggestIslandDates = findIsland(pastAndPresentData, d => d.level >= 2, dateMap, todayStr);
  const biggestSlumpIslandDates = findIsland(pastAndPresentData, d => d.count <= 1, dateMap, todayStr);

  const weekdayHighActivityCounts: Record<number, number> = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
  const weekdayTotalDays: Record<number, number> = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
  pastAndPresentData.forEach(day => {
    const wd = new Date(day.date + 'T00:00:00').getDay();
    weekdayTotalDays[wd]++;
    if (day.level >= 2) weekdayHighActivityCounts[wd]++;
  });

  let powerDayIndex = 0, maxAvg = -1, peakWeekdayIndex = 0, maxHighFreq = -1;
  for (let i = 0; i < 7; i++) {
    const avg = weekdayTotalDays[i] > 0 ? (base.weekdayCounts[i] / weekdayTotalDays[i]) : 0;
    if (avg > maxAvg) { maxAvg = avg; powerDayIndex = i; }
    if (weekdayHighActivityCounts[i] > maxHighFreq) { maxHighFreq = weekdayHighActivityCounts[i]; peakWeekdayIndex = i; }
  }

  const rpg = calculateRPGStats(pastAndPresentData, timeline, todayCount, base.currentStreak, velocity);

  const statsForTooltips: any = {
    consistency: { active: (base.ytdTotalDays > 0 ? base.ytdActiveDays : base.activeDays), total: (base.ytdTotalDays > 0 ? base.ytdTotalDays : pastAndPresentData.length) },
    velocity: { count: (base.ytdTotalDays > 0 ? ytdTotalContributions : pastAndPresentData.reduce((sum, d) => sum + d.count, 0)), active: (base.ytdTotalDays > 0 ? base.ytdActiveDays : base.activeDays) },
    slumpDates: base.longestSlumpDates
  };
  if (base.ytdTotalDays > 0) {
    statsForTooltips.weekend = { active: base.ytdActiveWeekendDays, total: base.ytdTotalWeekendDays };
  } else {
    const weekendDaysData = pastAndPresentData.filter(d => {
      const day = new Date(d.date + 'T00:00:00').getDay();
      return day === 0 || day === 6;
    });
    statsForTooltips.weekend = { active: weekendDaysData.filter(d => d.count > 0).length, total: weekendDaysData.length };
  }

  return {
    ...base, ...timeBased, ...rpg,
    weekendScore, persona,
    bestDay: daysOfWeek[bestDayIndex], bestDayIndex, bestDayCount: maxWeekdayCount,
    worstDay: daysOfWeek[worstDayIndex], worstDayIndex, worstDayCount: minWeekdayCount,
    currentWeekday: daysOfWeek[now.getDay()], currentWeekdayIndex: now.getDay(), currentWeekdayCount: base.weekdayCounts[now.getDay()],
    todayCount, mostActiveDay, mostActiveDayCount, mostActiveDayWeekday,
    powerDay: daysOfWeek[powerDayIndex], powerDayIndex, powerDayAvg: maxAvg.toFixed(1),
    peakWeekday: daysOfWeek[peakWeekdayIndex], peakWeekdayIndex, peakWeekdayCount: maxHighFreq,
    biggestIslandSize: biggestIslandDates.length, biggestIslandDates,
    biggestSlumpIslandSize: biggestSlumpIslandDates.length, biggestSlumpIslandDates,
    statsForTooltips,
    isYTD: base.ytdTotalDays > 0, totalStars, totalForks, topLangs,
    topRepos: timeline.topRepos.slice(0, 3), createdRepos: timeline.createdRepos, createdRepoList: timeline.createdRepoList,
    issuesOpened: timeline.issuesOpened, pullRequests: timeline.pullRequests, pullRequestReviews: timeline.pullRequestReviews, mergedPullRequests: timeline.mergedPullRequests,
    achievements: achievements.slice(0, 4), socials
  };
}

export function calculateBaseStats(pastAndPresentData: ContributionDay[], ytdStartStr: string, todayStr: string) {
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
    const isYTD = day.date >= ytdStartStr;

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
      }
      weekdayCounts[weekday] += day.count;
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
    else if (day.date !== todayStr) break;
  }

  return {
    activeDays, ytdTotalDays, ytdTotalWeekendDays, ytdActiveDays, ytdActiveWeekendDays,
    ytdWeekendContributions, ytdWeekdayContributions, weekdayCounts,
    currentStreak, currentStreakDates, longestStreak, longestStreakDates, longestSlump, longestSlumpDates
  };
}

export function calculateTimeBasedStats(pastAndPresentData: ContributionDay[]) {
  const monthData: Record<string, any> = {};
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

  let bestMonthName = "N/A", bestMonthScore = -1, bestMonthDates: string[] = [], bestMonthStats = { score: 0, count: 0, consistency: "0", streak: 0 };
  Object.entries(monthData).forEach(([month, data]) => {
    const consistency = data.activeDays / data.totalDays;
    const score = Math.round(data.count * consistency * (data.maxStreak || 1));
    if (score > bestMonthScore) {
      bestMonthScore = score;
      bestMonthName = new Date(month + '-01T00:00:00').toLocaleString('default', { month: 'long', year: 'numeric' });
      bestMonthDates = data.dates;
      bestMonthStats = { score, count: data.count, consistency: (consistency * 100).toFixed(1), streak: data.maxStreak };
    }
  });

  const weekData: Record<string, any> = {};
  pastAndPresentData.forEach(day => {
    const date = new Date(day.date + 'T00:00:00');
    const dayOfWeek = date.getDay();
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - dayOfWeek);
    const weekKey = sunday.toISOString().split('T')[0];
    if (!weekData[weekKey]) weekData[weekKey] = { count: 0, activeDays: 0, maxStreak: 0, tempStreak: 0, dates: [] };
    const w = weekData[weekKey];
    w.dates.push(day.date);
    if (day.count > 0) {
      w.count += day.count; w.activeDays++; w.tempStreak++;
      if (w.tempStreak > w.maxStreak) w.maxStreak = w.tempStreak;
    } else w.tempStreak = 0;
  });

  let bestWeekName = "N/A", bestWeekScore = -1, bestWeekDates: string[] = [], bestWeekStats = { score: 0, count: 0, consistency: "0", streak: 0 };
  Object.entries(weekData).forEach(([weekStart, data]) => {
    const consistency = data.activeDays / 7;
    const score = Math.round(data.count * consistency * (data.maxStreak || 1));
    if (score > bestWeekScore) {
      bestWeekScore = score;
      const start = new Date(weekStart + 'T00:00:00'), end = new Date(start);
      end.setDate(start.getDate() + 6);
      bestWeekName = `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
      bestWeekDates = data.dates;
      bestWeekStats = { score, count: data.count, consistency: (consistency * 100).toFixed(1), streak: data.maxStreak };
    }
  });

  return { bestMonthName, bestMonthDates, bestMonthStats, bestWeekName, bestWeekDates, bestWeekStats };
}
