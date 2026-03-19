import { vi } from 'vitest';

const mockStorage = {
  local: {
    get: vi.fn().mockResolvedValue({}),
    set: vi.fn().mockResolvedValue({}),
    clear: vi.fn().mockResolvedValue({}),
  },
  onChanged: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
};

const mockTabs = {
  query: vi.fn().mockResolvedValue([{ id: 1 }]),
  sendMessage: vi.fn(),
};

const mockRuntime = {
  onMessage: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
  sendMessage: vi.fn(),
  getURL: vi.fn(),
};

(global as any).chrome = {
  storage: mockStorage,
  tabs: mockTabs,
  runtime: mockRuntime,
};

// Mock fetch
(global as any).fetch = vi.fn().mockResolvedValue({
  text: () => Promise.resolve('<html><body><div class="ContributionCalendar-day" data-date="2023-01-01" data-level="1"></div></body></html>')
});

// Mock DOMParser
(global as any).DOMParser = class {
  parseFromString(html: string) {
    const doc = new Document();
    const div = doc.createElement('div');
    div.innerHTML = html;
    // Minimal mock of detached doc
    return {
      querySelectorAll: (selector: string) => div.querySelectorAll(selector),
      querySelector: (selector: string) => div.querySelector(selector),
    };
  }
};
