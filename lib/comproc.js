
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
     * The constructor called by the entry point.
     * 
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
                if (!msg) return "Tests the connection to the bot server.";

                msg.reply("Hi there");
            },

            //
            // deadlines
            //

            dl: msg => this.commands.deadlines(msg),
            dls: msg => this.commands.deadlines(msg),
            deadline: msg => this.commands.deadlines(msg),
            deadlines: msg => {
                if (!msg) return "`Deprecated` Gets a list of upcoming deadlines.";

                msg.channel.send(
                    "The `!deadlines` command is no longer available.\n" +
                    "However, they are still available in <#" + this.config.dashboard.channel + ">.");

                msg.channel.send(
                    "For a full listing of deadlines, see `!dl.list` instead.");
            },

            //
            // birthdays
            //

            bday: msg => this.commands.birthdays(msg),
            bdays: msg => this.commands.birthdays(msg),
            birthday: msg => this.commands.birthdays(msg),
            birthdays: msg => {
                if (!msg) return "`Deprecated` Gets a list of upcoming birthdays.";

                msg.channel.send(
                    "The `!birthday` command is no longer available.\n" +
                    "However, they are still available in <#" + this.config.dashboard.channel + ">.");
            },
            
            //
            // manage courses
            //
            
            "courses.list": msg => {
                if (!msg) return "Gets the list of courses.";

                let sb = "**Courses**\n";
                Object.values(this.bot.courses.courses).forEach(val => {
                    sb += `· ${val.name} (<@&${val.role}>)\n`;
                });
                msg.channel.send(sb);
            },

            "courses.add": (msg, args) => {
                if (!msg) return "`Admin` Adds a new course.";
                if (!this.isAdmin(msg)) return;

                if (args.length < 3) {
                    msg.channel.send(
                        "Usage: **!courses.add** [course] [role]");
                    return;
                }

                let name = args[1];
                let role = /<@&(\d+)>/.exec(args[2])[1];
                this.bot.courses.coursesAdd(name, role);
            },
            
            "courses.remove": async (msg, args) => {
                if (!msg) return "`Admin` Removes a course and its dependents.";
                if (!this.isAdmin(msg)) return;

                if (args.length < 2) {
                    msg.channel.send(
                        "Usage: **!courses.remove** [course]");
                    return;
                }

                let name = args[1];
                await this.bot.courses.coursesRemove(name);

                msg.channel.send(`Removed "${name}" from courses.`)
            },

            //
            // manage deadlines
            //

            /**
             * dl.info
             */
            "dl.list": (msg, args) => {
                if (!msg) return "Gets deadline information.";

                // show summary
                if (args.length < 2) {
                    let total;
                    let past = 0, present = 0;
                    for (const deadline of this.bot.courses.deadlines) {
                        total++;
                        if (deadline.date <= new Date()) past++;
                        else present++;
                    }

                    msg.channel.send("**Deadline Summary**\n" +
                        `> ${past} deadlines in the past\n` +
                        `> ${present} deadlines in the future\n` +
                        `> ${future} deadlines in total\n`);
                    
                    msg.channel.send("Usage: **!dl.list** [start] [length]\n" +
                        `Example: **!dl.list** ${Math.floor(total * Math.random())}`);
                    return;
                }

                let start = parseInt(args[1]);
                let length = parseInt(args[2]) || 1;

                let sb = "**Deadlines**";

                let past = 0;
                let future = 0;

                for (const val of this.bot.courses.deadlines) {

                }

                this.bot.classTimes.deadlines.forEach(val => {
                    let { course, name, date, nonce } = val;
                    if (new Date() - date < 0) future++;
                    if (new Date() - date > 0) past++;
                });

                msg.channel.send(
                    sb + `${past} in the past, ${future} in the future.`
                );
            },

            /**
             * dl.add [course] [name] [date:day] [date:month] [date:year] [time:hour24] [time:minute]
             * @arg {Discord.Message} msg
             * @arg {string[]} argv
             */
            "dl.add": async (msg, argv) => {
                if (!msg) return "`Admin` Adds a new deadline.";
                if (!this.isAdmin(msg)) return;

                // save all we need
                let args = {
                    course: argv[1],
                    name: argv[2],
                    day: parseInt(argv[3]),
                    month: parseInt(argv[4]),
                    year: parseInt(argv[5]),
                    hour24: parseInt(argv[6]),
                    minute: parseInt(argv[7])
                };
                console.log(JSON.stringify(args, undefined, "  "));

                // refuse to run if we're missing anything
                if (Object.values(args).some(arg => arg !== 0 && !arg)) {
                    msg.channel.send(
                        "Usage: **!dl.add** " +
                        "[course] [name] " +
                        "[day] [month] [year] [hour] [minute]"
                    );
                    return;
                }

                // add the deadline
                try {
                    await this.bot.courses.deadlinesAdd(
                        args.course, 
                        args.name, 
                        new Date(
                            args.year, 
                            args.month - 1, 
                            args.day, 
                            args.hour24, 
                            args.minute
                        )
                    );
                } catch (err) {
                    msg.channel.send("Failed to add deadline: " + err);
                    return;
                }


                msg.channel.send("Added deadline");
                return;
            },

            /**
             * dl.clear
             * @arg {Discord.Message} msg
             * @arg {string[]} argv
             */
            "dl.clear": async msg => {
                if (!msg) return "`Admin` Clears deadlines from memory, not writing to disk.";
                if (!this.isAdmin(msg)) return;

                await this.bot.courses.deadlinesClear();

                // inform about disk policy
                msg.channel.send("Removed all deadlines from memory.");
            },

            "dl.commit": async msg => {
                if (!msg) return "`Admin` Commits the deadlines to disk.";
                if (!this.isAdmin(msg)) return;

                await this.bot.courses.deadlinesCommit();
                msg.channel.send(
                    "Commited " +
                    this.bot.courses.deadlines.length +
                    " deadlines to disk.");
            },

            "dl.reload": async msg => {
                if (!msg) return "`Admin` Reloads the deadlines from disk.";
                if (!this.isAdmin(msg)) return;

                await this.bot.courses.deadlinesReload();
                msg.channel.send(
                    "Reloaded " + 
                    this.bot.courses.deadlines.length + 
                    " deadlines from disk."
                );
            },

            /**
             * dl.remove 
             */
            "dl.remove": (msg, argv) => {
                if (!msg) return "`Admin` Removes a deadline.";
                if (!this.isAdmin(msg)) return;
            },

            //
            // manage class times
            //

            /**
             * lecture.add [course] [name] [cron] [location]
             * @arg {Discord.Message} msg
             * @arg {string[]} argv
             */
            "lecture.list": msg => {
                if (!msg) return "Gets a complete list of lectures.";
                
                // TODO: get the whole list of lecture without upsetting Discord
                msg.channel.send(new Discord.MessageAttachment());
            },

            /**
             * lecture.add [course] [name] [cron] [location]
             * @arg {Discord.Message} msg
             * @arg {string[]} argv
             */
            "lecture.add": (msg, argv) => {
                if (!msg) return "`Admin` Adds a new lecture.";
                if (!this.isAdmin(msg)) return;

                let args = {
                    course: argv[1],
                    name: argv[2],
                    cron: argv[3],
                    month: parseInt(argv[4]),
                    year: parseInt(argv[5]),
                    hour24: parseInt(argv[6]),
                    minute: parseInt(argv[7])
                };
                console.log(JSON.stringify(args, undefined, "  "));
            },
            

            //
            // commands for debugging
            //

            debug: (msg) => {
                if (!msg) return "Sends debug information to #debug.";

                this.bot.log.log("DEBUG_REQ", "Server Log Request");
                this.bot.log.log("DEBUG_REQ", "pid: " + process.pid);
                this.bot.log.log("DEBUG_REQ", "platform: " + process.platform);
                msg.reply("I wrote the server info in the debug channel");
            },

            restart: msg => {
                if (!msg) return "Restarts the Coronabot software.";

                msg.reply(
                    "To do that, you need to know where the webhook is. 🤔"
                );
            },

            //
            // the usual help command
            //

            help: (msg, argv) => {
                if (!msg) return "Asks for help.";

                // something a bit different for admins
                if (this.isAdmin(msg) && argv[1] === "admin") {
                    let richEmbed = new Discord.MessageEmbed()
                        .setTitle("Super Secret Administrator/Mod Help Page")
                        .setDescription("These command descriptions are autogenerated from code. https://bit.ly/3dbZvgw")
                        .setColor("#3498db")
                        .setFooter("CoronaBot");
                    Object.keys(this.commands).forEach(key => {
                        richEmbed.addField(
                            key, 
                            this.commands[key].apply(this, [])
                        );
                    });
                    msg.channel.send(richEmbed);
                    return;
                }

                let richEmbed = new Discord.MessageEmbed()
                    .setTitle("CoronaBot Instructional Help Page")
                    .setDescription("There are other commands. The code holds the answers. https://bit.ly/3dbZvgw")
                    .addField("!help", "Get this wonderful help page")
                    .addField("!ping", "Pong")
                    .addField("!deadlines", "Get upcoming course deadlines")
                    .addField("!birthdays", "Get upcoming birthdays")
                    .setColor("#e91e63")
                    .setFooter("CoronaBot");
                if (this.isAdmin(msg)) {
                    richEmbed.setFooter("CoronaBot - Use `!help admin` for a full list of commands.");
                }
                msg.channel.send(richEmbed);
            }
        };
    }

    /**
     * Executes a command.
     * @param {Discord.Message} msg 
     */
    exec(msg) {
        if (msg.content.length < 1) return;
        if (msg.content[0] !== PREFIX) return;
        if (msg.content.length == 1) {
            msg.reply("If you need help, do `!help`.");
            return;
        }

        // refuse a message from ourselves
        if (msg.author.equals(this.client.user)) {
            return;
        }

        // parse the arguments
        let argv = this.argvParse(msg.content);

        // log it
        this.bot.log.log(
            "COMPROC",
            `Got command from ${msg.author.username} [${argv.length}]: ` +
            msg.content
        );

        // get the command name (the first bit before the first space)
        let spaceIndex = msg.content.indexOf(" ");
        if (spaceIndex < 0) spaceIndex = undefined;
        let commandName = msg.content.substring(1, spaceIndex);

        // look up the command
        let command = this.commands[commandName];
        if (typeof command !== "function") {
            msg.reply("Command not found. Try do `!help`");
            return;
        }

        // run it
        try {
            command.apply(this, [msg, argv]);
        } catch (err) {
            msg.channel.send(
                "❌ An error occured during command processing:\n```" + 
                err + "```");
        }
    }

    /**
     * Parses the arguments of a command.
     * @param {string} content The string to parse.
     * @returns {string[]} An array of command arguments.
     */
    argvParse(content) {
        let argv = [];
        let argv_c = "";

        /*
         * Using a simple FSM for this.
         * 
         * Basically, unless the string is wrapped in `"`, 
         * spaces act as a separator. Characters can be escaped with a 
         * backslash (`\`). Only `\` and `"` can be escaped this way, any other
         * character would just be inserted.
         */

        let state = "normal";
        for (let i = 0; i < content.length; i++) {
            let c = content[i];
            switch (state) {
                case "normal":
                    if (c == " ") {
                        state = "space";
                        argv.push(argv_c);
                        argv_c = "";
                    } else if (c == "\"") {
                        state = "quote";
                    } else {
                        argv_c += c;
                    }

                    break;

                case "space":
                    state = c == "\"" ? "quote" : "normal";
                    if (state == "normal") argv_c += c;
                    break;

                case "quote":
                    if (c == "\"") {
                        state = "normal";
                    } else if (c == "\\") {
                        state = "escape";
                    } else {
                        argv_c += c;
                    }
                    break;

                case "escape":
                    state = "quote";
                    argv_c += c;
                    break;

                default:
                    msg.channel.send("Failed to finish FSM.");
                    return;
            }
        }

        // commit the rest to the args
        argv.push(argv_c);

        return argv;
    }

    /**
     * Determines if the user sending the message is an admin.
     * @param {Discord.Message} msg The message to check against.
     */
    isAdmin({ author, member }) {
        // check against user list first
        if (this.config.comproc.adminUsers.some(id => author.id == id)) {
            return true;
        }

        // then check roles
        if (this.config.comproc.adminRoles.some(async id => {
            let role = await member.guild.roles.fetch(id);
            return role.members.has(author.id);
        })) {
            return true;
        }

        return false;
    }
}

module.exports = exports = CommandProcessor;
