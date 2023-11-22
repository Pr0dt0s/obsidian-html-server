const { spawn } = require('child_process');
require('dotenv').config();

/** @type import('child_process').ChildProcess */
const cp = spawn(process.env.OBSIDIAN_PATH, { detached: true });

module.exports = cp;
