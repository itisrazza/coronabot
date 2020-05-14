
/*!
 * CoronaBot -- Secret Voice Chat
 *
 * For the times when you don't want to be dropped in by @time.
 */

const Discord = require("discord.js")

/**
 * A bot module which handles secret chat rooms
 */
class SecretChat {
    static MAX_SECRET_ROOMS = 10;   // set the default to 10 until config.json kicks in

    /**
     * Instantiates the SecretChat module
     * @param {object} config Configuration object
     * @param {Discord.Client} client Discord.js client
     * @param {object} bot Bot object
     */
    constructor(config, client, bot) {
        this.config = config;
        this.client = client;
        this.bot = bot;

        // fetch max rooms from config
        this.MAX_SECRET_ROOMS = this.config.secretChat.maxRooms;

        // setup secret room
        SecretRoom.secretChat = this;
        SecretRoom.config = this.config;
        SecretRoom.bot = this.bot;

        // users and their secret chat rooms
        this.users = { }    // object mapping users to their rooms
        this.rooms = [ ]    // array of rooms

        // get references to discord master channels
        this.masterText = null;
        this.masterVoice = null;
        this.getDiscordResources();
    }

    async getDiscordResources() {
        // fetch the channel IDs from config
        let masterTextID = this.config.secretChat.masterChannel.text;
        let masterVoiceID = this.config.secretChat.masterChannel.voice;

        // fetch the channel objects from the server
        this.masterText = await this.client.channels.fetch(masterTextID);
        this.masterVoice = await this.client.channels.fetch(masterVoiceID);
    }

    /**
     * Creates a new room for the user
     * @param {Discord.User} user The user to own the room
     * @returns {string | undefined} On failure, a string with an error message is returned
     */
    createRoom(user) {
        // maximum occupancy
        if (this.rooms.length >= MAX_SECRET_ROOMS) {
            return "All of the secret rooms are occupied. Try again later.";
        } 

        // create a new secret room for the user
        let room = new SecretRoom(user);

        // keep track of it
        this.rooms.push(room);
        this.users[user] = room;
    }

    /**
     * Invites an invitee to the room the user belongs
     * @param {Discord.User} user The user who owns the room
     * @param {Discord.User} invitee The user to invite
     * @returns {string | undefined} On failure, a string with an error message is returned
     */
    inviteToRoom(user, invitee) {
        // get the user's room
        let room = this.users[user.id];
        if (!(room instanceof SecretRoom)) {
            return "You need to create a room first with `!secretroom`";
        }

        // invite the user to said room
        room.invite(invitee);
    }

    /**
     * Removes an invitee from the room the user belongs 
     * @param {Discord.User} user The user who owns the room
     * @param {Discord.User} invitee The user to remove
     */
    removeFromRoom(user, invitee) {
        // get the user's room
        let room = this.users[user.id];
        if (!(room instanceof SecretRoom)) {
            return "You need to create a room first with `!secretroom`";
        }

        // remove the user from the room
        room.remove(invitee);
    }

    /**
     * Closes the room the user belongs
     * @param {Discord.User} user The user who owns the room
     */
    closeRoom(user) {
        // get the user's room
        let room = this.users[user.id];
        if (!(room instanceof SecretRoom)) {
            return "You need to create a room first with `!secretroom`";
        }

        // remove the user from the room
        room.close();
    }

    /**
     * Removes the closing room from the array
     * @param {SecretRoom} room Secret Room
     */
    closeRoom_handler(room) {
        // remove the user from users map
        this.users[room.owner] = undefined;

        // remove this room from the array
        let roomIndex = this.rooms.indexOf(room);
        if (roomIndex < 0) {
            // we're done
            return
        }
        this.rooms.splice(roomIndex, 1);
    }
}

class SecretRoom {
    /** @type {SecretChat} */
    static secretChat = null;
    static bot = null;
    static config = null;

    /**
     * Creates a new secret room
     * @param {Discord.User} user The user to own the room
     */
    constructor(user) {
        // copy down the references to module, bot object and config
        this.secretChat = SecretRoom.secretChat;
        this.bot = SecretRoom.bot;
        this.config = SecretRoom.config;

        // save local variables
        this.client = user.client;
        this.owner = user;
        this.invitees = [ ];
        this.voiceChannel = null;
        this.textChannel = null;
        
        // 
        this.getDiscordResources();
    }

    /**
     * Creates the room within Discord
     */
    async getDiscordResources() {
        // 
    }

    /**
     * Invites user to the secret room
     * @param {Discord.User} user Invitee
     */
    async invite(user) {
        
    }

    /**
     * Removes the user from the secret room
     * @param {Discord.User} user User
     */
    async remove(user) {

    }

    /**
     * Closes the secret chat room
     */
    async close() {


        // remove the room from manager
        this.secretChat.closeRoom_handler(this);
    }
}

module.exports = exports = SecretChat
