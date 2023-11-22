let jest_puppeteer_conf = {
  launch: {
    timeout: 30000,
    dumpio: true, // Whether to pipe the browser process stdout and stderr
    headless: 'new',
  },
};

const isDebugMode = typeof v8debug === 'object' || /--debug|--inspect/.test(process.execArgv.join(' '));
const t = false;
if (isDebugMode || t) {
  jest_puppeteer_conf.launch.headless = false; // for debug:  to see what the browser is displaying
  jest_puppeteer_conf.launch.slowMo = 250; // slow down by 250ms for each step
  jest_puppeteer_conf.launch.devtools = true; // This lets you debug code in the application code browser
  jest_puppeteer_conf.launch.args = ['--start-maximized']; // maximise the screen
}

module.exports = jest_puppeteer_conf;
