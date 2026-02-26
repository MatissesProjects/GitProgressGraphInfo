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
  console.log("GitHeat Standalone: Initializing on " + window.location.href + "...");
  
  // Mock chrome API
  (window as any).chrome = {
    storage: {
      local: {
        get: (keys: string[] | any) => {
          const defaults: any = {};
          if (Array.isArray(keys)) {
            keys.forEach(k => (defaults as any)[k] = true); // Default to true for everything
          } else if (typeof keys === 'object') {
            Object.keys(keys).forEach(k => (defaults as any)[k] = true);
          }
          return Promise.resolve(defaults);
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
      await applyDeepRecoloring(data, p, 'green');
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
