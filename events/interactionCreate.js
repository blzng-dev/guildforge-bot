const { Events, MessageFlags } = require('discord.js');
const { getMessage } = require('../utils/messages');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: getMessage('events.interactionCreate.error'), flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: getMessage('events.interactionCreate.error'), flags: MessageFlags.Ephemeral });
            }
        }
    },
};
