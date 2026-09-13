const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { logAction } = require('../../utils/logger.js');
const { setTimeout: wait } = require('node:timers/promises');

// Discord Epoch for Snowflake conversion
const DISCORD_EPOCH = 1420070400000n;
function parseToSnowflake(input) {
    if (!input) return null;
    if (/^\d{17,20}$/.test(input)) return input; // Already a snowflake
    const date = new Date(input);
    if (!isNaN(date.getTime())) {
        return ((BigInt(date.getTime()) - DISCORD_EPOCH) << 22n).toString();
    }
    return null; // Invalid
}

function wildcardToRegex(pattern) {
    // Escape regex characters except *, then replace * with .*
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    return new RegExp('^.*' + escaped.replace(/\*/g, '.*') + '.*$', 'i');
}

module.exports = {
    category: 'slash',
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Advanced message purge with filters')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
        .setDMPermission(false)
        .addIntegerOption(option => 
            option.setName('count')
                .setDescription('Number of matching messages to delete (max 1000). Defaults to all matches in last 14 days.')
                .setMinValue(1)
                .setMaxValue(1000)
                .setRequired(false)
        )
        .addStringOption(option => 
            option.setName('keyword')
                .setDescription('Text to search for (supports * wildcards, case-insensitive)')
                .setRequired(false)
        )
        .addStringOption(option => 
            option.setName('regex')
                .setDescription('Advanced regular expression to match')
                .setRequired(false)
        )
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Target messages from a specific user')
                .setRequired(false)
        )
        .addRoleOption(option => 
            option.setName('role')
                .setDescription('Target messages from users with this role')
                .setRequired(false)
        )
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('Target channel (defaults to current channel)')
                .setRequired(false)
        )
        .addBooleanOption(option => 
            option.setName('pinned')
                .setDescription('Include pinned messages? (Default: False)')
                .setRequired(false)
        )
        .addStringOption(option => 
            option.setName('before')
                .setDescription('Message ID or Date to scan before')
                .setRequired(false)
        )
        .addStringOption(option => 
            option.setName('after')
                .setDescription('Message ID or Date to scan after')
                .setRequired(false)
        ),
    
    async execute(interaction) {
        // Permission Check
        if (!interaction.memberPermissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: "You do not have permission to manage messages.", flags: MessageFlags.Ephemeral });
        }
        
        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
        
        if (!targetChannel.isTextBased()) {
            return interaction.reply({ content: "Please select a text-based channel.", flags: MessageFlags.Ephemeral });
        }

        const botPermissions = targetChannel.permissionsFor(interaction.client.user);
        if (!botPermissions || !botPermissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: "I do not have Manage Messages permission in that channel.", flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Parsing Options
        const inputCount = interaction.options.getInteger('count');
        const inputKeyword = interaction.options.getString('keyword');
        const inputRegex = interaction.options.getString('regex');
        const targetUser = interaction.options.getUser('user');
        const targetRole = interaction.options.getRole('role');
        const includePinned = interaction.options.getBoolean('pinned') || false;
        
        let beforeSnowflake = parseToSnowflake(interaction.options.getString('before'));
        let afterSnowflake = parseToSnowflake(interaction.options.getString('after'));

        let targetCount = inputCount;
        const SAFETY_SCAN_LIMIT = 5000; 

        // Apply defaults if count is not provided
        if (targetCount === null) {
            targetCount = 1000; // max allowed deletions
            // If neither 'after' nor 'before' were specified, default 'after' to 14 days ago
            if (!afterSnowflake && !beforeSnowflake) {
                afterSnowflake = parseToSnowflake(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());
            }
        }

        let keywordPattern = null;
        if (inputKeyword) {
            keywordPattern = wildcardToRegex(inputKeyword);
        }

        let customRegexPattern = null;
        if (inputRegex) {
            try {
                customRegexPattern = new RegExp(inputRegex, 'i');
            } catch (e) {
                return interaction.editReply({ content: `Invalid regex pattern provided: \`${e.message}\`` });
            }
        }

        const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
        
        let lastId = beforeSnowflake;
        let scannedCount = 0;
        let matchesToBulkDelete = [];
        let matchesToManualDelete = [];
        let deletedCount = 0;
        let manualFailedCount = 0;

        while (scannedCount < SAFETY_SCAN_LIMIT && (matchesToBulkDelete.length + matchesToManualDelete.length) < targetCount) {
            const fetchOptions = { limit: 100 };
            if (lastId) fetchOptions.before = lastId;

            const messages = await targetChannel.messages.fetch(fetchOptions).catch(() => null);
            if (!messages || messages.size === 0) break; // End of history

            for (const message of messages.values()) {
                scannedCount++;
                lastId = message.id;

                // Stop if we hit the 'after' boundary
                if (afterSnowflake && message.id <= afterSnowflake) {
                    scannedCount = SAFETY_SCAN_LIMIT; // Break outer loop
                    break; 
                }

                if ((matchesToBulkDelete.length + matchesToManualDelete.length) >= targetCount) {
                    break;
                }

                // 1. Pinned Filter
                if (!includePinned && message.pinned) continue;
                
                // 2. User Filter
                if (targetUser && message.author.id !== targetUser.id) continue;
                
                // 3. Role Filter
                if (targetRole && message.member && !message.member.roles.cache.has(targetRole.id)) continue;
                
                // 4. Keyword Filter
                if (keywordPattern && !keywordPattern.test(message.content)) continue;
                
                // 5. Regex Filter
                if (customRegexPattern && !customRegexPattern.test(message.content)) continue;

                // Match found!
                if (message.createdTimestamp > fourteenDaysAgo) {
                    matchesToBulkDelete.push(message);
                } else {
                    matchesToManualDelete.push(message);
                }
            }
        }

        let totalFound = matchesToBulkDelete.length + matchesToManualDelete.length;
        
        if (totalFound === 0) {
            return interaction.editReply({ content: `Scanned ${scannedCount} messages. Found no messages matching your criteria.` });
        }

        // --- Execute Deletions ---
        await interaction.editReply({ content: `Scanned ${scannedCount} messages. Found ${totalFound} matches. Deleting now... (This may take a moment for older messages)` });

        // Bulk Delete (Recent Messages)
        if (matchesToBulkDelete.length > 0) {
            // channel.bulkDelete handles arrays up to 100, but let's chunk it just to be safe
            for (let i = 0; i < matchesToBulkDelete.length; i += 100) {
                const chunk = matchesToBulkDelete.slice(i, i + 100);
                try {
                    await targetChannel.bulkDelete(chunk, true);
                    deletedCount += chunk.length;
                } catch (e) {
                    console.error("Bulk delete error:", e);
                }
            }
        }

        // Manual Delete (Old Messages)
        if (matchesToManualDelete.length > 0) {
            for (const message of matchesToManualDelete) {
                try {
                    await message.delete();
                    deletedCount++;
                    // Rate limit delay (Discord allows ~5 per 5s typically, 1.2s is very safe)
                    await wait(1200); 
                } catch (e) {
                    console.error(`Failed to manually delete ${message.id}:`, e);
                    manualFailedCount++;
                }
            }
        }

        const summary = `**Purge Complete**\n` +
            `- **Scanned**: ${scannedCount} messages\n` +
            `- **Deleted**: ${deletedCount} matches\n` +
            (manualFailedCount > 0 ? `- **Failed**: ${manualFailedCount}\n` : '') +
            `- **Older than 14d**: ${matchesToManualDelete.length} (Processed individually)`;

        await interaction.editReply({ content: summary });

        // Log to audit
        const logContent = `**Moderation Action: Deep Purge**\n` +
            `* **Moderator:** ${interaction.user.tag}\n` +
            `* **Channel:** <#${targetChannel.id}>\n` +
            `* **Filters Used:** \n` +
            (inputKeyword ? `  - Keyword: \`${inputKeyword}\`\n` : '') +
            (inputRegex ? `  - Regex: \`${inputRegex}\`\n` : '') +
            (targetUser ? `  - User: <@${targetUser.id}>\n` : '') +
            (targetRole ? `  - Role: <@&${targetRole.id}>\n` : '') +
            (inputCount ? `  - Count Limit: ${inputCount}\n` : '') +
            `* **Result:** Deleted ${deletedCount} messages.`;
            
        await logAction(interaction.guild, logContent);
    },
};
