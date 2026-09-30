'use client';

import { Toaster as Sonner } from 'sonner';
import { useResolvedTheme } from '@/lib/theme';

/**
 * App-wide toast surface, themed to the design tokens so it follows the chosen `html.light` /
 * `.dark` class — not `theme="system"`, which would follow the OS even after picking a theme.
 */
export function Toaster() {
  const theme = useResolvedTheme();
  return (
    <Sonner
      theme={theme ?? 'dark'}
      position="top-center"
      toastOptions={{
        style: {
          background: 'hsl(var(--popover))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--popover-foreground))',
        },
      }}
    />
  );
}

export { toast } from 'sonner';
