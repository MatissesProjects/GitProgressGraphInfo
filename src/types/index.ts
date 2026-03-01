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

export interface RepoActivity {
  name: string;
  commits: number;
}

export interface CreatedRepo {
  name: string;
  language: string;
}

export interface SocialStats {
  followers: number;
  organizations: number;
}

export interface TodayActions {
  commits: number;
  repos: number;
  issues: number;
  prs: number;
  reviews: number;
}

export interface AvatarData {
  base: string;
  weapon: string;
  shield: string;
  headgear: string;
  companion: string;
  full: string;
  description: string;
}

export interface TimelineActivity {
  topRepos: RepoActivity[];
  createdRepos: number;
  createdRepoList: CreatedRepo[];
  issuesOpened: number;
  pullRequests: number;
  pullRequestReviews: number;
  mergedPullRequests: number;
  todayActions: TodayActions;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  requirement: string;
  category: 'Coding' | 'Social' | 'Consistency';
}

export interface CustomAvatarItem {
  min: number;
  val: string;
  label: string;
}

export interface CustomAvatarSettings {
  bases: CustomAvatarItem[];
  weapons: CustomAvatarItem[];
  shields: CustomAvatarItem[];
  headgear: CustomAvatarItem[];
  companions: CustomAvatarItem[];
}

export interface GitHeatSettings {
  theme?: string;
  customStart?: string;
  customStop?: string;
  showGrid?: boolean;
  showActiveRepos?: boolean;
  showCreatedRepos?: boolean;
  showAchievements?: boolean;
  showPersona?: boolean;
  showFooter?: boolean;
  showLegendNumbers?: boolean;
  islandWrapAround?: boolean;
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
  showCurrentWeekday?: boolean;
  showPowerDay?: boolean;
  showPeakDay?: boolean;
  showMostActiveDay?: boolean;
  showMaxCommits?: boolean;
  showIsland?: boolean;
  showSlumpIsland?: boolean;
  showStars?: boolean;
  showPR?: boolean;
  showIssueCreated?: boolean;
  showLangs?: boolean;
  showNetwork?: boolean;
  showBestMonth?: boolean;
  showWorstMonth?: boolean;
  showBestWeek?: boolean;
  showCurrentWeek?: boolean;
  showLevel?: boolean;
  showDominantWeekday?: boolean;
  showPulseHash?: boolean;
  showTrends?: boolean;
  showTicker?: boolean;
  showAvatar?: boolean;
  showGearHead?: boolean;
  showGearWeapon?: boolean;
  showGearShield?: boolean;
  showGearCompanion?: boolean;
  showCombo?: boolean;
  showXPBar?: boolean;
  showSkillTree?: boolean;
  gridOrder?: string[];
  customAvatarSettings?: CustomAvatarSettings;
}

export interface AdvancedStats {
  total: number;
  streak: number;
  maxStreak: number;
  velocity: number;
  consistency: number;
  weekendCommits: number;
  slumpStreak: number;
  bestDay: string;
  bestDayCount: number;
  worstDay: string;
  worstDayCount: number;
  mostActiveDay: string;
  maxCommits: number;
  island: { count: number; start: string; end: string } | null;
  slumpIsland: { count: number; start: string; end: string } | null;
  powerDays: number;
  peakDays: number;
  starsTotal: number;
  prTotal: number;
  issueTotal: number;
  topLangs: { name: string; count: number }[];
  networkScore: number;
  bestMonth: string;
  bestMonthCount: number;
  bestWeek: string;
  bestWeekCount: number;
  belowVelocityDates: string[];
  aboveVelocityDates: string[];
  level: number;
  xp: number;
  xpToNext: number;
  combo: { title: string; multiplier: number; points: number; bonusReasons: string[] };
  persona: string;
  skills: Skill[];
}
