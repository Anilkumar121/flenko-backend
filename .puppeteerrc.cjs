const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Store chrome in project directory so it persists in Render container
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
