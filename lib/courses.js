
/*!
 * CoronaBot -- Course Aide
 *
 * This module will eventually replace the current `class-times` module to make
 * loading and saving uni-related events simpler.
 * 
 * A data race or collision would be catastrophic, but oh well, this is why we
 * have the commit and reload functions. 🤷‍♂️
 */

const { existsSync } = require("fs");
const fs = require("fs").promises;
const path = require("path");
const schedule = require("node-schedule");
const Discord = require("discord.js");

const MS_PER_MINUTES = 60000;
const MS_PER_HOUR = MS_PER_MINUTES * 60;

const FNAME_COURSES = "courses.json";
const FNAME_DEADLINES = "deadlines.json";
const FNAME_LECTURES = "lectures.json";

let _bot, _config, _client;

class Courses {
    /**
     * @param {object} config The configuration object (JSON)
     * @param {Discord.Client} client 
     * @param {object} bot 
     */
    constructor(config, client, bot) {
        this.config = _config = config;
        this.client = _client = client;
        this.bot = _bot = bot;
        
        // create files
        this.assertFileExists(FNAME_COURSES);
        this.assertFileExists(FNAME_DEADLINES);
        this.assertFileExists(FNAME_LECTURES);

        // create arrays to store all this
        this.courses = { "Everyone": new Course("Everyone", this.config.courses.defaultRole) };
        /** @type {Deadline[]} */ this.deadlines = [];
        /** @type {Lecture[]}  */ this.lectures = [];

        // init channels
        this.initChannels();

        // automatically trigger a reload
        this.reloadAll();
    }

    /**
     * @access private
     * Initlialise channels
     */
    async initChannels() {
        // load channels
        let dlChannel = await this.client.channels.fetch(this.config.courses.channels.deadlines);
        let lectureChannel = await this.client.channels.fetch(this.config.courses.channels.lectures);
        
        // use the discord message senders instead
        Deadline.deadlineCallback = this.onDeadlineWarning.bind(this, dlChannel);
        Lecture.lectureCallback = this.onLectureWarning.bind(this, lectureChannel);
    }

    async reloadAll() {
        this.bot.log.log("COURSES", "Reloading all courses.");
        await this.coursesReload();
        await this.deadlinesReload();
        await this.lecturesReload();
    }

    //
    // convenience getters
    // 

    //
    // course management
    //

    /**
     * Deletes all the courses in memory.
     */
    async coursesClear() {
        for (const key of Object.keys(this.courses)) {
            await this.coursesRemove(key);
        }
        this.bot.log.log("COURSES", "Removed courses from memory.");
    }

    /**
     * Loads the courses from disk to memory.
     */
    async coursesReload() {
        let coursesString = await fs.readFile(this.getRealFilename(FNAME_COURSES));
        let coursesJSON = JSON.parse(coursesString);
        if (!Array.isArray(coursesJSON)) {
            throw new Error("Root object is not an array. Invalid courses.json schema.");
        }

        await this.coursesClear();
        coursesJSON.forEach(courseJSON => {
            let course = Course.fromJSON(courseJSON);
            this.courses[course.name] = course;
        });

        let reloadMessage = `Reloaded ${Object.values(this.courses).length} courses from disk.`;
        this.bot.log.log("COURSES", reloadMessage);
    }

    /**
     * Writes the courses in memory to disk.
     */
    async coursesCommit() {
        let jsonArray = [];
        for (const course of Object.values(this.courses)) {
            jsonArray.push(course.toJSON());
        }
        
        await fs.writeFile(
            this.getRealFilename(FNAME_COURSES), 
            JSON.stringify(jsonArray, undefined, "  "),
            { encoding: "utf-8" }  
        );
        this.bot.log.log("COURSES", "Commited courses to disk.");
    }

    /**
     * Adds a new course.
     * @argument {string} name The name for the course.
     * @argument {string | Discord.Role} role The role for the course.
     */
    async coursesAdd(name, role) {
        // stop if the course already exists
        if (this.courses[name]) {
            throw new Error("Course with the name already exists.");
        }

        // if the role is a Discord role object, get its ID
        if (role instanceof Discord.Role) {
            role = role.id;
        }

        this.bot.log.log("COURSES", `Added course "${name}" to memory.`);
        return this.courses[name] = new Course(name, role);
    }

    /**
     * Removes the course and all deadlines and courses associated with it.
     * @argument {string} name The name of the course.
     */
    async coursesRemove(name) {
        // get the course
        let course = this.courses[name];
        if (!course) throw new Error("Course not found.");

        // finish all the deadlines and lectures that depend on the course
        let i;
        for (i = 0; i < this.deadlines.length; ) {
            let deadline = this.deadlines[i];
            if (deadline.course == course) {
                await this.deadlinesRemove(i);
            } else {
                i++;
            }
        }
        for (i = 0; i < this.lectures.length; ) {
            let lecture = this.lectures[i];
            if (lecture.course == course) {
                await this.lectureRemove(i);
            } else {
                i++;
            }
        }

        // get the course name and delete it
        delete this.courses[name];

        this.bot.log.log("COURSES", `Removed course "${name}" from memory.`);
    }

    //
    // deadline management
    //

    async deadlinesClear() {
        while (this.deadlines.length > 0) {
            await this.deadlinesRemove(0);
        }
    }

    /**
     * Loads the deadlines from disk to memory.
     */
    async deadlinesReload() {
        let deadlinesString = await fs.readFile(this.getRealFilename(FNAME_DEADLINES));
        let deadlinesJSON = JSON.parse(deadlinesString);
        if (!Array.isArray(deadlinesJSON)) {
            throw new Error("Root object is not an array. Invalid deadlines.json schema.");
        }

        await this.deadlinesClear();

        let rejected = 0;   // number of rejected deadlines (because of missing courses)
        deadlinesJSON.forEach(deadlineJSON => {
            if (!this.courses[deadlineJSON.course]) return;
            let deadline = Deadline.fromJSON(this.courses, deadlineJSON);
            this.deadlines.push(deadline);
        });

        let reloadMessage = `Reloaded ${this.deadlines.length} deadlines from disk.`;
        this.bot.log.log("COURSES", reloadMessage);
    }

    /**
     * Writes the deadlines in memory to disk.
     */
    async deadlinesCommit() {
        let jsonArray = [];
        for (const deadline of this.deadlines) {
            jsonArray.push(deadline.toJSON());
        }
        
        await fs.writeFile(
            this.getRealFilename(FNAME_DEADLINES), 
            JSON.stringify(jsonArray, undefined, "  "),
            { encoding: "utf-8" }
        );
        this.bot.log.log("COURSES", "Commited deadlines to disk.");
    }

    /**
     * Adds a new deadline.
     * @argument {string} course The course the deadline is for.
     * @argument {string} name The name of the deadline.
     * @argument {Date} date The date and time the deadline is going to occur.
     */
    async deadlinesAdd(course, name, date) {
        if (!this.courses[course]) throw new Error("Course doesn't exist.")

        this.deadlines.push(new Deadline(this.courses[course], name, date));
    }
    
    /**
     * Removes the course and all deadlines and courses associated with it.
     * @argument {number} index The index of the course in `deadlines`.
     */
    async deadlinesRemove(index) {
        if (index >= this.deadlines.length) {
            throw new Error("Index is out of range.");
        }

        await this.deadlines[index].finish();
        return this.deadlines.shift();
    }

    //
    // lecture management
    //

    async lecturesClear() {
        while (this.lectures.length > 0) {
            await this.lectureRemove(0);
        }
    }

    /**
     * Loads the deadlines from disk to memory.
     */
    async lecturesReload() {
        let lecturesString = await fs.readFile(this.getRealFilename(FNAME_LECTURES));
        let lecturesJSON = JSON.parse(lecturesString);
        if (!Array.isArray(lecturesJSON)) {
            throw new Error("Root object is not an array. Invalid lectures.json schema.");
        }

        await this.lecturesClear();

        lecturesJSON.forEach(lectureJSON => {
            if (!this.courses[lectureJSON.course]) return;
            let lecture = Lecture.fromJSON(this.courses, lectureJSON);
            this.lectures.push(lecture);
        });

        let reloadMessage = `Reloaded ${this.lectures.length} lectures from disk.`;
        this.bot.log.log("COURSES", reloadMessage);
    }

    /**
     * Writes the courses in memory to disk.
     */
    async lecturesCommit() {
        let jsonArray = [];
        for (const lecture of this.lectures) {
            jsonArray.push(lecture.toJSON());
        }
        
        await fs.writeFile(
            this.getRealFilename(FNAME_LECTURES), 
            JSON.stringify(jsonArray, undefined, "  "),
            { encoding: "utf-8" }  
        );
        this.bot.log.log("COURSES", "Commited lectures to disk.");
    }

    /**
     * 
     * @param {string} course 
     * @param {string} name 
     * @param {string} cron 
     * @param {string} location 
     */
    async lecturesAdd(course, name, cron, location) {
        if (!this.courses[course]) throw new Error("Course doesn't exist.");
        this.lectures.push(new Lecture(this.courses[course], name, cron, location));
    }

    async lectureRemove(index) {
        if (index >= this.lectures.length) {
            throw new Error("Index out of range.");
        }

        await this.lectures[index].finish();
        return this.lectures.shift();
    }

    //
    // schedule handlers
    //

    /**
     * Handler for deadline warnings.
     * @param {function} warning A function which returns a warning message.warning
     * @param {Discord.TextChannel} channel
     * @this {Deadline}
     */
    onDeadlineWarning(channel, deadline, warning) {
        channel.send(
            `\`${deadline.course.name}\` <@&${deadline.course.role}> - ` + 
            warning(deadline.name));
    }

    onLectureWarning(channel, lecture) {
        channel.send(
            `\`${lecture.course.name}\` <@&${lecture.course.role}> - ` + 
            lecture.name + " will soon start in " + lecture.location);
    }

    //
    // helpers
    //

    /**
     * Gets the real data filename for this data file.
     * @param {string} filename File name.
     */
    getRealFilename(filename) {
        return path.join(this.config.dataFolder, filename);
    }

    /**
     * Make sure the file exists.
     * @param {string} filename The JSON file to create empty.
     * @throws Throws an write errors if the empty array cannot be written.
     */
    async assertFileExists(filename) {
        let realFilename = this.getRealFilename(filename);
        if (existsSync(realFilename)) return;

        this.bot.log.log("COURSES", `${realFilename} doesn't exist. Creating it...`);
        await fs.writeFile(realFilename, "[]", { encoding: "utf-8" });
    }

    /**
     * The the course object belonging to the name.
     * @param {string} name The name of the course.
     */
    async getCourse(name) {
        return this.courses[name];
    }
}

/**
 * Represents a course.
 */
class Course {
    /**
     * Creates a new Course object.
     * @param {string} name Human-readable name for the course.
     * @param {string} role Discord role ID.
     */
    constructor(name, role) {
        this.name = name;
        this.role = role;
    }

    /**
     * Returns a simple JSON representation of the object.
     * @returns {object} JSON object.
     */
    toJSON() {
        return { name: this.name, role: this.role };
    }

    /**
     * Creates a course object from JSON representation.
     * @param {object} object JSON object.
     * @returns Course object.
     */
    static fromJSON({ name, role }) {
        return new Course(name, role);
    }
}

/**
 * @param {Date} date
 * @param {number} hours
 * @returns {Function}
 */
function warningForHoursBefore(hours) {
    return date => new Date(date - hours * MS_PER_HOUR);
}

function warningAtTimeBefore(daysBefore, hour, minutes) {
    let offset =
        hour * MS_PER_HOUR + 
        minutes * MS_PER_MINUTES;

    return date => new Date(date - 
        // calculates the beginning of the day of the deadline
        daysBefore * 24 * MS_PER_HOUR -
        date.getHours() * MS_PER_HOUR - 
        date.getMinutes() * MS_PER_MINUTES +

        // adds the days and hours from there
        offset);
}

/**
 * Represents a deadline.
 */
class Deadline {
    /** Function to be run when a deadline warning is issued. */
    static deadlineCallback = warning => {
        console.log("Deadline will occur:");
        console.log("  Warning: " + warning(this.name));
    };

    /** Date calculators for warnings. */
    static warningTime = [
        // [0, 3] - specific times
        /* Next day 9 AM */ warningAtTimeBefore(1, 9, 0),
        /* Next day 8 PM */ warningAtTimeBefore(1, 20, 0),
        /* 9 AM          */ warningAtTimeBefore(0, 9, 0),
        /* 8 PM          */ warningAtTimeBefore(0, 20, 0),

        // [4, 7] - time before
        /*  1 hr before */ warningForHoursBefore(1),
        /*  4 hr before */ warningForHoursBefore(4),
        /*  8 hr before */ warningForHoursBefore(8),
        /* 12 hr before */ warningForHoursBefore(12)
    ]

    /** Warning messages. */
    static warnings = [
        // [0, 3] - specific times
        /* Next day 9 AM */ event => `${event} will be due tomorrow`,
        /* Next day 8 PM */ event => `${event} will be due tomorrow evening`,
        /* 9 AM          */ event => `${event} will be due soon`,
        /* 8 PM          */ event => `${event} will be due tonight`,

        // [4, 7] - time before
        /*  1 hr before */ event => `1 hour before ${event} is due`,
        /*  4 hr before */ event => `4 hours before ${event} is due`,
        /*  8 hr before */ event => `8 hours before ${event} is due`,
        /* 12 hr before */ event => `12 hours before ${event} is due`
    ];
    
    /**
     * Creates a new Deadline object.
     * @param {Course} course The course to file this under.
     * @param {string} name The name of the deadline.
     * @param {Date} date The time the deadline is due.
     */
    constructor(course, name, date) {
        this.course = course;
        this.name = name;
        this.date = date;
        this.nonce = (Math.random() * 255) | 0;
        /** @type {schedule.Job[]} */ this.scheduleJobs = [];

        // reject if the date is in the past
        if (this.date < new Date()) {
            throw new Error("Deadline occurs in the past.");
        }
        
        // schedule the jobs
        this.scheduleJobsEnable();
    }

    /**
     * Destroys and cancels any remaining events related to this object.
     */
    async finish() {
        this.scheduleJobsDisable();
    }

    //
    // serialisation
    //

    /**
     * Returns a simple JSON representation of the object.
     * @returns {object} JSON object.
     */
    toJSON() {
        return {
            name: this.name,
            course: this.course.name,
            date: this.date.toJSON()
        };
    }

    /**
     * Creates a Deadline object from JSON representation.
     * @param {object} object
     * @returns {Deadline} Deadline object.
     */
    static fromJSON(courseMap, { course, name, date }) {
        return new Deadline(courseMap[course], name, new Date(date));
    }

    //
    // Scheduler handling
    //

    /**
     * Prefix of the scheduled jobs' name.
     */
    scheduleName() {
        return `${this.course.name}:${this.name}:${this.nonce}`;
    }

    /**
     * Set up scheduler events for this lecture.
     */
    scheduleJobsEnable() {
        for (let i = 0; i < Deadline.warnings.length; i++) {
            let message = Deadline.warnings[i];
            let warningTime = Deadline.warningTime[i](this.date);

            // discard if the warning time lands after the event or if it occured before
            if (warningTime > this.date) continue;
            if (warningTime < new Date()) continue;

            let job;
            this.scheduleJobs.push(job = schedule.scheduleJob(
                this.scheduleName() + ":" + i,
                warningTime,
                Deadline.deadlineCallback.bind(this, this, message)
            ));
        }
    }

    /**
     * Cancel all the scheduler jobs related to this lecture.
     */
    scheduleJobsDisable() {
        for (const job of this.scheduleJobs) {
            job.cancel(false);
        }
    }
}

/**
 * Represents a lecture.
 */
class Lecture {
    static lectureCallback = () => { console.log("lectureWillStart"); console.log(this); };

    /**
     * Creates a new Lecture object.
     * @param {Course} course The course to assign the course to.
     * @param {string} name The name of the lecture.
     * @param {string} cron The date/time of the lecture in cron syntax.
     * @param {string} location The location of the lecture.
     */
    constructor(course, name, cron, location = "") {
        this.course = course;
        this.name = name;
        this.cron = cron;
        this.location = location;
        this.nonce = (Math.random() * 255) | 0;
        /** @type {schedule.Job} */ this.scheduleJob = undefined;

        this.scheduleJobsEnable();
    }

    /**
     * Destroys and cancels any remaining events related to this object.
     */
    async finish() {
        this.scheduleJobsDisable();
    }

    /**
     * @returns {Date}
     */
    next() {
        return this.scheduleJob.nextInvocation().toDate();
    }

    //
    // serialisation
    //

    toJSON() {
        return {
            course: this.course.name,
            name: this.name,
            cron: this.cron,
            location: this.location
        };
    }

    static fromJSON(courseMap, { course, name, cron, location }) {
        return new Lecture(courseMap[course], name, cron, location);
    }

    //
    // Scheduler handling
    //

    /**
     * Prefix of the scheduled jobs' name.
     */
    scheduleName() {
        return `${this.course.name}:${this.name}:${this.nonce}`;
    }

    /**
     * Set up scheduler events for this lecture.
     */
    scheduleJobsEnable() {
        // set up the job at the scheduled time
        this.scheduleJob = schedule.scheduleJob(
            this.scheduleName(),
            this.cron,
            Lecture.lectureCallback.bind(this, this)
        );
    }

    /**
     * Cancel all the scheduler jobs related to this lecture.
     */
    scheduleJobsDisable() {
        this.scheduleJob.cancel(false);
    }
}

module.exports = exports = Courses;
