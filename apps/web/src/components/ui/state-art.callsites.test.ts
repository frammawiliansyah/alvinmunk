import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import en from '../../../messages/en.json';
import tr from '../../../messages/tr.json';

/**
 * Issue #507: the same StateArt illustration (e.g. `empty-leaderboard`, `vouch-sent`) is
 * reused across contexts where one fixed English sentence is wrong in most of them — the
 * `empty-leaderboard` art alone appears in 5 places, only one of which is an actual
 * leaderboard. StateArt is decorative by default now (alt="", aria-hidden); a call site may
 * only override that with an `alt` sourced from the message files (never a literal string),
 * so a future PR can't quietly reintroduce a hardcoded, out-of-context sentence.
 *
 * This audits every one of the 13 known call sites directly against their source files.
 */

interface CallSite {
  file: string;
  kinds: string[];
}

const CALL_SITES: CallSite[] = [
  { file: '../../app/app/people/page.tsx', kinds: ['empty-leaderboard', 'empty-leaderboard'] },
  { file: '../../app/claim/[id]/page.tsx', kinds: ['claim-success'] },
  { file: '../../app/score/[address]/page.tsx', kinds: ['empty-leaderboard'] },
  { file: '../../app/leaderboard/page.tsx', kinds: ['empty-leaderboard'] },
  { file: '../ActivityFeed.tsx', kinds: ['vouch-sent'] },
  { file: '../VouchCompose.tsx', kinds: ['vouch-sent', 'vouch-sent'] },
  { file: '../PendingHalfCards.tsx', kinds: ['vouch-sent'] },
  { file: '../Tip.tsx', kinds: ['tip-received'] },
  { file: '../Quests.tsx', kinds: ['streak-fire', 'quest-complete'] },
  { file: '../app/stat-strip.tsx', kinds: ['empty-leaderboard'] },
];

function findStateArtTags(source: string): string[] {
  return source.match(/<StateArt\b[^>]*\/>/g) ?? [];
}

const messages = { en: en as Record<string, string>, tr: tr as Record<string, string> };

describe('StateArt call sites (issue #507)', () => {
  it('accounts for exactly the 13 known call sites', () => {
    const total = CALL_SITES.reduce((n, site) => n + site.kinds.length, 0);
    expect(total).toBe(13);
  });

  for (const site of CALL_SITES) {
    it(`${site.file}: every <StateArt> is decorative or its alt comes from the message files`, () => {
      const source = readFileSync(path.resolve(__dirname, site.file), 'utf8');
      const tags = findStateArtTags(source);
      expect(tags).toHaveLength(site.kinds.length);

      tags.forEach((tag, i) => {
        expect(tag).toContain(`kind="${site.kinds[i]}"`);

        const altMatch = tag.match(/\balt=(\{[^}]*\}|"[^"]*")/);
        if (!altMatch) return; // no alt prop at all → decorative default (alt="", aria-hidden)

        const altExpr = altMatch[1];
        if (altExpr === '""') return; // explicit empty string → still decorative

        // Anything else must be threaded through a translation key, never a hardcoded
        // sentence — that's the whole bug this issue fixes.
        const keyMatch = altExpr.match(/t\(\s*['"]([\w.]+)['"]/);
        expect(
          keyMatch,
          `${site.file}: alt must read t('some.key') from the message files, not a literal — got ${altExpr}`,
        ).not.toBeNull();

        const key = keyMatch![1];
        expect(messages.en[key], `${site.file}: missing en.json key "${key}"`).toBeTruthy();
        expect(messages.tr[key], `${site.file}: missing tr.json key "${key}"`).toBeTruthy();
      });
    });
  }
});
