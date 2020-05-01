
/*!
 * CoronaBot -- Command Processor
 *
 * ＡＬＬ　ＹＯＵＲ　ＣＯＭＭＡＮＤＳ　ＡＲＥ　ＢＥＬＯＮＧ　ＴＯ　ＵＳ．
 * Listens in on the commands from the #bots channel and executes them.
 */

const Discord = require('discord.js')

const PREFIX = '!'
class CommandProcessor {

    /**
     * @param {object} config The configuration object (JSON)
     * @param {Discord.Client} client 
     * @param {object} bot 
     */
    constructor(config, client, bot) {
        this.config = config
        this.client = client
        this.bot = bot

        this.commands = {
            ping: (msg) => {
                msg.reply('Hi there')
            },
            deadline: (msg) => {
                return this.commands.deadlines(msg)
            },
            deadlines: (msg) => {
                const EVENTS_PER_COURSE = 3

                let sb = ""

                // aggregate the assignments due soonest
                let events = { }
                this.bot.classTimes.getUpcomingEvents().forEach(val => {
                    let { course } = val
                    
                    // check if course exists
                    if (!Object.keys(events).includes(course)) {
                        events[course] = []
                    }

                    // stop if it's full
                    if (events[course].length >= EVENTS_PER_COURSE) return

                    // add to event list
                    events[course].push(val)
                })

                // convert the aggregate to a string
                Object.keys(events).forEach(course => {
                    sb += `**${course} Deadlines**\n`
                    events[course].forEach(deadline => {
                        let { name, date } = deadline
                        sb += `> **${name}** → ${date.toLocaleString()}\n`
                    })
                    sb += '\n'
                })
                
                // send to channel
                msg.channel.send(sb)
            },
            help: (msg) => {
                let richEmbed = new Discord.MessageEmbed()
                    .setTitle("CoronaBot Instructional Help Page")
                    .addField("!help", "Get this wonderful help page")
                    .addField("!ping", "Pong")
                    .addField("!deadlines", "Get upcoming course deadlines")
                    .setFooter("CoronaBot")
                msg.channel.send(richEmbed)
            }
        }
    }

    /**
     * 
     * @param {Discord.TextMessage} msg 
     */
    exec(msg) {
        if (msg.content.length < 1) return
        if (msg.content[0] !== PREFIX) return
        if (msg.content.length == 1) {
            msg.reply('If you need help, do `!help`.')
            return
        }

        // look up the command
        let command = this.commands[msg.content.substring(1)]
        if (typeof command !== 'function') {
            msg.reply('Command not found. Try do `!help`')
            return
        }

        // run it
        command.apply(this, [msg])
    }
}

module.exports = exports = CommandProcessor
