import { AvatarData, Skill, AdvancedStats } from '../types';

export interface TodayActions {
  commits: number;
  prs: number;
  issues: number;
  reviews: number;
  stars: number;
}

export function getAvatar(level: number, currentStreak: number, totalStars: number, actions: TodayActions, todayCount: number, customSettings?: any): AvatarData {
  const bases = ['🧙', '🧙‍♂️', '🧙‍♀️', '🧑‍💻', '👩‍💻', '🧔‍♂️', '🧝', '🧝‍♂️', '🧝‍♀️', '🧛', '🧛‍♂️', '🧛‍♀️'];
  const heads = ['👑', '🎓', '⛑️', '👒', '🧢', '🎓', '🪖', '👒'];
  const weapons = ['🪄', '🗡️', '🏹', '🪓', '⚔️', '⚒️', '🔫', '🔫'];
  const shields = ['🛡️', '💠', '🧼', '📁', '📦', '🔋'];
  const companions = ['🐱', '🐕', '🦊', '🐼', '🐨', '🤖', '👻', '👾', '🐉'];

  const base = customSettings?.base || bases[level % bases.length];
  const head = customSettings?.headgear || (level >= 5 ? heads[Math.floor(level/5) % heads.length] : '');
  const weapon = customSettings?.weapon || (totalStars >= 10 ? weapons[Math.floor(totalStars/10) % weapons.length] : '');
  const shield = customSettings?.shield || (currentStreak >= 7 ? shields[Math.floor(currentStreak/7) % shields.length] : '');
  const companion = customSettings?.companion || (actions.prs >= 1 ? companions[Math.floor(actions.prs) % companions.length] : '');

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

export async function calculateRPGStats(
  data: any[], 
  timeline: any, 
  todayCount: number, 
  currentStreak: number, 
  velocity: string, 
  totalStars: number, 
  socials: any, 
  pinned: any[], 
  longestStreak: number,
  customAvatarSettings?: any
) {
  const totalCommits = data.reduce((s, d) => s + d.count, 0);
  
  // XP Calculation: Commits (10 XP) + Longest Streak (50 XP/day) + PRs (100 XP) + Issues (50 XP)
  const totalXP = (totalCommits * 10) + 
                  (longestStreak * 50) + 
                  (timeline.pullRequests * 100) + 
                  (timeline.issuesOpened * 50) + 
                  (socials.followers * 20);

  // Level Logic: Level 1 starts at 0 XP, Level 2 at 100, Level 3 at 400, etc. (Level^2 * 100)
  const level = Math.floor(Math.sqrt(totalXP / 100)) + 1;
  const xpForCurrentLevel = Math.pow(level - 1, 2) * 100;
  const xpForNextLevel = Math.pow(level, 2) * 100;
  
  const levelProgressXP = totalXP - xpForCurrentLevel;
  const levelTotalXP = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = Math.min(100, Math.floor((levelProgressXP / levelTotalXP) * 100));

  const levelTitles = ["Novice", "Scripter", "Developer", "Engineer", "Architect", "Grandmaster", "Legend"];
  const levelTitle = levelTitles[Math.min(levelTitles.length - 1, Math.floor(level / 5))];

  const todayActions: TodayActions = {
    commits: todayCount,
    prs: timeline.pullRequests, // Simplified
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
    avatar
  };
}
