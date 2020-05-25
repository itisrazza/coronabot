
/*!
 * CoronaBot -- Config Loader
 */

const fs = require('fs');
const path = require('path');

let config;
try {
    let configPath = process.argv[2] || path.join(__dirname, '../config.json');
    let configStr = fs.readFileSync(configPath, { encoding: 'utf-8' });
    config = JSON.parse(configStr);
} catch (e) {
    console.error('CRITICAL: The configuration file did not load.');
    throw e;
}

module.exports = config;