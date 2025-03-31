
const fs = require('fs');
const path = require('path');

console.log('📦 Updating package.json with iOS setup script...');

try {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add setup:ios script if it doesn't already exist
  if (!packageJson.scripts['setup:ios']) {
    packageJson.scripts['setup:ios'] = 'node src/scripts/setup-ios.js';
    console.log('✅ Added setup:ios script to package.json');
  } else {
    console.log('⚠️ setup:ios script already exists in package.json');
  }
  
  // Ensure we have a cap:sync script
  if (!packageJson.scripts['cap:sync']) {
    packageJson.scripts['cap:sync'] = 'npx cap sync';
    console.log('✅ Added cap:sync script to package.json');
  }
  
  // Write back the updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ package.json updated successfully!');
} catch (error) {
  console.error('❌ Failed to update package.json:', error);
}
