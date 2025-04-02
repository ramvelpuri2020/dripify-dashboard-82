
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up iOS platform for CI environment...');

// Function to run commands with error handling
function runCommand(command, errorMessage) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ ${errorMessage}:`, error.message);
    return false;
  }
}

// Build the web assets first
console.log('📦 Building web assets...');
if (!runCommand('npm run build', 'Failed to build web assets')) {
  process.exit(1);
}

// Force add iOS platform (overwriting if necessary)
console.log('📱 Adding iOS platform with force option...');
if (!runCommand('npx cap add ios --force', 'Failed to add iOS platform')) {
  console.error('❌ Could not add iOS platform. Exiting.');
  process.exit(1);
}

// Sync to ensure all web assets are copied
console.log('🔄 Syncing Capacitor project...');
if (!runCommand('npx cap sync ios', 'Failed to sync iOS platform')) {
  console.error('❌ Could not sync iOS platform. Exiting.');
  process.exit(1);
}

// Verify iOS directory structure
const iosDir = path.join(process.cwd(), 'ios');
if (fs.existsSync(iosDir)) {
  const xcodeProjectPath = path.join(iosDir, 'App', 'App.xcodeproj');
  const xcodeWorkspacePath = path.join(iosDir, 'App', 'App.xcworkspace');
  
  if (fs.existsSync(xcodeProjectPath)) {
    console.log('✅ iOS Xcode project found at:', xcodeProjectPath);
  } else {
    console.error('❌ iOS Xcode project not found at expected location:', xcodeProjectPath);
    process.exit(1);
  }
  
  if (fs.existsSync(xcodeWorkspacePath)) {
    console.log('✅ iOS Xcode workspace found at:', xcodeWorkspacePath);
  } else {
    console.error('❌ iOS Xcode workspace not found at expected location:', xcodeWorkspacePath);
  }
  
  // List contents of the iOS directory for debugging
  console.log('📁 Contents of iOS directory:');
  execSync(`ls -la ${iosDir}`, { stdio: 'inherit' });
  console.log('📁 Contents of iOS/App directory:');
  execSync(`ls -la ${path.join(iosDir, 'App')}`, { stdio: 'inherit' });
} else {
  console.error('❌ iOS directory not found after adding platform. Something went wrong.');
  process.exit(1);
}

console.log('✅ CI setup for iOS platform completed successfully!');
