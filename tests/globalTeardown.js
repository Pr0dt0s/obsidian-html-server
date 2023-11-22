const teardownPuppeteer = require('jest-environment-puppeteer/teardown');

module.exports = async function (globalConfig, projectConfig) {
  globalThis.__killObsidianProcess();
  await teardownPuppeteer(globalConfig);
};
