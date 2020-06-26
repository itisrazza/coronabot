
/*!
 * CoronaBot -- Course Aide
 *
 * This module will eventually replace the current `class-times` module to make
 * loading and saving uni-related events simpler.
 * 
 * A data race or collision would be catastrophic, but oh well, this is why we
 * have the commit and reload functions. 🤷‍♂️
 */

const Discord = require("discord.js");

class Courses {
    /**
     * @param {object} config The configuration object (JSON)
     * @param {Discord.Client} client 
     * @param {object} bot 
     */
    constructor(config, client, bot) {
        this.config = config;
        this.client = client;
        this.bot = bot;

        // create arrays to store all this
        this.courses = { "Everyone": new Course("Everyone", ) };
        /** @type {Deadline[]} */ this.deadlines = [];
        /** @type {Lecture[]}  */ this.lectures = [];
    }

    /**
     * @access private
     * Initlialise channels
     */
    async initChannels() {
        // TODO: load channels
    }

    //
    // convenience getters
    // 

    //
    // course management
    //

    /**
     * Loads the courses from disk to memory.
     */
    async coursesReload() {

    }

    /**
     * Writes the courses in memory to disk.
     */
    async coursesCommit() {

    }

    /**
     * Adds a new course.
     * @argument {string} name The name for the course.
     * @argument {string | Discord.Role} role The role for the course.
     */
    async coursesAdd(name, role) {

    }

    /**
     * Removes the course and all deadlines and courses associated with it.
     * @argument {string} name The name of the course.
     */
    async coursesRemove(name) {
        
    }

    //
    // deadline management
    //

    /**
     * Loads the deadlines from disk to memory.
     */
    async deadlinesReload() {

    }

    /**
     * Writes the deadlines in memory to disk.
     */
    async deadlinesCommit() {

    }

    /**
     * Adds a new deadline.
     * @argument {string} course The course the deadline is for.
     * @argument {string} name The name of the deadline.
     * @argument {Date} date The date and time the deadline is going to occur.
     */
    async deadlinesAdd(course, name, date) {
        
    }
    
    /**
     * Removes the course and all deadlines and courses associated with it.
     * @argument {number} index The index of the course in `deadlines`.
     */
    async deadlinesRemove(index) {

    }

    //
    // lecture management
    //

    /**
     * Loads the deadlines from disk to memory.
     */
    async lectureReload() {

    }

    /**
     * Writes the courses in memory to disk.
     */
    async lecturesCommit() {

    }

    //
    // helpers
    //

    /**
     * The the course object belonging to the name.
     * @param {string} name The name of the course.
     */
    async getCourse(name) {

    }
}

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

class Deadline {
    // TODO
}

class Lecture {
    // TODO
}

module.exports = exports = Courses;
