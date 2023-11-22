const obsidianProcess = require('../scripts/start-obsidian.cjs');
const setupPuppeteer = require('jest-environment-puppeteer/setup');

module.exports = async function (globalConfig, projectConfig) {
  await setupPuppeteer(globalConfig);
  globalThis.__killObsidianProcess = () => obsidianProcess.kill();
};
