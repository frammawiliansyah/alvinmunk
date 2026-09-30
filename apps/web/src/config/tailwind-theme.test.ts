/**
 * Issue #500: `2xl`/`3xl` fell through to Tailwind's defaults, so `rounded-xl` ended up
 * rounder than `rounded-2xl`, and `shadow-card` hardcoded a literal near-black colour
 * instead of reading the theme. Both are guarded here so a future edit to the scale can't
 * silently reintroduce either bug.
 */
import { describe, expect, it } from 'vitest';
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../tailwind.config';

const resolved = resolveConfig(tailwindConfig);

const RADIUS_STEPS = ['sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const;

/** `var(--radius)` or `calc(var(--radius) ± Nrem)`, evaluated at a representative --radius. */
function evaluate(expr: string, radiusRem = 0.875): number {
  if (expr === 'var(--radius)') return radiusRem;
  const match = expr.match(/^calc\(var\(--radius\)\s*([+-])\s*([\d.]+)rem\)$/);
  if (!match) throw new Error(`Unrecognized radius expression: ${expr}`);
  const [, sign, amount] = match;
  return radiusRem + (sign === '+' ? 1 : -1) * parseFloat(amount);
}

describe('tailwind radius scale', () => {
  it('is monotonically non-decreasing from sm to 3xl', () => {
    const values = RADIUS_STEPS.map((step) => {
      const expr = resolved.theme.borderRadius[step];
      expect(typeof expr).toBe('string');
      return evaluate(expr as string);
    });

    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    }
  });
});

describe('tailwind boxShadow tokens', () => {
  it('contains no literal colours — every colour is a CSS variable', () => {
    const shadows = resolved.theme.boxShadow as Record<string, string>;
    const custom = ['card', 'popover', 'toast', 'glow-primary', 'glow-onchain'];

    for (const key of custom) {
      const value = shadows[key];
      expect(value, `expected a boxShadow.${key} token`).toBeTruthy();

      const colorFns = value.match(/hsla?\(([^)]*)\)/g) ?? [];
      expect(colorFns.length).toBeGreaterThan(0);
      for (const fn of colorFns) {
        expect(fn).toMatch(/^hsla?\(var\(--/);
      }
    }
  });

  it('defines theme-aware popover and toast shadows to replace shadow-lg', () => {
    const shadows = resolved.theme.boxShadow as Record<string, string>;
    expect(shadows.popover).toBeTruthy();
    expect(shadows.toast).toBeTruthy();
  });
});
