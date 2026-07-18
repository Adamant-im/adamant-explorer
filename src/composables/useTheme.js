import { computed, ref } from 'vue';

const STORAGE_KEY = 'adamant-explorer-theme';
const LIGHT_THEME_COLOR = '#f4f7f9';
const DARK_THEME_COLOR = '#0b1218';

/** Resolves the persisted preference or the operating-system theme. */
function initialTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved === 'light' || saved === 'dark') {
    return saved;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const theme = ref(initialTheme());

/** Applies the current theme to browser chrome and the document root. */
function applyTheme(value) {
  document.documentElement.dataset.theme = value;
  document.documentElement.style.colorScheme = value;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', value === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
}

applyTheme(theme.value);

/**
 * Shared light/dark theme state.
 *
 * The choice persists locally and never leaves the browser.
 *
 * @returns {{theme: import('vue').Ref<string>, isDark: import('vue').ComputedRef<boolean>, toggleTheme: Function}}
 */
export function useTheme() {
  const isDark = computed(() => theme.value === 'dark');

  function toggleTheme() {
    theme.value = isDark.value ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, theme.value);
    applyTheme(theme.value);
  }

  return { theme, isDark, toggleTheme };
}
