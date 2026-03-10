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
  } catch (buildError) {
    const error = buildError as { stdout?: Buffer; message: string };
    console.error('Build failed!', error.stdout?.toString() || error.message);
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
    // Use high deviceScaleFactor for crisp text
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
    page.on('pageerror', (err: Error) => console.error('PAGE ERROR:', err.message));

    // Inject configuration into the page context
    const startColor = process.env.CUSTOM_START_COLOR || '#4a207e';
    const stopColor = process.env.CUSTOM_STOP_COLOR || '#04ff00';
    const animationSpeed = parseInt(process.env.ANIMATION_SPEED || '8', 10);
    const animationStyle = process.env.ANIMATION_STYLE || 'hue';

    await page.evaluateOnNewDocument((start, stop, speed, style) => {
      (window as any).githeatConfig = { 
        startColor: start, 
        stopColor: stop,
        animationSpeed: speed,
        animationStyle: style
      };
    }, startColor, stopColor, animationSpeed, animationStyle);

    console.log(`Navigating to https://github.com/${username}...`);
    
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
    // Wait for either success or failure flag
    await page.waitForSelector('body.githeat-ready, body.githeat-failed', { timeout: 60000 });
    
    const isFailed = await page.evaluate(() => document.body.classList.contains('githeat-failed'));
    if (isFailed) {
      throw new Error('GitHeat analysis failed on the page. Check PAGE LOG for details.');
    }

    // Give a small buffer for the UI to actually render after the flag is set
    await new Promise(r => setTimeout(r, 2000));

    console.log('Isolating stats and graph for clean capture...');
    const isolationSuccess = await page.evaluate(() => {
      const stats = document.getElementById('git-heat-stats');
      const graphContainer = document.querySelector('.js-yearly-contributions') as HTMLElement | null;
      
      if (!stats || !graphContainer) return false;

      // 1. Create a truly isolated wrapper at the top of the body
      const wrapper = document.createElement('div');
      wrapper.id = 'githeat-screenshot-wrapper';
      
      // Style wrapper with fixed positioning and high z-index to ignore page layout
      Object.assign(wrapper.style, {
        backgroundColor: '#0d1117',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '820px', 
        borderRadius: '12px',
        border: '1px solid #30363d',
        boxSizing: 'border-box',
        position: 'fixed',
        top: '0',
        left: '0',
        zIndex: '2147483647',
        boxShadow: 'none'
      });

      // 2. Aggressively hide the year list and other UI elements
      const killList = [
        '.js-profile-timeline-year-list',
        '.profile-timeline-year-list',
        '#user-activity-overview',
        '.activity-listing',
        '.js-yearly-contributions .float-right',
        'ul.filter-list', // Common for year lists
        '.contrib-footer-link',
        'details' // Hide contribution settings dropdown
      ];
      
      killList.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          (el as HTMLElement).style.setProperty('display', 'none', 'important');
        });
      });

      // 3. Clean up the moved elements
      stats.style.margin = '0';
      stats.style.width = '100%';
      graphContainer.style.margin = '0';
      graphContainer.style.width = '100%';
      graphContainer.style.border = 'none';

      // 4. Move them into our isolated wrapper
      wrapper.appendChild(stats);
      wrapper.appendChild(graphContainer);
      document.body.appendChild(wrapper);
      return true;
    });

    if (!isolationSuccess) {
      throw new Error('Failed to isolate stats or graph container. Elements may not have been injected correctly.');
    }

    const wrapper = await page.$('#githeat-screenshot-wrapper');
    if (!wrapper) {
      throw new Error('Could not find isolated screenshot wrapper');
    }

    console.log('Taking frames for animation...');
    const framesDir = path.join(process.cwd(), 'frames');
    if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir);

    const fps = 30;
    const duration = 8; // 8 seconds of animation
    const totalFrames = fps * duration;
    
    const startCapture = Date.now();
    for (let i = 0; i < totalFrames; i++) {
      const framePath = path.join(framesDir, `frame-${String(i).padStart(3, '0')}.png`);
      // Use faster screenshot options if possible, though 'wrapper.screenshot' is already quite targeted
      await wrapper.screenshot({ path: framePath, optimizeForSpeed: true } as any);
    }
    const endCapture = Date.now();
    const actualDuration = (endCapture - startCapture) / 1000;
    const actualFps = totalFrames / actualDuration;

    console.log(`Captured ${totalFrames} frames in ${actualDuration.toFixed(2)}s (Actual FPS: ${actualFps.toFixed(2)})`);
    console.log('Generating GIF using ffmpeg...');
    const gifPath = path.join(process.cwd(), '../githeat.gif');
    // Use the actual measured framerate for playback so speed matches reality
    execSync(`ffmpeg -y -framerate ${actualFps} -i frames/frame-%03d.png -vf "split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" ${gifPath}`);

    console.log(`Success! Animation saved to: ${gifPath}`);
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
