const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Configure Puppeteer to use a local cache directory inside the project
  // to avoid home directory and permissions conflicts in CI environments.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
