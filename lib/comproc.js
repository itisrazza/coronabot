
/*!
 * CoronaBot -- Command Processor
 *
 * ＡＬＬ　ＹＯＵＲ　ＣＯＭＭＡＮＤＳ　ＡＲＥ　ＢＥＬＯＮＧ　ＴＯ　ＵＳ．
 * Listens in on the commands from the #bots channel and executes them.
 */

const Discord = require("discord.js");

const PREFIX = "!";
class CommandProcessor {

    /**
     * @param {object} config The configuration object (JSON)
     * @param {Discord.Client} client 
     * @param {object} bot 
     */
    constructor(config, client, bot) {
        this.config = config;
        this.client = client;
        this.bot = bot;

        this.commands = {
            ping: (msg) => {
                msg.reply("Hi there");
            },

            //
            // deadlines
            //

            dl: msg => this.commands.deadlines(msg),
            dls: msg => this.commands.deadlines(msg),
            deadline: msg => this.commands.deadlines(msg),
            deadlines: msg => {
                const EVENTS_PER_COURSE = 3;

                let sb = "";

                // aggregate the assignments due soonest
                let events = { };
                this.bot.classTimes.getUpcomingEvents().forEach(val => {
                    let { course } = val;
                    
                    // check if course exists
                    if (!Object.keys(events).includes(course)) {
                        events[course] = [];
                    }

                    // stop if it's full
                    if (events[course].length >= EVENTS_PER_COURSE) return;

                    // add to event list
                    events[course].push(val);
                });

                // convert the aggregate to a string
                Object.keys(events).forEach(course => {
                    sb += `**${course} Deadlines**\n`;
                    events[course].forEach(deadline => {
                        let { name, date } = deadline;
                        sb += `> **${name}** → ${date.toLocaleString()}\n`;
                    });
                    sb += "\n";
                });
                
                // send to channel
                msg.channel.send(sb);
            },

            //
            // birthdays
            //

            bday: msg => this.commands.birthdays(msg),
            bdays: msg => this.commands.birthdays(msg),
            birthday: msg => this.commands.birthdays(msg),
            birthdays: msg => {
                // handle birthdays here
                const UPCOMING_BIRTHDAYS_MAX = 5;
                let sb = "**⚠ The birthday list is largely incomplete.** <@325188281643827202> to get yours added.\n\n";

                // aggregate the birthdays of people
                let dates = { };
                this.bot.birthdays.getUpcomingBirthdays().forEach(bday => {
                    let day = bday.next();
                    let dayString = day.toDateString();
                    
                    // stop if it's full
                    if (Object.keys(dates).length >= UPCOMING_BIRTHDAYS_MAX) {
                        return;
                    }

                    // create an array if it doesn't exist
                    if (!Object.keys(dates).includes(dayString)) {
                        dates[dayString] = [];
                    }

                    // add birthday to the list
                    dates[dayString].push(bday);
                });

                // convert all of that to a string
                Object.keys(dates).forEach(date => {
                    sb += `**Birthdays on ${date}**\n`;
                    dates[date].forEach(bday => {
                        let { name } = bday;
                        sb += `> → ${name}\n`;
                    });
                    sb += "\n";
                });

                // send to channel
                msg.channel.send(sb);
            },

            //
            // commands for debugging
            //

            debug: (msg) => {
                this.bot.log.log("DEBUG_REQ", "Server Log Request");
                this.bot.log.log("DEBUG_REQ", "pid: " + process.pid);
                this.bot.log.log("DEBUG_REQ", "platform: " + process.platform);
                msg.reply("I wrote the server info in the debug channel");
            },

            restart: msg => {
                msg.reply(
                    "To do that, you need to know where the webhook is. 🤔"
                );
            },

            //
            // the usual help command
            //

            help: (msg) => {
                let richEmbed = new Discord.MessageEmbed()
                    .setTitle("CoronaBot Instructional Help Page")
                    .addField("!help", "Get this wonderful help page")
                    .addField("!ping", "Pong")
                    .addField("!deadlines", "Get upcoming course deadlines")
                    .addField("!birthdays", "Get upcoming birthdays")
                    .setDescription("There are other commands. The code holds the answers. https://bit.ly/3dbZvgw")
                    .setFooter("CoronaBot");
                msg.channel.send(richEmbed);
            }
        };
    }

    /**
     * 
     * @param {Discord.TextMessage} msg 
     */
    exec(msg) {
        if (msg.content.length < 1) return;
        if (msg.content[0] !== PREFIX) return;
        if (msg.content.length == 1) {
            msg.reply("If you need help, do `!help`.");
            return;
        }

        // look up the command
        let command = this.commands[msg.content.substring(1)];
        if (typeof command !== "function") {
            msg.reply("Command not found. Try do `!help`");
            return;
        }

        // run it
        command.apply(this, [msg]);
    }
}

module.exports = exports = CommandProcessor;
