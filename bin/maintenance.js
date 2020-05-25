
const Discord = require('discord.js');
const client = new Discord.Client();

const config = require('../lib/config');
const apiKey = config.discord.token;

client.on('ready', () => {
    // we're online
    
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setStatus('away');
    client.user.setPresence({
        activity: {
            name: `** MAINTENANCE MODE -- Coronabot is unavailable. Check again later. **`,
            type: 'PLAYING'
        }
    });
});

// login
client
    .login(apiKey)
    .then(val => {
        console.log("Logged in successfully!");
    })
    .catch(e => {
        console.error("Failed to log in: " + e);
        process.exit(1);
    });

