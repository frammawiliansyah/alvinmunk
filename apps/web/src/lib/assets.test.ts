import { describe, it, expect } from 'vitest';
import { asset, STATE, STICKER, TAPE, BRAND } from './assets';

describe('asset()', () => {
  it('prefixes the public assets base', () => {
    expect(asset('stickers/star-01.png')).toBe('/assets/stickers/star-01.png');
  });
  it('tolerates a leading slash', () => {
    expect(asset('/states/vouch-sent.png')).toBe('/assets/states/vouch-sent.png');
  });
});

describe('asset registries', () => {
  it('every state illustration has a file + intrinsic size', () => {
    for (const meta of Object.values(STATE)) {
      expect(meta.file).toMatch(/^states\/.+\.webp$/);
      expect(meta.w).toBeGreaterThan(0);
      expect(meta.h).toBeGreaterThan(0);
    }
  });
  it('stickers and tape ship as lossless webp', () => {
    for (const meta of [...Object.values(STICKER), ...Object.values(TAPE)]) {
      expect(meta.file).toMatch(/\.webp$/);
      expect(meta.w).toBeGreaterThan(0);
      expect(meta.h).toBeGreaterThan(0);
    }
  });
  it('brand entries are well-formed', () => {
    for (const meta of Object.values(BRAND)) {
      expect(meta.file).toMatch(/\.png$/);
      expect(meta.w).toBeGreaterThan(0);
      expect(meta.h).toBeGreaterThan(0);
    }
  });
});
