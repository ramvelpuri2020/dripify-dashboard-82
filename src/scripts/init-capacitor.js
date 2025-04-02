
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Initializing Capacitor project...');

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

// Check if iOS directory exists
const iosDir = path.join(process.cwd(), 'ios');
const iosExists = fs.existsSync(iosDir);

// Build the web assets first
console.log('📦 Building web assets...');
if (!runCommand('npm run build', 'Failed to build web assets')) {
  process.exit(1);
}

// Add iOS platform if it doesn't exist
if (!iosExists) {
  console.log('📱 Adding iOS platform...');
  if (!runCommand('npx cap add ios', 'Failed to add iOS platform')) {
    console.log('⚠️ Attempting to continue...');
  }
} else {
  console.log('📱 iOS platform already exists, updating...');
  runCommand('npx cap update ios', 'Failed to update iOS platform');
}

// Copy resources for iOS
console.log('🎨 Creating iOS resources...');
try {
  // Create resources directory if it doesn't exist
  const resourcesDir = path.join(process.cwd(), 'resources');
  if (!fs.existsSync(resourcesDir)) {
    fs.mkdirSync(resourcesDir);
  }

  // Copy icon source from og-image to resources
  console.log('🖼️ Copying icon source...');
  fs.copyFileSync(
    path.join(process.cwd(), 'public', 'og-image.png'), 
    path.join(resourcesDir, 'icon.png')
  );
  
  // Create a default splash screen
  fs.copyFileSync(
    path.join(process.cwd(), 'public', 'og-image.png'), 
    path.join(resourcesDir, 'splash.png')
  );

  console.log('✅ Resources created successfully!');
} catch (error) {
  console.error('❌ Failed to create resources:', error);
}

// Generate iOS resources
console.log('🔄 Generating iOS resources...');
runCommand('npx cordova-res ios --skip-config --copy', 'Failed to generate iOS resources');

// Sync the project
console.log('🔄 Syncing Capacitor project...');
runCommand('npx cap sync', 'Failed to sync Capacitor project');

// Set up Info.plist with required permissions
try {
  const infoPlistPath = path.join(process.cwd(), 'ios/App/App/Info.plist');
  console.log('📝 Adding iOS permissions to Info.plist...');
  
  if (fs.existsSync(infoPlistPath)) {
    let infoPlist = fs.readFileSync(infoPlistPath, 'utf8');
    
    // Add camera permissions if not present
    if (!infoPlist.includes('NSCameraUsageDescription')) {
      const insertPosition = infoPlist.lastIndexOf('</dict>');
      const cameraPermission = `
	<key>NSCameraUsageDescription</key>
	<string>We need camera access to analyze your style</string>`;
      
      infoPlist = infoPlist.slice(0, insertPosition) + cameraPermission + infoPlist.slice(insertPosition);
    }
    
    // Add photo library permissions if not present
    if (!infoPlist.includes('NSPhotoLibraryUsageDescription')) {
      const insertPosition = infoPlist.lastIndexOf('</dict>');
      const photoPermission = `
	<key>NSPhotoLibraryUsageDescription</key>
	<string>We need photo library access to analyze your style from existing photos</string>`;
      
      infoPlist = infoPlist.slice(0, insertPosition) + photoPermission + infoPlist.slice(insertPosition);
    }
    
    fs.writeFileSync(infoPlistPath, infoPlist);
    console.log('✅ iOS permissions added successfully!');
  } else {
    console.log('⚠️ Info.plist not found. Skipping permissions setup.');
  }
} catch (error) {
  console.error('❌ Failed to modify Info.plist:', error);
}

console.log('✅ Capacitor initialization completed!');
console.log('👉 Run "npx cap open ios" to open the project in Xcode');
