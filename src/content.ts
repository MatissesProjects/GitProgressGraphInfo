import { 
  parseContributionGraph, 
  parsePinnedProjects, 
  parseActivityTimeline, 
  parseAchievements, 
  parseSocials 
} from './modules/scraper';
import { 
  calculateThresholds, 
  calculatePercentiles, 
  calculateAdvancedStats 
} from './modules/analytics';
import { applyDeepRecoloring } from './modules/theme';
import { injectStats, extendLegend, applyVisibility } from './modules/ui';

function init() {
  console.log("GitHeat: Initializing...");
  const isContextValid = () => !!chrome.runtime?.id;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!isContextValid()) return;
    if (request.action === "getStats") {
      const data = parseContributionGraph();
      const pinned = parsePinnedProjects();
      const timeline = parseActivityTimeline();
      const achievements = parseAchievements();
      const socials = parseSocials();
      if (data) {
        const thresholds = calculateThresholds(data);
        const percentiles = calculatePercentiles(data);
        const advanced = calculateAdvancedStats(data, pinned, timeline, achievements, socials);
        let total = data.reduce((sum, day) => sum + day.count, 0);
        if (advanced.isYTD) {
          const currentYear = new Date().getFullYear();
          const ytdData = data.filter(d => d.date >= `${currentYear}-01-01`);
          if (ytdData.length > 0) total = ytdData.reduce((sum, day) => sum + day.count, 0);
        }
        sendResponse({ thresholds, percentiles, total, advanced, success: true });
      } else {
        sendResponse({ success: false, error: "No graph found" });
      }
    }
    return true;
  });

  chrome.storage.onChanged.addListener(async (changes) => {
    if (!isContextValid()) return;
    const visibilityKeys = ['showGrid', 'showActiveRepos', 'showCreatedRepos', 'showAchievements', 'showPersona', 'showFooter', 'showLegendNumbers', 'showTotal', 'showStreak', 'showVelocity', 'showConsistency', 'showWeekend', 'showSlump', 'showBestDay', 'showWorstDay', 'showMostActiveDay', 'showTodayCount', 'showCurrentWeekday', 'showMaxCommits', 'showIsland', 'showSlumpIsland', 'showPowerDay', 'showPeakDay', 'showStars', 'showPR', 'showIssueCreated', 'showLangs', 'showNetwork', 'showBestMonth', 'showBestWeek', 'showLevel'];
    if (visibilityKeys.some(key => changes[key])) applyVisibility();
    if (changes.gridOrder) runAnalysis().catch(() => {});
    if (changes.theme || changes.customStart || changes.customStop) {
      const data = parseContributionGraph();
      if (data) {
        const p = calculatePercentiles(data);
        const s = await chrome.storage.local.get('theme');
        await applyDeepRecoloring(data, p, (s.theme as string) || 'green');
      }
    }
  });

  let isAnalysisRunning = false;
  const runAnalysis = async () => {
    if (!isContextValid() || isAnalysisRunning) return;
    isAnalysisRunning = true;
    try {
      const data = parseContributionGraph();
      const pinned = parsePinnedProjects();
      const timeline = parseActivityTimeline();
      const achievements = parseAchievements();
      const socials = parseSocials();
      if (data) {
        const t = calculateThresholds(data), p = calculatePercentiles(data);
        const s = await chrome.storage.local.get(['theme', 'gridOrder']);
        const theme = (s.theme as string) || 'green', order = (s.gridOrder as string[]) || null;
        const advanced = calculateAdvancedStats(data, pinned, timeline, achievements, socials);
        injectStats(t, p, data, advanced, order);
        extendLegend(t);
        await applyDeepRecoloring(data, p, theme);
        await applyVisibility();
      }
    } catch (e) {} finally { isAnalysisRunning = false; }
  };

  const observer = new MutationObserver((mutations) => {
    if (!isContextValid()) { observer.disconnect(); return; }
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        if (document.querySelector('.js-yearly-contributions') && !document.getElementById('git-heat-stats')) {
          runAnalysis().catch(() => {});
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  runAnalysis().catch(() => {});
}

init();
