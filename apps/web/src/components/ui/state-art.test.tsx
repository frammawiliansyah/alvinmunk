import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StateArt } from './state-art';

(globalThis as { React?: typeof React }).React = React;
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('StateArt (issue #507)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('is decorative by default — the same art is reused across contexts a fixed sentence would misdescribe', async () => {
    await act(async () => root.render(<StateArt kind="empty-leaderboard" />));
    const img = container.querySelector('img')!;
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('aria-hidden')).toBe('true');
  });

  it('announces an explicit alt and drops aria-hidden when the caller provides one', async () => {
    await act(async () => root.render(<StateArt kind="empty-leaderboard" alt="No reputation yet" />));
    const img = container.querySelector('img')!;
    expect(img.getAttribute('alt')).toBe('No reputation yet');
    expect(img.hasAttribute('aria-hidden')).toBe(false);
  });

  it('treats an explicit empty-string alt the same as the default (still decorative)', async () => {
    await act(async () => root.render(<StateArt kind="vouch-sent" alt="" />));
    const img = container.querySelector('img')!;
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('aria-hidden')).toBe('true');
  });
});
