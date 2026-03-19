import { GitHeatSettings } from '../types';

export const XP_VALUES = {
  COMMIT: 15,
  LONGEST_STREAK_DAY: 100,
  PULL_REQUEST: 250,
  ISSUE_OPENED: 100,
  FOLLOWER: 50
};

export const LEVEL_TITLES = [
  "Novice", "Apprentice", "Scripter", "Coder", "Developer", 
  "Engineer", "Architect", "Senior Architect", "Grandmaster", 
  "Legend", "Mythic"
];

export const GEAR_ITEMS = {
  BASES: ['🧙', '🧙‍♂️', '🧙‍♀️', '🧑‍💻', '👩‍💻', '🧔‍♂️', '🧝', '🧝‍♂️', '🧝‍♀️', '🧛', '🧛‍♂️', '🧛‍♀️'],
  HEADS: ['👑', '🎓', '⛑️', '👒', '🧢', '🎓', '🪖', '👒'],
  WEAPONS: ['🪄', '🗡️', '🏹', '🪓', '⚔️', '⚒️', '🔫', '🔫'],
  SHIELDS: ['🛡️', '💠', '🧼', '📁', '📦', '🔋'],
  COMPANIONS: ['🐱', '🐕', '🦊', '🐼', '🐨', '🤖', '👻', '👾', '🐉']
};

export const DEFAULT_GRID_ORDER = [
  'gh-streak', 'gh-best-month', 'gh-worst-month', 'gh-best-week', 'gh-worst-week', 'gh-current-week', 'gh-dominant-weekday', 'gh-most-active-day', 'gh-max-commits',
  'gh-velocity', 'gh-velocity-above', 'gh-velocity-below', 'gh-consistency', 'gh-weekend',
  'gh-island', 'gh-slump-island', 'gh-above-avg-island', 'gh-slump',
  'gh-best-day', 'gh-worst-day', 'gh-power-day', 'gh-peak-day', 'gh-current-weekday',
  'gh-stars', 'gh-pr', 'gh-issue-created', 'gh-langs', 'gh-network'
];

export const VISIBILITY_KEYS: (keyof GitHeatSettings)[] = [
  'showGrid', 'showActiveRepos', 'showCreatedRepos', 'showAchievements', 'showPersona', 'showFooter', 'showLegendNumbers',
  'showTotal', 'showTodayCount', 'showStreak', 'showVelocity', 'showVelocityAbove', 'showVelocityBelow', 'showConsistency', 'showWeekend', 'showSlump', 'showBestDay', 'showWorstDay', 
  'showMostActiveDay', 'showCurrentWeekday', 'showMaxCommits', 'showIsland', 'showSlumpIsland', 'showAboveAvgIsland', 
  'showPowerDay', 'showPeakDay', 'showStars', 'showPR', 'showIssueCreated', 'showLangs', 'showNetwork', 'showBestMonth', 'showWorstMonth', 'showBestWeek', 'showWorstWeek', 'showCurrentWeek', 'showLevel', 'showDominantWeekday', 'showTrends', 'showPulseHash', 'showTicker', 'showAvatar', 'showGearHead', 'showGearWeapon', 'showGearShield', 'showGearCompanion', 'showCombo', 'showXPBar', 'showSkillTree'
];

export const GRID_ITEM_TO_SETTING: Record<string, keyof GitHeatSettings> = {
  'gh-total': 'showTotal',
  'gh-today': 'showTodayCount',
  'gh-streak': 'showStreak',
  'gh-best-month': 'showBestMonth',
  'gh-worst-month': 'showWorstMonth',
  'gh-best-week': 'showBestWeek',
  'gh-worst-week': 'showWorstWeek',
  'gh-current-week': 'showCurrentWeek',
  'gh-dominant-weekday': 'showDominantWeekday',
  'gh-island': 'showIsland',
  'gh-slump-island': 'showSlumpIsland',
  'gh-above-avg-island': 'showAboveAvgIsland',
  'gh-velocity': 'showVelocity',
  'gh-velocity-above': 'showVelocityAbove',
  'gh-velocity-below': 'showVelocityBelow',
  'gh-consistency': 'showConsistency',
  'gh-weekend': 'showWeekend',
  'gh-slump': 'showSlump',
  'gh-best-day': 'showBestDay',
  'gh-worst-day': 'showWorstDay',
  'gh-current-weekday': 'showCurrentWeekday',
  'gh-power-day': 'showPowerDay',
  'gh-peak-day': 'showPeakDay',
  'gh-most-active-day': 'showMostActiveDay',
  'gh-max-commits': 'showMaxCommits',
  'gh-stars': 'showStars',
  'gh-pr': 'showPR',
  'gh-issue-created': 'showIssueCreated',
  'gh-langs': 'showLangs',
  'gh-network': 'showNetwork',
  'gh-pulse-signature': 'showPulseHash',
  'gh-level': 'showLevel'
};
