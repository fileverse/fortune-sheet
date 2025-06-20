#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Fortune Sheet Release Helper');
console.log('This will help you create a changeset for your changes.\n');

const changeTypes = [
  { value: 'major', description: 'Breaking changes (e.g., API changes)' },
  { value: 'minor', description: 'New features (backwards compatible)' },
  { value: 'patch', description: 'Bug fixes and small improvements' }
];

const packages = [
  '@fileverse-dev/formula-parser',
  '@fileverse-dev/fortune-core', 
  '@fileverse-dev/fortune-react'
];

console.log('Available change types:');
changeTypes.forEach((type, index) => {
  console.log(`  ${index + 1}. ${type.value} - ${type.description}`);
});

rl.question('\nSelect change type (1-3): ', (answer) => {
  const selectedType = changeTypes[parseInt(answer) - 1];
  
  if (!selectedType) {
    console.log('Invalid selection. Exiting.');
    rl.close();
    return;
  }

  console.log('\nAvailable packages:');
  packages.forEach((pkg, index) => {
    console.log(`  ${index + 1}. ${pkg}`);
  });

  rl.question('\nWhich packages are affected? (comma-separated numbers, e.g., 1,2): ', (pkgAnswer) => {
    const selectedPackages = pkgAnswer.split(',').map(num => packages[parseInt(num.trim()) - 1]).filter(Boolean);
    
    if (selectedPackages.length === 0) {
      console.log('No valid packages selected. Exiting.');
      rl.close();
      return;
    }

    rl.question('\nDescribe your changes: ', (description) => {
      console.log('\n📝 Creating changeset...');
      
      try {
        // Run changeset add in non-interactive mode
        execSync('npx changeset add --empty', { stdio: 'pipe' });
        
        console.log('✅ Changeset created successfully!');
        console.log('\nNext steps:');
        console.log('1. Edit the created changeset file in .changeset/ folder');
        console.log('2. Add your change description and affected packages');
        console.log('3. Commit your changes');
        console.log('4. When ready to release, run: yarn version-packages');
        console.log('5. Then run: yarn release');
        
      } catch (error) {
        console.log('❌ Error creating changeset. Please run manually:');
        console.log('npx changeset');
      }
      
      rl.close();
    });
  });
}); 