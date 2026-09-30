import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { STATE, STICKER, TAPE, BRAND } from './assets';
import { KIT_COUNTS, FACE_IDS, kitFile, faceFile, type KitCategory } from './avatar';

/**
 * Guards issue #506: `public/` must ship nothing the app doesn't use. Every file under
 * apps/web/public is either named by an asset registry (assets.ts / avatar.ts — including
 * the portrait-kit and face stickers, which are built from index counts rather than
 * literal strings) or found as a literal path/basename in the app's source, next.config, or
 * the service worker (which references other public files itself, e.g. the push badge icon).
 *
 * This is a substring search, not a real reference graph, so it can be fooled by a file
 * whose name coincidentally appears in an unrelated string. It has not been in practice —
 * public/ asset names are specific (e.g. `landing-hero.png`, `alvinmunk-badge-96.png`).
 */
const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PUBLIC_DIR = path.join(WEB_ROOT, 'public');
const SRC_DIR = path.join(WEB_ROOT, 'src');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

describe('public/ has no unreferenced files (#506)', () => {
  it('every file under public/ is reachable from the app', () => {
    const referenced = new Set<string>();
    for (const m of [...Object.values(STATE), ...Object.values(STICKER), ...Object.values(TAPE), ...Object.values(BRAND)]) {
      referenced.add(`assets/${m.file}`);
    }
    for (const [cat, count] of Object.entries(KIT_COUNTS) as [KitCategory, number][]) {
      for (let n = 1; n <= count; n++) referenced.add(`assets/${kitFile(cat, n)}`);
    }
    for (const id of FACE_IDS) referenced.add(`assets/${faceFile(id)}`);

    // Literal-string fallback for files that aren't in a registry (backgrounds are gone —
    // replaced by CSS — so this is fonts, manifest/meta icons, and sw.js's own references).
    const blob = [
      ...walk(SRC_DIR).map((f) => fs.readFileSync(f, 'utf-8')),
      fs.readFileSync(path.join(WEB_ROOT, 'next.config.mjs'), 'utf-8'),
      fs.readFileSync(path.join(PUBLIC_DIR, 'sw.js'), 'utf-8'),
    ].join('\n');

    const unreferenced = walk(PUBLIC_DIR)
      .map((f) => path.relative(PUBLIC_DIR, f).split(path.sep).join('/'))
      .filter((rel) => rel !== 'sw.js')
      .filter((rel) => !referenced.has(rel))
      .filter((rel) => !blob.includes(rel) && !blob.includes(path.basename(rel)));

    expect(unreferenced).toEqual([]);
  });
});
