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
    // Use a wider viewport to ensure the graph doesn't wrap or get squished
    await page.setViewport({ width: 1000, height: 2000 });
    
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

    console.log('Preparing clean screenshot layout...');
    await page.evaluate(() => {
      const stats = document.getElementById('git-heat-stats');
      const graphContainer = document.querySelector('.js-yearly-contributions') as HTMLElement;
      
      if (stats && graphContainer) {
        // 1. Hide the year navigation list on the right
        const yearList = document.querySelector('.js-profile-timeline-year-list');
        if (yearList) (yearList as HTMLElement).style.display = 'none';

        // 2. Hide "Learn how we count contributions" and "Less/More" legend if needed, 
        // but let's keep the core graph area.
        const footer = graphContainer.querySelector('.contrib-footer');
        // if (footer) (footer as HTMLElement).style.display = 'none';

        // 3. Hide the activity overview and everything else below the graph
        const activityOverview = document.querySelector('.activity-listing');
        if (activityOverview) (activityOverview as HTMLElement).style.display = 'none';
        
        // 4. Create a clean wrapper for just the stats + graph
        const wrapper = document.createElement('div');
        wrapper.id = 'githeat-screenshot-wrapper';
        wrapper.style.backgroundColor = '#0d1117'; // GitHub Dark background
        wrapper.style.padding = '16px';
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.gap = '12px';
        wrapper.style.width = '850px'; // Lock width to a standard size
        
        // Ensure stats panel looks right inside wrapper
        stats.style.margin = '0';
        stats.style.width = '100%';
        
        // Ensure graph container doesn't have extra margins
        graphContainer.style.margin = '0';
        graphContainer.style.width = '100%';
        graphContainer.style.border = 'none';

        // Insert wrapper into DOM and move elements
        graphContainer.parentNode?.insertBefore(wrapper, graphContainer);
        wrapper.appendChild(stats);
        wrapper.appendChild(graphContainer);
      }
    });

    const wrapper = await page.$('#githeat-screenshot-wrapper');
    if (!wrapper) {
      throw new Error('Could not find screenshot wrapper');
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
