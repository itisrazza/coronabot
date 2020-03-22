#!/usr/bin/env node --unhandled-rejections=strict

const fs = require('fs')

const Discord = require('discord.js')
const client = new Discord.Client()

const config = require('../lib/config')
const apiKey = config.discord.token

/**
 * Bot functionality
 * 
 * Require the constructor and replace it with the object it produces
 */
const bot = {
    announcements: undefined
}

const Announcements = require('../lib/announcements')


// connect the bot up to the 
client.on('ready', () => {
    // we're online
    console.log(`Logged in as ${client.user.tag}`)
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
    // add the new members to the role
    let memberRole = await member.guild.roles.fetch(config.discord.memberRole)
    await member.addRole(memberRole)
})

// login
client
    .login(apiKey)
    .then(val => {
        console.log("Logged in successfully!")
    })
    .catch(e => {
        console.error("Failed to log in: " + e)
        process.exit(1)
    })
