import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '../components/ui/ThemeProvider';

export const metadata: Metadata = {
  title: 'Pehriod — Period Pain Manager',
  description: 'Cycle tracker, OTC drug guide, and medication safety log. Fully offline.',
  manifest: '/pehriod/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Pehriod' },
  icons: {
    icon: [
      { url: '/pehriod/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pehriod/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/pehriod/icon-192.png', sizes: '192x192' }],
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
            __html: `(function(){try{var t=localStorage.getItem('pehriod_theme');if(t==='dark')document.documentElement.classList.add('dark');else if(t==='light')document.documentElement.classList.add('light');else if(window.matchMedia('(prefers-color-scheme:dark)').matches)document.documentElement.classList.add('dark')}catch(e){}})();`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/pehriod/sw.js',{scope:'/pehriod/'}).catch(function(){});})}`,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
