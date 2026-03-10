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

export function interpolateColor(color1: string, color2: string, factor: number, mode: 'rgb' | 'hsl' | 'hsl-far' = 'rgb') {
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

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h, s, l };
  };

  const hslToRgb = (h: number, s: number, l: number) => {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  };

  const c1 = parseToRgb(color1);
  const c2 = parseToRgb(color2);

  if (mode === 'rgb') {
    const r = c1.r + factor * (c2.r - c1.r);
    const g = c1.g + factor * (c2.g - c1.g);
    const b = c1.b + factor * (c2.b - c1.b);
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  } else {
    const hsl1 = rgbToHsl(c1.r, c1.g, c1.b);
    const hsl2 = rgbToHsl(c2.r, c2.g, c2.b);
    let h1 = hsl1.h;
    let h2 = hsl2.h;

    if (mode === 'hsl') {
      let dh = h2 - h1;
      if (dh > 0.5) h1 += 1;
      else if (dh < -0.5) h2 += 1;
    } else if (mode === 'hsl-far') {
      let dh = h2 - h1;
      if (dh >= 0 && dh < 0.5) h1 += 1;
      else if (dh < 0 && dh > -0.5) h2 += 1;
    }

    const h = (h1 + factor * (h2 - h1)) % 1;
    const s = hsl1.s + factor * (hsl2.s - hsl1.s);
    const l = hsl1.l + factor * (hsl2.l - hsl1.l);
    const rgb = hslToRgb(h < 0 ? h + 1 : h, s, l);
    return `#${hex(rgb.r)}${hex(rgb.g)}${hex(rgb.b)}`;
  }
}

export function generateCustomScale(start: string, stop: string, steps: number = 11, mode: 'rgb' | 'hsl' | 'hsl-far' = 'rgb'): string[] {
  const scale = ['#161b22']; 
  for (let i = 0; i < steps; i++) {
    const factor = i / (steps - 1);
    scale.push(interpolateColor(start, stop, factor, mode));
  }
  return scale;
}

function applyColorAnimation(speed: number = 8) {
  const styleId = 'git-heat-animation-style';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    @keyframes gh-hue-shift {
      0% { filter: hue-rotate(0deg) brightness(1) saturate(1); }
      50% { filter: hue-rotate(180deg) brightness(1.2) saturate(1.5); }
      100% { filter: hue-rotate(360deg) brightness(1) saturate(1); }
    }
    .ContributionCalendar-day.gh-animate, 
    .gh-ticker-area.gh-animate, 
    .gh-ticker-path.gh-animate,
    .square-legend.gh-animate,
    .badge.gh-animate {
      animation: gh-hue-shift ${speed}s linear infinite !important;
      will-change: filter;
      transition: none !important;
    }
  `;
}

export async function applyDeepRecoloring(data: ContributionDay[], percentiles: Record<number, number>, themeName: string = 'green', customStart?: string, customStop?: string, tickerData?: { date: string; count: number }[], colorMode: 'rgb' | 'hsl' | 'hsl-far' = 'rgb') {
  console.log("GitHeat: Applying Deep Recoloring (v1.3 - High Resolution Gradient)...");
  const days = document.querySelectorAll('.ContributionCalendar-day');
  
  const pMarkers = [10, 20, 30, 40, 50, 60, 70, 75, 80, 85, 90, 95, 98, 99];
  const totalLevels = pMarkers.length + 1; // 15 levels

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

  const settings = await chrome.storage.local.get(['showColorAnimation', 'animationSpeed']);
  const doAnimate = settings.showColorAnimation === true;
  const speed = settings.animationSpeed || 8;

  let colors: string[] = [];
  if (themeName !== 'none') {
    if (themeName === 'custom') {
      let start = customStart;
      let stop = customStop;

      if (!start || !stop) {
        try {
          const settings = await chrome.storage.local.get(['customStart', 'customStop', 'colorMode']);
          start = start || (settings.customStart as string) || '#4a207e';
          stop = stop || (settings.customStop as string) || '#04ff00';
          colorMode = colorMode || (settings.colorMode as any) || 'rgb';
        } catch (e) {
          start = start || '#4a207e';
          stop = stop || '#04ff00';
          colorMode = colorMode || 'rgb';
        }
      }
      colors = generateCustomScale(start, stop, totalLevels, colorMode);
    } else {
      // Interpolate predefined themes to match our 15-level scale
      const baseColors = THEMES[themeName] || THEMES.green;
      colors = [baseColors[0]]; // Index 0 is always the background
      const gradientColors = baseColors.slice(1);
      const steps = totalLevels;
      for (let i = 0; i < steps; i++) {
        const factor = i / (steps - i);
        const colorIdx = factor * (gradientColors.length - 1);
        const low = Math.floor(colorIdx);
        const high = Math.ceil(colorIdx);
        const subFactor = colorIdx - low;
        colors.push(interpolateColor(gradientColors[low], gradientColors[high], subFactor));
      }
    }
  }

  if (doAnimate && themeName !== 'none') {
    applyColorAnimation(speed);
  } else {
    const styleEl = document.getElementById('git-heat-animation-style');
    if (styleEl) styleEl.textContent = '';
  }

  // ALWAYS set the data-granular-level attribute so highlighting works
  days.forEach((day: any, i: number) => {
    const date = day.getAttribute('data-date');
    const dayData = data.find(d => d.date === date);
    const level = getGranularLevel(dayData ? dayData.count : 0);
    day.setAttribute('data-granular-level', level.toString());
    
    if (doAnimate && level > 0 && themeName !== 'none') {
      day.classList.add('gh-animate');
      day.style.animationDelay = `${(i % 100) * 0.05}s`;
    } else {
      day.classList.remove('gh-animate');
      day.style.animationDelay = '';
    }

    if (themeName !== 'none' && dayData && dayData.count > 0) {
      const color = colors[level] || colors[colors.length - 1];
      day.style.setProperty('background-color', color, 'important');
      day.style.setProperty('fill', color, 'important');
    }
  });

  // Ticker Animation
  const tickerContainer = document.getElementById('gh-ticker-container');
  if (tickerContainer) {
    const area = tickerContainer.querySelector('.gh-ticker-area');
    const path = tickerContainer.querySelector('.gh-ticker-path');
    if (area) {
      if (doAnimate && themeName !== 'none') area.classList.add('gh-animate');
      else area.classList.remove('gh-animate');
    }
    if (path) {
      if (doAnimate && themeName !== 'none') path.classList.add('gh-animate');
      else path.classList.remove('gh-animate');
    }
  }

  if (themeName === 'none') return;

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
    const markers = [10, 20, 30, 40, 50, 60, 70, 75, 80, 85, 90, 95, 98, 99];
    
    const getRangeLabel = (start: number, end: number) => {
      if (start === end) return `${start} commit${start === 1 ? '' : 's'}`;
      return `${start} to ${end} commits`;
    };

    const legendRanges: string[] = [];
    const p10 = Math.max(2, p[10] || 2);
    legendRanges.push(getRangeLabel(1, p10 - 1));

    for (let i = 0; i < markers.length - 1; i++) {
      const curr = p[markers[i]];
      const next = p[markers[i+1]];
      const rangeEnd = next > curr ? next - 1 : curr;
      legendRanges.push(getRangeLabel(curr, rangeEnd));
    }
    legendRanges.push(`${p[99]}+ commits`);

    const legendSquares = statsPanel.querySelectorAll('.square-legend');
    legendSquares.forEach((sq: any, i) => {
      const color = colors[i + 1]; 
      if (color) sq.style.setProperty('background-color', color, 'important');
      const range = legendRanges[i];
      if (range) sq.setAttribute('title', range);
      
      if (doAnimate) sq.classList.add('gh-animate');
      else sq.classList.remove('gh-animate');
    });

    const badges = statsPanel.querySelectorAll('.badge');
    const badgeLevels = [1, Math.floor(totalLevels/3), Math.floor(totalLevels*2/3), totalLevels];
    badges.forEach((badge: any, i) => {
      const color = colors[badgeLevels[i]];
      if (color) badge.style.setProperty('background-color', color, 'important');
      
      if (doAnimate) badge.classList.add('gh-animate');
      else badge.classList.remove('gh-animate');
    });
  }

  // Recolor Activity Ticker Area (Horizontal Commit Intensity Gradient)
  const tickerLineGradient = document.getElementById('ticker-line-gradient');
  let targetTickerData = tickerData;
  
  if (!targetTickerData && tickerLineGradient) {
    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length > 0) {
      const now = new Date();
      const lastDayInData = sorted[sorted.length - 1];
      const yearFromData = new Date(lastDayInData.date + 'T00:00:00').getFullYear();
      const isCurrentYear = yearFromData === now.getFullYear();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const periodEndStr = isCurrentYear ? todayStr : lastDayInData.date;
      
      targetTickerData = sorted.filter(d => d.date >= `${yearFromData}-01-01` && d.date <= periodEndStr);
    }
  }
  
  if (tickerLineGradient && targetTickerData && targetTickerData.length > 0) {
    const sortedTicker = [...targetTickerData].sort((a, b) => a.date.localeCompare(b.date));
    
    // Clear existing stops
    tickerLineGradient.innerHTML = '';
    
    // Create a stop for every day to map color to commit intensity
    sortedTicker.forEach((day, i) => {
      const level = getGranularLevel(day.count);
      const color = colors[level] || colors[0];
      const offset = (i / (Math.max(1, sortedTicker.length - 1))) * 100;
      
      const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop.setAttribute('offset', `${offset}%`);
      stop.setAttribute('stop-color', color);
      // Ensure visibility: level 0 is faint, levels 1+ are solid (mask handles vertical fade)
      stop.setAttribute('stop-opacity', level === 0 ? '0.2' : '1');
      tickerLineGradient.appendChild(stop);
    });
  }
}
