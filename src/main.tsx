
import { createRoot } from 'react-dom/client'
import { App as CapacitorApp } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import App from './App.tsx'
import './index.css'

// Initialize Capacitor plugins when on a native platform
const isPlatform = () => {
  return typeof (window as any).Capacitor !== 'undefined'
}

// Set up mobile app when running natively
if (isPlatform()) {
  // Set status bar style
  StatusBar.setStyle({ style: Style.Dark })
    .catch(err => console.error('Status bar error:', err))
  
  // Hide splash screen with a fade animation
  SplashScreen.hide({
    fadeOutDuration: 500
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

// Get the root element
const rootElement = document.getElementById("root")

// Make sure the root element exists
if (!rootElement) {
  throw new Error("Root element not found. Make sure there is a div with id 'root' in your HTML.")
}

// Create and mount the React root
createRoot(rootElement).render(<App />)
