'use client';

import { useEffect, useState } from 'react';
import { getItem, remove, setItem } from './storage';

/** localStorage key for an explicit theme choice. Absent means "follow the OS". */
export const THEME_KEY = 'alvinmunk.theme';

export type Theme = 'light' | 'dark';
export type ThemeChoice = Theme | 'system';

/** Mirrors `--background` in globals.css (#0B0512 dark / computed from the light HSL token). */
export const THEME_COLOR: Record<Theme, string> = {
  dark: '#0B0512',
  light: '#F4EFFA',
};

export function systemTheme(): Theme {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

/** What's currently saved: an explicit theme, or `system` when no key is set. */
export function readThemeChoice(): ThemeChoice {
  const stored = getItem(THEME_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

/** Applies a resolved theme to the document: class, `color-scheme`, and every
 *  `theme-color` meta tag (so the browser chrome matches even when it differs
 *  from the OS-driven media queries the root `viewport` export renders). */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.style.colorScheme = theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute('content', THEME_COLOR[theme]);
  });
}

/** Persists a theme choice and applies it. `system` clears the saved key so
 *  OS changes are followed again. */
export function saveThemeChoice(choice: ThemeChoice) {
  if (choice === 'system') {
    remove(THEME_KEY);
    applyTheme(systemTheme());
  } else {
    setItem(THEME_KEY, choice);
    applyTheme(choice);
  }
}

/**
 * The theme actually in effect (never `system`), kept in sync with whatever
 * applied the `light`/`dark` class to `<html>` — the pre-paint script, this
 * hook's own OS listener, or ThemeToggle elsewhere in the tree.
 *
 * Returns `null` until mounted so callers can avoid guessing the OS theme
 * during SSR and flashing the wrong icon/state after hydration.
 */
export function useResolvedTheme(): Theme | null {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const read = () => (root.classList.contains('light') ? 'light' : 'dark');
    setTheme(read());

    const observer = new MutationObserver(() => setTheme(read()));
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    const media = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => {
      if (readThemeChoice() !== 'system') return;
      const next = media.matches ? 'light' : 'dark';
      applyTheme(next);
      setTheme(next);
    };
    media.addEventListener('change', onChange);

    return () => {
      observer.disconnect();
      media.removeEventListener('change', onChange);
    };
  }, []);

  return theme;
}
