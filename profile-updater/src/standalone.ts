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
import { VISIBILITY_KEYS } from '../../src/modules/constants';

async function runStandalone() {
  console.log("GitHeat Standalone: Initializing (v1.2 - Quantile Scale) on " + window.location.href + "...");
  
  // Read configuration injected by Puppeteer
  const config = (window as any).githeatConfig || { startColor: '#4a207e', stopColor: '#04ff00', animationSpeed: 8, animationStyle: 'hue' };
  const { startColor, stopColor, animationSpeed, animationStyle } = config;
  console.log(`Using custom colors: ${startColor} to ${stopColor}, Animation: ${animationStyle} at ${animationSpeed}s`);

  // Mock chrome API
  (window as any).chrome = {
    storage: {
      local: {
        get: (keys: string | string[] | null) => {
          const settings: any = {
            theme: 'custom',
            customStart: startColor,
            customStop: stopColor,
            animationSpeed: animationSpeed || 8,
            animationStyle: Array.isArray(animationStyle) ? animationStyle : [animationStyle || 'hue'],
            showTrends: true,
            showColorAnimation: true
          };

          // Default all visibility keys to true for standalone (full report)
          VISIBILITY_KEYS.forEach(key => {
            if (settings[key] === undefined) settings[key] = true;
          });

          if (keys === null) return Promise.resolve(settings);
          if (typeof keys === 'string') return Promise.resolve({ [keys]: settings[keys] });
          if (Array.isArray(keys)) {
            const result: any = {};
            keys.forEach(k => result[k] = settings[k]);
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
      const advanced = await calculateAdvancedStats(data, pinned, timeline, achievements, socials, true, p);
      
      await injectStats(t, p, data, advanced, null, true);
      await extendLegend(t);
      await applyDeepRecoloring(data, p, 'custom', startColor, stopColor, advanced.ytdDailyCounts);
      await applyVisibility();
      
      console.log("GitHeat Standalone: Analysis complete.");
    } else {
      console.error("GitHeat Standalone: No graph found.");
    }
    
    // Always signal completion so we don't just time out
    document.body.classList.add('githeat-ready');
  } catch (e: any) {
    console.error("GitHeat Standalone: Error during analysis:", e);
    if (e.stack) console.error(e.stack);
    document.body.classList.add('githeat-failed');
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
