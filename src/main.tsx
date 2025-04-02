
import { createRoot } from 'react-dom/client'
import { App as CapacitorApp } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import App from './App.tsx'
import './index.css'

// Initialize Capacitor plugins when on a native platform
const isPlatform = () => {
  if (typeof window !== 'undefined' && typeof (window as any).Capacitor !== 'undefined') {
    return (window as any).Capacitor.isNativePlatform();
  }
  return false;
}

// Detect if we're running in a CI environment
const isCI = typeof process !== 'undefined' && process.env.CI === 'true';

// Set up mobile app when running natively
if (isPlatform()) {
  console.log('Running on native platform, initializing Capacitor plugins');
  
  // Set status bar style
  StatusBar.setStyle({ style: Style.Dark })
    .catch(err => console.error('Status bar error:', err))
  
  // Hide splash screen with a fade animation
  SplashScreen.hide({
    fadeOutDuration: 1000
  }).catch(err => console.error('Splash screen error:', err))
  
  // Handle back button
  CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    if (!canGoBack) {
      CapacitorApp.exitApp()
    } else {
      window.history.back()
    }
  })
}

// Ensure DOM is fully loaded before creating React root
const initializeApp = () => {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    console.error("Root element not found. Make sure there is a div with id 'root' in your HTML.");
    return;
  }

  try {
    createRoot(rootElement).render(<App />);
    console.log("App successfully mounted");
  } catch (error) {
    console.error("Error rendering the app:", error);
  }
};

// Use the safer approach to ensure DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
