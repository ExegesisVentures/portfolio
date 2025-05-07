#!/usr/bin/env node
const { execSync } = require('child_process');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');

// Script paths relative to project root
const syncCoreumBalancesScript = path.join(__dirname, 'syncCoreumBalances.ts');

// Function to run a script with ts-node
function runScript(scriptPath) {
  console.log(`[${new Date().toISOString()}] Running script: ${scriptPath}`);
  try {
    const output = execSync(`npx ts-node ${scriptPath}`, { encoding: 'utf8' });
    console.log(`Script output: ${output}`);
    return true;
  } catch (error) {
    console.error(`Error running script ${scriptPath}:`, error.message);
    return false;
  }
}

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Display banner
console.log(`
${colors.bright}${colors.cyan}=================================${colors.reset}
${colors.bright}${colors.blue} Crypto Balance Update Scheduler ${colors.reset}
${colors.bright}${colors.cyan}=================================${colors.reset}
`);

// Initial run on startup
console.log(`${colors.yellow}Performing initial balance update...${colors.reset}`);
const initialSuccess = runScript(syncCoreumBalancesScript);
console.log(`${colors.yellow}Initial update ${initialSuccess ? 'successful' : 'failed'}.${colors.reset}`);

// Schedule Coreum balance updates every 15 minutes
cron.schedule('*/15 * * * *', () => {
  console.log(`${colors.green}[${new Date().toISOString()}] Running scheduled Coreum balance update...${colors.reset}`);
  runScript(syncCoreumBalancesScript);
});

console.log(`${colors.bright}${colors.green}Scheduler started successfully. Balances will update every 15 minutes.${colors.reset}`);
console.log(`${colors.dim}Press Ctrl+C to exit${colors.reset}`);

// Keep the process alive
process.stdin.resume();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Shutting down scheduler...${colors.reset}`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`\n${colors.yellow}Shutting down scheduler...${colors.reset}`);
  process.exit(0);
}); 