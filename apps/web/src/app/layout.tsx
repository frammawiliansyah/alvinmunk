import type { Metadata, Viewport } from 'next';
import './globals.css';
import { fontVars } from '@/lib/fonts';
import { Starfield } from '@/components/brand/starfield';
import { SmoothScroll } from '@/components/smooth-scroll';
import { Navbar } from '@/components/layout/navbar';
import { SiteFooter } from '@/components/layout/site-footer';
import { Toaster } from '@/components/ui/toaster';
import { AnalyticsProvider } from '@/components/analytics';
import { ConfigStatusBanner } from '@/components/config-status-banner';
import { WalletProvider } from '@/components/wallet/wallet-provider';
import { MotionProvider } from '@/components/motion/motion-provider';
import { I18nProvider } from '@/lib/i18n';
import { rootMetadata } from '@/lib/metadata';
import { THEME_COLOR_DARK, THEME_COLOR_LIGHT } from '@/lib/theme-colors';

// Runs before first paint so the page never flashes the wrong theme: an explicit choice
// (localStorage `alvinmunk.theme`, written by ThemeToggle) wins, else the OS preference.
// The server always renders `dark`, so without JS the brand's dark theme is the fallback.
// Also syncs the `theme-color` meta(s) below, so the browser chrome matches too (ThemeToggle's
// `applyTheme` does the same after mount).
const THEME_INIT = `(function(){try{var LIGHT='${THEME_COLOR_LIGHT}',DARK='${THEME_COLOR_DARK}';var t=localStorage.getItem('alvinmunk.theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}var r=document.documentElement;r.classList.remove('light','dark');r.classList.add(t);r.style.colorScheme=t;var c=t==='light'?LIGHT:DARK;var metas=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<metas.length;i++){metas[i].setAttribute('content',c)}}catch(e){}})();`;

export const metadata: Metadata = rootMetadata;

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: THEME_COLOR_LIGHT },
    { media: '(prefers-color-scheme: dark)', color: THEME_COLOR_DARK },
  ],
  colorScheme: 'dark light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontVars} dark`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="grain min-h-dvh" suppressHydrationWarning>
        <WalletProvider>
          <I18nProvider>
          <MotionProvider>
          <SmoothScroll />
          <Starfield />
          <ConfigStatusBanner />
          <Navbar />
          <main className="min-h-[calc(100dvh-4rem)]">{children}</main>
          <SiteFooter />
          <Toaster />
          <AnalyticsProvider />
          </MotionProvider>
          </I18nProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
