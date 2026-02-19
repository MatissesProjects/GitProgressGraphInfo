document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loading')!;
  const error = document.getElementById('error')!;
  const content = document.getElementById('content')!;
  const totalCount = document.getElementById('total-count')!;
  const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
  const customColors = document.getElementById('custom-colors') as HTMLDivElement;
  const colorStart = document.getElementById('color-start') as HTMLInputElement;
  const colorStop = document.getElementById('color-stop') as HTMLInputElement;

  // Load saved theme and colors
  const settings = await chrome.storage.local.get(['theme', 'customStart', 'customStop']);
  if (settings.theme) {
    themeSelect.value = settings.theme as string;
    if (themeSelect.value === 'custom') {
      customColors.style.display = 'block';
    }
  }
  if (settings.customStart) colorStart.value = settings.customStart as string;
  if (settings.customStop) colorStop.value = settings.customStop as string;

  themeSelect.addEventListener('change', async () => {
    await chrome.storage.local.set({ theme: themeSelect.value });
    customColors.style.display = themeSelect.value === 'custom' ? 'block' : 'none';
  });

  const saveColors = async () => {
    await chrome.storage.local.set({ 
      customStart: colorStart.value,
      customStop: colorStop.value 
    });
  };

  colorStart.addEventListener('input', saveColors);
  colorStop.addEventListener('input', saveColors);

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id || !tab.url?.includes('github.com')) {
      throw new Error("Not a GitHub page");
    }

    chrome.tabs.sendMessage(tab.id, { action: "getStats" }, (response) => {
      if (chrome.runtime.lastError) {
        loading.style.display = 'none';
        error.textContent = "Please refresh the page to activate GitHeat.";
        error.style.display = 'block';
        return;
      }

      if (response && response.success) {
        loading.style.display = 'none';
        content.style.display = 'block';
        
        const adv = response.advanced;
        const titleSuffix = adv.isYTD ? '(YTD)' : '(Year)';
        
        // Update Total label
        const totalLabel = totalCount.previousElementSibling;
        if (totalLabel) {
          totalLabel.textContent = `Total ${titleSuffix}:`;
        }
        
        totalCount.textContent = response.total.toLocaleString();
        
        const t = response.thresholds;
        document.getElementById('l1-range')!.textContent = `${t[1]?.min ?? '?'}-${t[1]?.max ?? '?'}`;
        document.getElementById('l2-range')!.textContent = `${t[2]?.min ?? '?'}-${t[2]?.max ?? '?'}`;
        document.getElementById('l3-range')!.textContent = `${t[3]?.min ?? '?'}-${t[3]?.max ?? '?'}`;
        document.getElementById('l4-range')!.textContent = `${t[4]?.min ?? '?'}+`;

        // Render Percentiles
        const raritySection = document.getElementById('rarity-section')!;
        const p = response.percentiles;
        const markers = [99, 95, 90, 75, 50];
        
        const existingRows = raritySection.querySelectorAll('.rarity-row');
        existingRows.forEach(r => r.remove());

        markers.forEach(m => {
          if (p[m] !== undefined) {
            const row = document.createElement('div');
            row.className = 'rarity-row';
            row.innerHTML = `
              <span class="rarity-label">Top ${100-m}%:</span>
              <div class="rarity-bar">
                <div class="rarity-fill" style="width: ${m}%"></div>
              </div>
              <span class="rarity-value">${p[m]}+</span>
            `;
            raritySection.appendChild(row);
          }
        });

        // Render Advanced Stats
        document.getElementById('persona-badge')!.textContent = adv.persona;
        document.getElementById('current-streak')!.textContent = `${adv.currentStreak} days`;
        document.getElementById('longest-streak')!.textContent = `${adv.longestStreak} days`;
        document.getElementById('longest-slump')!.textContent = `${adv.longestSlump} days`;
        document.getElementById('consistency')!.textContent = `${adv.consistency}%`;
        document.getElementById('velocity')!.textContent = `${adv.velocity} c/d`;
        document.getElementById('weekend-score')!.textContent = `${adv.weekendScore}%`;
        document.getElementById('best-day')!.textContent = `${adv.bestDay} (${adv.bestDayCount})`;
        document.getElementById('worst-day')!.textContent = `${adv.worstDay} (${adv.worstDayCount})`;
        document.getElementById('pinned-stats')!.textContent = `${adv.totalStars} / ${adv.totalForks}`;
        document.getElementById('top-langs')!.textContent = adv.topLangs.join(', ') || 'N/A';
        document.getElementById('socials')!.textContent = `${adv.socials.followers} Follow / ${adv.socials.organizations} Orgs`;

        // Render Top Repos
        const repoList = document.getElementById('repo-list')!;
        repoList.innerHTML = '';
        adv.topRepos.forEach((r: any) => {
          const div = document.createElement('div');
          div.className = 'stat-row';
          div.style.fontSize = '12px';
          div.innerHTML = `<span>${r.name}</span><span style="font-weight: 600;">${r.commits}</span>`;
          repoList.appendChild(div);
        });

        // Render Achievements
        const achList = document.getElementById('achievement-list')!;
        achList.innerHTML = '';
        adv.achievements.forEach((a: string) => {
          const span = document.createElement('span');
          span.style.fontSize = '10px';
          span.style.padding = '2px 4px';
          span.style.background = '#f6f8fa';
          span.style.border = '1px solid #d0d7de';
          span.style.borderRadius = '4px';
          span.textContent = a;
          achList.appendChild(span);
        });
      } else {
        loading.style.display = 'none';
        error.textContent = response?.error || "Could not find contribution graph.";
        error.style.display = 'block';
      }
    });
  } catch (err: any) {
    loading.style.display = 'none';
    error.textContent = err.message;
    error.style.display = 'block';
  }
});
