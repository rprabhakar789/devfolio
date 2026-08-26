import { useCallback, useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'portfolio-theme';
const DEFAULT_THEME = 'dark';

function getInitialTheme() {
  if (typeof document === 'undefined') {
    return DEFAULT_THEME;
  }

  const attributeTheme = document.documentElement.getAttribute('data-theme');
  if (attributeTheme === 'light' || attributeTheme === 'dark') {
    return attributeTheme;
  }

  return DEFAULT_THEME;
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors (e.g. private browsing mode).
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
}
