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
