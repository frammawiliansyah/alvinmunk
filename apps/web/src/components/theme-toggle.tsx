'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
  getStoredChoice,
  setThemeChoice,
  useResolvedTheme,
  type ThemeChoice,
} from '@/lib/theme';

export { THEME_KEY } from '@/lib/theme';

const ORDER: ThemeChoice[] = ['system', 'light', 'dark'];
const ICONS = { light: Sun, dark: Moon, system: Monitor } as const;

function nextChoice(current: ThemeChoice): ThemeChoice {
  return ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
}

function labelFor(t: ReturnType<typeof useTranslations>, choice: ThemeChoice): string {
  if (choice === 'light') return t('nav.themeLight');
  if (choice === 'dark') return t('nav.themeDark');
  return t('nav.themeSystem');
}

/**
 * Light/Dark/System toggle. The root layout's inline script applies the theme before first
 * paint (explicit choice, else the OS preference), so this only reads the current state, follows
 * OS changes while on 'system', and persists (or clears, for 'system') an explicit choice.
 *
 * Renders a blank fixed-size slot until mounted: the server always renders `dark`, so guessing
 * an icon/label before we know the real theme would flip on hydration for light-mode users.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations();
  const resolved = useResolvedTheme();
  const [choice, setChoice] = useState<ThemeChoice | undefined>(undefined);

  useEffect(() => {
    setChoice(getStoredChoice());
  }, []);

  const mounted = choice !== undefined && resolved !== undefined;
  const current = choice ?? 'system';
  const next = nextChoice(current);
  const label = mounted ? labelFor(t, next) : t('nav.themeToggle');
  const Icon = ICONS[current];

  return (
    <button
      type="button"
      onClick={() => {
        setThemeChoice(next);
        setChoice(next);
      }}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground',
        className,
      )}
    >
      <span className="inline-flex size-5 items-center justify-center">
        {mounted && <Icon className="size-5" />}
      </span>
    </button>
  );
}
