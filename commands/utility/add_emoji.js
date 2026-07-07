const { ContextMenuCommandBuilder, ApplicationCommandType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    category: 'utility',
    data: new ContextMenuCommandBuilder()
        .setName('Add Emoji')
        .setType(ApplicationCommandType.Message)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions)
        .setDMPermission(false),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const message = interaction.targetMessage;
        const content = message.content;
        
        // Regex to match custom emojis
        const regex = /<(a?):([a-zA-Z0-9_]+):([0-9]+)>/g;
        const matches = [...content.matchAll(regex)];

        if (matches.length === 0) {
            return interaction.editReply('No custom emojis found in this message.');
        }

        const results = {
            success: [],
            failed: []
        };

        for (const match of matches) {
            const animated = match[1] === 'a';
            const name = match[2];
            const id = match[3];
            const url = `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}`;

            // Check if emoji already exists in server by ID
            if (interaction.guild.emojis.cache.has(id)) {
                results.failed.push(`\`${name}\` (Already in server)`);
                continue;
            }

            try {
                const createdEmoji = await interaction.guild.emojis.create({ attachment: url, name: name });
                results.success.push(createdEmoji.toString());
            } catch (error) {
                console.error(`Error adding emoji ${name}:`, error);
                let reason = 'Unknown error';
                if (error.code === 30008) reason = 'Server slots full';
                else if (error.code === 50035 && error.message && error.message.includes('larger than')) reason = 'File too large';
                else if (error.code === 50035) reason = 'Invalid format/name';
                
                results.failed.push(`\`${name}\` (${reason})`);
            }

            // Delay to prevent hitting Discord rate limits (1 second)
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        let replyMessage = `**Emoji Add Results:**\n`;
        if (results.success.length > 0) {
            replyMessage += `✅ Added (${results.success.length}): ${results.success.join(' ')}\n`;
        }
        if (results.failed.length > 0) {
            replyMessage += `❌ Failed (${results.failed.length}): ${results.failed.join(', ')}\n`;
        }

        if (replyMessage.length > 2000) {
            replyMessage = replyMessage.substring(0, 1995) + '...';
        }

        await interaction.editReply(replyMessage);
    },
};
