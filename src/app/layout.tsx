import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '../components/ui/ThemeProvider';

export const metadata: Metadata = {
  title: 'Pehriod — Period Pain Manager',
  description: 'Cycle tracker, OTC drug guide, and medication safety log. Fully offline.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Pehriod' },
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
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ec4899' },
    { media: '(prefers-color-scheme: dark)', color: '#831843' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
              var t=localStorage.getItem('pehriod_theme');
              var h=document.documentElement;
              if(t==='dark'){h.classList.add('dark');}
              else if(t==='light'){h.classList.add('light');}
              else if(window.matchMedia('(prefers-color-scheme:dark)').matches){h.classList.add('dark');}
              var c=localStorage.getItem('pehriod_theme_color');
              if(c&&c!=='pink'){h.setAttribute('data-theme',c);}
            }catch(e){}})();`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(function(){});})}`,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
