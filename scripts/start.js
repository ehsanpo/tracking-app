#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from project root automatically
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

// Forward any args to expo (e.g., --web or --android)
const args = process.argv.slice(2);

const cmd = 'expo';
const cmdArgs = ['start', ...args];

const child = spawn(cmd, cmdArgs, { stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code));
