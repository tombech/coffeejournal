// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock ResizeObserver which is used by Headless UI v2 - REQUIRED for v2
class ResizeObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

global.ResizeObserver = ResizeObserverMock;

// Mock scrollIntoView which is not available in test environment
Element.prototype.scrollIntoView = jest.fn();

// Mock matchMedia which is not available in test environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver with proper constructor and methods
class IntersectionObserverMock {
  constructor(callback, options = {}) {
    this.callback = callback;
    this.options = options;
  }
  
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

// Ensure the mock is available globally and behaves like a proper class
global.IntersectionObserver = IntersectionObserverMock;
window.IntersectionObserver = IntersectionObserverMock;

// Mock MutationObserver for HeadlessUI
class MutationObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  
  observe = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn(() => []);
}

global.MutationObserver = MutationObserverMock;
window.MutationObserver = MutationObserverMock;

// Mock getComputedStyle for @testing-library/user-event 
window.getComputedStyle = jest.fn().mockImplementation((element) => {
  return {
    getPropertyValue: jest.fn((prop) => {
      if (prop === 'pointer-events') return 'auto';
      return '';
    }),
    setProperty: jest.fn(),
    pointerEvents: 'auto', // Required for @testing-library/user-event
    // Add other CSS properties that might be accessed
    display: 'block',
    visibility: 'visible',
    opacity: '1'
  };
});

// Mock getBoundingClientRect comprehensively for HeadlessUI v2
const mockBoundingClientRect = jest.fn().mockReturnValue({
  width: 120,
  height: 40,
  top: 0,
  left: 0,
  bottom: 40,
  right: 120,
  x: 0,
  y: 0,
  toJSON: jest.fn()
});

// Apply to all possible element types
Element.prototype.getBoundingClientRect = mockBoundingClientRect;
HTMLElement.prototype.getBoundingClientRect = mockBoundingClientRect;
HTMLDivElement.prototype.getBoundingClientRect = mockBoundingClientRect;
HTMLInputElement.prototype.getBoundingClientRect = mockBoundingClientRect;

// Mock animation frame methods - required for HeadlessUI components
global.requestAnimationFrame = jest.fn((callback) => setTimeout(callback, 0));
global.cancelAnimationFrame = jest.fn(clearTimeout);

// Mock HTMLElement.offsetParent
Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
  get: jest.fn(() => null),
});

// Set up global DOM mocks for HeadlessUI v2 compatibility
beforeAll(() => {
  // Mock document.createRange for HeadlessUI
  if (!document.createRange) {
    document.createRange = () => {
      const range = new Range();
      range.getBoundingClientRect = mockBoundingClientRect;
      range.getClientRects = () => ({
        item: () => null,
        length: 0,
        [Symbol.iterator]: jest.fn()
      });
      return range;
    };
  }
  
  // Mock element style property for @testing-library/user-event
  Object.defineProperty(Element.prototype, 'style', {
    value: {
      pointerEvents: 'auto',
      display: 'block',
      visibility: 'visible',
      opacity: '1'
    },
    writable: true,
    configurable: true
  });
});

// Suppress console logs during tests for cleaner output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
