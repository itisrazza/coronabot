#!/usr/bin/env node --unhandled-rejections=strict

/*!
 * CoronaBot -- Program entry point.
 * 
 * This file serves as the main entry point in the bot's program.
 * Everything else spins off from here.
 * 
 *                  -- Raresh
 */

const fs = require('fs')

const Discord = require('discord.js')
const client = new Discord.Client()

const config = require('../lib/config')
const apiKey = config.discord.token

// Bot Functionality

const bot = {
    announcements: undefined,
    log: require('../lib/log')
}

const Announcements = require('../lib/announcements')

// Discord library events

// connect the bot up to the 
client.on('ready', () => {
    // we're online
    
    bot.log.log('DISCORD', `Logged in as ${client.user.tag}`)
    client.user.setStatus('online')
    client.user.setPresence({
        activity: {
            name: `the paint dry`,
            type: 'WATCHING'
        }
    })

    // construct the modules
    bot.announcements = new Announcements(config, client, bot)
})

// for future messages
client.on('message', msg => {
    // 
})

// pinning, possible voting support
client.on('messageReactionAdd', async react => {
    // if we have 3 pins, pin it to the top
    // (code lifted from https://github.com/alexsurelee/VicBot/blob/026b9ff1ca85f72f33da6947c65f66d58a663a1e/index.js#L378)
    if (react.emoji.name === '📌') {
        if (react.count >= 1 && !react.message.pinned) {
            await react.message.pin()
        }
    }
})

// add people to lads on join
client.on('guildMemberAdd', async member => {
    // auto add on join didn't work
    // will keep this event handler for other things we might do later
})

// login
client
    .login(apiKey)
    .then(val => {
        bot.log.log("DISCORD", "Logged in successfully!")
    })
    .catch(e => {
        bot.log.error("DISCORD", "Failed to log in: " + e)
        process.exit(1)
    })
