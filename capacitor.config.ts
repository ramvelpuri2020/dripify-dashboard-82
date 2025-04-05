
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.genstyle.app',
  appName: 'GenStyle',
  webDir: 'dist',
  server: {
    url: 'https://7c4d7fc5-c801-4246-b1f3-59518b26b0e8.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PurchasesPlugin: {
      // RevenueCat specific configuration
      automaticAppleSearchAdsAttributionCollection: true,
      observerMode: false
    }
  }
};

export default config;
