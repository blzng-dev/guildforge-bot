const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('replies with pong'),
    async execute(interaction) {
        await interaction.reply({ content: 'Pong!', flags: MessageFlags.Ephemeral });
    },
};
