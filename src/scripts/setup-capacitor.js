
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Capacitor...');

// Update package.json with scripts
console.log('📦 Updating package.json...');
try {
  require('./update-package-json');
} catch (error) {
  console.error('❌ Failed to update package.json:', error);
}

// Check for cordova-res and install if needed
try {
  console.log('📦 Making sure cordova-res is installed...');
  execSync('npm list -g cordova-res || npm install -g cordova-res', { stdio: 'inherit' });
} catch (error) {
  console.error('⚠️ Could not check cordova-res globally, trying to install locally...');
  try {
    execSync('npm install --save-dev cordova-res', { stdio: 'inherit' });
  } catch (innerError) {
    console.error('❌ Failed to install cordova-res:', innerError);
  }
}

// Create iOS resources
console.log('🎨 Creating iOS resources...');
try {
  require('./create-ios-resources');
} catch (error) {
  console.error('❌ Failed to create iOS resources:', error);
}

// Set up iOS platform
console.log('📱 Setting up iOS platform...');
try {
  require('./setup-ios');
} catch (error) {
  console.error('❌ Failed to set up iOS platform:', error);
}

console.log('🎉 Capacitor setup completed!');
console.log('👉 To run on iOS, execute "npm run cap:open:ios" or "npm run cap:run:ios" if you have proper setup');
