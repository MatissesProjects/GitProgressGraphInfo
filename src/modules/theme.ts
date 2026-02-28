import { ContributionDay } from '../types';

export const THEMES: Record<string, string[]> = {
  flame: [
    '#ebedf0', '#ffeecc', '#ffdd99', '#ffcc66', '#ffbb44', '#ff9922', 
    '#ff7711', '#ff5500', '#dd3300', '#bb1100', '#880000', '#550000'
  ],
  green: [
    '#ebedf0', '#e6ffed', '#d1f2d9', '#9be9a8', '#7bc96f', '#40c463',
    '#30a14e', '#216e39', '#196127', '#124d1f', '#0c3a17', '#06250e'
  ],
  ocean: [
    '#ebedf0', '#e1f5fe', '#b3e5fc', '#81d4fa', '#4fc3f7', '#29b6f6',
    '#03a9f4', '#039be5', '#0288d1', '#0277bd', '#01579b', '#002f6c'
  ],
  sunset: [
    '#ebedf0', '#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a',
    '#ef3b2c', '#cb181d', '#a50f15', '#67000d', '#49000a', '#2d0006'
  ],
  monochrome: [
    '#ebedf0', '#f6f8fa', '#e6edf0', '#d0d7de', '#afb8c1', '#8c959f',
    '#6e7781', '#57606a', '#424a53', '#32383f', '#24292f', '#1b1f23'
  ]
};

export function interpolateColor(color1: string, color2: string, factor: number) {
  const hex = (x: number) => {
    const s = Math.max(0, Math.min(255, Math.round(x))).toString(16);
    return s.length === 1 ? '0' + s : s;
  };

  const parseToRgb = (c: string) => {
    c = (c || '').trim();
    if (c.startsWith('#')) {
      const h = c.replace('#', '');
      if (h.length === 3) {
        return {
          r: parseInt(h[0] + h[0], 16),
          g: parseInt(h[1] + h[1], 16),
          b: parseInt(h[2] + h[2], 16)
        };
      }
      return {
        r: parseInt(h.substring(0, 2), 16),
        g: parseInt(h.substring(2, 4), 16),
        b: parseInt(h.substring(4, 6), 16)
      };
    }
    if (c.startsWith('rgb')) {
      const parts = c.match(/\d+/g);
      if (parts && parts.length >= 3) {
        return { r: parseInt(parts[0]), g: parseInt(parts[1]), b: parseInt(parts[2]) };
      }
    }
    return { r: 235, g: 237, b: 240 };
  };

  const c1 = parseToRgb(color1);
  const c2 = parseToRgb(color2);

  const r = c1.r + factor * (c2.r - c1.r);
  const g = c1.g + factor * (c2.g - c1.g);
  const b = c1.b + factor * (c2.b - c1.b);

  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

export function generateCustomScale(start: string, stop: string, steps: number = 11): string[] {
  const scale = ['#161b22']; 
  for (let i = 0; i < steps; i++) {
    const factor = i / (steps - 1);
    scale.push(interpolateColor(start, stop, factor));
  }
  return scale;
}

export async function applyDeepRecoloring(data: ContributionDay[], percentiles: Record<number, number>, themeName: string = 'green', customStart?: string, customStop?: string) {
  console.log("GitHeat: Applying Deep Recoloring (v1.3 - High Resolution Gradient)...");
  const days = document.querySelectorAll('.ContributionCalendar-day');
  
  if (themeName === 'none') {
    days.forEach((day: any) => {
      day.style.removeProperty('background-color');
      day.style.removeProperty('fill');
    });
    return;
  }

  const pMarkers = [10, 20, 30, 40, 50, 60, 70, 75, 80, 85, 90, 95, 98, 99];
  const totalLevels = pMarkers.length + 1; // 15 levels

  let colors: string[];
  if (themeName === 'custom') {
    let start = customStart;
    let stop = customStop;

    if (!start || !stop) {
      try {
        const settings = await chrome.storage.local.get(['customStart', 'customStop']);
        start = start || (settings.customStart as string) || '#4a207e';
        stop = stop || (settings.customStop as string) || '#04ff00';
      } catch (e) {
        start = start || '#4a207e';
        stop = stop || '#04ff00';
      }
    }
    colors = generateCustomScale(start, stop, totalLevels);
  } else {
    // Interpolate predefined themes to match our 15-level scale
    const baseColors = THEMES[themeName] || THEMES.green;
    colors = [baseColors[0]]; // Index 0 is always the background
    const gradientColors = baseColors.slice(1);
    const steps = totalLevels;
    for (let i = 0; i < steps; i++) {
      const factor = i / (steps - 1);
      const colorIdx = factor * (gradientColors.length - 1);
      const low = Math.floor(colorIdx);
      const high = Math.ceil(colorIdx);
      const subFactor = colorIdx - low;
      colors.push(interpolateColor(gradientColors[low], gradientColors[high], subFactor));
    }
  }
  
  const getGranularLevel = (count: number) => {
    if (count <= 0) return 0;
    const c = Number(count);
    if (c === 1) return 1;

    for (let i = pMarkers.length - 1; i >= 0; i--) {
      const m = pMarkers[i];
      if (c >= (percentiles[m] || 999)) return i + 2;
    }
    return 1;
  };

  days.forEach((day: any) => {
    const date = day.getAttribute('data-date');
    const dayData = data.find(d => d.date === date);
    if (dayData && dayData.count > 0) {
      const level = getGranularLevel(dayData.count);
      day.setAttribute('data-granular-level', level.toString());
      const color = colors[level] || colors[colors.length - 1];
      day.style.setProperty('background-color', color, 'important');
      day.style.setProperty('fill', color, 'important');
    }
  });

  const footer = document.querySelector('.ContributionCalendar-footer');
  if (footer) {
    const legendSquares = footer.querySelectorAll('.ContributionCalendar-day');
    const levelMap = [0, 1, Math.floor(totalLevels/3), Math.floor(totalLevels*2/3), totalLevels];
    legendSquares.forEach((sq: any, i) => {
      const color = colors[levelMap[i]];
      if (color) {
        sq.style.setProperty('background-color', color, 'important');
        sq.style.setProperty('fill', color, 'important');
      }
    });
  }

  const statsPanel = document.getElementById('git-heat-stats');
  if (statsPanel) {
    const p = percentiles;
    const p10 = Math.max(2, p[10] || 2);
    const legendRanges = [
      p10 === 2 ? "1 commit" : `1 to ${p10 - 1} commits`,
      `${p10} to ${p[20] > p10 ? p[20]-1 : p10} commits`,
      `${p[20]} to ${p[30] > p[20] ? p[30]-1 : p[20]} commits`,
      `${p[30]} to ${p[40] > p[30] ? p[40]-1 : p[30]} commits`,
      `${p[40]} to ${p[50] > p[40] ? p[50]-1 : p[40]} commits`,
      `${p[50]} to ${p[60] > p[50] ? p[60]-1 : p[50]} commits`,
      `${p[60]} to ${p[70] > p[60] ? p[70]-1 : p[60]} commits`,
      `${p[70]} to ${p[75] > p[70] ? p[75]-1 : p[70]} commits`,
      `${p[75]} to ${p[80] > p[75] ? p[80]-1 : p[75]} commits`,
      `${p[80]} to ${p[85] > p[80] ? p[85]-1 : p[80]} commits`,
      `${p[85]} to ${p[90] > p[85] ? p[90]-1 : p[85]} commits`,
      `${p[90]} to ${p[95] > p[90] ? p[95]-1 : p[90]} commits`,
      `${p[95]} to ${p[98] > p[95] ? p[98]-1 : p[95]} commits`,
      `${p[98]} to ${p[99] > p[98] ? p[99]-1 : p[98]} commits`,
      `${p[99]}+ commits`
    ];

    const legendSquares = statsPanel.querySelectorAll('.square-legend');
    legendSquares.forEach((sq: any, i) => {
      const color = colors[i + 1]; 
      if (color) sq.style.setProperty('background-color', color, 'important');
      const range = legendRanges[i];
      if (range) sq.setAttribute('title', range);
    });

    const badges = statsPanel.querySelectorAll('.badge');
    const badgeLevels = [1, Math.floor(totalLevels/3), Math.floor(totalLevels*2/3), totalLevels];
    badges.forEach((badge: any, i) => {
      const color = colors[badgeLevels[i]];
      if (color) badge.style.setProperty('background-color', color, 'important');
    });
  }

  // Recolor Activity Ticker
  const tickerPath = document.querySelector('.gh-ticker-path');
  const tickerStopTop = document.querySelector('.gh-ticker-stop-top');
  const tickerStopBottom = document.querySelector('.gh-ticker-stop-bottom');
  if (tickerPath && tickerStopTop && tickerStopBottom) {
    const startColor = colors[1];
    const stopColor = colors[colors.length - 1];
    tickerPath.setAttribute('stroke', stopColor);
    (tickerStopTop as HTMLElement).style.setProperty('stop-color', stopColor, 'important');
    (tickerStopBottom as HTMLElement).style.setProperty('stop-color', startColor, 'important');
  }
}
