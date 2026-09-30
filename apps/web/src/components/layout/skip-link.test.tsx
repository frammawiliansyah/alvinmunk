import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

(globalThis as { React?: typeof React }).React = React;
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { SkipLink } from './skip-link';

describe('SkipLink', () => {
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

  it('is a hidden-until-focused link to #main, labelled in English by default', async () => {
    await act(async () => root.render(<SkipLink />));
    const link = container.querySelector('a')!;
    expect(link.getAttribute('href')).toBe('#main');
    expect(link.textContent).toBe('Skip to content');
    expect(link.className).toContain('sr-only');
  });
});
