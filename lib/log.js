
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

class Logger {
    constructor() {
        this.client = null
        this.channel = null
    }

    log(prefix, ...strings) {
        let out = `[${prefix}] `
        for (const string of strings) out += string
    
        console.log(out)
        fs.appendFile(logPath, out + '\n', err => {
            if (err) throw err
        })

        if (this.channel != null) 
            this.channel.send(out)
    }

    error(prefix, ...strings) {
        let out = `[${prefix}] `
        for (const string of strings) out += string

        console.error(out)
        fs.appendFile(logPath, out + '\n', err => {
            if (err) throw err
        })

        if (this.channel != null) 
            this.channel.send(out)
    }

    async setClient(client) {
        this.client = client
        this.channel = await this.client.channels.fetch("705219131041120396")
    }
}

module.exports = exports = Logger
