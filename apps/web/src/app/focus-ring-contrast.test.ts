import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Declarations of the first `selector { … }` block, comments stripped. */
function block(css: string, selector: ':root' | ':root.light'): Map<string, string> {
  const escaped = selector.replace('.', '\\.');
  const body = new RegExp(`(^|\\n)${escaped}\\s*\\{([^}]*)\\}`).exec(css)?.[2];
  if (body === undefined) throw new Error(`no ${selector} block`);
  const decls = new Map<string, string>();
  for (const [, prop, value] of body
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .matchAll(/([\w-]+)\s*:\s*([^;]+);/g)) {
    decls.set(prop, value.trim());
  }
  return decls;
}

type Rgb = [number, number, number];

function toRgb(value: string): Rgb {
  const m = /^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/.exec(value);
  if (!m) throw new Error(`bad hsl triple: ${value}`);
  const [h, s, l] = [Number(m[1]), Number(m[2]) / 100, Number(m[3]) / 100];
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}

function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg: Rgb, bg: Rgb): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const globals = readFileSync(join(srcDir, 'app/globals.css'), 'utf8');
const THEMES = { dark: block(globals, ':root'), light: block(globals, ':root.light') };

describe('global focus ring', () => {
  for (const [theme, tokens] of Object.entries(THEMES)) {
    it(`--ring clears WCAG non-text contrast (3:1) against --background in ${theme}`, () => {
      const ring = toRgb(tokens.get('--ring')!);
      const background = toRgb(tokens.get('--background')!);
      expect(contrast(ring, background)).toBeGreaterThanOrEqual(3);
    });
  }

  it('globals.css applies :focus-visible with the --ring token in @layer base', () => {
    expect(globals).toMatch(/:focus-visible\s*{\s*outline:\s*2px solid hsl\(var\(--ring\)\);/);
  });

  it('components no longer hand-pick a focus ring colour', () => {
    const offenders = [/focus-visible:ring-lime/, /focus-visible:ring-primary/, /focus-visible:ring-offset/];
    for (const file of ['components/IdentityBar.tsx', 'app/leaderboard/page.tsx', 'app/stats/page.tsx', 'components/ui/button.tsx']) {
      const contents = readFileSync(join(srcDir, file), 'utf8');
      for (const pattern of offenders) expect(contents, `${file} matches ${pattern}`).not.toMatch(pattern);
    }
  });
});
