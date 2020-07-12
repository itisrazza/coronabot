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
    
    /** @type {Motd} */
    motd: undefined,

    /** @type {CommandProcessor} */
    comProc: undefined,

    /** @type {Birthdays} */
    birthdays: undefined,

    /** @type {Dashboard} */
    dashboard: undefined,

    /** @type {Courses} */
    courses: undefined
};

const Motd = require("../lib/motd");
const Courses = require("../lib/courses");
const CommandProcessor = require("../lib/comproc");
// const Birthdays = require("../lib/birthdays");
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
    // bot.birthdays = new Birthdays(config, client, bot);
    bot.dashboard = new Dashboard(config, client, bot);
    bot.courses = new Courses(config, client, bot);
    bot.comProc = new CommandProcessor(config, client, bot);
    bot.motd = new Motd(config, client, bot);
});

// for future messages
client.on("message", async msg => {
    if (msg.channel.id === config.comproc.channel) {
        bot.comProc.exec(msg);
    }
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
