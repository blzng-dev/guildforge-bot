const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const path = require('path');
const { getMessage } = require('../../utils/messages');

module.exports = {
    category: 'slash',
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('reloads a command')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('the command to reload')
                .setRequired(true)),
    async execute(interaction) {
        const commandName = interaction.options.getString('command', true).toLowerCase();
        const command = interaction.client.commands.get(commandName);

        if (!command) {
            return interaction.reply({ content: getMessage('reload.error_not_found', { commandName }), flags: MessageFlags.Ephemeral });
        }

        try {
            // Correct path for commands under 'commands/utility'
            const commandPath = path.join(__dirname, `${command.data.name}.js`);

            // Delete from cache
            delete require.cache[require.resolve(commandPath)];

            // Reload the command
            const newCommand = require(commandPath);
            interaction.client.commands.set(newCommand.data.name, newCommand);

            await interaction.reply({ content: getMessage('reload.success', { commandName: newCommand.data.name }), flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: getMessage('reload.error_failed', { commandName: commandName, error: error.message }), flags: MessageFlags.Ephemeral });
        }
    },
};