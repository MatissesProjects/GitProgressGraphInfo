export interface ContributionDay {
  date: string;
  level: number;
  count: number;
}

export interface PinnedProject {
  name: string;
  stars: number;
  forks: number;
  language: string;
  languageColor: string;
}

export interface TimelineActivity {
  topRepos: { name: string; commits: number }[];
  issuesOpened: number;
  pullRequests: number;
  mergedPullRequests: number;
  pullRequestReviews: number;
  createdRepos: number;
  createdRepoList: { name: string; date: string }[];
}

export interface SocialStats {
  followers: number;
  organizations: number;
}

export interface Skill {
  id: string;
  name: string;
  icon: string;
  description: string;
  requirement: string;
  category: 'Coding' | 'Social' | 'Consistency';
  unlocked: boolean;
}

export interface AvatarData {
  base: string;
  headgear: string;
  weapon: string;
  shield: string;
  companion: string;
  description: string;
}

export interface StatScore {
  score: number;
  count: number;
  consistency: string;
  streak: number;
}

export interface TooltipStat {
  count: number;
  active: number;
  total: number;
}

export interface YearlyStats {
  year: number;
  total: number;
  thresholds: Record<number, { min: number; max: number }>;
  percentiles: Record<number, number>;
  advanced: AdvancedStats;
}

export interface AdvancedStats {
  isYTD: boolean;
  targetYear: number;
  total: number;
  streak: number;
  maxStreak: number;
  velocity: string;
  consistency: string;
  weekendCommits: number;
  weekendScore: string;
  slumpStreak: number;
  bestDay: string;
  bestDayCount: number;
  bestDayIndex: number;
  worstDay: string;
  worstDayCount: number;
  worstDayIndex: number;
  powerDay: string;
  powerDayAvg: string;
  powerDayIndex: number;
  peakWeekday: string;
  peakWeekdayCount: number;
  peakWeekdayIndex: number;
  mostActiveDay: string;
  mostActiveDayCount: number;
  mostActiveDayWeekday: number;
  longestSlump: number;
  longestSlumpDates: string[];
  biggestIslandSize: number;
  biggestIslandDates: string[];
  biggestSlumpIslandSize: number;
  biggestSlumpIslandDates: string[];
  biggestAboveAvgIslandSize: number;
  biggestAboveAvgIslandDates: string[];
  currentStreak: number;
  currentStreakDates: string[];
  longestStreak: number;
  longestStreakDates: string[];
  topRepos: { name: string; commits: number }[];
  issuesOpened: number;
  pullRequests: number;
  mergedPullRequests: number;
  pullRequestReviews: number;
  createdRepos: number;
  createdRepoList: { name: string; date: string }[];
  totalStars: number;
  totalForks: number;
  socials: SocialStats;
  topLangs: string[];
  bestMonthName: string;
  bestMonthDates: string[];
  bestMonthStats: StatScore;
  worstMonthName: string;
  worstMonthDates: string[];
  worstMonthStats: StatScore;
  bestWeekName: string;
  bestWeekDates: string[];
  bestWeekStats: StatScore;
  worstWeekName: string;
  worstWeekDates: string[];
  worstWeekStats: StatScore;
  currentWeekStats: StatScore;
  currentWeekDates: string[];
  dominantWeekday: string;
  dominantWeekdayWins: number;
  bestMonthTrend: number;
  bestMonthIcon: string;
  worstMonthTrend: number;
  worstMonthIcon: string;
  bestWeekTrend: number;
  bestWeekIcon: string;
  worstWeekTrend: number;
  worstWeekIcon: string;
  avgMonthScore: number;
  avgWeekScore: number;
  velocityTrend: number;
  velocityIcon: string;
  acceleration: number;
  accelerationIcon: string;
  currentWeekday: string;
  currentWeekdayCount: number;
  currentWeekdayAvg: string;
  currentWeekdayIndex: number;
  currentWeekdayTrend: number;
  currentWeekdayIcon: string;
  bestWeekdayAvg: string;
  worstWeekdayAvg: string;
  bestWeekdayTrend: number;
  bestWeekdayIcon: string;
  todayCount: number;
  level: number;
  levelTitle: string;  totalXP: number;
  xpToNext: number;
  levelProgressXP: number;
  levelTotalXP: number;
  progressPercent: number;
  todayCombo: number;
  todayComboMath: string;
  todayComboReason: string;
  persona: string;
  skills: Skill[];
  avatar: AvatarData;
  pulseHash: string;
  ytdDailyCounts: { date: string; count: number }[];
  statsForTooltips: {
    velocity: TooltipStat;
    consistency: TooltipStat;
    weekend: TooltipStat;
  };
}

export interface GitHeatSettings {
  showGrid?: boolean;
  showActiveRepos?: boolean;
  showCreatedRepos?: boolean;
  showAchievements?: boolean;
  showPersona?: boolean;
  showFooter?: boolean;
  showLegendNumbers?: boolean;
  showTotal?: boolean;
  showTodayCount?: boolean;
  showStreak?: boolean;
  showVelocity?: boolean;
  showVelocityAbove?: boolean;
  showVelocityBelow?: boolean;
  showConsistency?: boolean;
  showWeekend?: boolean;
  showSlump?: boolean;
  showBestDay?: boolean;
  showWorstDay?: boolean;
  showMostActiveDay?: boolean;
  showCurrentWeekday?: boolean;
  showMaxCommits?: boolean;
  showIsland?: boolean;
  showSlumpIsland?: boolean;
  showAboveAvgIsland?: boolean;
  showPowerDay?: boolean;
  showPeakDay?: boolean;
  showStars?: boolean;
  showPR?: boolean;
  showIssueCreated?: boolean;
  showLangs?: boolean;
  showNetwork?: boolean;
  showYearComparison?: boolean;
  showBestMonth?: boolean;
  showWorstMonth?: boolean;
  showBestWeek?: boolean;
  showWorstWeek?: boolean;
  showCurrentWeek?: boolean;
  showLevel?: boolean;
  showDominantWeekday?: boolean;
  showTrends?: boolean;
  showPulseHash?: boolean;
  showTicker?: boolean;
  showAvatar?: boolean;
  showGearHead?: boolean;
  showGearWeapon?: boolean;
  showGearShield?: boolean;
  showGearCompanion?: boolean;
  showCombo?: boolean;
  showXPBar?: boolean;
  showSkillTree?: boolean;
  showColorAnimation?: boolean;
  syncAnimations?: boolean;
  animationSpeed?: number;
  animationStyle?: ('hue' | 'breathe' | 'sparkle' | 'rainbow' | 'ghost' | 'fire' | 'glitch' | 'chaos' | 'plasma')[];
  theme?: string;
  customStart?: string;
  customStop?: string;
  colorMode?: 'rgb' | 'hsl' | 'lab';
  gridOrder?: string[];
}

export interface CustomAvatarSettings {
  base?: string;
  headgear?: string;
  weapon?: string;
  shield?: string;
  companion?: string;
}
