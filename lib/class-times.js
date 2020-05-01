
/*!
 * CoronaBot -- Class times.
 * 
 * Alerts people of upcoming events.
 * 
 *              -- Raresh
 */

const fs = require('fs').promises
const path = require('path')
const schedule = require('node-schedule')
const csvParse = require('csv-parse/lib/sync')
const Discord = require('discord.js')

class ClassTimes {
    /**
     * @param {object} config The configuration object (JSON)
     * @param {Discord.Client} client 
     * @param {object} bot 
     */
    constructor(config, client, bot) {
        this.config = config
        this.client = client
        this.bot = bot

        // warning templates
        this.warnings = {
            5: event => `5 minutes before ${event} is due`,
            15: event => `15 minutes before ${event} is due`,
            30: event => `30 minutes before ${event} is due`,
            60: event => `1 hour before ${event} is due`,
            1440: event => `24 hours before ${event} is due`
        }

        // Discord channels
        this.deadlineChannel = null
        this.lectureTimeChannel = null
        this.initChannels().then(() => {
            this.importData()
        })
    }

    async initChannels() {
        let channels = this.config.classTimes.channels

        this.deadlineChannel = await this.client.channels.fetch(channels.deadlines)
        this.lectureTimeChannel = await this.client.channels.fetch(channels.lectureTimes)
    }

    async importData() {
        //
        // granted, this function isn't very event loop friendly,
        // but for now it's init only 🤷‍♂️
        //

        // load csv data
        let deadlinesRaw    = await fs.readFile(path.join(__dirname, '..', 'data', 'deadlines.csv'))
        let lectureTimesRaw = await fs.readFile(path.join(__dirname, '..', 'data', 'lecture-times.csv'))

        // parse them into js objects
        let deadlinesObj = csvParse(deadlinesRaw, {
            skip_empty_lines: true
        })
        let lectureTimesObj = csvParse(lectureTimesRaw, {
            skip_empty_lines: true
        })

        // create objects for deadlines and lecture times

        this.deadlines = deadlinesObj.map(row => {
            let date = new Date(row[4], row[3] - 1, row[2], row[5], row[6])
            let deadline = new Deadline(row[0], row[1], date)

            let warnTimeCalc = (time, minutes) => {
                const MS_PER_MINUTES = 60000
                return new Date(time - minutes * MS_PER_MINUTES)
            }

            // warning schedule times
            let warningTimes = Object.keys(this.warnings)
            let warningDates = warningTimes.map(time => warnTimeCalc(date, time))

            // schedule the task if it's in the future
            warningTimes.forEach((time, i) => {
                let warning = this.warnings[time]
                let job = schedule.scheduleJob(
                    warningDates[i],
                    ((deadline, warning) => {
                        this.bot.log.log('Deadline happen')

                        let { course, name } = deadline
                        let role = this.getCourseRole(course)
                        let sb = ""

                        if (role !== null) sb += `<@&${role}> - `
                        this.deadlineChannel.send(sb + warning(`${course} / ${name}`))
                    }).bind(this, deadline, warning)
                )

                if (job == null) {
                    this.bot.log.log('CLASSTIMES', `Job for deadline ${deadline.scheduleName()} at ${warningDates[i]} failed to register.`)
                } else {
                    this.bot.log.log('CLASSTIMES', `Job for deadline ${deadline.scheduleName()} at ${warningDates[i]} registered.`)
                }
            })

            return deadline
        })
        this.lectureTimes = lectureTimesObj.map(row => {
            let lectureTime = new LectureTime(row[0], row[1], row[2], row[3])
            let job = schedule.scheduleJob(
                lectureTime.scheduleName(),
                lectureTime.cron,
                ((lectureTime) => {
                    let { course, name, location } = lectureTime
                    let role = this.getCourseRole(course)
                    let sb = ""

                    if (role !== null) sb += `<@&${role}> - `
                    this.lectureTimeChannel.send(sb + `${course} / ${name} will soon start in ${location}`)
                }).bind(this, lectureTime)
            )

            if (job == null) {
                this.bot.log.log('CLASSTIMES', `Job ${lectureTime.scheduleName()} failed to register.`)
            } else {
                this.bot.log.log('CLASSTIMES', `Job ${lectureTime.scheduleName()} registered.`)
            }
        })

        // TODO: lecture times

        this.bot.log.log('CLASSTIMES', `${this.deadlines.length} deadlines loaded.`)
        this.bot.log.log('CLASSTIMES', `${this.lectureTimes.length} lecture times loaded.`)
    }

    getCourseRole(course) {
        let courses = this.config.classTimes.courses
        let thisCourse = courses[course]

        if (typeof thisCourse === 'undefined') return null
        return thisCourse.role
    }

    getUpcomingEvents() {
        return this.deadlines
            .filter(deadline => new Date() < deadline.date)
            .sort((a, b) => a.date - b.date)
    }

    async warn(template, role, event) {
        this.deadlineChannel.send(`<@&${role}> - ${template(event)}`)
    }
}

class Deadline {
    constructor(course, name, date) {
        this.course = course
        this.name = name
        this.date = date
        this.nonce = Math.random() * 255
    }

    scheduleName() {
        return `${this.course}:${this.name}:${this.nonce}`
    }
}

class LectureTime {
    constructor(course, name, cron, location) {
        this.course = course
        this.name = name
        this.cron = cron
        this.location = location
        this.nonce = Math.random() * 255
    }

    scheduleName() {
        return `${this.course}:${this.name}:${this.nonce}`
    }
}

module.exports = exports = ClassTimes
