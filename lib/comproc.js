
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
                if (!msg) return "[[deprecated]] Gets a list of upcoming deadlines.";
                msg.channel.send(
                    `Upcoming deadlines are now available on <#${this.config.dashboard.channel}>.\n` +
                    "For a list of all deadlines, use `!dl.list` instead."
                );
            },

            //
            // birthdays
            //

            bday: msg => this.commands.birthdays(msg),
            bdays: msg => this.commands.birthdays(msg),
            birthday: msg => this.commands.birthdays(msg),
            birthdays: msg => {
                if (!msg) return "[[deprecated]] Gets a list of upcoming birthdays.";
                msg.channel.send(
                    `Upcoming birthdays are now available on <#${this.config.dashboard.channel}>.\n` +
                    "A listing of all birthdays, including adding your own to the list, will be available in a future version of Coronabot."
                );
            },
            
            //
            // manage courses
            //

            /**
             * courses.reloadAll
             * @param {Discord.Message} msg
             */
            "courses.reloadAll": async msg => {
                if (!msg) return "[[borked]] Reloads courses, deadlines and lectures from disk.";
                if (!this.isAdmin(msg)) return;

                await this.bot.courses.reloadAll();
                msg.channel.send("Reloaded courses, deadlines and lectures from disk.");
            },

            /**
             * courses.commitAll
             * @param {Discord.Message} msg
             */
            "courses.commitAll": async msg => {
                if (!msg) return "[[wip]] Commits courses, deadlines and lectures to disk.";

                await this.bot.courses.coursesCommit();
                msg.channel.send("Commited courses.");

                await this.bot.courses.deadlinesCommit();
                msg.channel.send("Commited deadlines.");

                await this.bot.courses.lecturesCommit();
                msg.channel.send("Commited lectures.");
            },

            /**
             * courses.prune
             * @param {Discord.Message} msg
             */
            "courses.prune": async msg => {
                if (!msg) return "[[wip]] Removes past deadlines and empty courses.";
                let { lectures, deadlines, courses } = this.bot.courses;

                // remove deadlines which occured in the past
                let deletedDeadlines = 0;
                for (let i = 0; i < deadlines.length; /* i++ */) {
                    if (deadlines[i].date < new Date()) {
                        await this.bot.courses.deadlineRemove(i);
                        deletedDeadlines++;
                    } else {
                        i++;
                    }
                }

                // remove courses with no lectures and deadlines
                let toRemove = [];
                let toConsider = [];
                for (const course of Object.values(courses)) {
                    let courseDeadlines = 0;
                    let courseLectures = 0;

                    for (const lecture of lectures) {
                        if (lecture.course == course) courseLectures++;
                    }
                    for (const deadline of deadlines) {
                        if (deadline.course == course) courseDeadlines++;
                    }

                    if (courseDeadlines == 0) {
                        if (courseLectures == 0) {
                            toRemove.push(course.name);
                        } else {
                            toConsider.push(course.name);
                        }
                    }
                }
                for (const course of toRemove) {
                    this.bot.courses.courseRemove(course);
                }

                let sb = `${deletedDeadlines} deadlines deleted.\n`;
                sb += `${toRemove.length} channels deleted.\n\n`;

                sb += "The following channels have been deleted:\n"
                for (const course of toRemove) {
                    sb += `· ${course}\n`;
                }
                sb += "\n\n";

                sb += "Consider the following channels for deletion:\n";
                for (const course of toConsider) {
                    sb += `· ${course}\n`;
                }

                msg.channel.send(sb);
            },

            /**
             * courses.list
             * @arg {Discord.Message} msg
             * @arg {string[]} argv
             */
            "courses.list": msg => {
                if (!msg) return "Gets the list of courses.";

                let sb = "**Courses**\n";
                Object.values(this.bot.courses.courses).forEach(val => {
                    sb += `· ${val.name} (<@&${val.role}>)\n`;
                });
                msg.channel.send(sb);
            },

            /**
             * courses.clear
             * @arg {Discord.Message} msg
             * @arg {string[]} argv
             */
            "courses.clear": async msg => {
                if (!msg) return "Clears courses and dependents from memory, not writing to disk.";

                this.bot.courses.coursesClear().then(() => {
                    msg.channel.send("Cleared all courses, deadlines and lectures.");
                });
            },

            /**
             * courses.reload
             * @arg {Discord.Message} msg
             * @arg {string[]} argv
             */
            "courses.reload": async msg => {
                if (!msg) return "Reloads the courses from disk.";

                await this.bot.courses.coursesReload();
                msg.channel.send(`Loaded ${Object.values(this.bot.courses.courses).length} courses from disk.`);
            },

            /**
             * courses.commit
             * @arg {Discord.Message} msg
             * @arg {string[]} argv
             */
            "courses.commit": async msg => {
                if (!msg) return "Commits the courses from disk.";

                await this.bot.courses.coursesCommit();
                msg.channel.send("Written courses to disk.");
            },

            /**
             * courses.add [course] [role]
             * @arg {Discord.Message} msg
             * @arg {string[]} argv
             */
            "courses.add": async (msg, args) => {
                if (!msg) return "Adds a new course.\n" + 
                    "Usage: `!courses.add [course] [role]`\n" +
                    "Example: `!courses.add COMP102 @comp`";
                if (!this.isAdmin(msg)) return;

                if (args.length < 3) {
                    msg.channel.send(
                        "Usage: **!courses.add** [course] [role]"
                    );
                    return;
                }

                let name = args[1];
                let role = /<@&(\d+)>/.exec(args[2])[1];
                await this.bot.courses.coursesAdd(name, role);

                msg.channel.send(`Added course ${name} to memory.`);
            },

            /**
             * courses.remove [course]
             * @arg {Discord.Message} msg
             * @arg {string[]} argv
             */
            "courses.remove": async (msg, args) => {
                if (!msg) return "Removes a course and its deadlines and lectures.\n" +
                    "Usage: `!courses.remove [course]`\n" +
                    "Example: `!courses.remove COMP102`";
                if (!this.isAdmin(msg)) return;

                if (args.length < 2) {
                    msg.channel.send(
                        "Usage: **!courses.remove** [course]"
                    );
                }

                this.bot.courses.coursesRemove(args[1]);
                msg.channel.send("Removes the course and dependents from memory.");
            },
            
            //
            // manage deadlines
            //

            /**
             * dl.list
             */
            "dl.list": (msg, args) => {
                if (!msg) return "Gets the list of deadlines.\n" +
                    "Usage: `!dl.list [from?] [to?]`\n" + 
                    "Example: `!dl.list 10 50`";

                let deadlines = this.bot.courses.deadlines;
                let total = deadlines.length;

                // if there are no arguments, show summary
                if (args.length < 2) {
                    let futureEvents = 0;
                    for (const deadline of deadlines) {
                        if (deadline.date > new Date()) {
                            futureEvents++;
                        }
                    }

                    let sb = "**Deadline Summary**\n";    
                    sb += `> **${total}** total deadlines\n`;
                    sb += `> **${total - futureEvents}** past deadlines\n`;
                    sb += `> **${futureEvents}** future deadlines\n`;
                    sb += "\n";
                    sb += "Usage: **!dl.list** [from] [to?]\n";
                    sb += "Print the deadlines from index `from` to index `to` exclusive.";

                    msg.channel.send(sb);
                    return;
                }

                // start and end of the list
                let start = Math.max(parseInt(args[1]) || 0, 0);
                let end = Math.min(parseInt(args[2]) || start + 1, deadlines.length);

                // stop here for no deadlines
                if (total == 0) {
                    msg.channel.send("There are no current deadlines.");
                    return;
                }

                // build and send out the list in chunks
                let sb = "**Deadlines**\n";
                let page = 1;
                for (let i = start; i < end; i++) {
                    let deadline = deadlines[i];
                    let deadlineStr = `${i}: ${deadline.course.name} - ${deadline.name} - ${deadline.date}\n`;
                    
                    // discord supports a max of 2000 chars, split the message
                    // if we're close to the limit
                    if (sb.length + deadlineStr.length >= 1750) {
                        msg.channel.send(sb);
                        sb = `(page ${++page})\n`;
                    }

                    // add to the sb
                    sb += deadlineStr;
                }
                msg.channel.send(sb);
            },

            /**
             * dl.add [course] [name] [date:day] [date:month] [date:year] [time:hour24] [time:minute]
             * @arg {Discord.Message} msg
             * @arg {string[]} argv
             */
            "dl.add": async (msg, argv) => {
                if (!msg) return "Adds a new deadline.\n" + 
                    "Usage: `!dl.add [course] [name] [day] [month] [year] [hour] [minute]`\n" +
                    "Example: `!dl.add COMP102 \"Assignment 10\" 4 6 2019 9 00`";

                // refuse non-admins
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
            },

            /**
             * dl.clear
             * @arg {Discord.Message} msg
             * @arg {string[]} argv
             */
            "dl.clear": async msg => {
                if (!msg) return "Clears deadlines from memory, not writing to disk.";
                if (!this.isAdmin(msg)) return;

                await this.bot.courses.deadlinesClear();

                // inform about disk policy
                msg.channel.send("Removed deadline records from memory. No changes have been made on disk.");
                msg.channel.send("`!dl.reload` to reload the deadlines.");
                msg.channel.send("`!dl.commit` to commit to disk.");
            },

            /**
             * dl.commit
             * @arg {Discord.Message} msg
             * @arg {string[]} argv
             */
            "dl.commit": async msg => {
                if (!msg) return "Commits the deadlines to disk.";
                if (!this.isAdmin(msg)) return;

                await this.bot.courses.coursesCommit();
                msg.channel.send("Written courses to disk.");
            },

            /**
             * dl.reload
             * @arg {Discord.Message} msg
             * @arg {string[]} argv
             */
            "dl.reload": async msg => {
                if (!msg) return "Reloads the deadlines from disk.";

                // refuse non-admins
                if (!this.isAdmin(msg)) return;

                try {
                    await this.bot.courses.deadlinesReload();
                } catch (err) {
                    msg.channel.send("Failed to reload deadlines: " + err);
                    return;
                }

                msg.channel.send(
                    "Reloaded " + 
                    this.bot.courses.deadlines.length + 
                    " deadlines from disk."
                );
            },

            /**
             * dl.remove
             * @arg {Discord.Message} msg
             * @arg {string[]} argv
             */
            "dl.remove": async (msg, argv) => {
                if (!msg) return "Removes a deadline.\n" + 
                    "Usage: `!dl.remove [index]`\n" + 
                    "Example: `!dl.remove 420`";
                if (!this.isAdmin(msg)) return;

                // get the index and reject if there is none
                let index = parseInt(argv[1]);
                if (isNaN(index)) {
                    msg.channel.send(
                        "Usage: **!dl.remove** [index]"
                    );
                    return;
                }

                // get the deadline for later, and check if it exists
                let deadline = this.bot.courses.deadlines[index];
                if (!deadline) {
                    msg.channel.send(`Deadline with index ${index} doesn't exist.`);
                    return;
                }

                // delete and report back
                await this.bot.courses.deadlinesRemove(index);
                msg.channel.send(`Deleted deadline: ${deadline.course.name} - ${deadline.name}`);
            },

            //
            // manage class times
            //

            /**
             * lecture.list [course] [name] [cron] [location]
             * @arg {Discord.Message} msg
             * @arg {string[]} argv
             */
            "lecture.list": (msg, args) => {
                if (!msg) return "Gets the list of lectures.\n" +
                    "Usage: `!lecture.list [from?] [to?]`\n" + 
                    "Example: `!lecture.list 10 50`";
            
                let lectures = this.bot.courses.lectures;
                let total = lectures.length;
            
                // if there are no arguments, show summary
                if (args.length < 2) {            
                    let sb = "**Lecture Summary**\n";    
                    sb += `> **${total}** total lectures\n`;
                    sb += "\n";
                    sb += "Usage: **!lecture.list** [from] [to?]\n";
                    sb += "Print the lectures from index `from` to index `to` exclusive.";
            
                    msg.channel.send(sb);
                    return;
                }
            
                // start and end of the list
                let start = Math.max(parseInt(args[1]) || 0, 0);
                let end = Math.min(parseInt(args[2]) || start + 1, lectures.length);
            
                // stop here for no deadlines
                if (total == 0) {
                    msg.channel.send("There are no current deadlines.");
                    return;
                }
            
                // build and send out the list in chunks
                let sb = "**Lectures**\n";
                let page = 1;
                for (let i = start; i < end; i++) {
                    let lecture = lectures[i];
                    let lectureStr = `${i}: ${lecture.course.name} - ${lecture.name} - \`${lecture.cron}\` - ${lecture.location}\n`;
                    
                    // discord supports a max of 2000 chars, split the message
                    // if we're close to the limit
                    if (sb.length + lectureStr.length >= 1750) {
                        msg.channel.send(sb);
                        sb = `(page ${++page})\n`;
                    }
            
                    // add to the sb
                    sb += lectureStr;
                }
                msg.channel.send(sb);
            },

            /**
             * lecture.clear
             * @arg {Discord.Message} msg
             * @arg {string[]} args
             */
            "lecture.clear": async msg => {
                if (!msg) return "Clears lectures from memory, not writing to disk.";
                if (!this.isAdmin(msg)) return;

                await this.bot.courses.lecturesClear();
                msg.channel.send("Cleared all lectures.");
            },

            "lecture.commit": async msg => {
                if (!msg) return "Commits the lectures to disk.";
                if (!this.isAdmin(msg)) return;

                await this.bot.courses.lecturesCommit();
                msg.channel.send("Written courses to disk.");
            },

            "lecture.reload": async msg => {
                if (!msg) return "Reloads the deadlines from disk.";
                if (!this.isAdmin(msg)) return;

                await this.bot.courses.lecturesReload();
            },

            /**
             * lecture.add [course] [name] [cron] [location]
             * @arg {Discord.Message} msg
             * @arg {string[]} argv
             */
            "lecture.add": async (msg, argv) => {
                if (!msg) return "Adds a new lecture.\n" + 
                    "Usage: `!lecture.add [course] [name] [cron] [location]`\n" + 
                    "Example: `!lecture.add COMP102 \"Monday lecture\" \"0 12 * * 1\" MT228`";
                if (!this.isAdmin(msg)) return;

                if (argv.length < 5) {
                    msg.channel.send(
                        "Usage: **!lecture.add** [course] [name] [cron] [location]\n" +
                        "`cron` syntax: https://crontab.guru/"
                    );
                    return;
                }

                let args = {
                    course: argv[1],
                    name: argv[2],
                    cron: argv[3],
                    location: argv[4]
                };
                try {
                    await this.bot.courses.lecturesAdd(args.course, args.name, args.cron, args.location);
                } catch (err) {
                    msg.channel.send("Failed to reload deadlines: " + err);
                    return;
                }

                msg.channel.send("Added lecture.");
            },

            /**
             * lecture.remove [index]
             * @arg {Discord.Message} msg
             * @arg {string[]} args
             */
            "lecture.remove": async (msg, argv) => {
                if (!msg) return "Removes a deadline.\n" + 
                    "Usage: `!lecture.remove [index]`\n" + 
                    "Example: `!lecture.remove 420`";
                if (!this.isAdmin(msg)) return;

                // get the index and reject if there is none
                let index = parseInt(argv[1]);
                if (isNaN(index)) {
                    msg.channel.send(
                        "Usage: **!lecture.remove** [index]"
                    );
                    return;
                }

                // get the deadline for later, and check if it exists
                let lecture = this.bot.courses.lectures[index];
                if (!lecture) {
                    msg.channel.send(`Lecture with index ${index} doesn't exist.`);
                    return;
                }

                // delete and report back
                await this.bot.courses.lecturesRemove(index);
                msg.channel.send(`Deleted lecture: ${lecture.course.name} - ${lecture.name}`);
            },

            //
            // commands for debugging
            //

            /**
             * debug
             * @arg {Discord.Message} msg
             * @arg {string[]} argv
             */
            debug: (msg) => {
                if (!msg) return "Sends debug information to #debug.";

                this.bot.log.log("DEBUG_REQ", "Server Log Request");
                this.bot.log.log("DEBUG_REQ", "pid: " + process.pid);
                this.bot.log.log("DEBUG_REQ", "platform: " + process.platform);
                msg.reply("I wrote the server info in the debug channel");
            },

            /**
             * restart
             * @arg {Discord.Message} msg
             * @arg {string[]} argv
             */
            restart: msg => {
                if (!msg) return "Restarts the Coronabot software.";

                msg.channel.send(
                    "I've been trying to figure this out for ages.\n" + 
                    "I can fork() and call the controller (covid19-stop.js), but it will kill the process and there won't be a way to restart.\n" +
                    "\n" +
                    "So... for now I'll just use GitHub actions until @joel has the time to figure out Dockering this." 
                );
            },

            //
            // the usual help command
            //

            help: async (msg, argv) => {
                if (!msg) return "Asks for help.";

                // something a bit different for admins
                if (this.isAdmin(msg) && argv[1] === "admin") {
                    let richEmbed = new Discord.MessageEmbed()
                        .setTitle("Super Secret Administrator/Mod Help Page")
                        .setDescription("These command descriptions are autogenerated from code. https://bit.ly/3dbZvgw")
                        .setColor("#3498db")
                        .setFooter("CoronaBot");
                    for (const key of Object.keys(this.commands)) {
                        let funcResult = this.commands[key].apply(this, []);
                        if (funcResult instanceof Promise) {
                            // resolve promise if the function is async
                            funcResult = await funcResult;
                        }
    
                        richEmbed.addField(key, funcResult);
                    }
                    msg.channel.send(richEmbed);
                    return;
                }

                let richEmbed = new Discord.MessageEmbed()
                    .setTitle("CoronaBot Instructional Help Page")
                    .setDescription("There are other commands. The code holds the answers. https://bit.ly/3dbZvgw")
                    .addField("!help", "Get this wonderful help page")
                    .addField("!ping", "Pong")
                    .addField("~~!deadlines~~", "Upcoming deadlines are now available on #dashboard.")
                    .addField("~~!birthdays~~", "Upcoming birthdays are now available on #dashboard.")
                    .addField("!dl.list [from] [to?]", "List deadlines from index [from] to [to] exclusive.")
                    .addField("!lecture.list [from] [to?]", "List lectures from index [from] to [to] exclusive.")
                    .addField("!bday.list [from] [to?]", "(not implemented)")
                    .addField("!bday.request [day] [month]", "(not implemented)")
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
    async exec(msg) {
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
            await command.apply(this, [msg, argv]);
        } catch (err) {
            this.bot.log.error("COMPROC", "❌ An error occured during command processing: " + err);
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
