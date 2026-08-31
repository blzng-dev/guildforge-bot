const { Events } = require('discord.js');
const { fetchApplicationEmojis } = require('../utils/emoji.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        await fetchApplicationEmojis(client);
        console.log(`Ready! Logged in as ${client.user.tag}`);
    },
};
