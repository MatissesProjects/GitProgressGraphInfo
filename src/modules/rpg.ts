import { AvatarData, AdvancedStats, CustomAvatarSettings, TimelineActivity, SocialStats, ContributionDay, PinnedProject } from '../types';
import { XP_VALUES, LEVEL_TITLES, GEAR_ITEMS } from './constants';

export interface TodayActions {
  commits: number;
  prs: number;
  issues: number;
  reviews: number;
  stars: number;
}

export function getAvatar(level: number, currentStreak: number, totalStars: number, actions: TodayActions, todayCount: number, customSettings?: CustomAvatarSettings): AvatarData {
  const { BASES, HEADS, WEAPONS, SHIELDS, COMPANIONS } = GEAR_ITEMS;

  const base = customSettings?.base || BASES[level % BASES.length];
  const head = customSettings?.headgear || (level >= 5 ? HEADS[Math.floor(level/5) % HEADS.length] : '');
  const weapon = customSettings?.weapon || (totalStars >= 10 ? WEAPONS[Math.floor(totalStars/10) % WEAPONS.length] : '');
  const shield = customSettings?.shield || (currentStreak >= 7 ? SHIELDS[Math.floor(currentStreak/7) % SHIELDS.length] : '');
  const companion = customSettings?.companion || (actions.prs >= 1 ? COMPANIONS[Math.floor(actions.prs) % COMPANIONS.length] : '');

  return {
    base,
    headgear: head,
    weapon,
    shield,
    companion,
    description: `Level ${level} Character`
  };
}

export function getCodingClass(advanced: AdvancedStats) {
  const classes: { name: string; icon: string; description: string }[] = [];
  
  if (parseFloat(advanced.velocity) > 15) {
    classes.push({ name: 'Apex Predator', icon: '🦈', description: 'Extremely high daily commit volume.' });
  }
  
  if (parseFloat(advanced.consistency) > 95) {
    classes.push({ name: 'The Marathoner', icon: '🏃', description: 'Unwavering consistency over long periods.' });
  }

  if (advanced.totalStars > 50) {
    classes.push({ name: 'The Influencer', icon: '🌟', description: 'Highly starred pinned repositories.' });
  }

  if (advanced.topLangs.length > 5) {
    classes.push({ name: 'The Polyglot', icon: '🌍', description: 'Proficient in many different languages.' });
  }

  return classes;
}

export function getCombo(todayScore: number, actions: TodayActions) {
  let multiplier = 1;
  const bonusReasons: string[] = [];

  if (todayScore >= 5) {
    multiplier += 0.5;
    bonusReasons.push('High Volume (+0.5x)');
  }
  if (actions.prs > 0) {
    multiplier += 0.3;
    bonusReasons.push('PR Contributor (+0.3x)');
  }
  if (actions.issues > 0) {
    multiplier += 0.2;
    bonusReasons.push('Bug Hunter (+0.2x)');
  }

  return {
    multiplier: Math.round(multiplier * 10) / 10,
    title: `${multiplier.toFixed(1)}x COMBO`,
    bonusReasons
  };
}

export function getPersona(weekendVolumeShare: number, consistency: string, velocity: string, weekendScore: number, totalStars: number): string {
  const c = parseFloat(consistency);
  const v = parseFloat(velocity);
  
  if (v > 15 && c > 90) return "High-Volume Architect";
  if (weekendVolumeShare > 0.4) return "Weekend Warrior";
  if (c > 98) return "Consistency Master";
  if (totalStars > 100) return "Open Source Star";
  if (v < 2) return "Casual Committer";
  
  return "Steady Developer";
}

export function getStreakHeat(current: number, best: number) {
  if (current === 0) return { status: 'Cold', multiplier: 1, icon: '❄️', color: '#57606a' };
  if (current > best) return { status: 'Supernova', multiplier: 2.0, icon: '🌟', color: '#0969da' }; // Breaking record!
  if (current === best) return { status: 'On Fire', multiplier: 1.5, icon: '🔥', color: '#cf222e' };
  if (current >= best * 0.8) return { status: 'Hot', multiplier: 1.3, icon: '🔸', color: '#d44c1e' };
  if (current > 3) return { status: 'Warm', multiplier: 1.1, icon: '🔆', color: '#9a6700' };
  return { status: 'Active', multiplier: 1, icon: '⚡', color: '#30a14e' };
}

export async function calculateRPGStats(
  data: ContributionDay[], 
  timeline: TimelineActivity, 
  todayCount: number, 
  currentStreak: number, 
  velocity: string, 
  totalStars: number, 
  socials: SocialStats, 
  pinned: PinnedProject[], 
  longestStreak: number,
  customAvatarSettings?: CustomAvatarSettings
) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const ytdStart = `${currentYear}-01-01`;
  
  const ytdCommits = data.filter(d => d.date >= ytdStart).reduce((s, d) => s + d.count, 0);
  
  const heat = getStreakHeat(currentStreak, longestStreak);

  // Balanced XP Calculation (YTD focused for commits)
  let totalXP = (ytdCommits * XP_VALUES.COMMIT) + 
                  (longestStreak * XP_VALUES.LONGEST_STREAK_DAY) + 
                  (timeline.pullRequests * XP_VALUES.PULL_REQUEST) + 
                  (timeline.issuesOpened * XP_VALUES.ISSUE_OPENED) + 
                  (socials.followers * XP_VALUES.FOLLOWER);

  // Apply streak multiplier to recent gains if needed, but for now we apply a flat bonus to total
  // to make it feel like "leveling faster" when on a streak
  if (heat.multiplier > 1) {
    const bonus = Math.floor(totalXP * (heat.multiplier - 1) * 0.1); // 10% of weight * multiplier
    totalXP += bonus;
  }

  // Balanced Level Logic: 
  // Formula: (Level-1)^1.8 * 500
  const level = Math.floor(Math.pow(totalXP / 500, 1 / 1.8)) + 1;
  const xpForCurrentLevel = Math.floor(Math.pow(level - 1, 1.8) * 500);
  const xpForNextLevel = Math.floor(Math.pow(level, 1.8) * 500);
  
  const levelProgressXP = totalXP - xpForCurrentLevel;
  const levelTotalXP = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = Math.min(100, Math.floor((levelProgressXP / levelTotalXP) * 100));

  const levelTitle = LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.floor(level / 3))];

  const todayActions: TodayActions = {
    commits: todayCount,
    prs: timeline.pullRequests,
    issues: timeline.issuesOpened,
    reviews: timeline.pullRequestReviews,
    stars: socials.followers
  };

  const combo = getCombo(todayCount, todayActions);
  const avatar = getAvatar(level, currentStreak, totalStars, todayActions, todayCount, customAvatarSettings);

  return {
    level,
    levelTitle,
    totalXP,
    xpToNext: xpForNextLevel - totalXP,
    levelProgressXP,
    levelTotalXP,
    progressPercent,
    todayCombo: combo.multiplier,
    todayComboMath: combo.title,
    todayComboReason: combo.bonusReasons.join(', '),
    avatar,
    streakHeat: heat
  };
}

