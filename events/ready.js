const { Events } = require('discord.js');
const { setClient } = require('../utils/messages');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        setClient(client);
        console.log(`Ready! Logged in as ${client.user.tag}`);
    },
};
