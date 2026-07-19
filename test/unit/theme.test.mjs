import { expect } from 'chai';

const originalLocalStorage = globalThis.localStorage;
const originalWindow = globalThis.window;
const originalDocument = globalThis.document;

describe('theme storage', function () {
  after(function () {
    globalThis.localStorage = originalLocalStorage;
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  });

  it('keeps the application usable when browser storage is blocked', async function () {
    globalThis.localStorage = {
      getItem() {
        throw new DOMException('Storage is blocked', 'SecurityError');
      },
      setItem() {
        throw new DOMException('Storage is blocked', 'SecurityError');
      },
    };
    globalThis.window = {
      matchMedia() {
        return { matches: false };
      },
    };
    globalThis.document = {
      documentElement: { dataset: {}, style: {} },
      createElement() {
        return {};
      },
      querySelector() {
        return null;
      },
    };

    const { useTheme } = await import(`../../src/composables/useTheme.js?blocked=${Date.now()}`);
    const state = useTheme();

    expect(state.theme.value).to.equal('light');
    expect(() => state.toggleTheme()).not.to.throw();
    expect(state.theme.value).to.equal('dark');
  });
});
