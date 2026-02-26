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
    // Use high deviceScaleFactor for crisp text like the example image
    await page.setViewport({ width: 1200, height: 2000, deviceScaleFactor: 2 });
    
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
    await page.evaluate(standaloneScript);

    console.log('Waiting for GitHeat to be ready...');
    await page.waitForSelector('body.githeat-ready', { timeout: 60000 });
    
    // Give a small buffer for the UI to actually render after the flag is set
    await new Promise(r => setTimeout(r, 2000));

    console.log('Preparing combined screenshot layout...');
    await page.evaluate(() => {
      const stats = document.getElementById('git-heat-stats');
      const graphContainer = document.querySelector('.js-yearly-contributions') as HTMLElement;
      
      if (stats && graphContainer) {
        // 1. Hide noise
        const noise = [
          '.js-profile-timeline-year-list',
          '.js-yearly-contributions .float-right',
          '.activity-listing',
          '#user-activity-overview'
        ];
        noise.forEach(selector => {
          const el = document.querySelector(selector);
          if (el) (el as HTMLElement).style.setProperty('display', 'none', 'important');
        });

        // 2. Create a clean wrapper for the combined view
        const wrapper = document.createElement('div');
        wrapper.id = 'githeat-screenshot-wrapper';
        
        // Match the aesthetic of ExampleGraphAndData.png
        // Dark background, rounded corners, clean padding
        Object.assign(wrapper.style, {
          backgroundColor: '#0d1117',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          width: '820px', // Matches GitHub's typical column width
          borderRadius: '12px',
          border: '1px solid #30363d',
          boxSizing: 'border-box'
        });

        // 3. Ensure the stats panel doesn't have its own margin interfering
        Object.assign(stats.style, {
          margin: '0',
          width: '100%',
          border: 'none',
          padding: '0'
        });
        
        // 4. Clean up the graph container
        Object.assign(graphContainer.style, {
          margin: '0',
          width: '100%',
          border: 'none'
        });

        // Move elements into the wrapper
        graphContainer.parentNode?.insertBefore(wrapper, graphContainer);
        wrapper.appendChild(stats);
        wrapper.appendChild(graphContainer);
        
        // Ensure the graph itself inside the container is visible and styled
        const graphSvg = graphContainer.querySelector('svg');
        if (graphSvg) {
            graphSvg.style.maxWidth = '100%';
        }
      }
    });

    const wrapper = await page.$('#githeat-screenshot-wrapper');
    if (!wrapper) {
      throw new Error('Could not find screenshot wrapper');
    }

    console.log('Taking screenshot...');
    const screenshotPath = path.join(process.cwd(), '../githeat.png');
    // Set omitBackground to true to let the wrapper's background show
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
