
/*!
 * CoronaBot -- Message Logging
 * 
 * This file contains helpers to keep logging simple.
 * STDOUT and STDERR are typically not available on server,
 * so this script creates functions which also log to a file.
 * 
 *                  -- Raresh
 */

const fs = require('fs')
const path = require('path')

let logPath = path.join(__dirname, `/../log/coronabot-${new Date().toDateString()}.txt`)
console.log(`Logging to ${logPath}`)

/**
 * Prints the contents to STDOUT
 */
function log(prefix, ...strings) {
    let out = `[${prefix}] `
    for (const string of strings) out += string

    console.log(out)
    fs.appendFile(logPath, out + '\n', err => {
        if (err) throw err
    })
}

/**
 * Prints the contents to STDERR
 */
function error(prefix, ...strings) {
    let out = `[${prefix}] `
    for (const string of strings) out += string

    console.error(out)
    fs.appendFile(logPath, out + '\n', err => {
        if (err) throw err
    })
}

module.exports = exports = { log, error }
