import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { initPopup } from '../src/popup';

const html = fs.readFileSync(path.resolve(__dirname, '../src/popup.html'), 'utf8');

describe('Popup UI', () => {
  beforeEach(() => {
    document.body.innerHTML = html;
    // Reset mocks
    vi.clearAllMocks();
    // We need to clear the storage mock return values too
    (chrome.storage.local.get as any).mockReset();
  });

  it('should toggle settings and save to storage', async () => {
    (chrome.storage.local.get as any).mockResolvedValue({
      showGrid: true,
      theme: 'green'
    });

    await initPopup();
    
    // Wait for async storage calls
    await new Promise(resolve => setTimeout(resolve, 0));

    const gridToggle = document.getElementById('toggle-grid') as HTMLInputElement;
    expect(gridToggle).not.toBeNull();
    expect(gridToggle.checked).toBe(true);

    // Simulate change
    gridToggle.checked = false;
    gridToggle.dispatchEvent(new Event('change', { bubbles: true }));

    expect(chrome.storage.local.set).toHaveBeenCalledWith({ showGrid: false });
  });

  it('should update theme selection', async () => {
    (chrome.storage.local.get as any).mockResolvedValue({
      theme: 'green'
    });

    await initPopup();
    await new Promise(resolve => setTimeout(resolve, 0));

    const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
    expect(themeSelect.value).toBe('green');

    themeSelect.value = 'ocean';
    themeSelect.dispatchEvent(new Event('change', { bubbles: true }));

    expect(chrome.storage.local.set).toHaveBeenCalledWith({ theme: 'ocean' });
  });

  it('should populate gear selections', async () => {
    (chrome.storage.local.get as any).mockResolvedValue({
      customAvatar: { base: '🧙' }
    });

    await initPopup();
    await new Promise(resolve => setTimeout(resolve, 0));

    const basesContainer = document.getElementById('custom-bases');
    expect(basesContainer?.children.length).toBeGreaterThan(1);
    
    const radioButtons = basesContainer?.querySelectorAll('input[type="radio"]');
    
    const wizardRadio = Array.from(radioButtons || []).find(rb => (rb as HTMLInputElement).value === '🧙') as HTMLInputElement;
    expect(wizardRadio).toBeDefined();
    expect(wizardRadio).not.toBeNull();
    expect(wizardRadio.checked).toBe(true);
  });
});
