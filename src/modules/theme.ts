import { ContributionDay } from '../types';

export const THEMES: Record<string, string[]> = {
  flame: [
    '#ebedf0', '#ffeecc', '#ffdd99', '#ffcc66', '#ffbb44', '#ff9922', 
    '#ff7711', '#ff5500', '#dd3300', '#bb1100', '#880000', '#550000'
  ],
  green: [
    '#ebedf0', '#e6ffed', '#d1f2d9', '#9be9a8', '#7bc96f', '#40c463',
    '#30a14e', '#216e39', '#196127', '#124d1f', '#0c3a17', '#06250e'
  ]
};

export function interpolateColor(color1: string, color2: string, factor: number) {
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

export function generateCustomScale(start: string, stop: string): string[] {
  const scale = [start];
  for (let i = 1; i <= 11; i++) {
    scale.push(interpolateColor(start, stop, i / 11));
  }
  return scale;
}

export async function applyDeepRecoloring(data: ContributionDay[], percentiles: Record<number, number>, themeName: string = 'green') {
  const days = document.querySelectorAll('.ContributionCalendar-day');
  
  let colors: string[];
  if (themeName === 'custom') {
    try {
      const settings = await chrome.storage.local.get(['customStart', 'customStop']);
      colors = generateCustomScale((settings.customStart as string) || '#ebedf0', (settings.customStop as string) || '#216e39');
    } catch (e) {
      return;
    }
  } else {
    colors = THEMES[themeName] || THEMES.green;
  }
  
  const getGranularLevel = (count: number) => {
    if (count <= 0) return 0;
    if (count >= (percentiles[99] || 999)) return 11;
    if (count >= (percentiles[95] || 999)) return 10;
    if (count >= (percentiles[90] || 999)) return 9;
    if (count >= (percentiles[80] || 999)) return 8;
    if (count >= (percentiles[70] || 999)) return 7;
    if (count >= (percentiles[60] || 999)) return 6;
    if (count >= (percentiles[50] || 999)) return 5;
    if (count >= (percentiles[40] || 999)) return 4;
    if (count >= (percentiles[30] || 999)) return 3;
    if (count >= (percentiles[20] || 999)) return 2;
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
      
      if (day.classList.contains('gh-highlight') || day.classList.contains('gh-highlight-special') || day.classList.contains('gh-highlight-sad')) {
        day.style.outline = '';
        day.style.border = '';
      } else {
        day.style.outline = 'none';
        day.style.border = 'none';
      }
    }
  });

  const footer = document.querySelector('.ContributionCalendar-footer');
  if (footer) {
    const legendSquares = footer.querySelectorAll('.ContributionCalendar-day');
    legendSquares.forEach((sq: any, i) => {
      const levelMap = [0, 3, 6, 9, 11];
      const color = colors[levelMap[i]];
      if (color) {
        sq.style.setProperty('background-color', color, 'important');
        sq.style.setProperty('fill', color, 'important');
      }
    });
  }

  const statsPanel = document.getElementById('git-heat-stats');
  if (statsPanel) {
    const legendSquares = statsPanel.querySelectorAll('.square-legend');
    legendSquares.forEach((sq: any, i) => {
      const color = colors[i];
      if (color) sq.style.setProperty('background-color', color, 'important');
    });

    const badges = statsPanel.querySelectorAll('.badge');
    const badgeLevels = [3, 6, 9, 11];
    badges.forEach((badge: any, i) => {
      const color = colors[badgeLevels[i]];
      if (color) badge.style.setProperty('background-color', color, 'important');
    });
  }
}
