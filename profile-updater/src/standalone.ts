import { 
  parseContributionGraph, 
  parsePinnedProjects, 
  parseActivityTimeline, 
  parseAchievements, 
  parseSocials 
} from '../../src/modules/scraper';
import { 
  calculateThresholds, 
  calculatePercentiles, 
  calculateAdvancedStats 
} from '../../src/modules/analytics';
import { applyDeepRecoloring } from '../../src/modules/theme';
import { injectStats, extendLegend, applyVisibility } from '../../src/modules/ui';

async function runStandalone() {
  console.log("GitHeat Standalone: Initializing (v1.2 - Quantile Scale) on " + window.location.href + "...");
  
  // Mock chrome API
  (window as any).chrome = {
    storage: {
      local: {
        get: (keys: string[] | any) => {
          const settings: any = {
            // Panel Sections (All Checked)
            showGrid: true,
            showPersona: true,
            showActiveRepos: true,
            showCreatedRepos: true,
            showAchievements: true,
            showFooter: true,
            showLegendNumbers: true,
            
            // Main Grid Items (Checked)
            showTotal: true,
            showTodayCount: true,
            showStreak: true,
            showLevel: true,
            showBestMonth: true,
            showBestWeek: true,
            showIsland: true,
            showSlumpIsland: true,
            showVelocity: true,
            showVelocityAbove: true,
            showVelocityBelow: true,
            showConsistency: true,
            showWeekend: true,
            showSlump: true,
            showBestDay: true,
            showWorstDay: true,
            showCurrentWeekday: true,
            showPeakDay: true,
            showMaxCommits: true,

            // Main Grid Items (Unchecked)
            showPowerDay: false,
            showMostActiveDay: false,
            showStars: false,
            showPR: false,
            showIssueCreated: false,
            showLangs: false,
            showNetwork: false,

            theme: 'custom',
            customStart: '#4a207e',
            customStop: '#04ff00'
          };

          if (typeof keys === 'string') return Promise.resolve({ [keys]: (settings as any)[keys] });
          if (Array.isArray(keys)) {
            const result: any = {};
            keys.forEach(k => result[k] = (settings as any)[k] ?? true);
            return Promise.resolve(result);
          }
          return Promise.resolve(settings);
        }
      },
      onChanged: { addListener: () => {} }
    },
    runtime: { id: 'standalone' }
  };

  try {
    const data = parseContributionGraph();
    const pinned = parsePinnedProjects();
    const timeline = parseActivityTimeline();
    const achievements = parseAchievements();
    const socials = parseSocials();
    
    if (data) {
      console.log("Graph found with " + data.length + " days of data, calculating stats...");
      const t = calculateThresholds(data);
      const p = calculatePercentiles(data);
      const advanced = calculateAdvancedStats(data, pinned, timeline, achievements, socials, true);
      
      injectStats(t, p, data, advanced, null);
      extendLegend(t);
      await applyDeepRecoloring(data, p, 'custom', '#4a207e', '#04ff00');
      await applyVisibility();
      
      console.log("GitHeat Standalone: Analysis complete.");
    } else {
      console.error("GitHeat Standalone: No graph found. Looking for .ContributionCalendar-day elements...");
      const days = document.querySelectorAll('.ContributionCalendar-day');
      console.log("Found " + days.length + " calendar day elements.");
      
      if (days.length === 0) {
        console.log("DOM state: " + (document.querySelector('.js-yearly-contributions') ? "Container found" : "Container NOT found"));
      }
    }
    
    // Always signal completion so we don't just time out
    document.body.classList.add('githeat-ready');
  } catch (e: any) {
    console.error("GitHeat Standalone: Error during analysis: " + e.message);
    document.body.classList.add('githeat-ready');
  }
}

// Wait for the graph to be present
if (document.querySelector('.js-yearly-contributions')) {
  runStandalone();
} else {
  const observer = new MutationObserver(() => {
    if (document.querySelector('.js-yearly-contributions')) {
      observer.disconnect();
      runStandalone();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
