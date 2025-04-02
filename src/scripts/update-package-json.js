
const fs = require('fs');
const path = require('path');

console.log('📦 Updating package.json with Capacitor scripts...');

try {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add Capacitor scripts
  const scriptsToAdd = {
    'cap:init': 'node src/scripts/init-capacitor.js',
    'setup:ios': 'node src/scripts/setup-ios.js',
    'cap:sync': 'npx cap sync',
    'cap:open:ios': 'npx cap open ios',
    'cap:run:ios': 'npx cap run ios',
    'cap:build:ios': 'npm run build && npx cap sync ios'
  };
  
  let scriptsAdded = false;
  
  // Add scripts that don't exist
  Object.entries(scriptsToAdd).forEach(([key, value]) => {
    if (!packageJson.scripts[key]) {
      packageJson.scripts[key] = value;
      console.log(`✅ Added ${key} script to package.json`);
      scriptsAdded = true;
    } else {
      console.log(`⚠️ ${key} script already exists in package.json`);
    }
  });
  
  if (!scriptsAdded) {
    console.log('⚠️ All scripts already exist in package.json');
  } else {
    // Write back the updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ package.json updated successfully!');
  }
} catch (error) {
  console.error('❌ Failed to update package.json:', error);
}
