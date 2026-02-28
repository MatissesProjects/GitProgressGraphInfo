import { ContributionDay, TimelineActivity, AvatarData, TodayActions } from '../types';

export const getLevelThreshold = (l: number) => 25 * l * l;

export const titles = ["Ghost", "Novice", "Script Kiddie", "Code Monkey", "Byte Basher", "Repo Ranger", "Commit Commander", "Git Guru", "Merge Master", "Branch Baron", "Pull Request Prince", "Octocat Overlord", "Code God"];

export function getAvatar(level: number, currentStreak: number, totalStars: number, actions: TodayActions, todayCount: number): AvatarData {
  let base = "👶";
  if (level >= 20) base = "🧙‍♂️";
  else if (level >= 15) base = "🦸‍♂️";
  else if (level >= 10) base = "👨‍💻";
  else if (level >= 5) base = "🐒";

  const effectiveCommits = Math.max(actions.commits, todayCount);

  let weapon = "";
  let weaponDesc = "Unarmed";
  if (effectiveCommits >= 20) { weapon = "⚡"; weaponDesc = "Legendary Lightning (20+ Commits)"; }
  else if (effectiveCommits >= 12) { weapon = "⚔️"; weaponDesc = "Steel Claymore (12+ Commits)"; }
  else if (effectiveCommits >= 7) { weapon = "🗡️"; weaponDesc = "Iron Sword (7+ Commits)"; }
  else if (effectiveCommits >= 4) { weapon = "🔨"; weaponDesc = "Heavy Hammer (4+ Commits)"; }
  else if (effectiveCommits >= 1) { weapon = "🦴"; weaponDesc = "Primitive Stick (1+ Commits)"; }

  let shield = "";
  let shieldDesc = "No Shield";
  if (actions.reviews >= 3) { shield = "💠"; shieldDesc = "Energy Shield (3+ Reviews)"; }
  else if (actions.reviews >= 1) { shield = "🛡️"; shieldDesc = "Wooden Shield (1+ Reviews)"; }

  let headgear = "";
  let headgearDesc = "No Headgear";
  if (currentStreak >= 30) { headgear = "👑"; headgearDesc = "God Crown (30+ Day Streak)"; }
  else if (currentStreak >= 14) { headgear = "🪖"; headgearDesc = "Steel Helmet (14+ Day Streak)"; }
  else if (currentStreak >= 7) { headgear = "🧢"; headgearDesc = "Lucky Cap (7+ Day Streak)"; }

  let companion = "";
  let companionDesc = "Lone Wolf";
  if (totalStars >= 500) { companion = "🐉"; companionDesc = "Ancient Dragon (500+ Stars)"; }
  else if (totalStars >= 100) { companion = "🦄"; companionDesc = "Unicorn (100+ Stars)"; }
  else if (totalStars >= 20) { companion = "🐕"; companionDesc = "Loyal Dog (20+ Stars)"; }

  const full = `${companion} ${headgear}${base}${weapon}${shield}`.trim();
  const description = `Level ${level} Character: ${weaponDesc}, ${shieldDesc}, ${headgearDesc}, ${companionDesc}.`;

  return { base, weapon, shield, headgear, companion, full, description };
}

export function getPersona(weekendVolumeShare: number, consistency: string, velocity: string, weekendScore: number, totalStars: number) {
  if (weekendVolumeShare > 0.4) return "Weekend Warrior";
  if (parseFloat(consistency) < 20 && parseFloat(velocity) > 5) return "Burst Developer";
  if (parseFloat(velocity) > 15) return "High-Volume Architect";
  if (weekendScore > 80 && parseFloat(consistency) > 80) return "Unstoppable Force";
  if (totalStars > 100) return "Popular Maintainer";
  return "Consistent Coder";
}

export function getCodingClass(advanced: any) {
  const classes: { name: string; icon: string; description: string }[] = [];
  
  // The Night Owl (Mocked/Proxy: High consistency but low weekend score? No, let's use TodayActions if it's late night)
  // Actually, let's use the achievements as a source for some
  if (advanced.achievements.includes('Pull Shark')) {
    classes.push({ name: 'Apex Predator', icon: '🦈', description: 'Has the Pull Shark achievement.' });
  }
  if (advanced.achievements.includes('YOLO')) {
    classes.push({ name: 'Risk Taker', icon: '🎲', description: 'Has the YOLO achievement.' });
  }
  
  // Necromancer Proxy: Commits in many different repos but few created repos
  if (advanced.topRepos.length > 10 && advanced.createdRepos < 2) {
    classes.push({ name: 'The Necromancer', icon: '💀', description: 'Working on many existing repositories.' });
  }

  // Refactorer Proxy: High PR to Commit ratio
  if (advanced.pullRequests > advanced.todayCount && advanced.pullRequests > 0) {
    classes.push({ name: 'The Refactorer', icon: '🔧', description: 'High ratio of Pull Requests to raw commits.' });
  }

  // The Specialist
  if (advanced.topRepos.length > 0 && advanced.topRepos[0].commits > (advanced.totalCount * 0.7)) {
    classes.push({ name: 'The Specialist', icon: '🎯', description: '70%+ of work is in a single repository.' });
  }

  // The Polyglot
  if (advanced.topLangs.length >= 2) {
    classes.push({ name: 'The Polyglot', icon: '🌍', description: 'Master of multiple programming languages.' });
  }

  // The Marathoner
  if (advanced.longestStreak > 30) {
    classes.push({ name: 'The Marathoner', icon: '🏃', description: '30+ day commit streak.' });
  }

  return classes;
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

export function calculateRPGStats(pastAndPresentData: ContributionDay[], timeline: TimelineActivity, todayCount: number, currentStreak: number, velocity: string, totalStars: number) {
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

  const avatar = getAvatar(currentLevel, currentStreak, totalStars, actions, heatmapCommits);

  return {
    totalXP: totalXPWithBonuses, level: currentLevel, levelTitle, levelProgressXP: xpProgress, levelTotalXP: xpNeeded, progressPercent,
    todayCombo, todayComboReason, todayComboMath, xpToNext: nextLevelXP - totalXPWithBonuses,
    avatar
  };
}
