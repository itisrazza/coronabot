
/*!
 * CoronaBot - Dashboard
 *
 * The dashboard implements a central location of sorts to send out and then
 * update information as opposed to having to run commands.
 */

const Discord = require("discord.js");
const exec = require("child_process").execSync;

class Dashboard {
    /**
     * @param {object} config The configuration object (JSON)
     * @param {Discord.Client} client 
     * @param {object} bot 
     */
    constructor(config, client, bot) {
        this.config = config;
        this.client = client;
        this.bot = bot;

        // load in values that won't change during runtime
        this.package = require("./package.json");
        this.gitHash = this.getGitHash();

        // save the time the program started existing (or at least this module)
        this.startTime = new Date();

        // keep an object with messages and functions to update said messages
        this.messageAssemblers = [
            this.assembleBotInfo.bind(this),
            this.assembleBirthdays.bind(this),
            this.assembleDeadlines.bind(this)
        ];
        this.messages = [];

        // set up the channel for dashboard
        /** @type {Discord.TextChannel} */ this.channel = null;
        this.initChannel();

        this.bot.log.log("DASHBOARD", "Module constructed");
    }

    /**
     * Init Discord channels (using async and magic Promise stuff) and
     * initially create the messages.
     */
    async initChannel() {
        this.channel = await this.client.channels.fetch(this.config.discord.dashChannel);
        this.bot.log.log("DASHBOARD", "Got channel: " + this.channel.id);

        // clear the messages from the channel
        await this.deleteAllMessages();

        // write out new messages
        this.messageAssemblers.forEach((async (assembler) => {
            let message = await this.channel.send("Loading: " + assembler.name);
            this.messages.push({ assembler, message });

            this.bot.log.log("DASHBOARD", "Mapped message ID: " + message.id);
        }).bind(this));

        // hook in the updater
        setInterval(
            this.updateMessages.bind(this),
            0.5 * 60 * 1000 /* 15 min */
        );

        this.bot.log.log("DASHBOARD", "Set up channel and messages");
    }

    async deleteAllMessages() {
        let fetched;
        do {
            fetched = await this.channel.messages.fetch({ limit: 100 });
            this.channel.bulkDelete(fetched);
        }
        while (fetched.size >= 2);
    }

    async updateMessages() {
        this.bot.log.log("DASHBOARD", "Message update triggered");
        for (const { assembler, message } of this.messages) {
            try {
                message.edit(assembler());
            } catch (e) {
                this.bot.log.log(
                    "DASHBOARD", 
                    `Failed updating "${ assembler.name }": ${ e }`
                );
            }
        }
    }

    /*
     * function below assemble the messages
     */

    /**
     * Assemble bot metadata
     */
    assembleBotInfo() {
        return "**Bot Information**\n" +
            `> Discord User: <@${this.client.user.id}>\n` +
            `> Bot Software: CoronaBot ${this.package.version}` +
            `-${this.gitHash} (https://git.io/Jf7tN)\n` +
            `> Platform: ${process.platform}\n` +
            `> Uptime: ${this.getUptime()}\n` +
            `> Process ID: ${process.pid}\n`;
    }

    /**
     * Assemble the string for upcoming deadlines and events
     */
    assembleDeadlines() {
        const EVENTS_PER_COURSE = 3;
        let sb = "";

        // aggregate the assignments due soonest
        let events = {};
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

        return sb;
    }

    /**
     * Assemble the string for the next upcoming birthdays
     */
    assembleBirthdays() {
        // handle birthdays here
        const UPCOMING_BIRTHDAYS_MAX = 5;
        let sb = "**Birthdays** (⚠ beta) <@325188281643827202> to get yours added.\n\n";

        // aggregate the birthdays of people
        let dates = {};
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
            sb += `Birthdays on ${date}\n`;
            dates[date].forEach(bday => {
                let { name } = bday;
                sb += `> → ${name}\n`;
            });
            sb += "\n";
        });

        return sb + "\n";
    }

    /*
     * helper functions
     */

    /**
     * Retrieve the Git commit hash for the running version of the bot
     */
    getGitHash() {
        try {
            return exec("git rev-parse HEAD", { encoding: "utf8" })
                .substring(0, 6);
        } catch {
            return "custom";
        }
    }

    /**
     * Retrieve the current uptime of the bot in human-readable form
     */
    getUptime() {
        // get the difference in milliseconds
        let uptimeMilli = new Date() - this.startTime;

        // get days, hours, minutes
        let seconds = uptimeMilli / 1000;
        let minutes = seconds / 60;
        let hours = minutes / 60;
        let days = hours / 24;

        // subtract the bigger things from the smaller things
        hours -= days * 24;
        minutes -= hours * 60;
        seconds -= minutes * 60;

        // round the numbers off
        days = Math.floor(days);
        hours = Math.floor(hours);
        minutes = Math.floor(minutes);

        // assemble the string together
        let sb = "";
        if (days > 0) sb += `${days} days, `;
        if (hours > 0) sb += `${hours} hours, `;
        sb += `${minutes} minutes`;

        return sb;
    }
};

module.exports = exports = Dashboard;
