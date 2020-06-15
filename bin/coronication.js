#!/usr/bin/env node --unhandled-rejections=strict

/*!
 * CoronaBot -- Program entry point.
 * 
 * This file serves as the main entry point in the bot's program.
 * Everything else spins off from here.
 * 
 *                  -- Raresh
 */

const fs = require("fs");

const Discord = require("discord.js");
const client = new Discord.Client();

const config = require("../lib/config");
const apiKey = config.discord.token;

// Bot Functionality

const Logger = require("../lib/log");

const bot = {
    devMode: process.argv.includes("devmode"),
    log: new Logger(),

    /** @type {Announcements} */
    announcements: undefined,
    
    /** @type {Motd} */
    motd: undefined,

    /** @type {ClassTimes} */
    classTimes: undefined,

    /** @type {CommandProcessor} */
    comProc: undefined,

    /** @type {Birthdays} */
    birthdays: undefined,

    /** @type {Dashboard} */
    dashboard: undefined
};

const Announcements = require("../lib/announcements");
const Motd = require("../lib/motd");
const ClassTimes = require("../lib/class-times");
const CommandProcessor = require("../lib/comproc");
const Birthdays = require("../lib/birthdays");
const Dashboard = require("../lib/dashboard");

// Discord library events

if (bot.devMode) {
    console.log("Running in developer mode.");
}

// connect the bot up to the 
client.on("ready", () => {
    // we're online
    
    bot.log.log("DISCORD", `Logged in as ${client.user.tag}`);
    bot.log.bot = bot;
    client.user.setStatus("online");
    client.user.setPresence({
        activity: {
            name: "** Coronabot starting up... **",
            type: "PLAYING"
        }
    });

    // construct the modules
    if (!bot.devMode) bot.log.setClient(client);
    // bot.announcements = new Announcements(config, client, bot);
    bot.motd = new Motd(config, client, bot);
    bot.classTimes = new ClassTimes(config, client, bot);
    bot.comProc = new CommandProcessor(config, client, bot);
    bot.birthdays = new Birthdays(config, client, bot);
    bot.dashboard = new Dashboard(config, client, bot);
});

// for future messages
client.on("message", async msg => {
    if (typeof bot.comProc === "undefined") {
        msg.reply("Coronabot is taking commands yet. Try again later.");
        return;
    }

    if (msg.channel.id === config.discord.botChannel) {
        bot.comProc.exec(msg);
    }
});

// pinning, possible voting support
client.on("messageReactionAdd", async react => {
    // if we have 3 pins, pin it to the top
    // (code lifted from https://github.com/alexsurelee/VicBot/blob/026b9ff1ca85f72f33da6947c65f66d58a663a1e/index.js#L378)
    if (react.emoji.name === "📌") {
        if (react.count >= 1 && !react.message.pinned) {
            await react.message.pin();
        }
    }
});

// add people to lads on join
client.on("guildMemberAdd", async member => {
    // auto add on join didn't work
    // will keep this event handler for other things we might do later
});

// login
client
    .login(apiKey)
    .then(val => {
        bot.log.log("DISCORD", "Logged in successfully!");
    })
    .catch(e => {
        bot.log.error("DISCORD", "Failed to log in: " + e);
        process.exit(1);
    });
