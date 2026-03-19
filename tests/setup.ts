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
