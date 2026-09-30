import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Every non-test source file under src/. */
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [full] : [];
  });
}

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
const SURFACES = ['--background', '--surface', '--surface-2', '--card', '--muted'];

/** Every semantic colour token that is used as text somewhere in the app, via its
 * text-safe `-text` variant (see globals.css and tailwind.config.ts). */
const TEXT_TOKENS = [
  '--muted-foreground',
  '--secondary-text',
  '--success-text',
  '--warning-text',
  '--accent-text',
  '--tertiary-text',
  '--destructive-text',
  '--lime-text',
];

describe('secondary text contrast', () => {
  for (const [theme, tokens] of Object.entries(THEMES)) {
    const color = (token: string) => toRgb(tokens.get(token)!);

    it(`full-strength muted-foreground clears AA on every ${theme} surface`, () => {
      for (const surface of SURFACES) {
        expect(
          contrast(color('--muted-foreground'), color(surface)),
          surface,
        ).toBeGreaterThanOrEqual(4.5);
      }
    });

    for (const token of TEXT_TOKENS) {
      it(`${token} clears AA on every ${theme} surface`, () => {
        for (const surface of SURFACES) {
          expect(contrast(color(token), color(surface)), surface).toBeGreaterThanOrEqual(4.5);
        }
      });
    }
  }

  // No fade is safe for text: /80 still clears AA on dark (5.3:1) but not on light (3.85:1).
  it('only decorative icons fade muted-foreground', () => {
    const offenders: string[] = [];
    for (const file of walk(srcDir)) {
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          // Icons are sized with `size-*`; everything else here is text.
          if (/text-muted-foreground\/\d+/.test(line) && !/\bsize-\d/.test(line)) {
            offenders.push(`${file.replace(srcDir, '')}:${i + 1}`);
          }
        });
    }
    expect(offenders).toEqual([]);
  });

  it('placeholders use the full-strength token', () => {
    for (const file of walk(srcDir)) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/placeholder:text-muted-foreground\//);
    }
  });

  // Raw Tailwind amber/yellow read at 1.3-1.5:1 on the light background — always use
  // the `warning` or `accent` token instead, which are guaranteed AA above.
  it('no raw amber/yellow Tailwind classes', () => {
    const offenders: string[] = [];
    for (const file of walk(srcDir)) {
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (/\b(?:amber|yellow)-\d+\b/.test(line)) {
            offenders.push(`${file.replace(srcDir, '')}:${i + 1}`);
          }
        });
    }
    expect(offenders).toEqual([]);
  });

  // The raw fill token (e.g. text-secondary) fails AA on light; text must go through the
  // `-text` variant instead (e.g. text-secondary-text), which the tests above verify.
  it('secondary/destructive/tertiary/accent/warning/success/lime text uses the -text variant', () => {
    const offenders: string[] = [];
    const RAW_TEXT = /\btext-(secondary|destructive|tertiary|accent|warning|success|lime)(?![-/\w])/;
    for (const file of walk(srcDir)) {
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (RAW_TEXT.test(line)) {
            offenders.push(`${file.replace(srcDir, '')}:${i + 1}`);
          }
        });
    }
    expect(offenders).toEqual([]);
  });
});
