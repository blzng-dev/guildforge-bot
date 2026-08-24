const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        if (client.application && typeof client.application.emojis?.fetch === 'function') {
            client.application.emojis.fetch().catch(console.error);
        }
        console.log(`Ready! Logged in as ${client.user.tag}`);
    },
};
