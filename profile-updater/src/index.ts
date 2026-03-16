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
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    // Use deviceScaleFactor: 2 for high quality frames
    await page.setViewport({ width: 850, height: 1200, deviceScaleFactor: 2 });
    
    const timezone = process.env.TIMEZONE || 'UTC';
    try {
      await page.emulateTimezone(timezone);
      console.log(`Emulating timezone: ${timezone}`);
    } catch (e) {
      console.error(`Failed to set timezone ${timezone}, falling back to UTC`);
    }
    
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', (err: Error) => console.error('PAGE ERROR:', err.message));

    const startColor = process.env.CUSTOM_START_COLOR || '#4a207e';
    const stopColor = process.env.CUSTOM_STOP_COLOR || '#04ff00';
    const animationSpeed = parseInt(process.env.ANIMATION_SPEED || '8', 10);
    const animationStyle = process.env.ANIMATION_STYLE || 'hue';

    await page.evaluateOnNewDocument((start, stop, speed, style) => {
      (window as any).githeatConfig = { 
        startColor: start, 
        stopColor: stop,
        animationSpeed: speed,
        animationStyle: style,
        showColorAnimation: true
      };
    }, startColor, stopColor, animationSpeed, animationStyle);

    console.log(`Navigating to https://github.com/${username}...`);
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const ytdUrl = `https://github.com/${username}?tab=overview&from=${year}-${month}-01&to=${year}-${month}-${day}`;
    
    await page.goto(ytdUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-color-mode', 'dark');
      document.documentElement.setAttribute('data-dark-theme', 'dark');
    });

    console.log('Injecting styles and script...');
    await page.addStyleTag({ content: styles });
    await page.evaluate(standaloneScript);

    console.log('Waiting for GitHeat to be ready...');
    await page.waitForSelector('body.githeat-ready, body.githeat-failed', { timeout: 60000 });
    
    const isFailed = await page.evaluate(() => document.body.classList.contains('githeat-failed'));
    if (isFailed) {
      throw new Error('GitHeat analysis failed on the page.');
    }

    await new Promise(r => setTimeout(r, 2000));

    console.log('Isolating stats and graph...');
    const isolationSuccess = await page.evaluate(() => {
      const stats = document.getElementById('git-heat-stats');
      const graphContainer = document.querySelector('.js-yearly-contributions') as HTMLElement | null;
      if (!stats || !graphContainer) return false;

      const wrapper = document.createElement('div');
      wrapper.id = 'githeat-screenshot-wrapper';
      Object.assign(wrapper.style, {
        backgroundColor: '#0d1117',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '820px', 
        position: 'fixed',
        top: '0',
        left: '0',
        zIndex: '2147483647',
        borderRadius: '12px',
        border: '1px solid #30363d'
      });

      const killList = ['.js-profile-timeline-year-list', '.profile-timeline-year-list', '#user-activity-overview', '.activity-listing', '.js-yearly-contributions .float-right', 'ul.filter-list', '.contrib-footer-link', 'details'];
      killList.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => (el as HTMLElement).style.setProperty('display', 'none', 'important'));
      });

      stats.style.margin = '0';
      graphContainer.style.margin = '0';
      wrapper.appendChild(stats);
      wrapper.appendChild(graphContainer);
      document.body.appendChild(wrapper);
      return true;
    });

    if (!isolationSuccess) throw new Error('Failed to isolate elements.');

    const wrapper = await page.$('#githeat-screenshot-wrapper');
    if (!wrapper) throw new Error('Could not find wrapper');

    console.log('Taking high-quality PNG for GitHeat...');
    const pngPath = path.join(process.cwd(), '../githeat.png');
    await wrapper.screenshot({ path: pngPath });
    console.log(`Success! Image saved to: ${pngPath}`);

    console.log('Taking high-quality PNG frames for animation...');
    const framesDir = path.join(process.cwd(), 'frames');
    if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir);

    const fps = 15;
    const duration = 4; 
    const totalFrames = fps * duration;
    
    const startCapture = Date.now();
    for (let i = 0; i < totalFrames; i++) {
      const framePath = path.join(framesDir, `frame-${String(i).padStart(3, '0')}.png`);
      // Capturing PNGs for high quality, using deviceScaleFactor: 2 from viewport
      await wrapper.screenshot({ path: framePath });
    }
    const endCapture = Date.now();
    const actualDuration = (endCapture - startCapture) / 1000;
    const actualFps = totalFrames / actualDuration;

    console.log(`Captured ${totalFrames} frames in ${actualDuration.toFixed(2)}s (Actual FPS: ${actualFps.toFixed(2)})`);
    console.log('Generating high-quality GIF using ffmpeg...');
    const gifPath = path.join(process.cwd(), '../githeat.gif');
    // High quality palette generation from PNGs
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
