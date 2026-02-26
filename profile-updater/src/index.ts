import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const username = process.env.GITHUB_USERNAME;
  if (!username) {
    console.error('GITHUB_USERNAME is not set in environment variables');
    process.exit(1);
  }

  const outputDir = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Building standalone script...');
  execSync('npm run build:standalone', { cwd: path.join(process.cwd()) });

  const standalonePath = path.join(outputDir, 'standalone.js');
  const stylesPath = path.join(process.cwd(), '../src/styles.css');
  const standaloneScript = fs.readFileSync(standalonePath, 'utf8');
  const styles = fs.readFileSync(stylesPath, 'utf8');

  console.log(`Launching Puppeteer for user: ${username}...`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 2000 });

    console.log(`Navigating to https://github.com/${username}...`);
    await page.goto(`https://github.com/${username}`, { waitUntil: 'networkidle2' });

    console.log('Injecting styles and script...');
    await page.addStyleTag({ content: styles });
    await page.evaluate((script) => {
      const el = document.createElement('script');
      el.textContent = script;
      document.body.appendChild(el);
    }, standaloneScript);

    console.log('Waiting for GitHeat to be ready...');
    // standalone.ts adds 'githeat-ready' class to body when done
    await page.waitForSelector('body.githeat-ready', { timeout: 60000 });

    const statsPanel = await page.$('#git-heat-stats');
    if (!statsPanel) {
      throw new Error('Could not find #git-heat-stats panel');
    }

    console.log('Taking screenshot...');
    const screenshotPath = path.join(process.cwd(), '../githeat.png');
    await statsPanel.screenshot({ path: screenshotPath });

    console.log(`Success! Image saved to: ${screenshotPath}`);
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
