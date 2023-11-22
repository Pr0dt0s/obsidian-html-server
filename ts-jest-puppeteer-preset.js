/* eslint-disable @typescript-eslint/no-var-requires */
const ts_preset = require('ts-jest/jest-preset');
const puppeteer_preset = require('jest-puppeteer/jest-preset');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = Object.assign(ts_preset, puppeteer_preset, {
  globalSetup: './tests/globalSetup.js',
  globalTeardown: './tests/globalTeardown.js',
});
