
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.7c4d7fc5c8014246b1f359518b26b0e8',
  appName: 'GenStyle',
  webDir: 'dist',
  server: {
    url: 'https://7c4d7fc5-c801-4246-b1f3-59518b26b0e8.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  bundledWebRuntime: false,
  ios: {
    contentInset: 'automatic',
    limitsNavigationsToAppBoundDomains: true,
    backgroundColor: '#000000', // Matching the dark theme
    preferredContentMode: 'mobile',
    scheme: 'genstyle',
    allowsLinkPreview: false,
    handleApplicationNotifications: true,
    statusBarStyle: 'dark',
    minVersion: '14.0', // Set minimum iOS version
    hideLogs: false // Keep logs visible for debugging
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#000000', // Matching the dark theme
    captureInput: true,
    webContentsDebuggingEnabled: true,
    initialMargin: {
      top: 0
    },
    minSdkVersion: 22,
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#000000",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      splashFullScreen: true,
      splashImmersive: true
    },
    CapacitorHttp: {
      enabled: true
    },
    Camera: {
      presentationStyle: 'fullscreen'
    }
  }
};

export default config;
