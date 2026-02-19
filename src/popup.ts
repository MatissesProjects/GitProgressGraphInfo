document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loading')!;
  const error = document.getElementById('error')!;
  const content = document.getElementById('content')!;
  const totalCount = document.getElementById('total-count')!;
  const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;

  // Load saved theme
  const settings = await chrome.storage.local.get('theme');
  if (settings.theme) {
    themeSelect.value = settings.theme as string;
  }

  themeSelect.addEventListener('change', async () => {
    await chrome.storage.local.set({ theme: themeSelect.value });
  });

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
