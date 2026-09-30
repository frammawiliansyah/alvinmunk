import { Bricolage_Grotesque, Inter, JetBrains_Mono } from 'next/font/google';

/**
 * `latin-ext` is preloaded alongside `latin` on every family: Turkish (ğ, ş, İ — 378
 * occurrences in `tr.json`) lives in `latin-ext`, which next/font self-hosts but only
 * preloads for subsets actually listed here. Without it, those glyphs briefly render in
 * the fallback font on first paint of Turkish pages.
 */
/** Display / headings — warm humanist (brand "human" feeling). */
export const fontDisplay = Bricolage_Grotesque({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-display',
  display: 'swap',
});

/** Body / UI — neutral humanist, legible at small sizes. */
export const fontSans = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
});

/** Mono — addresses, hashes, code, dev docs (the on-chain layer). */
export const fontMono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-mono',
  display: 'swap',
});

export const fontVars = `${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`;
