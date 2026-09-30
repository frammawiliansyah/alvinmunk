import React from 'react';
import { cn } from '@/lib/utils';
import { STATE, asset, type StateKind } from '@/lib/assets';

/**
 * An illustrated state moment (success / empty). Rendered at or below intrinsic size so
 * it never upscales. `size` is the max rendered WIDTH.
 *
 * Decorative by default (`alt=""`, `aria-hidden`) — the same art is reused across contexts
 * where a fixed sentence would be wrong, and the visible heading next to it already carries
 * the meaning. Pass an explicit `alt` (sourced from the message files) only where the art
 * conveys something the surrounding text doesn't.
 */
export function StateArt({
  kind,
  size = 220,
  alt = '',
  className,
}: {
  kind: StateKind;
  size?: number;
  alt?: string;
  className?: string;
}) {
  const m = STATE[kind];
  const width = Math.min(size, m.w);
  const height = Math.round((width / m.w) * m.h);
  return (
    <img
      src={asset(m.file)}
      alt={alt}
      aria-hidden={alt === '' ? true : undefined}
      width={width}
      height={height}
      draggable={false}
      className={cn('select-none', className)}
    />
  );
}
