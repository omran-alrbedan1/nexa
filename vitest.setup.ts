import '@testing-library/jest-dom/vitest';

// Ensure localStorage is available on globalThis (jsdom provides it on window
// but modules may access it via globalThis in Node.js context)
const storage: Record<string, string> = {};
const localStorageMock: Storage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = String(value); },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
  get length() { return Object.keys(storage).length; },
  key: (index: number) => Object.keys(storage)[index] ?? null,
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});
