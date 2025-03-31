
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.7c4d7fc5c8014246b1f359518b26b0e8',
  appName: 'GenStyle',
  webDir: 'dist',
  server: {
    url: 'https://7c4d7fc5-c801-4246-b1f3-59518b26b0e8.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    limitsNavigationsToAppBoundDomains: true,
    backgroundColor: '#000000', // Matching the dark theme
    preferredContentMode: 'mobile'
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#000000', // Matching the dark theme
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
