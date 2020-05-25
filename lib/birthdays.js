
/*!
 * CoronaBot -- Birthdays.
 * 
 * „Mulți ani trăiască, mulți ani trăiască! 🎶”
 *              -- Raresh
 */

const fs = require("fs").promises;
const path = require("path");
const csvParse = require("csv-parse/lib/sync");
const Discord = require("discord.js");
const schedule = require("node-schedule");

class Birthdays {
    /**
     * @param {object} config The configuration object (JSON)
     * @param {Discord.Client} client 
     * @param {object} bot 
     */
    constructor(config, client, bot) {
        this.config = BirthdayEvent.config = config;
        this.client = BirthdayEvent.client = client;
        this.bot = BirthdayEvent.bot = bot;
        this.birthdays = [];
        BirthdayEvent.eventHandler = this.message;
        BirthdayEvent.master = this;

        // create an empty object if birthday isn't set
        if (!config.birthday) config.birthday = { };

        // get a hook to the file
        this.dataFilename = path.join(
            __dirname, 
            "..", 
            config.birthday.file || "data/real_birthdays.csv"
        );
        this.reloadInterval = config.birthday.interval || 1800000;

        // import channels and set up a time to occasionally reload
        this.initChannels().then(() => {
            this.importData();
            // setInterval(this.importData.bind(this), this.reloadInterval);
        });
    }

    async initChannels() {
        let channel = this.config.birthday.channel;

        /** @type {Discord.TextChannel} */
        this.channel = await this.client.channels.fetch(channel);
    }

    async importData() {
        try {
            let bdaysRaw = await fs.readFile(this.dataFilename);
            let bdaysObj = csvParse(bdaysRaw, { skip_empty_lines: true });
            let birthdays = [];
            
            // cancel the existing events so we can replace them
            this.birthdays.forEach(birthday => {
                birthday.cancelJob();
            });

            // create new birthday entries
            bdaysObj.forEach(async row => {
                let name = row[0];
                let userID = row[1] || undefined;
                let cron = row[2];
                let message = row[3] || undefined;

                // look up Discord user
                let user = null;
                if (userID != null) {
                    user = await this.client.users.fetch(userID);
                }

                // create a birthday obj for this entry and keep it
                birthdays.push(new BirthdayEvent(name, user, cron, message));
            });

            // update the actual birthdays count
            this.birthdays = birthdays;
            this.bot.log.log("BDAY", `Loaded ${this.birthdays.length} entries.`);
        } catch (e) {
            this.bot.log.log("BDAY", "Failed to import data.");
            this.bot.log.log("BDAY", "Error info: " + e);
        }
    }

    getUpcomingBirthdays() {
        return this.birthdays
            .sort((a, b) => a.next() - b.next());
    }

    /**
     * @param {BirthdayEvent} birthday 
     */
    async message(birthday) {
        let out = "Happy Birthday, " + birthday.name;
        if (birthday.user) { out + " (<@" + birthday.user.id + ">)"; }
        out += "!";
        if (birthday.message) { out += " - \"" + birthday.message + "\""; }

        this.channel.send(out);
        this.bot.log.log("BDAY", "Birthday event happened: " + out);
    }
};

class BirthdayEvent {
    /**
     * @param {string} name 
     * @param {Discord.User?} user 
     * @param {string} cron 
     * @param {string} message 
     */
    constructor(name, user, cron, message) {
        this.name = name;
        this.user = user;
        this.cron = cron;
        this.message = message;

        let userID = "no-discord";
        if (this.user) userID = this.user.id;
        this.job = schedule.scheduleJob(
            this.name + " " + userID,
            this.cron,
            BirthdayEvent.eventHandler.bind(BirthdayEvent.master, this)
        );

        if (this.job == null) {
            BirthdayEvent.bot.log.log(
                "BDAY", 
                `Job ${this.name} failed to register.`
            );
        } else {
            BirthdayEvent.bot.log.log(
                "BDAY", 
                `Job ${this.job.name} registered.`
            );
        }
    }

    next() {
        return this.job.nextInvocation().toDate();
    }

    cancelJob() {
        return this.job.cancel(false);
    }
};

BirthdayEvent.master = null;
BirthdayEvent.config = null;
BirthdayEvent.client = null;
BirthdayEvent.bot = null;
BirthdayEvent.eventHandler = null;

module.exports = exports = Birthdays;
