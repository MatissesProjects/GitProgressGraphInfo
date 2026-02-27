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
    c = c.trim();
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

export function generateCustomScale(start: string, stop: string): string[] {
  // Index 0: Placeholder for background
  const scale = ['#161b22']; 
  // Level 1 (start) to Level 11 (stop)
  for (let i = 0; i <= 10; i++) {
    const factor = i / 10;
    scale.push(interpolateColor(start, stop, factor));
  }
  return scale;
}

export async function applyDeepRecoloring(data: ContributionDay[], percentiles: Record<number, number>, themeName: string = 'green', customStart?: string, customStop?: string) {
  console.log("GitHeat: Applying Deep Recoloring (v1.2 - Quantile Scale)...");
  const days = document.querySelectorAll('.ContributionCalendar-day');
  
  if (themeName === 'none') {
    days.forEach((day: any) => {
      day.style.removeProperty('background-color');
      day.style.removeProperty('fill');
    });
    return;
  }

  let colors: string[];
  if (themeName === 'custom') {
    const start = customStart || '#4a207e';
    const stop = customStop || '#04ff00';
    colors = generateCustomScale(start, stop);
  } else {
    colors = THEMES[themeName] || THEMES.green;
  }
  
  const getGranularLevel = (count: number) => {
    if (count <= 0) return 0;
    const c = Number(count);
    if (c === 1) return 1;

    if (c >= (percentiles[99] || 999)) return 11;
    if (c >= (percentiles[95] || 999)) return 10;
    if (c >= (percentiles[90] || 999)) return 9;
    if (c >= (percentiles[80] || 999)) return 8;
    if (c >= (percentiles[70] || 999)) return 7;
    if (c >= (percentiles[60] || 999)) return 6;
    if (c >= (percentiles[50] || 999)) return 5;
    if (c >= (percentiles[40] || 999)) return 4;
    if (c >= (percentiles[30] || 999)) return 3;
    if (c >= (Math.max(2, percentiles[20] || 999))) return 2;
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
    }
  });

  const footer = document.querySelector('.ContributionCalendar-footer');
  if (footer) {
    const legendSquares = footer.querySelectorAll('.ContributionCalendar-day');
    const levelMap = [0, 1, 4, 7, 11];
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
    const p20 = Math.max(2, p[20] || 2);
    const legendRanges = [
      p20 === 2 ? "1 commit" : `1 to ${p20 - 1} commits`,
      `${p20} to ${p[30] > p20 ? p[30]-1 : p20} commits`,
      `${p[30]} to ${p[40] > p[30] ? p[40]-1 : p[30]} commits`,
      `${p[40]} to ${p[50] > p[40] ? p[50]-1 : p[40]} commits`,
      `${p[50]} to ${p[60] > p[50] ? p[60]-1 : p[50]} commits`,
      `${p[60]} to ${p[70] > p[60] ? p[70]-1 : p[60]} commits`,
      `${p[70]} to ${p[80] > p[70] ? p[80]-1 : p[70]} commits`,
      `${p[80]} to ${p[90] > p[80] ? p[90]-1 : p[80]} commits`,
      `${p[90]} to ${p[95] > p[90] ? p[95]-1 : p[90]} commits`,
      `${p[95]} to ${p[99] > p[95] ? p[99]-1 : p[95]} commits`,
      `${p[99]}+ commits`
    ];

    // Coloring the Deep Scale legend
    const legendSquares = statsPanel.querySelectorAll('.square-legend');
    legendSquares.forEach((sq: any, i) => {
      const color = colors[i + 1]; // Level 1 to 11
      if (color) sq.style.setProperty('background-color', color, 'important');
      
      // Update tooltip to ensure it's always correct
      const range = legendRanges[i];
      if (range) sq.setAttribute('title', range);
    });

    // Coloring the threshold badges
    const badges = statsPanel.querySelectorAll('.badge');
    const badgeLevels = [1, 4, 7, 11];
    badges.forEach((badge: any, i) => {
      const color = colors[badgeLevels[i]];
      if (color) badge.style.setProperty('background-color', color, 'important');
    });
  }
}
