'use client';

import { useTranslations } from '@/lib/i18n';

/**
 * First focusable element in the document. Invisible until it receives keyboard focus,
 * then it jumps above the config banner (z-[200]) so it's never hidden behind it. Sends
 * focus straight to `<main>`, clearing the navbar (and, on /app/*, the tab bar) in one Tab.
 */
export function SkipLink() {
  const t = useTranslations();
  return (
    <a
      href="#main"
      className="sr-only z-[210] rounded-full bg-background px-4 py-2 text-sm font-medium text-foreground shadow-lg ring-1 ring-border focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {t('nav.skipToContent')}
    </a>
  );
}
