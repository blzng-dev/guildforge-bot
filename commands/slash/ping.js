const { SlashCommandBuilder, MessageFlags } = require('discord.js');

const MESSAGES = {
    ping: {
        success: ":status: Pong!"
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

module.exports = {
    category: 'slash',
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('replies with pong')
        .addBooleanOption(option =>
            option.setName('ephemeral')
                .setDescription('Whether the response should be ephemeral (default: true)')
                .setRequired(false)),
    async execute(interaction) {
        await interaction.reply({ content: getMessage('ping.success'), flags: MessageFlags.Ephemeral });
    },
};
