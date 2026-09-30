import React from 'react';
import { cn } from '@/lib/utils';
import { STATE, asset, type StateKind } from '@/lib/assets';

/** Human-readable labels — these illustrations carry meaning, so they get real alt text. */
const LABEL: Record<StateKind, string> = {
  'vouch-sent': 'Vouch sent — their star is waiting to be claimed',
  'claim-success': 'Two people connected — your star just ignited',
  'quest-complete': 'Quest complete — Earned XP granted',
  'tip-received': 'Tip on its way',
  'streak-fire': 'Your weekly streak is on fire',
  'empty-leaderboard': 'No one on the leaderboard yet — be the first',
};

/**
 * An illustrated state moment (success / empty). Rendered at or below intrinsic size so
 * it never upscales. `size` is the max rendered WIDTH. Loads lazily by default — pass
 * `priority` for state art that's above the fold.
 */
export function StateArt({
  kind,
  size = 220,
  alt,
  priority = false,
  className,
}: {
  kind: StateKind;
  size?: number;
  alt?: string;
  priority?: boolean;
  className?: string;
}) {
  const m = STATE[kind];
  const width = Math.min(size, m.w);
  const height = Math.round((width / m.w) * m.h);
  return (
    <img
      src={asset(m.file)}
      alt={alt ?? LABEL[kind]}
      width={width}
      height={height}
      draggable={false}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      className={cn('select-none', className)}
    />
  );
}
