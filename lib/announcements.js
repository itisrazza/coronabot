
/*!
 * CoronaBot -- ECS Mailing List Annoucement Channel
 * 
 * This file forwards messages sent to my mailbox via a
 * mailing list (see targetAddresses).
 * 
 *                  -- Raresh
 */

/*!
 * Announcement channels
 *
 * This file handles the announcement channels, which pipe email announcements
 * sent by ECS staff to students (via my email)
 */

const Discord = require('discord.js')
const ImapClient = require('emailjs-imap-client').default
const simpleParser = require('mailparser').simpleParser

/**
 * These are the mailing lists for members of a certain class.
 * If I receive messages as this email, so does everyone.
 * 
 * Use these to only post relevant messages.
 */
const targetAddresses = [
    'ecs-second-year@ecs.vuw.ac.nz',
    'comp261-class@ecs.vuw.ac.nz',
    'nwen241-class@ecs.vuw.ac.nz',
    'swen221-class@ecs.vuw.ac.nz',
    'engr291-class@ecs.vuw.ac.nz'
]

class Announcements {
    /**
     * 
     * @param {object} config The configuration object (JSON)
     * @param {Discord.Client} client 
     * @param {object} bot 
     */
    constructor(config, client, bot) {
        // fetch config from main
        this.config = config
        this.client = client
        this.bot = bot

        // keep the time
        this.startTime = new Date()

        // get the channel
        client.channels.fetch(config.discord.emailChannel).then(c => {
            this.channel = c;
            // (async () => {
            //     let messages = this.channel.messages
            //     let f = await messages.fetch({ limit: 100 })
            //     for (const message of f) {
            //         message[1].delete()
            //     }
            // })()
        })
        
        // open imap client and connect to it
        this.imapClient = new ImapClient(
            config.email.host, 
            config.email.port, 
            config.email.options
        )
        this.imapClient.connect()
            .then(() => {
                this.bot.log.log('EMAIL', 'Connected to server')
                
                // select the mail box
                this.imapClient.selectMailbox('INBOX').then(mailbox => {
                    this.bot.log.log('EMAIL', 'Got the mailbox')

                    // set up events
                    this.imapClient.onupdate = (path, type, value) => {
                        if (type === 'exists') {
                            console.log(`EMAIL: ${value} exist in ${path}`)
                            this.checkMailbox()
                        } else { 
                            /* the library supports more but i cant be fucked */
                        }
                    }
            
                    // initial mailbox check
                    this.checkMailbox()
                })
            })
            .catch(e => {
                throw e
            })

        // make an array to store hashes of known emails
        // (and to not dupliate things)
        this.pastMailUIDs = []
    }

    async checkMailbox() {
        this.bot.log.log('EMAIL', 'Checking mailbox...')

        // convert the target addresses to a query
        let queries = targetAddresses.map(addr => { return { header: [ 'to', addr ] } } )

        // get the amount of messages in box
        let boxDeets = await this.imapClient.selectMailbox('INBOX')

        // fetch emails
        const blockSize = 10
        let newUids = 0
        for (let i = 1; i <= boxDeets.exists; i += blockSize) {
            let scale = `${i}:${ Math.min(i + blockSize, boxDeets.exists) }`
            let messages = await this.imapClient.listMessages(
                'INBOX',
                scale,
                [ 'uid', 'envelope', 'body[]' ]
            )
            this.bot.log.log('EMAIL', `Downloaded mailbox ${scale}`)
                
            for (const message of messages) {
                // skip if it's too old
                if (Date.parse(message.envelope.date) < this.startTime) continue
    
                // skip if the target is not whitelisted
                let hasEntry = false
                for (const entry of message.envelope.to || [ ]) {
                    hasEntry |= targetAddresses.includes(entry.address)
                }
                if (!hasEntry) continue
    
                // if we've seen the UID before, same... skip it
                if (this.pastMailUIDs.includes(message.uid)) continue
                this.pastMailUIDs.push(message.uid)
                newUids++
    
                // parse the email
                let body = await simpleParser(message['body[]'])
                
                // prep the rich embed
                var richEmbed = new Discord.MessageEmbed()
                    .setColor('#115737')
                    .setTitle(body.subject || "(No Subject)")
                    .setAuthor(body.from.text)
                    .setTimestamp(Date.parse(message.envelope.date))
                    .addField('To', body.to.text)
                    .setDescription(body.text)
                    .setFooter('ECS Mailing List')

                // add a warning for shortened ones
                if (richEmbed.description.length >= 2048) {
                    richEmbed
                        .setColor("#FF0000")
                        .addField("Notice", "Please check your email for full text.")
                        .setDescription(richEmbed.description.substring(0, 2040) + '...')
                }

                this.channel.send(richEmbed).catch(e => console.log('DISCORD: Error ' + e))
            }
        }

        this.bot.log.log('EMAIL', `Done. ${newUids} new entries`)
    }

    /**
     * JavaScript doesn't have deconstructors... oh well.
     */
    destruct() {        
        this.imapClient.close().then(() => {
            this.bot.log.log('EMAIL', 'Connection ended')
        })
    }
}

module.exports = Announcements