import { ContributionDay, TimelineActivity, AvatarData, TodayActions, Skill, SocialStats, PinnedProject } from '../types';

export const getLevelThreshold = (l: number) => 25 * l * l;

export const titles = ["Ghost", "Novice", "Script Kiddie", "Code Monkey", "Byte Basher", "Repo Ranger", "Commit Commander", "Git Guru", "Merge Master", "Branch Baron", "Pull Request Prince", "Octocat Overlord", "Code God"];

export function calculateSkills(
  timeline: TimelineActivity, 
  socials: SocialStats, 
  pinned: PinnedProject[],
  level: number,
  longestStreak: number,
  totalCommits: number
): Skill[] {
  const uniqueLangs = new Set(pinned.map(p => p.language).filter(l => l !== "Unknown")).size;
  
  return [
    {
      id: 'hello_world',
      name: 'Hello World',
      description: 'The journey of a thousand miles begins with a single commit.',
      icon: '🌱',
      unlocked: totalCommits >= 1,
      requirement: '1+ total commits',
      category: 'Coding'
    },
    {
      id: 'deca_coder',
      name: 'Deca-Coder',
      description: 'Double digits! You are starting to get the hang of this.',
      icon: '🔟',
      unlocked: totalCommits >= 10,
      requirement: '10+ total commits',
      category: 'Coding'
    },
    {
      id: 'quarter_century',
      name: 'Quarter-Century',
      description: 'A solid foundation of work built commit by commit.',
      icon: '🏛️',
      unlocked: totalCommits >= 25,
      requirement: '25+ total commits',
      category: 'Coding'
    },
    {
      id: 'polyglot',
      name: 'Polyglot Adept',
      description: 'Master of multiple languages.',
      icon: '🌍',
      unlocked: uniqueLangs >= 3,
      requirement: '3+ unique languages in pinned projects',
      category: 'Coding'
    },
    {
      id: 'reviewer',
      name: 'Eagle Eye Reviewer',
      description: 'Carefully inspecting every line.',
      icon: '👁️',
      unlocked: timeline.pullRequestReviews >= 10,
      requirement: '10+ total PR reviews',
      category: 'Social'
    },
    {
      id: 'architect',
      name: 'System Architect',
      description: 'Creating worlds from scratch.',
      icon: '🏗️',
      unlocked: timeline.createdRepos >= 5,
      requirement: '5+ created repositories',
      category: 'Coding'
    },
    {
      id: 'marathoner',
      name: 'Code Marathoner',
      description: 'Unstoppable consistency.',
      icon: '🏃',
      unlocked: longestStreak >= 30,
      requirement: '30+ day longest streak',
      category: 'Consistency'
    },
    {
      id: 'socialite',
      name: 'Social Butterfly',
      description: 'Building a massive network.',
      icon: '🦋',
      unlocked: socials.followers >= 50,
      requirement: '50+ followers',
      category: 'Social'
    },
    {
      id: 'maintainer',
      name: 'Lead Maintainer',
      description: 'Guiding projects to success.',
      icon: '👑',
      unlocked: timeline.mergedPullRequests >= 20,
      requirement: '20+ merged pull requests',
      category: 'Coding'
    },
    {
      id: 'cleanup',
      name: 'Refactoring Master',
      description: 'Proxy: High PR review count.',
      icon: '🧹',
      unlocked: timeline.pullRequestReviews >= 50,
      requirement: '50+ total PR reviews (proxy for refactoring/cleanup)',
      category: 'Coding'
    }
  ];
}

export function getAvatar(level: number, currentStreak: number, totalStars: number, actions: TodayActions, todayCount: number, customSettings?: any): AvatarData {
  // Default values
  const defaults = {
    bases: [
      { min: 20, val: "🧙‍♂️", label: "Archmage" },
      { min: 15, val: "🦸‍♂️", label: "Superhero" },
      { min: 10, val: "👨‍💻", label: "Senior Dev" },
      { min: 5, val: "🐒", label: "Code Monkey" },
      { min: 0, val: "👶", label: "Newbie" }
    ],
    weapons: [
      { min: 20, val: "⚡", label: "Legendary Lightning" },
      { min: 12, val: "🪓", label: "Battle Axe" },
      { min: 7, val: "🗡️", label: "Iron Sword" },
      { min: 4, val: "🔨", label: "Heavy Hammer" },
      { min: 1, val: "🦴", label: "Primitive Stick" }
    ],
    shields: [
      { min: 3, val: "💠", label: "Energy Shield" },
      { min: 1, val: "🛡️", label: "Wooden Shield" }
    ],
    headgear: [
      { min: 30, val: "👑", label: "God Crown" },
      { min: 14, val: "🪖", label: "Steel Helmet" },
      { min: 7, val: "🧢", label: "Lucky Cap" }
    ],
    companions: [
      { min: 500, val: "🐉", label: "Ancient Dragon" },
      { min: 100, val: "🦄", label: "Unicorn" },
      { min: 20, val: "🐕", label: "Loyal Dog" }
    ]
  };

  const s = customSettings || defaults;

  const findBest = (list: any[], val: number) => {
    return list.sort((a, b) => b.min - a.min).find(item => val >= item.min);
  };

  const renderItem = (item: any) => {
    if (!item) return "";
    const val = item.val;
    if (val.startsWith('http') || val.startsWith('data:image')) {
      return `<img src="${val}" style="width: 1em; height: 1em; object-fit: contain; vertical-align: middle;" />`;
    }
    return val;
  };

  const baseItem = findBest(s.bases || defaults.bases, level);
  const weaponItem = findBest(s.weapons || defaults.weapons, Math.max(actions.commits, todayCount));
  const shieldItem = findBest(s.shields || defaults.shields, actions.reviews);
  const headgearItem = findBest(s.headgear || defaults.headgear, currentStreak);
  const companionItem = findBest(s.companions || defaults.companions, totalStars);

  const base = renderItem(baseItem);
  const weapon = renderItem(weaponItem);
  const shield = renderItem(shieldItem);
  const headgear = renderItem(headgearItem);
  const companion = renderItem(companionItem);

  const description = `Level ${level} Character: ${weaponItem?.label || 'Unarmed'}, ${shieldItem?.label || 'No Shield'}, ${headgearItem?.label || 'No Headgear'}, ${companionItem?.label || 'Lone Wolf'}.`;

  return { base, weapon, shield, headgear, companion, full: "", description };
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

export async function calculateRPGStats(pastAndPresentData: ContributionDay[], timeline: TimelineActivity, todayCount: number, currentStreak: number, velocity: string, totalStars: number, socials: SocialStats, pinned: PinnedProject[], longestStreak: number) {
  let totalXPWithBonuses = 0;
  let totalCommits = 0;
  pastAndPresentData.forEach(day => {
    totalCommits += day.count;
    let dayXP = day.count;
    if (day.count >= 5) {
      dayXP += Math.floor(day.count / 5) * 2;
    }
    totalXPWithBonuses += dayXP;
  });
  totalXPWithBonuses += (timeline.pullRequestReviews * 3);

  // Skill Tree Calculation & Bonuses
  const tempLevel = Math.floor(Math.sqrt(totalXPWithBonuses / 25));
  const skills = calculateSkills(timeline, socials, pinned, tempLevel, longestStreak, totalCommits);
  const unlockedSkillsCount = skills.filter(s => s.unlocked).length;
  
  // Add +20 XP for each unlocked skill
  totalXPWithBonuses += (unlockedSkillsCount * 20);

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
  
  // Skill Bonus (+1 to today's score per unlocked skill)
  const skillComboBonus = unlockedSkillsCount;
  
  const todayScore = (heatmapCommits + actions.reviews * 2 + actions.repos * 3) + streakBonus + velocityBonus + skillComboBonus;
  
  const { todayCombo, todayComboReason } = getCombo(todayScore, actions);
  const fib = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];
  const todayComboMath = `Score: ${todayScore} ((Commits:${heatmapCommits}) + (Reviews:${actions.reviews}*2) + (Repos:${actions.repos}*3) + (Streak:${streakBonus}) + (Vel:${velocityBonus}) + (Skills:${skillComboBonus})). Next level at ${fib[todayCombo] || '??'} XP.`;

  const settings = await chrome.storage.local.get(['customAvatarSettings']);
  const avatar = getAvatar(currentLevel, currentStreak, totalStars, actions, heatmapCommits, settings.customAvatarSettings);

  return {
    totalXP: totalXPWithBonuses, level: currentLevel, levelTitle, levelProgressXP: xpProgress, levelTotalXP: xpNeeded, progressPercent,
    todayCombo, todayComboReason, todayComboMath, xpToNext: nextLevelXP - totalXPWithBonuses,
    avatar, skills
  };
}
