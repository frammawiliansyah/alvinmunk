import type { MetadataRoute } from 'next';
import { THEME_COLOR_DARK } from '@/lib/theme-colors';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'alvinmunk',
    short_name: 'alvinmunk',
    description: 'Collect people, not points.',
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    background_color: THEME_COLOR_DARK,
    theme_color: THEME_COLOR_DARK,
    icons: [
      {
        src: '/assets/brand/alvinmunk-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/assets/brand/alvinmunk-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/assets/brand/alvinmunk-icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
