import { 
  parseContributionGraph, 
  parsePinnedProjects, 
  parseActivityTimeline, 
  parseAchievements, 
  parseSocials,
  isOwnProfile
} from './modules/scraper';
import { 
  calculateThresholds, 
  calculatePercentiles, 
  calculateAdvancedStats 
} from './modules/analytics';
import { applyDeepRecoloring } from './modules/theme';
import { injectStats, extendLegend, applyVisibility } from './modules/ui';
import { VISIBILITY_KEYS } from './modules/constants';
import { GitHeatSettings, YearlyStats, AdvancedStats } from './types';

function init() {
  console.log("GitHeat: Initializing...");
  const isContextValid = () => !!chrome.runtime?.id;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!isContextValid()) return;
    if (request.action === "getStats") {
      try {
        const data = parseContributionGraph();
        const pinned = parsePinnedProjects();
        const timeline = parseActivityTimeline();
        const achievements = parseAchievements();
        const socials = parseSocials();
        if (data) {
          const thresholds = calculateThresholds(data);
          const percentiles = calculatePercentiles(data);
          calculateAdvancedStats(data, pinned, timeline, achievements, socials, true, percentiles).then(advanced => {
            let total = data.reduce((sum, day) => sum + day.count, 0);
            if (advanced.isYTD) {
              const currentYear = new Date().getFullYear();
              const ytdData = data.filter(d => d.date >= `${currentYear}-01-01`);
              if (ytdData.length > 0) total = ytdData.reduce((sum, day) => sum + day.count, 0);
            }
            sendResponse({ thresholds, percentiles, total, advanced, success: true });
          });
        } else {
          sendResponse({ success: false, error: "No graph found" });
        }
      } catch (e) {
        console.error("GitHeat: Error in message listener", e);
        sendResponse({ success: false, error: "Internal error" });
      }
    }
    return true;
  });

  chrome.storage.onChanged.addListener(async (changes) => {
    if (!isContextValid()) return;
    console.log("GitHeat: Storage changed", Object.keys(changes));

    if (VISIBILITY_KEYS.some(key => changes[key])) {
      console.log("GitHeat: Visibility key changed, applying...");
      await applyVisibility();
      if (changes.showTrends) runAnalysis().catch(() => {});
    }

    if (changes.gridOrder || changes.islandWrapAround || changes.customAvatar) {
      console.log("GitHeat: Structural setting changed, re-analyzing...");
      runAnalysis().catch(() => {});
    }

    const themeKeys: (keyof GitHeatSettings)[] = ['theme', 'customStart', 'customStop', 'colorMode', 'showColorAnimation', 'animationSpeed', 'animationStyle'];
    if (themeKeys.some(key => changes[key])) {
      console.log("GitHeat: Theme or Animation setting changed, recoloring...");
      const data = parseContributionGraph();
      if (data) {
        const p = calculatePercentiles(data);
        const s = await chrome.storage.local.get(themeKeys) as GitHeatSettings;
        await applyDeepRecoloring(data, p, s.theme || 'green', s.customStart, s.customStop, undefined, s.colorMode);
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
        const s = await chrome.storage.local.get(null) as GitHeatSettings;
        const theme = s.theme || 'green', order = s.gridOrder || null;
        const wrapAround = true; 
        const showTrends = s.showTrends !== false;
        
        const advanced = await calculateAdvancedStats(data, pinned, timeline, achievements, socials, wrapAround, p, s.customAvatar);
        
        // Save own character if on own profile
        if (isOwnProfile()) {
          console.log("GitHeat: Saving own character stats...");
          await chrome.storage.local.set({ ownCharacter: advanced });
        }

        const { ownCharacter } = await chrome.storage.local.get(['ownCharacter']) as { ownCharacter?: AdvancedStats };

        let yearlyComparison: YearlyStats[] = [];
        if (s.showYearComparison) {
          try {
            const { compareYears } = await import('./modules/analytics');
            yearlyComparison = await compareYears(pinned, timeline, achievements, socials, s.customAvatar);
          } catch (e) {
            console.error("GitHeat: Year comparison error", e);
          }
        }

        await injectStats(t, p, data, advanced, order, showTrends, yearlyComparison, ownCharacter);
        await extendLegend(t);
        await applyDeepRecoloring(data, p, theme, s.customStart, s.customStop, advanced.ytdDailyCounts, s.colorMode);
        await applyVisibility();
      }
    } catch (e) {
      console.error("GitHeat: Analysis error", e);
    } finally { isAnalysisRunning = false; }
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

