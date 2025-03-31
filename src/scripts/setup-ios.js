
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up iOS platform for Capacitor...');

// Check if ios directory exists
if (!fs.existsSync(path.join(process.cwd(), 'ios'))) {
  console.log('📱 Adding iOS platform...');
  try {
    execSync('npx cap add ios', { stdio: 'inherit' });
    console.log('✅ iOS platform added successfully!');
  } catch (error) {
    console.error('❌ Failed to add iOS platform:', error);
    process.exit(1);
  }
} else {
  console.log('📱 iOS platform already exists, updating...');
  try {
    execSync('npx cap update ios', { stdio: 'inherit' });
    console.log('✅ iOS platform updated successfully!');
  } catch (error) {
    console.error('❌ Failed to update iOS platform:', error);
    process.exit(1);
  }
}

// Run build
console.log('🛠️ Building web assets...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}

// Sync Capacitor
console.log('🔄 Syncing web assets to iOS...');
try {
  execSync('npx cap sync ios', { stdio: 'inherit' });
  console.log('✅ Sync completed successfully!');
} catch (error) {
  console.error('❌ Sync failed:', error);
  process.exit(1);
}

// Modify Info.plist with required iOS permissions
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

console.log('🎉 iOS setup completed! Ready to open in Xcode.');
console.log('👉 Run "npx cap open ios" to open the project in Xcode');
