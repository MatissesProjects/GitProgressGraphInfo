interface ContributionDay {
  date: string;
  level: number;
  count: number;
}

function parseContributionGraph() {
  console.log("GitHeat: Starting to parse contribution graph...");

  const days = document.querySelectorAll('.ContributionCalendar-day');
  const contributionData: ContributionDay[] = [];

  days.forEach((day) => {
    const date = day.getAttribute('data-date');
    const level = parseInt(day.getAttribute('data-level') || '0', 10);
    
    if (date) {
      // Find the contribution count.
      let count = 0;
      
      // Method 1: Check for tool-tip element (Modern GitHub)
      const id = day.getAttribute('id');
      if (id) {
        const tooltip = document.querySelector(`tool-tip[for="${id}"]`);
        if (tooltip) {
          count = parseCountText(tooltip.textContent || "");
        }
      }

      // Method 2: Check aria-label or title as fallback
      if (count === 0 && level > 0) {
        const ariaLabel = day.getAttribute('aria-label');
        const title = day.getAttribute('title');
        count = parseCountText(ariaLabel || title || "");
      }

      // Method 3: Check for sr-only text inside or nearby
      // (Some versions of GitHub have hidden text for screen readers)

      contributionData.push({ date, level, count });
    }
  });

  if (contributionData.length === 0) {
    console.warn("GitHeat: No contribution data found. Is this a GitHub profile page?");
    return null;
  }

  console.log(`GitHeat: Parsed ${contributionData.length} days.`);
  return contributionData;
}

function parseCountText(text: string): number {
  if (!text) return 0;
  // Matches "12 contributions", "1 contribution", "No contributions"
  if (text.toLowerCase().includes("no contribution")) return 0;
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function calculateThresholds(data: ContributionDay[]) {
  const levels: Record<number, number[]> = {
    1: [],
    2: [],
    3: [],
    4: []
  };

  data.forEach(day => {
    if (day.level > 0 && day.count > 0) {
      levels[day.level].push(day.count);
    }
  });

  const thresholds: Record<number, { min: number; max: number }> = {};

  for (let l = 1; l <= 4; l++) {
    const counts = levels[l].sort((a, b) => a - b);
    if (counts.length > 0) {
      thresholds[l] = {
        min: counts[0],
        max: counts[counts.length - 1]
      };
    }
  }

  return thresholds;
}

function calculatePercentiles(data: ContributionDay[]) {
  const activeDays = data.filter(d => d.count > 0).map(d => d.count).sort((a, b) => a - b);
  if (activeDays.length === 0) return {};

  const percentiles: Record<number, number> = {};
  const markers = [10, 25, 50, 75, 90, 95, 99];
  
  markers.forEach(m => {
    const index = Math.ceil((m / 100) * activeDays.length) - 1;
    percentiles[m] = activeDays[Math.min(index, activeDays.length - 1)];
  });

  return percentiles;
}

// Color Themes
const THEMES: Record<string, string[]> = {
  flame: [
    '#ebedf0', '#ffeecc', '#ffdd99', '#ffcc66', '#ffbb44', '#ff9922', 
    '#ff7711', '#ff5500', '#dd3300', '#bb1100', '#880000', '#550000'
  ],
  green: [
    '#ebedf0', '#e6ffed', '#d1f2d9', '#9be9a8', '#7bc96f', '#40c463',
    '#30a14e', '#216e39', '#196127', '#124d1f', '#0c3a17', '#06250e'
  ]
};

function interpolateColor(color1: string, color2: string, factor: number) {
  const hex = (x: number) => {
    const s = x.toString(16);
    return s.length === 1 ? '0' + s : s;
  };

  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);

  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);

  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));

  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function generateCustomScale(start: string, stop: string): string[] {
  const scale = [start];
  for (let i = 1; i <= 11; i++) {
    scale.push(interpolateColor(start, stop, i / 11));
  }
  return scale;
}

async function applyDeepRecoloring(data: ContributionDay[], percentiles: Record<number, number>, themeName: string = 'green') {
  const days = document.querySelectorAll('.ContributionCalendar-day');
  
  let colors: string[];
  if (themeName === 'custom') {
    const settings = await chrome.storage.local.get(['customStart', 'customStop']);
    colors = generateCustomScale((settings.customStart as string) || '#ebedf0', (settings.customStop as string) || '#216e39');
  } else {
    colors = THEMES[themeName] || THEMES.green;
  }
  
  const getGranularLevel = (count: number) => {
    if (count === 0) return 0;
    if (count >= (percentiles[99] || 999)) return 11;
    if (count >= (percentiles[95] || 999)) return 10;
    if (count >= (percentiles[90] || 999)) return 9;
    if (count >= (percentiles[75] || 999)) return 8;
    if (count >= (percentiles[50] || 999)) return 5;
    if (count >= (percentiles[25] || 999)) return 3;
    if (count >= (percentiles[10] || 999)) return 1;
    return 1;
  };

  days.forEach((day: any) => {
    const date = day.getAttribute('data-date');
    const dayData = data.find(d => d.date === date);
    if (dayData && dayData.count > 0) {
      const level = getGranularLevel(dayData.count);
      const color = colors[level];
      day.style.setProperty('background-color', color, 'important');
      day.style.setProperty('fill', color, 'important');
      day.style.outline = 'none';
      day.style.border = 'none';
    }
  });
}

function init() {
  console.log("GitHeat: Initializing...");
  
  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getStats") {
      const data = parseContributionGraph();
      if (data) {
        const thresholds = calculateThresholds(data);
        const percentiles = calculatePercentiles(data);
        const total = data.reduce((sum, day) => sum + day.count, 0);
        sendResponse({ thresholds, percentiles, total, success: true });
      } else {
        sendResponse({ success: false, error: "No graph found" });
      }
    }
    return true; // Keep channel open for async
  });

  // Listen for storage changes to update theme instantly
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.theme || changes.customStart || changes.customStop) {
      const data = parseContributionGraph();
      if (data) {
        const percentiles = calculatePercentiles(data);
        chrome.storage.local.get('theme').then(settings => {
          applyDeepRecoloring(data, percentiles, settings.theme as string || 'green');
        });
      }
    }
  });

  // Wait for the graph to load for injection
  const observer = new MutationObserver((mutations, obs) => {
    const graph = document.querySelector('.js-yearly-contributions');
    if (graph) {
      setTimeout(async () => {
        const data = parseContributionGraph();
        if (data) {
          const thresholds = calculateThresholds(data);
          const percentiles = calculatePercentiles(data);
          
          const settings = await chrome.storage.local.get('theme');
          const theme = (settings.theme as string) || 'green';
          
          injectStats(thresholds, data);
          extendLegend(thresholds);
          await applyDeepRecoloring(data, percentiles, theme);
        }
      }, 500);
      obs.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function injectStats(thresholds: any, data: ContributionDay[]) {
  const container = document.querySelector('.js-yearly-contributions');
  if (!container) return;

  // Check if we already injected
  if (document.getElementById('git-heat-stats')) return;

  const totalContributions = data.reduce((sum, day) => sum + day.count, 0);
  const sortedData = [...data].sort((a, b) => b.count - a.count);
  const busiestDay = sortedData[0];

  const statsDiv = document.createElement('div');
  statsDiv.id = 'git-heat-stats';
  statsDiv.className = 'git-heat-panel border color-border-muted color-bg-subtle rounded-2 p-3 mb-3';
  statsDiv.style.marginTop = '16px';

  statsDiv.innerHTML = `
    <h3 class="h4 mb-2">GitHeat Analysis</h3>
    <div class="d-flex flex-wrap gap-3">
      <div class="stat-item">
        <span class="color-fg-muted">Total (Year):</span>
        <strong class="color-fg-default">${totalContributions}</strong>
      </div>
      <div class="stat-item">
        <span class="color-fg-muted">Busiest Day:</span>
        <strong class="color-fg-default">${busiestDay.count} (${busiestDay.date})</strong>
      </div>
      <div class="stat-item">
        <span class="color-fg-muted">Level 4 Cutoff:</span>
        <strong class="color-fg-success">${thresholds[4]?.min || 'N/A'}+</strong>
      </div>
    </div>
    <div class="mt-2 pt-2 border-top color-border-muted">
      <span class="color-fg-muted text-small">Detected Thresholds: </span>
      <span class="d-inline-flex gap-2 text-small">
        <span class="badge color-bg-done-emphasis color-fg-on-emphasis" style="background-color: var(--color-calendar-graph-day-L1-bg) !important; color: var(--color-fg-default) !important; border: 1px solid var(--color-border-default)">L1: ${thresholds[1]?.min ?? '?'}-${thresholds[1]?.max ?? '?'}</span>
        <span class="badge color-bg-done-emphasis color-fg-on-emphasis" style="background-color: var(--color-calendar-graph-day-L2-bg) !important; color: var(--color-fg-default) !important; border: 1px solid var(--color-border-default)">L2: ${thresholds[2]?.min ?? '?'}-${thresholds[2]?.max ?? '?'}</span>
        <span class="badge color-bg-done-emphasis color-fg-on-emphasis" style="background-color: var(--color-calendar-graph-day-L3-bg) !important; color: var(--color-fg-default) !important; border: 1px solid var(--color-border-default)">L3: ${thresholds[3]?.min ?? '?'}-${thresholds[3]?.max ?? '?'}</span>
        <span class="badge color-bg-done-emphasis color-fg-on-emphasis" style="background-color: var(--color-calendar-graph-day-L4-bg) !important; color: var(--color-fg-default) !important; border: 1px solid var(--color-border-default)">L4: ${thresholds[4]?.min ?? '?'}+</span>
      </span>
    </div>
  `;

  container.prepend(statsDiv);
}

function extendLegend(thresholds: any) {
  // GitHub legend is usually at the bottom of the graph
  const legend = document.querySelector('.ContributionCalendar-footer');
  if (!legend) return;

  const squares = legend.querySelectorAll('.ContributionCalendar-day');
  squares.forEach(square => {
    const level = parseInt(square.getAttribute('data-level') || '0', 10);
    if (level > 0 && thresholds[level]) {
      const range = level === 4 ? `${thresholds[level].min}+` : `${thresholds[level].min}-${thresholds[level].max}`;
      const span = document.createElement('span');
      span.className = 'text-small color-fg-muted ml-1';
      span.style.fontSize = '10px';
      span.style.marginLeft = '2px';
      span.style.marginRight = '4px';
      span.textContent = range;
      square.after(span);
    }
  });
}

init();
