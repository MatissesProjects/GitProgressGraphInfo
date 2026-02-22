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
  following: number;
  organizations: number;
}

export interface TodayActions {
  commits: number;
  repos: number;
  issues: number;
  prs: number;
  reviews: number;
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
  level: number;
  xp: number;
  xpToNext: number;
  combo: { title: string; multiplier: number; points: number; bonusReasons: string[] };
  persona: string;
}
