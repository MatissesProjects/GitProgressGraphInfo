const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Cross-platform build script for GitHeat.
 * Replaces platform-specific commands (like PowerShell) to ensure
 * a consistent experience for all developers.
 */

function build() {
  const isWatch = process.argv.includes('--watch');
  
  console.log(`GitHeat: Starting ${isWatch ? 'watch mode' : 'production build'}...`);

  // 1. Ensure dist directory exists
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
    console.log('Created dist/ directory.');
  }

  // 2. Copy static assets
  const assets = [
    'src/manifest.json',
    'src/styles.css',
    'src/popup.html'
  ];

  assets.forEach(asset => {
    try {
      const dest = path.join('dist', path.basename(asset));
      fs.copyFileSync(asset, dest);
      console.log(`Copied ${asset} -> ${dest}`);
    } catch (err) {
      console.error(`Error copying ${asset}:`, err.message);
    }
  });

  // 3. Run esbuild
  const esbuildCmd = `npx esbuild src/content.ts src/popup.ts --bundle --outdir=dist --platform=browser ${isWatch ? '--watch' : '--minify'}`;
  
  try {
    execSync(esbuildCmd, { stdio: 'inherit' });
  } catch (err) {
    console.error('esbuild failed. Make sure dependencies are installed via "npm install".');
    process.exit(1);
  }
}

build();
