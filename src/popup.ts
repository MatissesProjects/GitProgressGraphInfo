document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loading')!;
  const error = document.getElementById('error')!;
  const content = document.getElementById('content')!;
  const totalCount = document.getElementById('total-count')!;

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
