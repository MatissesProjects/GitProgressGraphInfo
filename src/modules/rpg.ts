import { ContributionDay, TimelineActivity } from '../types';

export const getLevelThreshold = (l: number) => 25 * l * l;

export const titles = ["Ghost", "Novice", "Script Kiddie", "Code Monkey", "Byte Basher", "Repo Ranger", "Commit Commander", "Git Guru", "Merge Master", "Branch Baron", "Pull Request Prince", "Octocat Overlord", "Code God"];

export function getPersona(weekendVolumeShare: number, consistency: string, velocity: string, weekendScore: number, totalStars: number) {
  if (weekendVolumeShare > 0.4) return "Weekend Warrior";
  if (parseFloat(consistency) < 20) return "Burst Developer";
  if (parseFloat(velocity) > 15) return "High-Volume Architect";
  if (weekendScore > 80) return "Unstoppable Force";
  if (totalStars > 100) return "Popular Maintainer";
  return "Consistent Coder";
}

export function getCombo(todayScore: number, actions: any) {
  const fib = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];
  let todayCombo = 0;
  for (let i = 0; i < fib.length; i++) {
    if (todayScore >= fib[i]) todayCombo = i + 1;
    else break;
  }

  let todayComboReason = "Activity Streak";
  if (todayCombo >= 2) {
    const typesCount = (actions.commits > 0 ? 1 : 0) + (actions.issues > 0 ? 1 : 0) + (actions.prs > 0 ? 1 : 0) + (actions.reviews > 0 ? 1 : 0);
    
    if (typesCount >= 3) todayComboReason = "Multi-Tasker";
    else if (actions.reviews >= 2) todayComboReason = "Guardian of Code";
    else if (actions.commits >= 5) todayComboReason = "Commit Frenzy";
    else if (actions.prs >= 1 && actions.issues >= 1) todayComboReason = "Problem Solver";
    else if (actions.repos >= 1) todayComboReason = "Architect";
  }

  return { todayCombo, todayComboReason };
}

export function calculateRPGStats(pastAndPresentData: ContributionDay[], timeline: TimelineActivity, todayCount: number, currentStreak: number, velocity: string) {
  let totalXPWithBonuses = 0;
  pastAndPresentData.forEach(day => {
    let dayXP = day.count;
    if (day.count >= 5) {
      dayXP += Math.floor(day.count / 5) * 2;
    }
    totalXPWithBonuses += dayXP;
  });
  totalXPWithBonuses += (timeline.pullRequestReviews * 3);

  const currentLevel = Math.floor(Math.sqrt(totalXPWithBonuses / 25));
  const nextLevel = currentLevel + 1;
  const currentLevelXP = getLevelThreshold(currentLevel);
  const nextLevelXP = getLevelThreshold(nextLevel);
  const xpProgress = totalXPWithBonuses - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const progressPercent = Math.min(100, Math.max(0, Math.round((xpProgress / xpNeeded) * 100)));
  const levelTitle = titles[Math.min(currentLevel, titles.length - 1)];

  const actions = timeline.todayActions;
  const heatmapCommits = todayCount;
  const streakBonus = Math.floor(currentStreak / 3);
  const avgVelocity = parseFloat(velocity);
  const velocityBonus = (heatmapCommits > avgVelocity && avgVelocity > 0) ? 2 : 0;
  const todayScore = (heatmapCommits + actions.reviews * 2 + actions.repos * 3) + streakBonus + velocityBonus;
  
  const { todayCombo, todayComboReason } = getCombo(todayScore, actions);
  const fib = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];
  const todayComboMath = `Score: ${todayScore} ((HeatmapCommits:${heatmapCommits}) + (Reviews:${actions.reviews}*2) + (Repos:${actions.repos}*3) + (StreakBonus:${streakBonus}) + (VelocityBonus:${velocityBonus})). Next level at ${fib[todayCombo] || '??'} XP.`;

  return {
    totalXPWithBonuses, currentLevel, levelTitle, xpProgress, xpNeeded, progressPercent,
    todayCombo, todayComboReason, todayComboMath, xpToNext: nextLevelXP - totalXPWithBonuses
  };
}
