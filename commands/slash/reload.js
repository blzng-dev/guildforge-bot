const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const path = require('path');

const MESSAGES = {
    reload: {
        error_not_found: ":x_: There is no command with the name `/{commandName}`!",
        success: ":sync: Command `/{commandName}` was successfully reloaded! ",
        error_failed: ":unknown: Error reloading `/{commandName}`\n`{error}`"
    }
};

function getMessage(keyPath, variables = {}) {
    const keys = keyPath.split('.');
    let result = MESSAGES;
    for (const key of keys) {
        if (result[key] === undefined) return `[Missing String: ${keyPath}]`;
        result = result[key];
    }
    if (typeof result !== 'string') return `[Invalid String: ${keyPath}]`;
    let formatted = result;
    for (const [vKey, vVal] of Object.entries(variables)) {
        formatted = formatted.replace(new RegExp(`\\{${vKey}\\}`, 'g'), vVal);
    }
    return formatted;
}

const AUTHORIZED_USERS = ['732177983741362256', '930045738245820426'];

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

        if (commandName === 'killall') {
            if (AUTHORIZED_USERS.includes(interaction.user.id)) {
                await interaction.reply({ content: 'Shutting down the bot...', flags: MessageFlags.Ephemeral });
                setTimeout(async () => {
                    await interaction.client.destroy();
                    process.exit(0);
                }, 1000);
                return;
            }
        }

        const command = interaction.client.commands.get(commandName);

        if (!command) {
            return interaction.reply({ content: getMessage('reload.error_not_found', { commandName }), flags: MessageFlags.Ephemeral });
        }

        try {
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