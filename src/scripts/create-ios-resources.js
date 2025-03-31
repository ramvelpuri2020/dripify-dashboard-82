
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎨 Creating iOS resources...');

// Create resources directory if it doesn't exist
const resourcesDir = path.join(process.cwd(), 'resources');
if (!fs.existsSync(resourcesDir)) {
  fs.mkdirSync(resourcesDir);
}

// Copy icon source from og-image to resources
try {
  console.log('🖼️ Copying icon source...');
  fs.copyFileSync(
    path.join(process.cwd(), 'public', 'og-image.png'), 
    path.join(resourcesDir, 'icon.png')
  );
  console.log('✅ Icon source copied successfully!');
} catch (error) {
  console.error('❌ Failed to copy icon source:', error);
}

// Create a default splash screen if it doesn't exist
const splashPath = path.join(resourcesDir, 'splash.png');
if (!fs.existsSync(splashPath)) {
  console.log('🎨 Creating default splash screen...');
  // We'll use the og-image as a splash screen base too
  fs.copyFileSync(
    path.join(process.cwd(), 'public', 'og-image.png'), 
    splashPath
  );
  console.log('✅ Default splash screen created!');
}

// Generate iOS resources
console.log('🔄 Generating iOS resources...');
try {
  execSync('npx cordova-res ios --skip-config --copy', { stdio: 'inherit' });
  console.log('✅ iOS resources generated successfully!');
} catch (error) {
  console.error('❌ Failed to generate iOS resources:', error);
}
