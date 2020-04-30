
/*!
 * CoronaBot -- Command Processor
 *
 * ＡＬＬ　ＹＯＵＲ　ＣＯＭＭＡＮＤＳ　ＡＲＥ　ＢＥＬＯＮＧ　ＴＯ　ＵＳ．
 * Listens in on the commands from the #bots channel and executes them.
 */

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
    }
}

module.exports = exports = CommandProcessor
