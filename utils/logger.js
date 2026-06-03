const { getSetting } = require('./db.js');

/**
 * Logs an action to the configured audit log channel for the guild.
 * @param {import('discord.js').Guild} guild The guild where the action occurred
 * @param {string} actionText The text to log
 */
async function logAction(guild, actionText) {
    if (!guild) return;
    
    try {
        const logChannelId = await getSetting(guild.id, 'auditLogChannel');
        if (!logChannelId) return;

        const channel = guild.channels.cache.get(logChannelId) || await guild.channels.fetch(logChannelId).catch(() => null);
        if (!channel) return;

        const timestamp = `<t:${Math.floor(Date.now() / 1000)}:f>`;
        const formattedLog = `**[Audit Log]** ${timestamp}\n${actionText}`;

        await channel.send({ content: formattedLog });
    } catch (e) {
        console.error(`Failed to send audit log in guild ${guild.id}:`, e);
    }
}

module.exports = { logAction };
