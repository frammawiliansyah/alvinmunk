'use client';

import { useEffect, useState } from 'react';
import { getItem, remove, setItem } from './storage';
import { THEME_COLOR_DARK, THEME_COLOR_LIGHT } from './theme-colors';

/** localStorage key for an explicit theme choice. Read by the pre-paint script in the root layout. */
export const THEME_KEY = 'alvinmunk.theme';

export type ResolvedTheme = 'light' | 'dark';
/** What the toggle offers: an explicit theme, or 'system' to follow the OS (no saved key). */
export type ThemeChoice = ResolvedTheme | 'system';

const THEME_COLOR: Record<ResolvedTheme, string> = {
  dark: THEME_COLOR_DARK,
  light: THEME_COLOR_LIGHT,
};

// Notifies every mounted `useResolvedTheme()` consumer (toggle, toaster, ...) when the applied
// theme changes, since they don't share a common ancestor to lift state into.
const THEME_CHANGE_EVENT = 'alvinmunk:theme-change';

export function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/** Applies a resolved theme to the document: class, color-scheme, and the theme-color meta(s). */
export function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.style.colorScheme = theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute('content', THEME_COLOR[theme]);
  });
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

/** Reads the stored explicit choice, or 'system' if none was ever saved (or it was cleared). */
export function getStoredChoice(): ThemeChoice {
  const stored = getItem(THEME_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

/** Applies and persists a theme choice. Picking 'system' clears the saved key so OS changes apply again. */
export function setThemeChoice(choice: ThemeChoice): ResolvedTheme {
  if (choice === 'system') {
    remove(THEME_KEY);
  } else {
    setItem(THEME_KEY, choice);
  }
  const resolved = choice === 'system' ? getSystemTheme() : choice;
  applyTheme(resolved);
  return resolved;
}

/**
 * Tracks the theme actually applied to `<html>`. Returns `undefined` until mounted so callers
 * can render a neutral placeholder instead of assuming the server-rendered `dark` default.
 */
export function useResolvedTheme(): ResolvedTheme | undefined {
  const [theme, setTheme] = useState<ResolvedTheme | undefined>(undefined);

  useEffect(() => {
    const read = () =>
      setTheme(document.documentElement.classList.contains('light') ? 'light' : 'dark');
    read();

    const media = window.matchMedia('(prefers-color-scheme: light)');
    const onMediaChange = (e: MediaQueryListEvent) => {
      if (getItem(THEME_KEY)) return; // an explicit choice wins
      applyTheme(e.matches ? 'light' : 'dark');
    };
    media.addEventListener('change', onMediaChange);
    window.addEventListener(THEME_CHANGE_EVENT, read);
    return () => {
      media.removeEventListener('change', onMediaChange);
      window.removeEventListener(THEME_CHANGE_EVENT, read);
    };
  }, []);

  return theme;
}
