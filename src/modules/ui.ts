import { ContributionDay, AdvancedStats, GitHeatSettings, Skill, AvatarData, BattleStats, YearlyStats, CreatedRepo } from '../types';
import { getCodingClass, generateGuestCharacter } from './rpg';
import { DEFAULT_GRID_ORDER, GRID_ITEM_TO_SETTING, VISIBILITY_KEYS } from './constants';

// Module-level state to persist across re-injections
let selectionStartIdx = -1;
let isDragging = false;
let globalAdvanced: AdvancedStats | null = null;
let battleAnimationFrame: number | null = null;
let isArenaVisible = false;
let playerScore = 0;
let enemyScore = 0;

// Global event listeners (added once)
if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', (e: MouseEvent) => {
    if (!isDragging || !globalAdvanced) return;
    const idx = getIdxFromPoint(e.clientX, e.clientY);
    if (idx !== -1) {
      updateSelection(selectionStartIdx, idx);
    }
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

function getIdxFromPoint(x: number, y: number): number {
  const el = document.elementFromPoint(x, y);
  if (el && el.classList.contains('gh-ticker-hover-zone')) {
    const zones = Array.from(document.querySelectorAll('.gh-ticker-hover-zone'));
    return zones.indexOf(el);
  }
  return -1;
}

function updateSelection(start: number, end: number) {
  if (start < 0 || end < 0 || !globalAdvanced) return;
  const minIdx = Math.min(start, end);
  const maxIdx = Math.max(start, end);
  const selectedData = globalAdvanced.ytdDailyCounts.slice(minIdx, maxIdx + 1);
  if (selectedData.length === 0) return;
  
  const selectionRect = document.getElementById('gh-ticker-selection') as unknown as SVGRectElement;
  const selectionStats = document.getElementById('gh-selection-stats');
  if (!selectionRect || !selectionStats) return;

  const width = 800;
  const xStart = (minIdx / (globalAdvanced.ytdDailyCounts.length - 1)) * width;
  const xEnd = (maxIdx / (globalAdvanced.ytdDailyCounts.length - 1)) * width;
  const hoverWidth = width / (globalAdvanced.ytdDailyCounts.length - 1);
  
  selectionRect.setAttribute('x', (xStart - hoverWidth/2).toString());
  selectionRect.setAttribute('width', (xEnd - xStart + hoverWidth).toString());
  selectionRect.style.display = 'block';

  const totalCommits = selectedData.reduce((acc, d) => acc + d.count, 0);
  const days = selectedData.length;
  const activeDays = selectedData.filter(d => d.count > 0).length;
  const avg = (totalCommits / days).toFixed(2);
  const consistency = ((activeDays / days) * 100).toFixed(1);
  const startDate = selectedData[0].date;
  const endDate = selectedData[selectedData.length - 1].date;

  selectionStats.innerHTML = `
    <div class="d-flex flex-justify-between flex-items-center mb-1" style="border-bottom: 1px solid var(--color-border-muted); padding-bottom: 2px;">
      <span class="font-weight-bold" style="font-size: 10px;">${startDate} — ${endDate}</span>
      <span class="color-fg-muted" style="font-size: 9px;">${days} days</span>
    </div>
    <div class="d-flex gap-3 mt-1">
      <div class="d-flex flex-column">
        <span class="color-fg-muted" style="font-size: 8px; text-transform: uppercase;">Commits</span>
        <strong style="font-size: 13px;">${totalCommits}</strong>
      </div>
      <div class="d-flex flex-column" style="border-left: 1px solid var(--color-border-muted); padding-left: 8px;">
        <span class="color-fg-muted" style="font-size: 8px; text-transform: uppercase;">Avg/Day</span>
        <strong style="font-size: 13px;">${avg}</strong>
      </div>
      <div class="d-flex flex-column" style="border-left: 1px solid var(--color-border-muted); padding-left: 8px;">
        <span class="color-fg-muted" style="font-size: 8px; text-transform: uppercase;">Consistency</span>
        <strong style="font-size: 13px;">${consistency}%</strong>
      </div>
    </div>
  `;
  selectionStats.style.display = 'block';
}

export async function applyVisibility() {
  try {
    const settings = await chrome.storage.local.get(VISIBILITY_KEYS) as GitHeatSettings;

    const grid = document.getElementById('gh-grid-stats');
    const detailed = document.getElementById('gh-detailed-stats');
    const activeRepos = document.getElementById('gh-active-repos');
    const createdRepos = document.getElementById('gh-created-repos');
    const achievements = document.getElementById('gh-achievements');
    const persona = document.getElementById('gh-persona');
    const footer = document.getElementById('gh-footer');
    const headerLevel = document.getElementById('gh-header-level');
    const pulseSignature = document.getElementById('gh-pulse-signature');
    const tickerGraph = document.getElementById('gh-ticker-container');
    const avatar = document.querySelector('.gh-avatar-wrapper') as HTMLElement;
    const thresholdsContainer = document.getElementById('gh-thresholds-container');
    const comboBadge = document.querySelector('.gh-combo-badge') as HTMLElement;
    const xpBar = document.querySelector('.gh-progress-container') as HTMLElement;
    const xpText = document.querySelector('.gh-xp-text') as HTMLElement;
    const skillTree = document.getElementById('gh-skill-tree');
    const battleArena = document.getElementById('gh-battle-arena');

    if (grid) grid.style.display = (settings.showGrid !== false) ? 'grid' : 'none';
    if (activeRepos) activeRepos.style.display = (settings.showActiveRepos !== false) ? 'block' : 'none';
    if (createdRepos) createdRepos.style.display = (settings.showCreatedRepos !== false) ? 'block' : 'none';
    if (achievements) achievements.style.display = (settings.showAchievements !== false) ? 'block' : 'none';
    if (persona) persona.style.display = (settings.showPersona !== false) ? 'inline-block' : 'none';
    if (footer) footer.style.display = (settings.showFooter !== false) ? 'block' : 'none';
    if (headerLevel) headerLevel.style.display = (settings.showLevel !== false) ? 'flex' : 'none';
    if (pulseSignature) pulseSignature.style.display = (settings.showPulseHash !== false) ? 'block' : 'none';
    if (tickerGraph) tickerGraph.style.display = (settings.showTicker !== false) ? 'block' : 'none';
    if (avatar) avatar.style.display = (settings.showAvatar !== false) ? 'block' : 'none';
    if (thresholdsContainer) thresholdsContainer.style.display = (settings.showLegendNumbers !== false) ? 'flex' : 'none';
    
    if (comboBadge) comboBadge.style.display = (settings.showCombo !== false) ? 'block' : 'none';
    if (xpBar) xpBar.style.display = (settings.showXPBar !== false) ? 'block' : 'none';
    if (xpText) xpText.style.display = (settings.showXPBar !== false) ? 'block' : 'none';
    if (skillTree) skillTree.style.display = (settings.showSkillTree !== false) ? 'block' : 'none';
    if (battleArena) battleArena.style.display = (settings.showBattle !== false) ? 'block' : 'none';

    // Gear toggles
    if (avatar) {
      const gearSelectors = [
        { el: 'div:nth-child(3)', key: settings.showGearHead },
        { el: 'div:nth-child(4)', key: settings.showGearWeapon },
        { el: 'div:nth-child(5)', key: settings.showGearShield },
        { el: 'div:nth-child(1)', key: settings.showGearCompanion }
      ];
      gearSelectors.forEach(({ el, key }) => {
        const gearEl = avatar.querySelector(el) as HTMLElement;
        if (gearEl) gearEl.style.display = (key !== false) ? 'block' : 'none';
      });
    }

    Object.entries(GRID_ITEM_TO_SETTING).forEach(([id, settingKey]) => {
      const el = document.getElementById(id);
      if (el) el.style.display = (settings[settingKey] !== false) ? 'block' : 'none';
    });

    const legendLabels = document.querySelectorAll('.git-heat-legend-label');
    legendLabels.forEach((el: Element) => {
      (el as HTMLElement).style.display = (settings.showLegendNumbers !== false) ? 'inline' : 'none';
    });

    if (detailed) {
      const anyDetailedVisible = (settings.showActiveRepos !== false) || (settings.showCreatedRepos !== false) || (settings.showAchievements !== false);
      detailed.style.display = anyDetailedVisible ? 'flex' : 'none';
    }
  } catch (e) {
    console.error("GitHeat: Error applying visibility", e);
  }
}

function renderAvatar(avatar: AvatarData, size: number = 50, isEnemy: boolean = false) {
  if (!avatar) return '';
  const scale = size / 50;
  return `
    <div class="gh-avatar-wrapper ${isEnemy ? 'gh-enemy' : 'gh-player'}" title="${avatar.description}" style="position: relative; width: ${65*scale}px; height: ${55*scale}px; cursor: help; user-select: none;">
      <!-- Companion -->
      <div class="gh-avatar-gear" style="position: absolute; left: -${15*scale}px; bottom: -${5*scale}px; font-size: ${22*scale}px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2)); z-index: 1;">
        ${avatar.companion}
      </div>
      <!-- Base Character -->
      <div class="gh-avatar-base" style="position: absolute; left: 50%; top: 55%; transform: translate(-50%, -35%); font-size: ${34*scale}px; z-index: 2;">
        ${avatar.base}
      </div>
      <!-- Headgear -->
      <div class="gh-avatar-gear" style="position: absolute; left: 50%; top: -${6*scale}px; transform: translateX(-50%); font-size: ${26*scale}px; z-index: 5; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
        ${avatar.headgear}
      </div>
      <!-- Weapon -->
      <div class="gh-avatar-weapon" style="position: absolute; left: -${8*scale}px; top: 62%; transform: translateY(-50%) rotate(-10deg); font-size: ${28*scale}px; z-index: 4; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));">
        ${avatar.weapon}
      </div>
      <!-- Shield -->
      <div class="gh-avatar-gear" style="position: absolute; right: -${2*scale}px; top: 55%; transform: translateY(-50%) rotate(10deg); font-size: ${28*scale}px; z-index: 4; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));">
        ${avatar.shield}
      </div>
    </div>
  `;
}

function renderBattleMap(sig: string) {
  const tileSize = 16;
  const rows = 8;
  const numCols = 40; 
  
  const charsPerCol = Math.max(1, Math.floor(sig.length / numCols));
  
  // Textured floor: Sand-like pattern for the arena background
  const sandFloor = `background-image: radial-gradient(circle at 1px 1px, var(--color-border-subtle) 1px, transparent 0); background-size: 8px 8px; background-color: var(--color-canvas-subtle);`;

  let mapHtml = `<div class="gh-battle-map" style="position: absolute; inset: 0; display: grid; grid-template-columns: repeat(${numCols}, ${tileSize}px); grid-template-rows: repeat(${rows}, ${tileSize}px); opacity: 0.35; pointer-events: none; user-select: none; overflow: hidden; justify-content: center; ${sandFloor}">`;

  const getBiomeTile = (intensity: number, row: number) => {
    if (intensity === 0) return ''; // 0 commits shows the floor texture instead of ocean
    if (intensity <= 2) return (row > 5) ? '🏖️' : ''; 
    if (intensity <= 7) return (row < 2 || row > 5) ? '🌱' : '🌳';
    if (intensity <= 11) return (row % 3 === 0) ? '⛰️' : '🌲';
    return (row % 2 === 0) ? '🏔️' : '⛰️';
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < numCols; c++) {
      const start = c * charsPerCol;
      const chunk = sig.substring(start, start + charsPerCol) || '0';
      const sum = chunk.split('').reduce((acc, char) => acc + parseInt(char, 16), 0);
      const avg = sum / chunk.length;
      
      const tile = getBiomeTile(Math.round(avg), r);
      mapHtml += `<div style="width: ${tileSize}px; height: ${tileSize}px; display: flex; align-items: center; justify-content: center; font-size: 11px; filter: saturate(1.5);">${tile}</div>`;
    }
  }

  mapHtml += `</div>`;
  return mapHtml;
}
interface BattleEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  kx: number; // Knockback X
  ky: number; // Knockback Y
  stats: BattleStats;
  avatar: AvatarData;
  isPlayer: boolean;
  currentHp: number;
  lastAttack: number;
  attackType: 'melee' | 'ranged';
  range: number;
}

function startBattle(playerStats: AdvancedStats, enemyStats: AdvancedStats, settings: GitHeatSettings) {
  const arena = document.getElementById('gh-battle-arena-content');
  const arenaContainer = document.getElementById('gh-battle-arena');
  if (!arena || !arenaContainer) return;

  if (battleAnimationFrame) cancelAnimationFrame(battleAnimationFrame);
  arena.innerHTML = renderBattleMap(enemyStats.pulseHash);

  // Add Scoreboard to the header if not already there
  let scoreboard = arenaContainer.querySelector('.gh-battle-scoreboard') as HTMLElement | null;
  if (!scoreboard) {
    const header = arenaContainer.querySelector('.d-flex.flex-justify-between.flex-items-center.mb-2');
    scoreboard = document.createElement('div');
    scoreboard.className = 'gh-battle-scoreboard d-flex flex-items-center gap-2 px-2 py-1 rounded-2';
    scoreboard.style.background = 'var(--color-canvas-subtle)';
    scoreboard.style.border = '1px solid var(--color-border-muted)';
    scoreboard.style.fontSize = '11px';
    scoreboard.style.fontWeight = 'bold';
    header?.appendChild(scoreboard);
  }
  
  const updateScoreboard = () => {
    if (scoreboard) {
      scoreboard.innerHTML = `
        <span style="color: #2da44e;">YOU: ${playerScore}</span>
        <span style="color: var(--color-border-muted);">|</span>
        <span style="color: #cf222e;">ENEMY: ${enemyScore}</span>
      `;
    }
  };
  updateScoreboard();

  // Attack type decided by Class or Stats
  // Classes like "Hunter" or high consistency might favor ranged
  const getAttackType = (stats: AdvancedStats): 'melee' | 'ranged' => {
    if (stats.persona.includes('Hunter') || stats.persona.includes('Architect')) return 'ranged';
    return Math.random() > 0.5 ? 'ranged' : 'melee';
  };

  const player: BattleEntity = {
    x: 50, y: 50, vx: 0, vy: 0, kx: 0, ky: 0,
    stats: playerStats.battleStats,
    avatar: playerStats.avatar,
    isPlayer: true,
    currentHp: playerStats.battleStats.maxHp,
    lastAttack: 0,
    attackType: getAttackType(playerStats),
    range: 0
  };
  player.range = player.attackType === 'ranged' ? 120 : 35;

  const enemy: BattleEntity = {
    x: 250, y: 50, vx: 0, vy: 0, kx: 0, ky: 0,
    stats: enemyStats.battleStats,
    avatar: enemyStats.avatar,
    isPlayer: false,
    currentHp: enemyStats.battleStats.maxHp,
    lastAttack: 0,
    attackType: getAttackType(enemyStats),
    range: 0
  };
  enemy.range = enemy.attackType === 'ranged' ? 120 : 35;

  // History-based AI parameters for enemy
  // Deriving "Aggression", "Agility", and "Intelligence" from the signature
  const sig = enemyStats.pulseHash;
  const aiSeed = sig.substring(0, 8).split('').reduce((a, b) => a + parseInt(b, 16), 0);
  const enemyAI = {
    aggression: (parseInt(sig[0] || '8', 16) / 15), // 0-1
    retreatThreshold: (parseInt(sig[1] || '4', 16) / 30) + 0.1, // 0.1 - 0.6
    jitter: (1 - (parseInt(sig[2] || '8', 16) / 15)) * 4 // 0 - 4
  };

  const randomness = settings.battleRandomness ?? 50;

  const renderEntity = (ent: BattleEntity) => {
    const el = document.createElement('div');
    el.className = `gh-battle-entity ${ent.isPlayer ? 'player' : 'enemy'}`;
    el.style.position = 'absolute';
    el.style.transition = 'all 0.1s linear';
    el.innerHTML = `
      <div class="gh-hp-bar-container" style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); width: 40px; height: 4px; background: #eee; border: 1px solid #ccc; border-radius: 2px; overflow: hidden;">
        <div class="gh-hp-bar-fill" style="width: 100%; height: 100%; background: ${ent.isPlayer ? '#2da44e' : '#cf222e'}; transition: width 0.3s;"></div>
      </div>
      <div class="gh-attack-label" style="position: absolute; top: -28px; left: 50%; transform: translateX(-50%); font-size: 8px; font-weight: bold; color: var(--color-fg-muted); opacity: 0.7;">${ent.attackType.toUpperCase()}</div>
      ${renderAvatar(ent.avatar, 30, !ent.isPlayer)}
    `;
    arena.appendChild(el);
    return el;
  };

  let playerEl = renderEntity(player);
  let enemyEl = renderEntity(enemy);

  const showDamage = (x: number, y: number, dmg: number) => {
    const d = document.createElement('div');
    d.className = 'gh-damage-popup';
    d.textContent = `-${Math.round(dmg)}`;
    d.style.position = 'absolute';
    d.style.left = `${x + 20}px`;
    d.style.top = `${y}px`;
    d.style.color = '#cf222e';
    d.style.fontWeight = 'bold';
    d.style.fontSize = '12px';
    d.style.pointerEvents = 'none';
    d.style.animation = 'gh-damage-up 0.8s ease-out forwards';
    arena.appendChild(d);
    setTimeout(() => d.remove(), 800);
  };

  const spawnProjectile = (from: BattleEntity, to: BattleEntity) => {
    const p = document.createElement('div');
    p.style.position = 'absolute';
    p.style.left = `${from.x + 15}px`;
    p.style.top = `${from.y + 15}px`;
    p.style.width = '8px';
    p.style.height = '8px';
    p.style.background = from.isPlayer ? '#2da44e' : '#cf222e';
    p.style.borderRadius = '50%';
    p.style.zIndex = '50';
    p.style.boxShadow = '0 0 5px rgba(0,0,0,0.2)';
    p.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    arena.appendChild(p);

    // Force reflow for transition
    p.getBoundingClientRect();
    p.style.left = `${to.x + 15}px`;
    p.style.top = `${to.y + 15}px`;

    setTimeout(() => p.remove(), 400);
  };

  const showWinner = (isPlayer: boolean) => {
    const msg = document.createElement('div');
    msg.style.position = 'absolute';
    msg.style.left = '50%';
    msg.style.top = '50%';
    msg.style.transform = 'translate(-50%, -50%)';
    msg.style.padding = '10px 20px';
    msg.style.borderRadius = '8px';
    msg.style.background = isPlayer ? '#2da44e' : '#cf222e';
    msg.style.color = 'white';
    msg.style.fontWeight = 'bold';
    msg.style.fontSize = '16px';
    msg.style.zIndex = '100';
    msg.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
    msg.textContent = isPlayer ? 'VICTORY! 🏆' : 'DEFEATED! 💀';
    arena.appendChild(msg);
    setTimeout(() => msg.remove(), 2000);
  };

  const updateEntity = (ent: BattleEntity, el: HTMLElement, target?: BattleEntity) => {
    if (ent.currentHp <= 0) {
      if (ent.isPlayer) enemyScore++; else playerScore++;
      updateScoreboard();
      
      // Reset positions and HP
      player.x = 50; player.y = 50; player.kx = 0; player.ky = 0; player.currentHp = player.stats.maxHp;
      enemy.x = 250; enemy.y = 50; enemy.kx = 0; enemy.ky = 0; enemy.currentHp = enemy.stats.maxHp;
      
      const pFill = playerEl.querySelector('.gh-hp-bar-fill') as HTMLElement;
      if (pFill) pFill.style.width = '100%';
      const eFill = enemyEl.querySelector('.gh-hp-bar-fill') as HTMLElement;
      if (eFill) eFill.style.width = '100%';
      return;
    }

    const rect = arena.getBoundingClientRect();

    // AI logic: Chase, Range, or Retreat
    if (target && target.currentHp > 0) {
      const dx = target.x - ent.x;
      const dy = target.y - ent.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      const retreatThreshold = ent.isPlayer ? 0.25 : enemyAI.retreatThreshold;
      const isRetreating = ent.currentHp < ent.stats.maxHp * retreatThreshold;

      // Randomness/Jitter: User configurable for Player, Signature-based for Enemy
      const currentRandomness = ent.isPlayer ? randomness : (enemyAI.jitter * 25);
      const jitterAmount = (currentRandomness / 100) * 4;
      const jitterX = (Math.random() - 0.5) * jitterAmount;
      const jitterY = (Math.random() - 0.5) * jitterAmount;

      const speedMult = ent.isPlayer ? 1 : (0.8 + enemyAI.aggression * 0.4);

      if (isRetreating) {
        // Run away from target towards edges
        ent.vx = -(dx / dist) * (ent.stats.speed / 4 * speedMult) + jitterX;
        ent.vy = -(dy / dist) * (ent.stats.speed / 4 * speedMult) + jitterY;
      } else if (dist > ent.range) {
        // Move towards target
        ent.vx = (dx / dist) * (ent.stats.speed / 5 * speedMult) + jitterX;
        ent.vy = (dy / dist) * (ent.stats.speed / 5 * speedMult) + jitterY;
      } else if (ent.attackType === 'ranged' && dist < 60) {
        // Ranged tries to keep distance
        ent.vx = -(dx / dist) * (ent.stats.speed / 6 * speedMult) + jitterX;
        ent.vy = -(dy / dist) * (ent.stats.speed / 6 * speedMult) + jitterY;
      } else {
        // In range, maybe small circle movement
        ent.vx = (Math.random() - 0.5) * jitterAmount;
        ent.vy = (Math.random() - 0.5) * jitterAmount;
        
        // Attack
        const now = Date.now();
        const attackCooldown = ent.attackType === 'ranged' ? 1500 : 1000;
        if (now - ent.lastAttack > attackCooldown) {
          ent.lastAttack = now;
          const dmg = Math.max(1, ent.stats.attack - (target.stats.defense / 2));
          target.currentHp -= dmg;
          
          const targetEl = (target === player ? playerEl : enemyEl);
          const fill = targetEl.querySelector('.gh-hp-bar-fill') as HTMLElement;
          if (fill) fill.style.width = `${Math.max(0, (target.currentHp / target.stats.maxHp) * 100)}%`;
          
          // Attack animation
          el.style.transform = `scale(1.2)`;
          setTimeout(() => {
            el.style.transform = `scale(1)`;
          }, 100);
        }
      }
    }

    // Apply movement, knockback, and friction
    ent.x += ent.vx + ent.kx;
    ent.y += ent.vy + ent.ky;
    ent.kx *= 0.8; // Friction
    ent.ky *= 0.8;

    // Bounds
    if (rect.width > 0) {
      ent.x = Math.max(0, Math.min(ent.x, rect.width - 40));
      ent.y = Math.max(0, Math.min(ent.y, rect.height - 40));
    }

    el.style.left = `${ent.x}px`;
    el.style.top = `${ent.y}px`;
  };

  const battleLoop = () => {
    if (isArenaVisible) {
      updateEntity(player, playerEl, enemy);
      updateEntity(enemy, enemyEl, player);
    }
    battleAnimationFrame = requestAnimationFrame(battleLoop);
  };

  const observer = new IntersectionObserver((entries) => {
    isArenaVisible = entries[0].isIntersecting;
  }, { threshold: 0.1 });
  observer.observe(arenaContainer);

  battleLoop();
}

function renderTickerGraph(data: { date: string; count: number }[], thresholds: Record<number, {min:number; max:number}>) {
  if (data.length < 2) return '';
  const width = 800;
  const height = 80;
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (d.count / maxCount) * height;
    return `${x},${y}`;
  }).join(' ');

  const quadrantLines = [1, 2, 3, 4].map(l => {
    if (!thresholds[l]) return '';
    const y = height - (Math.min(thresholds[l].min, maxCount) / maxCount) * height;
    return `
      <line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="var(--color-border-muted)" stroke-width="0.5" stroke-dasharray="4,4" />
      <text x="${width - 5}" y="${y - 2}" text-anchor="end" font-size="7" fill="var(--color-fg-muted)" opacity="0.8">L${l}</text>
    `;
  }).join('');

  const hoverWidth = width / (data.length - 1);
  const hoverZones = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    return `<rect class="gh-ticker-hover-zone" data-date="${d.date}" x="${x - hoverWidth/2}" y="0" width="${hoverWidth}" height="${height}" fill="transparent" style="cursor: crosshair; pointer-events: all;" />`;
  }).join('');

  const lineStops = data.map((d, i) => {
    const offset = (i / (Math.max(1, data.length - 1))) * 100;
    let level = 0;
    if (d.count > 0) {
      level = 1;
      if (thresholds[2] && d.count >= thresholds[2].min) level = 2;
      if (thresholds[3] && d.count >= thresholds[3].min) level = 3;
      if (thresholds[4] && d.count >= thresholds[4].min) level = 4;
    }
    const colorVar = `var(--color-calendar-graph-day-L${Math.max(1, level)}-bg, #40c463)`;
    const stopOpacity = level === 0 ? 0.15 : 1;
    return `<stop offset="${offset}%" stop-color="${colorVar}" stop-opacity="${stopOpacity}" />`;
  }).join('');

  const counts = data.filter(d => d.count > 0).map(d => d.count);
  const avgVelocityValue = counts.length > 0 ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
  const avgY = height - (Math.min(avgVelocityValue, maxCount) / maxCount) * height;
  const avgLineHtml = avgVelocityValue > 0 ? `
    <line x1="0" y1="${avgY}" x2="${width}" y2="${avgY}" stroke="var(--color-accent-fg)" stroke-width="1.5" stroke-dasharray="4,2" opacity="0.8" />
    <text x="5" y="${avgY - 3}" font-size="7" font-weight="bold" fill="var(--color-accent-fg)" style="text-shadow: 0 0 2px var(--color-canvas-default);">AVG VELOCITY (${avgVelocityValue.toFixed(1)})</text>
  ` : '';

  const overallAvg = data.length > 0 ? data.reduce((a, b) => a + b.count, 0) / data.length : 0;
  const overallAvgY = height - (Math.min(overallAvg, maxCount) / maxCount) * height;
  const overallAvgLineHtml = overallAvg > 0 ? `
    <line x1="0" y1="${overallAvgY}" x2="${width}" y2="${overallAvgY}" stroke="var(--color-fg-muted)" stroke-width="1" stroke-dasharray="2,2" opacity="0.5" />
    <text x="${width - 5}" y="${overallAvgY + 7}" text-anchor="end" font-size="7" font-weight="bold" fill="var(--color-fg-muted)" style="text-shadow: 0 0 2px var(--color-canvas-default);">OVERALL AVG (${overallAvg.toFixed(2)})</text>
  ` : '';

  return `
    <div id="gh-ticker-container" class="mb-2" style="border-top: 1px solid var(--color-border-muted); padding-top: 8px; position: relative; user-select: none;">
      <div class="d-flex flex-justify-between flex-items-center mb-1">
        <span class="color-fg-muted text-small d-block">Activity Intensity Ticker (Vertical Heat Zones)</span>
        <span class="color-fg-accent text-small" style="font-size: 9px;">Click & Drag to select range</span>
      </div>
      <div id="gh-ticker-tooltip" style="position: absolute; display: none; background: var(--color-neutral-emphasis-plus); color: var(--color-fg-on-emphasis); padding: 4px 8px; border-radius: 6px; font-size: 11px; pointer-events: none; z-index: 1000; box-shadow: 0 2px 5px rgba(0,0,0,0.3); white-space: nowrap; transform: translate(-50%, -120%); transition: opacity 0.1s;"></div>
      <div id="gh-selection-stats" style="position: absolute; display: none; background: var(--color-canvas-overlay); color: var(--color-fg-default); padding: 6px 10px; border-radius: 6px; font-size: 11px; z-index: 1001; box-shadow: var(--color-shadow-large); border: 1px solid var(--color-border-default); pointer-events: none; top: 10px; left: 50%; transform: translateX(-50%);"></div>
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="overflow: visible; background: var(--color-canvas-default); border-radius: 4px; border: 1px solid var(--color-border-muted); cursor: crosshair;">
        <defs>
          <linearGradient id="ticker-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            ${lineStops}
          </linearGradient>
          <linearGradient id="pulse-area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="white" style="stop-opacity:1" />
            <stop offset="100%" stop-color="white" style="stop-opacity:0.2" />
          </linearGradient>
          <mask id="gh-ticker-area-mask">
            <rect width="100%" height="100%" fill="url(#pulse-area-gradient)" />
          </mask>
        </defs>
        <g id="gh-ticker-quadrants">${quadrantLines}${avgLineHtml}${overallAvgLineHtml}</g>
        <path class="gh-ticker-area" d="M 0,${height} L ${points} L ${width},${height} Z" fill="url(#ticker-line-gradient)" mask="url(#gh-ticker-area-mask)" style="filter: saturate(1.5) brightness(1.2);" />
        <path class="gh-ticker-path" d="M ${points}" fill="none" stroke="var(--color-fg-default, #1f2328)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));" />
        <rect id="gh-ticker-selection" x="0" y="0" width="0" height="${height}" fill="var(--color-accent-emphasis)" fill-opacity="0.2" stroke="var(--color-accent-fg)" stroke-width="1" style="display: none; pointer-events: none;" />
        ${hoverZones}
      </svg>
    </div>
  `;
}

const clearHighlights = () => {
  document.querySelectorAll('.gh-highlight, .gh-highlight-special, .gh-highlight-sad').forEach((el: Element) => {
    el.classList.remove('gh-highlight', 'gh-highlight-special', 'gh-highlight-sad');
    (el as HTMLElement).style.outline = 'none';
    (el as HTMLElement).style.border = 'none';
  });
  document.querySelectorAll('.square-legend, .gh-sig-char, .stat-card, .badge').forEach((el: Element) => {
    el.classList.remove('highlighting');
  });
  document.querySelectorAll('.gh-ticker-highlight').forEach(el => el.remove());
};

const highlightDates = (dates: string[], className: string = 'gh-highlight') => {
  dates.forEach(date => {
    const dayEl = (document.querySelector(`.ContributionCalendar-day[data-date="${date}"]`) as HTMLElement);
    if (dayEl) { 
      dayEl.classList.add(className); 
    }

    const sigChar = document.querySelector(`.gh-sig-char[data-date="${date}"]`);
    if (sigChar) sigChar.classList.add('highlighting');

    if (globalAdvanced) {
      const ytdIdx = globalAdvanced.ytdDailyCounts.findIndex((d: {date:string}) => d.date === date);
      if (ytdIdx !== -1) {
        const tickerContainer = document.getElementById('gh-ticker-container');
        if (tickerContainer) {
          const svg = tickerContainer.querySelector('svg');
          const width = 800;
          const height = 80;
          const maxCount = Math.max(...globalAdvanced.ytdDailyCounts.map((d: {count:number}) => d.count), 1);
          const x = (ytdIdx / (globalAdvanced.ytdDailyCounts.length - 1)) * width;
          const y = height - (globalAdvanced.ytdDailyCounts[ytdIdx].count / maxCount) * height;
          
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', x.toString());
          circle.setAttribute('cy', y.toString());
          circle.setAttribute('r', '5');
          circle.setAttribute('fill', 'var(--color-accent-fg)');
          circle.setAttribute('class', 'gh-ticker-highlight');
          circle.style.pointerEvents = 'none';
          svg?.appendChild(circle);
        }
      }
    }
  });
};

const highlightWeekday = (weekdayIndex: number, startDate?: string, endDate?: string, className: string = 'gh-highlight') => {
  document.querySelectorAll('.ContributionCalendar-day[data-date]').forEach((day: Element) => {
    const date = day.getAttribute('data-date');
    if (!date || (startDate && date < startDate) || (endDate && date > endDate)) return;
    if (new Date(date + 'T00:00:00').getDay() === weekdayIndex) { 
      highlightDates([date], className);
    }
  });
};

function renderYearComparison(results: YearlyStats[]) {
  if (results.length === 0) return '';
  
  return `
    <div id="gh-year-comparison" class="mb-3" style="border-top: 1px solid var(--color-border-muted); padding-top: 8px;">
      <div class="d-flex flex-justify-between flex-items-center mb-2">
        <span class="color-fg-muted text-small font-weight-bold">Yearly Performance Comparison</span>
      </div>
      <div style="overflow-x: auto;">
        <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--color-border-muted); text-align: left;">
              <th style="padding: 4px;">Year</th>
              <th style="padding: 4px;">Total</th>
              <th style="padding: 4px;">Max Streak</th>
              <th style="padding: 4px;">Avg Velocity</th>
              <th style="padding: 4px;">Consistency</th>
              <th style="padding: 4px;">L4 Range</th>
            </tr>
          </thead>
          <tbody>
            ${results.map(r => `
              <tr style="border-bottom: 1px solid var(--color-border-subtle);">
                <td style="padding: 4px; font-weight: 600;">${r.year}</td>
                <td style="padding: 4px;">${r.total}</td>
                <td style="padding: 4px;">${r.advanced.longestStreak}d</td>
                <td style="padding: 4px;">${r.advanced.velocity} c/d</td>
                <td style="padding: 4px;">${r.advanced.consistency}%</td>
                <td style="padding: 4px;">${r.thresholds[4]?.min ?? '?'}+</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
export async function injectStats(thresholds: Record<number, {min:number; max:number}>, percentiles: any, data: ContributionDay[], advanced: AdvancedStats, savedOrder: string[] | null = null, showTrends: boolean = true, yearlyComparison: YearlyStats[] = [], ownCharacter?: AdvancedStats) {
  const settings = await chrome.storage.local.get(VISIBILITY_KEYS) as GitHeatSettings;
  const isBattleEnabled = settings.showBattle !== false;

  console.log("GitHeat: Injecting Stats (v1.4)...");
  globalAdvanced = advanced;
  const container = document.querySelector('.js-yearly-contributions');
  if (!container) return;
  const existing = document.getElementById('git-heat-stats');
  if (existing) existing.remove();

  // Add streak and battle styles
  if (!document.getElementById('gh-extra-styles')) {
    const style = document.createElement('style');
    style.id = 'gh-extra-styles';
    style.textContent = `
      @keyframes streak-glow {
        0% { box-shadow: 0 0 5px rgba(207, 34, 46, 0.2); border-color: rgba(207, 34, 46, 0.3); }
        50% { box-shadow: 0 0 15px rgba(207, 34, 46, 0.5); border-color: rgba(207, 34, 46, 0.6); }
        100% { box-shadow: 0 0 5px rgba(207, 34, 46, 0.2); border-color: rgba(207, 34, 46, 0.3); }
      }
      @keyframes record-pulse {
        0% { transform: scale(1); filter: brightness(1); }
        50% { transform: scale(1.02); filter: brightness(1.2); box-shadow: 0 0 20px rgba(9, 105, 218, 0.4); }
        100% { transform: scale(1); filter: brightness(1); }
      }
      @keyframes gh-damage-up {
        0% { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(-30px); opacity: 0; }
      }
      .streak-hot { animation: streak-glow 2s infinite ease-in-out; border-width: 1.5px !important; }
      .streak-supernova { animation: record-pulse 1.5s infinite ease-in-out; border: 2px solid #0969da !important; background: var(--color-accent-subtle) !important; }
      .streak-progress-bg { height: 3px; width: 100%; background: var(--color-border-muted); border-radius: 2px; margin-top: 4px; overflow: hidden; }
      .streak-progress-fill { height: 100%; transition: width 0.5s ease-out; }
      .gh-battle-arena { background: var(--color-canvas-subtle); border: 1px solid var(--color-border-muted); border-radius: 6px; overflow: hidden; position: relative; }
      .gh-switch { position: relative; display: inline-block; width: 24px; height: 14px; margin-left: 6px; }
      .gh-switch input { opacity: 0; width: 0; height: 0; }
      .gh-switch-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--color-border-default); transition: .4s; border-radius: 14px; }
      .gh-switch-slider:before { position: absolute; content: ""; height: 10px; width: 10px; left: 2px; bottom: 2px; background-color: white; transition: .4s; border-radius: 50%; }
      input:checked + .gh-switch-slider { background-color: var(--color-success-emphasis); }
      input:checked + .gh-switch-slider:before { transform: translateX(10px); }
    `;
    document.head.appendChild(style);
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const statsDiv = document.createElement('div');
  statsDiv.id = 'git-heat-stats';
  statsDiv.className = 'git-heat-panel border color-border-muted color-bg-subtle rounded-2 p-2 mb-2';
  statsDiv.style.marginTop = '8px';
  const titleSuffix = advanced.isYTD ? '(YTD)' : '(Year)';

  let gridOrder = savedOrder || DEFAULT_GRID_ORDER;
  DEFAULT_GRID_ORDER.forEach(id => { if (!gridOrder.includes(id)) gridOrder.push(id); });

  const streakPercent = Math.min(100, Math.floor((advanced.currentStreak / advanced.longestStreak) * 100));
  const heatClass = advanced.streakHeat.status === 'Supernova' ? 'streak-supernova' : 
                    (advanced.streakHeat.status === 'On Fire' || advanced.streakHeat.status === 'Hot' ? 'streak-hot' : '');

  const itemMap: Record<string, string> = {
    'gh-streak': `<div class="stat-card highlightable ${heatClass}" id="gh-streak" data-current-streak="${(advanced.currentStreakDates || []).join(',')}" data-longest-streak="${(advanced.longestStreakDates || []).join(',')}" title="Your current streak: ${advanced.currentStreak} days. Longest streak ever: ${advanced.longestStreak} days.">
      <div class="d-flex flex-justify-between flex-items-center">
        <span class="color-fg-muted d-block text-small">Current / Best Streak</span>
        ${advanced.streakHeat.multiplier > 1 ? `<span class="Label" style="background: ${advanced.streakHeat.color}; color: white; font-size: 9px; padding: 0 4px;">${advanced.streakHeat.icon} ${advanced.streakHeat.status}</span>` : ''}
      </div>
      <strong class="f3-light">${advanced.currentStreak} / ${advanced.longestStreak} days</strong>
      ${advanced.streakHeat.status !== 'Supernova' ? `
        <div class="streak-progress-bg">
          <div class="streak-progress-fill" style="width: ${streakPercent}%; background: ${advanced.streakHeat.color};"></div>
        </div>
        <div class="text-small color-fg-muted mt-1" style="font-size: 9px;">
          ${advanced.currentStreak >= advanced.longestStreak ? 'Record matched!' : `${advanced.longestStreak - advanced.currentStreak} days to personal best`}
        </div>
      ` : `<div class="text-small color-fg-accent mt-1 font-weight-bold" style="font-size: 9px;">NEW PERSONAL RECORD! 🏆</div>`}
    </div>`,
    'gh-best-month': `<div class="stat-card highlightable" id="gh-best-month" data-month-dates="${(advanced.bestMonthDates || []).join(',')}" title="Best month score vs average month score (${Math.round(advanced.avgMonthScore)}). (${advanced.bestMonthStats.count} commits, ${advanced.bestMonthStats.consistency}% consistency, ${advanced.bestMonthStats.streak} day streak)">
      <span class="color-fg-muted d-block text-small">Best Month (${advanced.bestMonthName})</span>
      <div class="d-flex flex-items-center gap-1">
        <strong class="f3-light">Score: ${advanced.bestMonthStats.score}</strong>
        ${(showTrends !== false && advanced.bestMonthTrend !== 0) ? `
          <span class="${advanced.bestMonthTrend > 0 ? 'color-fg-success' : 'color-fg-danger'} font-weight-bold" style="white-space: nowrap; font-size: 11px;">
            ${advanced.bestMonthIcon}${Math.abs(advanced.bestMonthTrend)}%
          </span>` : ''}
      </div>
    </div>`,
    'gh-worst-month': `<div class="stat-card highlightable" id="gh-worst-month" data-month-dates="${(advanced.worstMonthDates || []).join(',')}" title="Calculation: Commits × Consistency × Max Streak. This month: ${advanced.worstMonthStats.count} commits, ${advanced.worstMonthStats.consistency}% consistency, ${advanced.worstMonthStats.streak} day streak. Average month score: ${Math.round(advanced.avgMonthScore || 0)}.">
      <span class="color-fg-muted d-block text-small">Worst Month (${advanced.worstMonthName})</span>
      <div class="d-flex flex-items-center gap-1">
        <strong class="f3-light">Score: ${advanced.worstMonthStats.score}</strong>
        ${(showTrends !== false && advanced.worstMonthTrend !== 0) ? `
          <span class="${advanced.worstMonthTrend > 0 ? 'color-fg-success' : 'color-fg-danger'} font-weight-bold" style="white-space: nowrap; font-size: 11px;">
            ${advanced.worstMonthIcon}${Math.abs(advanced.worstMonthTrend)}%
          </span>` : ''}
      </div>
    </div>`,
    'gh-best-week': `<div class="stat-card highlightable" id="gh-best-week" data-week-dates="${(advanced.bestWeekDates || []).join(',')}" title="Best week score vs average week score (${Math.round(advanced.avgWeekScore)}). (${advanced.bestWeekStats.count} commits, ${advanced.bestWeekStats.consistency}% consistency, ${advanced.bestWeekStats.streak} day streak)">
      <span class="color-fg-muted d-block text-small">Best Week (${advanced.bestWeekName})</span>
      <div class="d-flex flex-items-center gap-1">
        <strong class="f3-light">Score: ${advanced.bestWeekStats.score}</strong>
        ${(showTrends !== false && advanced.bestWeekTrend !== 0) ? `
          <span class="${advanced.bestWeekTrend > 0 ? 'color-fg-success' : 'color-fg-danger'} font-weight-bold" style="white-space: nowrap; font-size: 11px;">
            ${advanced.bestWeekIcon}${Math.abs(advanced.bestWeekTrend)}%
          </span>` : ''}
      </div>
    </div>`,
    'gh-worst-week': `<div class="stat-card highlightable" id="gh-worst-week" data-week-dates="${(advanced.worstWeekDates || []).join(',')}" title="Calculation: Commits × Consistency × Max Streak. This week: ${advanced.worstWeekStats.count} commits, ${advanced.worstWeekStats.consistency}% consistency, ${advanced.worstWeekStats.streak} day streak. Average week score: ${Math.round(advanced.avgWeekScore || 0)}.">
      <span class="color-fg-muted d-block text-small">Worst Week (${advanced.worstWeekName})</span>
      <div class="d-flex flex-items-center gap-1">
        <strong class="f3-light">Score: ${advanced.worstWeekStats.score}</strong>
        ${(showTrends !== false && advanced.worstWeekTrend !== 0) ? `
          <span class="${advanced.worstWeekTrend > 0 ? 'color-fg-success' : 'color-fg-danger'} font-weight-bold" style="white-space: nowrap; font-size: 11px;">
            ${advanced.worstWeekIcon}${Math.abs(advanced.worstWeekTrend)}%
          </span>` : ''}
      </div>
    </div>`,
    'gh-current-week': `<div class="stat-card highlightable" id="gh-current-week" data-week-dates="${(advanced.currentWeekDates || []).join(',')}" title="Your performance this week so far vs average week score (${Math.round(advanced.avgWeekScore)}). (${advanced.currentWeekStats.count} commits, ${advanced.currentWeekStats.consistency}% consistency, ${advanced.currentWeekStats.streak} day streak)">
      <span class="color-fg-muted d-block text-small">Current Week</span>
      <strong class="f3-light">Score: ${advanced.currentWeekStats.score}</strong>
    </div>`,
    'gh-dominant-weekday': `<div class="stat-card" id="gh-dominant-weekday" title="The day of the week you are most active in terms of being the 'winner' of the week most often."><span class="color-fg-muted d-block text-small">Dominant Weekday</span><strong class="f3-light">${advanced.dominantWeekday} (${advanced.dominantWeekdayWins} weeks)</strong></div>`,
    'gh-island': `<div class="stat-card highlightable" id="gh-island" data-island="${(advanced.biggestIslandDates || []).join(',')}" title="The longest continuous period where you had at least level 2 (moderate) activity."><span class="color-fg-muted d-block text-small">Biggest Island (L2+)</span><strong class="f3-light">${advanced.biggestIslandSize} days</strong></div>`,
    'gh-slump-island': `<div class="stat-card highlightable" id="gh-slump-island" data-island="${(advanced.biggestSlumpIslandDates || []).join(',')}" title="The longest continuous period where you had level 0-1 (minimal) activity."><span class="color-fg-muted d-block text-small">Worst Island (0-1)</span><strong class="f3-light">${advanced.biggestSlumpIslandSize} days</strong></div>`,
    'gh-above-avg-island': `<div class="stat-card highlightable" id="gh-above-avg-island" data-island="${(advanced.biggestAboveAvgIslandDates || []).join(',')}" title="The longest continuous period where you were above your daily average velocity (${advanced.velocity} commits)."><span class="color-fg-muted d-block text-small">Longest Above Avg Island</span><strong class="f3-light">${advanced.biggestAboveAvgIslandSize} days</strong></div>`,
    'gh-velocity': `<div class="stat-card" id="gh-velocity" title="Average commits per active day: ${advanced.velocity}. Trend: Last 7 days vs Overall. Acceleration: Last 7 days vs 7 days prior.">
      <span class="color-fg-muted d-block text-small">Average Velocity</span>
      <div class="d-flex flex-items-center flex-wrap gap-1">
        <strong class="f3-light">${advanced.velocity} <small style="font-size: 0.6em; opacity: 0.8;">c/d</small></strong>
        <div class="d-flex flex-items-center" style="gap: 2px;">
          ${(showTrends !== false && advanced.velocityTrend !== 0) ? `
            <span class="${advanced.velocityTrend > 0 ? 'color-fg-success' : 'color-fg-danger'} font-weight-bold" style="white-space: nowrap; font-size: 11px;" title="Velocity Trend">
              ${advanced.velocityIcon}${Math.abs(advanced.velocityTrend)}%
            </span>` : ''}
          ${(showTrends !== false && advanced.acceleration !== 0) ? `
            <span class="${advanced.acceleration > 0 ? 'color-fg-success' : 'color-fg-danger'}" style="white-space: nowrap; font-size: 10px; border-left: 1px solid var(--color-border-muted); padding-left: 2px; margin-left: 2px; font-weight: 600;" title="Acceleration (7d vs Prev 7d)">
              ${advanced.accelerationIcon}${Math.abs(advanced.acceleration)}%<small style="opacity: 0.7; font-weight: normal;">acc</small>
            </span>` : ''}
        </div>
      </div>
    </div>`,
    'gh-velocity-above': `<div class="stat-card highlightable" id="gh-velocity-above" title="Days where your commit count was >= your average velocity (${advanced.velocity})."><span class="color-fg-muted d-block text-small">Above Average Days</span><strong class="f3-light">${advanced.aboveVelocityDates.length} days</strong></div>`,
    'gh-velocity-below': `<div class="stat-card highlightable" id="gh-velocity-below" title="Days where your commit count was > 0 but < your average velocity (${advanced.velocity})."><span class="color-fg-muted d-block text-small">Below Average Days</span><strong class="f3-light">${advanced.belowVelocityDates.length} days</strong></div>`,
    'gh-consistency': `<div class="stat-card" id="gh-consistency" title="${advanced.statsForTooltips.consistency.active} active days out of ${advanced.statsForTooltips.consistency.total} total days. Average active days per week: ${((advanced.statsForTooltips.consistency.active / advanced.statsForTooltips.consistency.total) * 7).toFixed(1)}."><span class="color-fg-muted d-block text-small">Consistency</span><strong class="f3-light">${advanced.consistency}%</strong></div>`,
    'gh-weekend': `<div class="stat-card" id="gh-weekend" title="${advanced.statsForTooltips.weekend.active} active weekend days out of ${advanced.statsForTooltips.weekend.total} total weekend days. Weekend contribution share: ${((advanced.weekendCommits / advanced.total) * 100).toFixed(1)}%."><span class="color-fg-muted d-block text-small">Weekend Score</span><strong class="f3-light">${advanced.weekendScore}%</strong></div>`,
    'gh-slump': `<div class="stat-card highlightable" id="gh-slump" title="Longest period without any commits: ${advanced.longestSlump} days. Period: ${(advanced.longestSlumpDates || []).length > 0 ? (advanced.longestSlumpDates[0] + ' to ' + advanced.longestSlumpDates[advanced.longestSlumpDates.length - 1]) : 'N/A'}"><span class="color-fg-muted d-block text-small">Longest Slump</span><strong class="f3-light">${advanced.longestSlump} days</strong></div>`,
    'gh-best-day': `<div class="stat-card highlightable" id="gh-best-day" data-weekday="${advanced.bestDayIndex}" title="Average for this day: ${advanced.bestWeekdayAvg} commits. Comparison vs other weekdays: ${advanced.bestWeekdayTrend > 0 ? '+' : ''}${advanced.bestWeekdayTrend}%.">
      <span class="color-fg-muted d-block text-small">Best Weekday</span>
      <div class="d-flex flex-items-center gap-1">
        <strong class="f3-light">${advanced.bestDay} (${advanced.bestDayCount})</strong>
        ${(showTrends !== false && advanced.bestWeekdayTrend !== 0) ? `
          <span class="${advanced.bestWeekdayTrend > 0 ? 'color-fg-success' : 'color-fg-danger'} font-weight-bold" style="white-space: nowrap; font-size: 11px;">
            ${advanced.bestWeekdayIcon}${Math.abs(advanced.bestWeekdayTrend)}%
          </span>` : ''}
      </div>
    </div>`,
    'gh-worst-day': `<div class="stat-card highlightable" id="gh-worst-day" data-weekday="${advanced.worstDayIndex}" title="Average for this day: ${advanced.worstWeekdayAvg} commits."><span class="color-fg-muted d-block text-small">Worst Weekday</span><strong class="f3-light">${advanced.worstDay} (${advanced.worstDayCount})</strong></div>`,
    'gh-current-weekday': `<div class="stat-card highlightable" id="gh-current-weekday" data-weekday="${advanced.currentWeekdayIndex}" title="Today's count: ${advanced.currentWeekdayCount}. Average for this specific weekday: ${advanced.currentWeekdayAvg}. Trend: ${advanced.currentWeekdayTrend > 0 ? '+' : ''}${advanced.currentWeekdayTrend}%.">
      <span class="color-fg-muted d-block text-small">Current Weekday (${advanced.currentWeekday})</span>
      <div class="d-flex flex-items-center gap-1">
        <strong class="f3-light">${advanced.currentWeekdayCount}</strong>
        ${(showTrends !== false && advanced.currentWeekdayTrend !== 0) ? `
          <span class="${advanced.currentWeekdayTrend > 0 ? 'color-fg-success' : 'color-fg-danger'} font-weight-bold" style="white-space: nowrap; font-size: 11px;">
            ${advanced.currentWeekdayIcon}${Math.abs(advanced.currentWeekdayTrend)}%
          </span>` : ''}
      </div>
    </div>`,
    'gh-power-day': `<div class="stat-card highlightable" id="gh-power-day" data-weekday="${advanced.powerDayIndex}" title="The day of the week with the highest average commit count (${advanced.powerDayAvg})."><span class="color-fg-muted d-block text-small">Most Productive (Avg)</span><strong class="f3-light">${advanced.powerDay} (${advanced.powerDayAvg})</strong></div>`,
    'gh-peak-day': `<div class="stat-card highlightable" id="gh-peak-day" data-weekday="${advanced.peakWeekdayIndex}" title="The day of the week where you most frequently reach at least moderate (L2+) activity levels. Count: ${advanced.peakWeekdayCount} days."><span class="color-fg-muted d-block text-small">Peak Frequency (L2+)</span><strong class="f3-light">${advanced.peakWeekday} (${advanced.peakWeekdayCount})</strong></div>`,
    'gh-most-active-day': `<div class="stat-card highlightable" id="gh-most-active-day" data-date="${advanced.mostActiveDay}" data-weekday="${advanced.mostActiveDayWeekday}"><span class="color-fg-muted d-block text-small">Most Active Day</span><strong class="f3-light">${advanced.mostActiveDay}</strong></div>`,
    'gh-max-commits': `<div class="stat-card highlightable" id="gh-max-commits" data-date="${advanced.mostActiveDay}" data-weekday="${advanced.mostActiveDayWeekday}"><span class="color-fg-muted d-block text-small">Max Daily Commits</span><strong class="f3-light">${advanced.mostActiveDayCount}</strong></div>`,
    'gh-stars': `<div class="stat-card" id="gh-stars"><span class="color-fg-muted d-block text-small">Pinned Stars / Forks</span><strong class="f3-light">${advanced.totalStars} / ${advanced.totalForks}</strong></div>`,
    'gh-pr': `<div class="stat-card" id="gh-pr"><span class="color-fg-muted d-block text-small">PR Activity (O/M/R)</span><strong class="f3-light">${advanced.pullRequests} / ${advanced.mergedPullRequests} / ${advanced.pullRequestReviews}</strong></div>`,
    'gh-issue-created': `<div class="stat-card" id="gh-issue-created"><span class="color-fg-muted d-block text-small">Issues / Created Repos</span><strong class="f3-light">${advanced.issuesOpened} / ${advanced.createdRepos}</strong></div>`,
    'gh-langs': `<div class="stat-card" id="gh-langs"><span class="color-fg-muted d-block text-small">Top Languages</span><strong class="f3-light">${(advanced.topLangs || []).join(', ') || 'N/A'}</strong></div>`,
    'gh-network': `<div class="stat-card" id="gh-network"><span class="color-fg-muted d-block text-small">Network</span><strong class="f3-light">${advanced.socials.followers} Followers / ${advanced.socials.organizations} Orgs</strong></div>`
  };

  const rpgClasses = getCodingClass(advanced);
  const tickerHtml = renderTickerGraph(advanced.ytdDailyCounts, thresholds);
  const comparisonHtml = renderYearComparison(yearlyComparison);

  statsDiv.innerHTML = `
    <div class="d-flex flex-justify-between flex-items-start mb-2" style="gap: 15px;">
      <div class="d-flex flex-column" style="flex: 1; min-width: 0;">
        <div class="d-flex flex-items-center flex-wrap gap-2">
          <h3 class="h4 mb-0" style="white-space: nowrap;">GitHeat Analytics ${titleSuffix}</h3>
          <span id="gh-persona" class="Label Label--info" style="white-space: nowrap; cursor: help;" title="Your general coding persona based on recent activity.">Persona: ${advanced.persona}</span>
        </div>
        
        ${rpgClasses.length > 0 ? `
          <div class="d-flex flex-items-center flex-wrap gap-1 mt-1">
            <span class="color-fg-muted text-small" style="white-space: nowrap;">Class:</span>
            ${rpgClasses.map(c => `
              <span class="Label Label--secondary" style="cursor: help; display: inline-flex; align-items: center; gap: 4px;" title="${c.description}">
                <span>${c.icon}</span> ${c.name}
              </span>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <div class="d-flex flex-items-center" style="gap: 12px; flex-shrink: 0;">
        ${renderAvatar(advanced.avatar)}

        ${advanced.todayCombo >= 2 ? `
          <div class="gh-combo-badge" title="${advanced.todayComboMath}">
            <div style="line-height: 1;">${advanced.todayCombo}x COMBO</div>
            <div style="font-size: 9px; opacity: 0.95; margin-top: 1px; font-weight: 700;">${advanced.todayComboReason}</div>
          </div>` : ''}
        
        <div id="gh-header-level" class="gh-level-header" style="margin: 0; width: 180px;">
          <div class="d-flex flex-items-center gap-2">
            <span class="gh-level-badge">LVL ${advanced.level}</span>
            <span class="gh-level-title">${advanced.levelTitle}</span>
          </div>
          <div class="gh-progress-container" title="${advanced.totalXP} XP earned (commits + bonuses). ${advanced.xpToNext} to level up.">
            <div class="gh-progress-bar" style="width: ${advanced.progressPercent}%;"></div>
          </div>
          <span class="gh-xp-text" style="font-size: 8px;">${advanced.levelProgressXP} / ${advanced.levelTotalXP} XP</span>
        </div>
      </div>
    </div>

    ${tickerHtml}
    ${comparisonHtml}

    <div id="gh-battle-arena" class="mb-2 p-2 border rounded-2 color-bg-default" style="display: none;">
      <div class="d-flex flex-justify-between flex-items-center mb-2">
        <div class="d-flex flex-items-center">
          <span class="color-fg-muted text-small font-weight-bold" style="font-size: 10px; letter-spacing: 0.5px;">AFK BATTLE ARENA</span>
          <label class="gh-switch" title="Toggle AFK Battler visibility">
            <input type="checkbox" id="gh-battle-toggle-check" ${isBattleEnabled ? 'checked' : ''}>
            <span class="gh-switch-slider"></span>
          </label>
        </div>
        <span class="text-small color-fg-accent" style="font-size: 9px;">Auto-battling based on profile stats</span>
      </div>
      <div id="gh-battle-arena-content" class="gh-battle-arena" style="height: 120px; width: 100%;">
        <!-- Battle entities injected here -->
      </div>
    </div>

    <details id="gh-skill-tree" class="mb-2 p-2 border rounded-2 color-bg-default" style="display: none;">
      <summary class="color-fg-muted text-small font-weight-bold" style="cursor: pointer; outline: none; list-style: none;">
        <span class="d-flex flex-justify-between flex-items-center">
          <span style="font-size: 10px; letter-spacing: 0.5px;">SKILL TREE (Expand)</span>
          <span class="text-small color-fg-accent" style="cursor: help; font-size: 9px;" title="Unlock skills by completing specific GitHub milestones.">? How to unlock</span>
        </span>
      </summary>
      
      <div class="mt-2">
        ${['Coding', 'Social', 'Consistency'].map(cat => {
          const catSkills = (advanced.skills || []).filter((s: Skill) => s.category === cat);
          if (catSkills.length === 0) return '';
          return `
            <div class="mb-1">
              <div class="text-small color-fg-muted" style="font-size: 8px; text-transform: uppercase; margin-bottom: 2px;">${cat}</div>
              <div class="d-flex flex-wrap gap-1">
                ${catSkills.map((s: Skill) => `
                  <div class="skill-node ${s.unlocked ? 'unlocked' : 'locked'}" 
                       title="${s.name}: ${s.description}\nRequirement: ${s.requirement}"
                       style="display: flex; align-items: center; gap: 3px; padding: 1px 6px; border-radius: 10px; font-size: 10px; border: 1px solid ${s.unlocked ? 'var(--color-success-emphasis)' : 'var(--color-border-muted)'}; background: ${s.unlocked ? 'var(--color-success-subtle)' : 'transparent'}; opacity: ${s.unlocked ? '1' : '0.4'}; cursor: help; transition: all 0.2s ease;">
                    <span style="font-size: 12px;">${s.icon}</span>
                    <span style="font-weight: ${s.unlocked ? '600' : 'normal'};">${s.name}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </details>

    <div class="git-heat-grid" id="gh-grid-stats">${gridOrder.map(id => itemMap[id] || '').join('')}</div>
    <div class="mt-2 pt-2 border-top color-border-muted d-flex flex-wrap gap-3" id="gh-detailed-stats">
      <div style="flex: 1; min-width: 160px;" id="gh-active-repos">
        <span class="color-fg-muted text-small d-block mb-1">Most Active Repos (Commits)</span>
        <div class="d-flex flex-column gap-1">${advanced.topRepos.slice(0, 3).map((r: {name:string; commits:number}) => `<div class="d-flex flex-justify-between text-small"><span>${r.name}</span></div>`).join('') || '<span class="text-small color-fg-muted">No recent activity found</span>'}</div>
      </div>
      <div style="flex: 1; min-width: 160px;" id="gh-created-repos">
        <span class="color-fg-muted text-small d-block mb-1">Created Repositories</span>
        <div class="d-flex flex-column gap-1">${advanced.createdRepoList.slice(0, 3).map((r: CreatedRepo) => `<div class="d-flex flex-justify-between text-small"><span>${r.name}</span></div>`).join('') || '<span class="text-small color-fg-muted">No repos created</span>'}</div>
      </div>
      <div style="flex: 1; min-width: 160px;" id="gh-achievements">
        <span class="color-fg-muted text-small d-block mb-1">Recent Achievements</span>
        <div class="d-flex flex-wrap gap-1">${advanced.achievements.map((a: string) => `<span class="Label Label--secondary" title="${a}">${a}</span>`).join('') || '<span class="text-small color-fg-muted">None found</span>'}</div>
      </div>
    </div>
    <div class="mt-2 pt-2 border-top color-border-muted" id="gh-footer">
      <div id="gh-pulse-signature" class="mb-2" style="min-height: 14px;" title="A unique hexadecimal signature built from your daily contribution levels since Jan 1st. Reversed: Most recent day first. 0=Empty, 1-F=Deep Scale Level.">
        <div class="d-flex flex-items-center">
          <span class="color-fg-muted" style="font-size: 9px; font-family: monospace; letter-spacing: 1px; word-break: break-all; line-height: 1.4; display: block; flex: 1;">
            SIG: 0x${advanced.pulseHash.split('').map((char: string, i: number) => {
              const level = parseInt(char, 16);
              const dateIdx = advanced.ytdDailyCounts.length - 1 - i;
              const date = advanced.ytdDailyCounts[dateIdx]?.date || '';
              const count = advanced.ytdDailyCounts[dateIdx]?.count || 0;
              return `<span class="gh-sig-char" data-level="${level}" data-date="${date}" title="${date}: ${count} commits">${char}</span>`;
            }).join('')}
          </span>
          <button id="gh-sig-copy-btn" class="gh-sig-copy" title="Copy Signature to clipboard">Copy</button>
        </div>
      </div>
      <div class="d-flex flex-items-center flex-wrap mt-1">
        <span class="color-fg-muted text-small mr-2">Deep Scale: </span>
        <div id="granular-legend" class="d-flex gap-1 mr-3">
          ${Array.from({ length: 15 }).map((_, i) => `<div class="square-legend level-${i+1}"></div>`).join('')}
        </div>
        <div id="gh-thresholds-container" class="d-flex flex-items-center flex-wrap gap-2 ml-auto">
          <span class="color-fg-muted text-small mr-1">Thresholds: </span>
          <span id="gh-thresh-1" class="badge highlightable" style="border: 1px solid var(--color-border-default); cursor: pointer;">L1: ${thresholds[1]?.min ?? '?'}${thresholds[1]?.min === thresholds[1]?.max ? '' : `-${thresholds[1]?.max ?? '?'}`}</span>
          <span id="gh-thresh-2" class="badge highlightable" style="border: 1px solid var(--color-border-default); cursor: pointer;">L2: ${thresholds[2]?.min ?? '?'}${thresholds[2]?.min === thresholds[2]?.max ? '' : `-${thresholds[2]?.max ?? '?'}`}</span>
          <span id="gh-thresh-3" class="badge highlightable" style="border: 1px solid var(--color-border-default); cursor: pointer;">L3: ${thresholds[3]?.min ?? '?'}${thresholds[3]?.min === thresholds[3]?.max ? '' : `-${thresholds[3]?.max ?? '?'}`}</span>
          <span id="gh-thresh-4" class="badge highlightable" style="border: 1px solid var(--color-border-default); cursor: pointer;">L4: ${thresholds[4]?.min ?? '?'}+</span>
        </div>
      </div>
    </div>`;
  container.prepend(statsDiv);

  // Initialize Battle Arena
  if (isBattleEnabled) {
    const effectiveOwnCharacter = ownCharacter || generateGuestCharacter(advanced);
    startBattle(effectiveOwnCharacter, advanced, settings);
  }

  // Copy Signature logic
  const copyBtn = document.getElementById('gh-sig-copy-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(`0x${advanced.pulseHash}`);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('gh-copy-anim');
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.classList.remove('gh-copy-anim');
        }, 1500);
      } catch (err) {
        console.error('Failed to copy signature:', err);
      }
    });
  }

  const highlightThreshold = (level: number) => {
    document.querySelectorAll(`.ContributionCalendar-day[data-level="${level}"][data-date]`).forEach((day: Element) => {
      const date = day.getAttribute('data-date');
      if (date) highlightDates([date]);
    });
    document.querySelectorAll(`.gh-sig-char[data-level="${level}"]`).forEach((char: Element) => {
      char.classList.add('highlighting');
    });
  };

  const startOfYear = `${advanced.targetYear}-01-01`;
  const endOfTargetPeriod = advanced.targetYear === now.getFullYear() ? todayStr : `${advanced.targetYear}-12-31`;

  const addHover = (id: string, fn: () => void) => {
    const el = statsDiv.querySelector(id);
    if (el) { 
      el.addEventListener('mouseenter', () => { el.classList.add('highlighting'); fn(); }); 
      el.addEventListener('mouseleave', () => { el.classList.remove('highlighting'); clearHighlights(); }); 
    }
  };

  addHover('#gh-streak', () => highlightDates([...new Set([...advanced.longestStreakDates, ...advanced.currentStreakDates])]));
  addHover('#gh-best-month', () => highlightDates(advanced.bestMonthDates));
  addHover('#gh-worst-month', () => highlightDates(advanced.worstMonthDates));
  addHover('#gh-best-week', () => highlightDates(advanced.bestWeekDates));
  addHover('#gh-worst-week', () => highlightDates(advanced.worstWeekDates));
  addHover('#gh-current-week', () => highlightDates(advanced.currentWeekDates));
  addHover('#gh-island', () => highlightDates(advanced.biggestIslandDates, 'gh-highlight-special'));
  addHover('#gh-slump-island', () => highlightDates(advanced.biggestSlumpIslandDates, 'gh-highlight-sad'));
  addHover('#gh-above-avg-island', () => highlightDates(advanced.biggestAboveAvgIslandDates, 'gh-highlight-special'));
  addHover('#gh-velocity-above', () => highlightDates(advanced.aboveVelocityDates, 'gh-highlight-special'));
  addHover('#gh-velocity-below', () => highlightDates(advanced.belowVelocityDates, 'gh-highlight-sad'));
  addHover('#gh-slump', () => highlightDates(advanced.longestSlumpDates, 'gh-highlight-sad'));
  addHover('#gh-best-day', () => highlightWeekday(advanced.bestDayIndex, startOfYear, endOfTargetPeriod));
  addHover('#gh-worst-day', () => highlightWeekday(advanced.worstDayIndex, startOfYear, endOfTargetPeriod));
  addHover('#gh-current-weekday', () => highlightWeekday(advanced.currentWeekdayIndex, startOfYear, endOfTargetPeriod));
  addHover('#gh-power-day', () => highlightWeekday(advanced.powerDayIndex, startOfYear, endOfTargetPeriod));
  addHover('#gh-peak-day', () => highlightWeekday(advanced.peakWeekdayIndex, startOfYear, endOfTargetPeriod));
  addHover('#gh-most-active-day', () => highlightDates([advanced.mostActiveDay], 'gh-highlight-special'));
  addHover('#gh-max-commits', () => highlightDates([advanced.mostActiveDay], 'gh-highlight-special'));
  
  addHover('#gh-thresh-1', () => highlightThreshold(1));
  addHover('#gh-thresh-2', () => highlightThreshold(2));
  addHover('#gh-thresh-3', () => highlightThreshold(3));
  addHover('#gh-thresh-4', () => highlightThreshold(4));

  // Ticker interaction
  const tickerContainer = statsDiv.querySelector('#gh-ticker-container') as HTMLElement;
  tickerContainer?.addEventListener('mousedown', (e: MouseEvent) => {
    const idx = getIdxFromPoint(e.clientX, e.clientY);
    if (idx !== -1) {
      isDragging = true;
      selectionStartIdx = idx;
      updateSelection(idx, idx);
      e.preventDefault();
      e.stopPropagation();
    } else {
      const selectionRect = document.getElementById('gh-ticker-selection');
      const selectionStats = document.getElementById('gh-selection-stats');
      if (selectionRect) selectionRect.style.display = 'none';
      if (selectionStats) selectionStats.style.display = 'none';
      clearHighlights();
    }
  });

  tickerContainer?.addEventListener('mouseleave', () => {
    if (!isDragging) clearHighlights();
  });

  // Graph interaction
  document.querySelectorAll('.ContributionCalendar-day').forEach((day: Element) => {
    day.addEventListener('mouseenter', () => {
      const date = day.getAttribute('data-date');
      if (date) highlightDates([date]);
    });
    day.addEventListener('mouseleave', () => {
      clearHighlights();
    });
  });

  // Granular legend interaction
  statsDiv.querySelectorAll('.square-legend').forEach((sq, i) => {
    const level = i + 1;
    sq.addEventListener('mouseenter', () => {
       document.querySelectorAll(`.ContributionCalendar-day[data-granular-level="${level}"]`).forEach(el => {
         const d = el.getAttribute('data-date');
         if (d) highlightDates([d]);
       });
       sq.classList.add('highlighting');
    });
    sq.addEventListener('mouseleave', () => {
      clearHighlights();
    });
  });

  // SIG interaction
  statsDiv.querySelectorAll('.gh-sig-char').forEach((char: Element) => {
    char.addEventListener('mouseenter', () => {
      const date = char.getAttribute('data-date');
      if (date) highlightDates([date]);
    });
    char.addEventListener('mouseleave', () => {
      clearHighlights();
    });
  });

  // Battle Toggle Event Listener
  const battleToggleCheck = statsDiv.querySelector('#gh-battle-toggle-check') as HTMLInputElement;
  if (battleToggleCheck) {
    battleToggleCheck.addEventListener('change', async () => {
      await chrome.storage.local.set({ showBattle: battleToggleCheck.checked });
      if (!battleToggleCheck.checked && battleAnimationFrame) {
        cancelAnimationFrame(battleAnimationFrame);
        battleAnimationFrame = null;
        isArenaVisible = false;
      } else if (battleToggleCheck.checked) {
        const effectiveOwnCharacter = ownCharacter || generateGuestCharacter(advanced);
        startBattle(effectiveOwnCharacter, advanced, settings);
      }
    });
  }
}

export async function extendLegend(thresholds: Record<number, {min:number; max:number}>) {
  const legend = document.querySelector('.ContributionCalendar-footer');
  if (!legend) return;
  
  const settings = await chrome.storage.local.get(['showLegendNumbers']) as GitHeatSettings;
  const show = settings.showLegendNumbers !== false;

  legend.querySelectorAll('.git-heat-legend-label').forEach(el => el.remove());
  
  if (!show) return;

  legend.querySelectorAll('.ContributionCalendar-day').forEach(square => {
    const level = parseInt(square.getAttribute('data-level') || '0', 10);
    if (level > 0 && thresholds[level]) {
      const { min, max } = thresholds[level];
      const range = level === 4 ? `${min}+` : (min === max ? `${min}` : `${min}-${max}`);
      const span = document.createElement('span');
      span.className = 'text-small color-fg-muted ml-1 git-heat-legend-label';
      span.style.cssText = 'font-size: 10px; margin-left: 2px; margin-right: 4px;';
      span.textContent = range;
      square.after(span);
    }
  });
}
