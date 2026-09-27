import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.robbiemed.pehriod',
  appName: 'Pehriod',
  webDir: 'out',
  android: {
    // No remote content: the app only ever loads its own bundled files.
    allowMixedContent: false,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_pehriod',
      iconColor: '#B8432F',
    },
  },
};

export default config;
