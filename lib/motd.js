
/*!
 * CoronaBot -- Message of the Day.
 * 
 * You know the bit where is says "Playing" or "Watching" something?
 * This updates that bit every hour or so...
 * 
 *                  -- Raresh
 */

const fs = require('fs')
const path = require('path')

class Motd {
    /**
     * @param {object} config The configuration object (JSON)
     * @param {Discord.Client} client 
     * @param {object} bot 
     */
    constructor(config, client, bot) {
        this.config = config
        this.client = client
        this.bot = bot

        this.activities = JSON.parse(fs.readFileSync(
            path.join(__dirname, '..', 'data', 'motd.json')
        ))
        this.updateInterval = setInterval(() => this.updateActivity(), this.config.motd.interval)
        this.updateActivity()
    }

    async updateActivity() {
        let whichActivity = (Math.random() * this.activities.length) | 0
        let activity = this.activities[whichActivity];
        await this.client.user.setPresence({ activity })
    }
}

module.exports = exports = Motd
