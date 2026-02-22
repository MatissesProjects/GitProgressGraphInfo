import { TimelineActivity, SocialStats, PinnedProject, ContributionDay, CreatedRepo, RepoActivity, TodayActions } from '../types';

export function parseActivityTimeline(): TimelineActivity {
  const repoCommits: Record<string, number> = {};
  let createdRepos = 0;
  let createdRepoList: CreatedRepo[] = [];
  let issuesOpened = 0;
  let pullRequests = 0;
  let pullRequestReviews = 0;
  let mergedPullRequests = 0;
  
  const todayActions: TodayActions = { commits: 0, repos: 0, issues: 0, prs: 0, reviews: 0 };
  
  const activityItems = document.querySelectorAll('.TimelineItem');
  let isTodaySection = false;
  
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayLabelShort = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // "Feb 20"
  const todayLabelLong = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });   // "February 20"

  activityItems.forEach(item => {
    // 1. Better Section Detection (Headers)
    const breakEl = item.querySelector('.TimelineItem-break, .TimelineItem-section-title, h3');
    if (breakEl) {
      const text = breakEl.textContent?.trim() || "";
      if (text.includes('Today') || text.includes(todayLabelShort) || text.includes(todayLabelLong)) {
        isTodaySection = true;
      } else if (text.match(/^[A-Z][a-z]+ \d+/) || text.includes('Yesterday')) {
        isTodaySection = false;
      }
    }

    const body = item.querySelector('.TimelineItem-body');
    if (!body) return;

    // 2. Relative Time Detection (Sync with graph's todayStr)
    const timeEl = body.querySelector('relative-time');
    if (timeEl) {
      const dt = timeEl.getAttribute('datetime');
      if (dt) {
        // Convert UTC datetime to local YYYY-MM-DD
        const itemDate = new Date(dt);
        const itemLocalDate = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`;
        if (itemLocalDate === todayStr) {
          isTodaySection = true;
        }
      }
    }

    const bodyText = body.textContent?.trim() || "";

    // Commits
    if (bodyText.includes('commits in')) {
      const match = bodyText.match(/(\d+) commit/i);
      const count = match ? parseInt(match[1], 10) : 0;
      if (isTodaySection) todayActions.commits += count;

      const listItems = body.querySelectorAll('li');
      listItems.forEach(li => {
        const link = li.querySelector('a');
        if (link) {
          const repoName = link.textContent?.trim() || "";
          const liText = li.textContent?.trim() || "";
          const commitMatch = liText.match(/(\d+)\s+commit/);
          if (commitMatch && repoName && repoName.includes('/')) {
            repoCommits[repoName] = (repoCommits[repoName] || 0) + parseInt(commitMatch[1], 10);
          }
        }
      });
    }

    // Created Repos
    if (bodyText.includes('Created') && bodyText.includes('repositor') && !bodyText.includes('commits in')) {
      const match = bodyText.match(/Created (\d+) repositor/i);
      const count = match ? parseInt(match[1], 10) : (bodyText.includes('Created a repository') ? 1 : 0);
      createdRepos += count;
      if (isTodaySection) todayActions.repos += count;
      
      const listItems = body.querySelectorAll('li, div.py-1');
      listItems.forEach(li => {
        const link = li.querySelector('a');
        if (link) {
          const name = link.textContent?.trim() || "";
          if (name && name.includes('/') && !name.includes(' ')) {
            const language = li.querySelector('[itemprop="programmingLanguage"]')?.textContent?.trim() || "";
            if (!createdRepoList.some(r => r.name === name)) {
              createdRepoList.push({ name, language });
            }
          }
        }
      });
    }

    // Issues
    if ((bodyText.includes('Opened') || bodyText.includes('Created')) && bodyText.includes('issue')) {
      const match = bodyText.match(/(?:Opened|Created) (\d+) (?:other )?issue/i);
      const count = match ? parseInt(match[1], 10) : 1;
      issuesOpened += count;
      if (isTodaySection) todayActions.issues += count;
    }

    // PRs & Reviews
    if (bodyText.includes('pull request')) {
      if (bodyText.includes('Proposed') || bodyText.includes('Opened')) {
        const match = bodyText.match(/(?:Proposed|Opened) (\d+) (?:other )?pull request/i);
        const count = match ? parseInt(match[1], 10) : 1;
        pullRequests += count;
        if (isTodaySection) todayActions.prs += count;
      }
      if (bodyText.includes('Merged')) {
        const match = bodyText.match(/Merged (\d+) (?:other )?pull request/i);
        const count = match ? parseInt(match[1], 10) : 1;
        mergedPullRequests += count;
        if (isTodaySection) todayActions.prs += count;
      }
      if (bodyText.includes('Reviewed')) {
        const match = bodyText.match(/Reviewed (\d+) (?:other )?pull request/i);
        const count = match ? parseInt(match[1], 10) : 1;
        pullRequestReviews += count;
        if (isTodaySection) todayActions.reviews += count;
      }
    }
  });

  const topRepos = Object.entries(repoCommits)
    .map(([name, commits]) => ({ name, commits }))
    .sort((a, b) => b.commits - a.commits);

  return { 
    topRepos, createdRepos, createdRepoList, issuesOpened, pullRequests, pullRequestReviews, mergedPullRequests, todayActions
  };
}

export function parseAchievements(): string[] {
  const achievements: string[] = [];
  const badges = document.querySelectorAll('.achievement-badge-sidebar, .js-achievement-badge-card img');
  badges.forEach(badge => {
    const alt = badge.getAttribute('alt') || "";
    if (alt && !achievements.includes(alt)) {
      achievements.push(alt.replace("Achievement: ", ""));
    }
  });
  return achievements;
}

export function parseSocials(): SocialStats {
  const followersText = document.querySelector('a[href*="?tab=followers"] span')?.textContent?.trim() || "0";
  const followingText = document.querySelector('a[href*="?tab=following"] span')?.textContent?.trim() || "0";
  const orgs = document.querySelectorAll('.avatar-group-item').length;

  const parseNum = (txt: string) => {
    if (txt.includes('k')) return parseFloat(txt) * 1000;
    return parseInt(txt.replace(/,/g, ''), 10) || 0;
  };

  return {
    followers: parseNum(followersText),
    following: parseNum(followingText),
    organizations: orgs
  };
}

export function parsePinnedProjects(): PinnedProject[] {
  const projects: PinnedProject[] = [];
  const pinnedItems = document.querySelectorAll('.pinned-item-list-item-content');

  pinnedItems.forEach((item) => {
    const name = item.querySelector('a.Link')?.textContent?.trim() || "";
    const language = item.querySelector('[itemprop="programmingLanguage"]')?.textContent?.trim() || "Unknown";
    const languageColor = (item.querySelector('.repo-language-color') as HTMLElement)?.style?.backgroundColor || "";
    
    let stars = 0;
    let forks = 0;
    
    const links = item.querySelectorAll('a.pinned-item-meta');
    links.forEach(link => {
      const text = link.textContent?.trim() || "";
      const href = link.getAttribute('href') || "";
      const count = parseInt(text.replace(/,/g, ''), 10) || 0;
      
      if (href.includes('/stargazers')) {
        stars = count;
      } else if (href.includes('/forks') || href.includes('/network/members')) {
        forks = count;
      }
    });

    if (name) {
      projects.push({ name, stars, forks, language, languageColor });
    }
  });

  return projects;
}

export function parseContributionGraph(): ContributionDay[] | null {
  const days = document.querySelectorAll('.ContributionCalendar-day');
  const contributionData: ContributionDay[] = [];

  days.forEach((day) => {
    const date = day.getAttribute('data-date');
    const level = parseInt(day.getAttribute('data-level') || '0', 10);
    
    if (date) {
      let count = 0;
      const id = day.getAttribute('id');
      if (id) {
        const tooltip = document.querySelector(`tool-tip[for="${id}"]`);
        if (tooltip) {
          count = parseCountText(tooltip.textContent || "");
        }
      }

      if (count === 0 && level > 0) {
        const ariaLabel = day.getAttribute('aria-label');
        const title = day.getAttribute('title');
        count = parseCountText(ariaLabel || title || "");
      }

      contributionData.push({ date, level, count });
    }
  });

  if (contributionData.length === 0) return null;
  return contributionData;
}

function parseCountText(text: string): number {
  if (!text) return 0;
  if (text.toLowerCase().includes("no contribution")) return 0;
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}
