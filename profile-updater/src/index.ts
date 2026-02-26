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
  try {
    execSync('npm run build:standalone', { cwd: path.join(process.cwd()) });
  } catch (buildError: any) {
    console.error('Build failed!', buildError.stdout?.toString() || buildError.message);
    process.exit(1);
  }

  const standalonePath = path.join(outputDir, 'standalone.js');
  const stylesPath = path.join(process.cwd(), '../src/styles.css');
  const standaloneScript = fs.readFileSync(standalonePath, 'utf8');
  const styles = fs.readFileSync(stylesPath, 'utf8');

  console.log(`Launching Puppeteer for user: ${username}...`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 2000 });
    
    // Set Timezone if provided, otherwise default to UTC
    const timezone = process.env.TIMEZONE || 'UTC';
    try {
      await page.emulateTimezone(timezone);
      console.log(`Emulating timezone: ${timezone}`);
    } catch (e) {
      console.error(`Failed to set timezone ${timezone}, falling back to UTC`);
    }
    
    // Force Dark Mode
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
    
    // Set a realistic User-Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // Pipe browser console to Node console
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

    console.log(`Navigating to https://github.com/${username}...`);
    
    // Construct YTD URL to ensure full graph data is loaded
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const ytdUrl = `https://github.com/${username}?tab=overview&from=${year}-${month}-01&to=${year}-${month}-${day}`;
    
    console.log(`Using YTD URL: ${ytdUrl}`);
    await page.goto(ytdUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    // Force GitHub to render in Dark Mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-color-mode', 'dark');
      document.documentElement.setAttribute('data-dark-theme', 'dark');
    });

    console.log('Injecting styles and script...');
    await page.addStyleTag({ content: styles });
    
    // Bypass CSP by executing the script content directly via Puppeteer's evaluate
    // instead of creating an inline script element
    await page.evaluate(standaloneScript);

    console.log('Waiting for GitHeat to be ready...');
    // standalone.ts adds 'githeat-ready' class to body when done
    await page.waitForSelector('body.githeat-ready', { timeout: 60000 });
    
    // Give a small buffer for the UI to actually render after the flag is set
    await new Promise(r => setTimeout(r, 2000));

    // Find both the stats panel and the contribution graph container
    const combinedSelector = '#git-heat-stats, .js-yearly-contributions';
    
    console.log('Wrapping stats and graph for combined screenshot...');
    await page.evaluate(() => {
      const stats = document.getElementById('git-heat-stats');
      const graph = document.querySelector('.js-yearly-contributions') as HTMLElement;
      
      if (stats && graph) {
        // Create a wrapper to contain both
        const wrapper = document.createElement('div');
        wrapper.id = 'githeat-screenshot-wrapper';
        wrapper.className = 'p-3 color-bg-default border color-border-default rounded-2';
        wrapper.style.display = 'inline-block';
        wrapper.style.minWidth = 'max-content';
        
        // Move them into the wrapper
        graph.parentNode?.insertBefore(wrapper, graph);
        wrapper.appendChild(stats);
        wrapper.appendChild(graph);
        
        // Clean up UI for screenshot
        const profileLink = graph.querySelector('.float-right.f6');
        if (profileLink) (profileLink as HTMLElement).style.display = 'none';
      }
    });

    const wrapper = await page.$('#githeat-screenshot-wrapper');
    if (!wrapper) {
      throw new Error('Could not create screenshot wrapper');
    }

    console.log('Taking screenshot...');
    const screenshotPath = path.join(process.cwd(), '../githeat.png');
    await wrapper.screenshot({ path: screenshotPath });

    console.log(`Success! Image saved to: ${screenshotPath}`);
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
