import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/recursive/casl.css';
import '@fontsource/gowun-dodum/index.css';
import '@fontsource/padauk/index.css';
import '@fontsource-variable/vazirmatn/index.css';
import './globals.css';
import { ThemeProvider } from '../components/ui/ThemeProvider';

export const metadata: Metadata = {
  title: 'Pehriod',
  description: 'Period tracking that measures: blood loss, pain relief, and a report for your doctor. Offline.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Pehriod' },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f3ee' },
    { media: '(prefers-color-scheme: dark)', color: '#131110' },
  ],
};

// Runs before first paint so the theme and accent never flash.
const THEME_SCRIPT = `(function(){try{
var t=localStorage.getItem('pehriod_theme'),h=document.documentElement;
if(t==='dark'){h.classList.add('dark');}
else if(t==='light'){h.classList.add('light');}
else if(window.matchMedia('(prefers-color-scheme:dark)').matches){h.classList.add('dark');}
var hue=localStorage.getItem('pehriod_accent_hue');
if(hue!==null){h.style.setProperty('--ah',hue);}
var l=JSON.parse(localStorage.getItem('pehriod_language')||'null');
if(l){h.lang=l;h.dir=l==='ar'?'rtl':'ltr';}
}catch(e){}})();`;

// The Android app serves its own files; the service worker is only for the website.
const SW_SCRIPT = `if('serviceWorker' in navigator&&!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform())){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(function(){});})}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: SW_SCRIPT }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
