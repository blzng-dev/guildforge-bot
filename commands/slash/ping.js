const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getMessage } = require('../../utils/messages');

module.exports = {
    category: 'slash',
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('replies with pong'),
    async execute(interaction) {
        await interaction.reply({ content: getMessage('ping.success'), flags: MessageFlags.Ephemeral });
    },
};
