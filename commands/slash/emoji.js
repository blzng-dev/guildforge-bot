const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    MessageFlags,
    EmbedBuilder
} = require('discord.js');
const MESSAGES = {
    emoji: {
        add: {
            error_no_source: ":x_: You must provide at least one source (emoji, attachment, or link).",
            prompt_multiple_sources: "You provided multiple image sources. Which one would you like to use?",
            action_cancelled: ":x_: Action cancelled.",
            processing: ":sync: Processing {type}...",
            error_timeout: ":x_: Confirmation timed out.",
            error_invalid_format: ":x_: Invalid emoji format. Please provide a custom server emoji (like `<:name:id>`).",
            success: ":checkmark: Successfully added emoji {emoji}!",
            error_unknown: ":unknown: Failed to add emoji due to an unknown error.",
            error_slots_full: ":x_: Failed to add emoji: The server has reached the maximum number of emojis in this category.",
            error_too_large: ":x_: Failed to add emoji: The file size is too large (max 256KB).",
            error_invalid_image: ":x_: Failed to add emoji: Invalid image, format, or name."
        },
        list: {
            error_none_found: ":search: No emojis found matching your filter.",
            title_paginated: ":emoji: **Emoji List ({count}) [{current}/{total}]:**\n{content}",
            title_full: ":emoji: **Emoji List ({count}):**\n{content}"
        },
        delete: {
            error_invalid_format: ":x_: Invalid emoji format. Please provide a custom emoji from this server.",
            error_not_found: ":search: The emoji `{name}` was not found in this server.",
            success: ":checkmark: Successfully deleted emoji: `{name}`",
            error_failed: ":unknown: Failed to delete emoji `{name}`. It might belong to Discord or a built-in integration."
        },
        rename: {
            error_invalid_format: ":x_: Invalid emoji format. Please provide a custom emoji from this server.",
            error_not_found: ":search: The emoji `{name}` was not found in this server.",
            success: ":checkmark: Successfully renamed emoji to `{newName}` {emoji}",
            error_failed: ":x_: Failed to rename emoji. It might belong to Discord or a built-in integration."
        },
        info: {
            error_invalid_format: ":x_: Invalid emoji format. Please provide a custom emoji from this server.",
            error_not_found: ":search: The emoji `{name}` was not found in this server."
        },
        bulk: {
            add: {
                error_no_valid: ":x_: No valid custom emojis were found in your input. Please make sure you are using actual server custom emojis.",
                results: ":emoji: **Bulk Emoji Add Results:**\n{successList}{failedList}"
            },
            delete: {
                error_no_valid: ":x_: No valid custom emojis were found in your input. Please make sure you are using actual server custom emojis.",
                results: ":delete: **Bulk Emoji Delete Results:**\n{successList}{failedList}"
            }
        }
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

const parseEmoji = (emojiString) => {
    // Regex to match custom emojis <a:name:id> or <:name:id>
    const regex = /<(a?):([a-zA-Z0-9_]+):([0-9]+)>/;
    const match = emojiString.match(regex);
    if (match) {
        return {
            animated: match[1] === 'a',
            name: match[2],
            id: match[3],
            url: `https://cdn.discordapp.com/emojis/${match[3]}.${match[1] === 'a' ? 'gif' : 'png'}`
        };
    }
    return null;
};

module.exports = {
    category: 'slash',
    data: new SlashCommandBuilder()
        .setName('emoji')
        .setDescription('Manage server emojis')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions)
        .setDMPermission(false)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a new emoji to the server')
                .addStringOption(option => 
                    option.setName('emoji')
                        .setDescription('An existing emoji from any server')
                        .setRequired(false))
                .addStringOption(option => 
                    option.setName('name')
                        .setDescription('Name for the new emoji')
                        .setRequired(false))
                .addAttachmentOption(option => 
                    option.setName('attachment')
                        .setDescription('An image/gif attachment')
                        .setRequired(false))
                .addStringOption(option => 
                    option.setName('link')
                        .setDescription('A direct link to an image/gif')
                        .setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all custom emojis in the server')
                .addStringOption(option => 
                    option.setName('filter')
                        .setDescription('Filter by animated or static emojis')
                        .setRequired(false)
                        .addChoices(
                            { name: 'All Emojis', value: 'all' },
                            { name: 'Animated Only', value: 'animated' },
                            { name: 'Static Only', value: 'static' }
                        ))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete an emoji from the server')
                .addStringOption(option => 
                    option.setName('emoji')
                        .setDescription('The custom emoji to delete')
                        .setRequired(true)
                        .setAutocomplete(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('rename')
                .setDescription('Rename an existing emoji in the server')
                .addStringOption(option => 
                    option.setName('emoji')
                        .setDescription('The custom emoji to rename')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option => 
                    option.setName('new_name')
                        .setDescription('The new name for the emoji')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('View detailed information about an emoji')
                .addStringOption(option => 
                    option.setName('emoji')
                        .setDescription('The custom emoji to view')
                        .setRequired(true)
                        .setAutocomplete(true))
        )
        .addSubcommandGroup(group =>
            group
                .setName('bulk')
                .setDescription('Bulk emoji management')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('add')
                        .setDescription('Add multiple emojis from a string of emojis')
                        .addStringOption(option => 
                            option.setName('emojis')
                                .setDescription('A string containing multiple custom emojis')
                                .setRequired(true))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('delete')
                        .setDescription('Delete multiple emojis from a string of emojis')
                        .addStringOption(option => 
                            option.setName('emojis')
                                .setDescription('A string containing multiple custom emojis')
                                .setRequired(true))
                )
        ),
        
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const group = interaction.options.getSubcommandGroup(false);
        
        if (group === 'bulk') {
            if (subcommand === 'add') {
                await handleBulkAdd(interaction);
            } else if (subcommand === 'delete') {
                await handleBulkDelete(interaction);
            }
        } else {
            if (subcommand === 'add') {
                await handleAdd(interaction);
            } else if (subcommand === 'list') {
                await handleList(interaction);
            } else if (subcommand === 'delete') {
                await handleDelete(interaction);
            } else if (subcommand === 'rename') {
                await handleRename(interaction);
            } else if (subcommand === 'info') {
                await handleInfo(interaction);
            }
        }
    }
};

async function handleAdd(interaction) {
    const inputEmoji = interaction.options.getString('emoji');
    const inputName = interaction.options.getString('name');
    const inputAttachment = interaction.options.getAttachment('attachment');
    const inputLink = interaction.options.getString('link');

    const sources = [];
    if (inputEmoji) sources.push({ type: 'emoji', value: inputEmoji });
    if (inputAttachment) sources.push({ type: 'attachment', value: inputAttachment });
    if (inputLink) sources.push({ type: 'link', value: inputLink });

    if (sources.length === 0) {
        return interaction.reply({ content: getMessage('emoji.add.error_no_source'), flags: MessageFlags.Ephemeral });
    }

    if (sources.length > 1) {
        const row = new ActionRowBuilder();
        for (const source of sources) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`use_${source.type}`)
                    .setLabel(`Use ${source.type.charAt(0).toUpperCase() + source.type.slice(1)}`)
                    .setStyle(ButtonStyle.Primary)
            );
        }
        row.addComponents(
            new ButtonBuilder()
                .setCustomId('cancel_emoji')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger)
        );

        const response = await interaction.reply({ 
            content: getMessage('emoji.add.prompt_multiple_sources'), 
            components: [row],
            flags: MessageFlags.Ephemeral 
        });

        try {
            const confirmation = await response.awaitMessageComponent({ 
                filter: i => i.user.id === interaction.user.id, 
                time: 60000 
            });

            if (confirmation.customId === 'cancel_emoji') {
                return confirmation.update({ content: getMessage('emoji.add.action_cancelled'), components: [] });
            }

            const selectedType = confirmation.customId.replace('use_', '');
            const selectedSource = sources.find(s => s.type === selectedType);
            
            await confirmation.update({ content: getMessage('emoji.add.processing', { type: selectedType }), components: [] });
            await processAddEmoji(interaction, selectedSource, inputName);

        } catch (e) {
            await interaction.editReply({ content: getMessage('emoji.add.error_timeout'), components: [] });
        }
    } else {
        await interaction.deferReply();
        await processAddEmoji(interaction, sources[0], inputName);
    }
}

async function processAddEmoji(interaction, source, providedName) {
    let url = '';
    let emojiName = providedName || 'emoji';

    if (source.type === 'emoji') {
        const parsed = parseEmoji(source.value);
        if (!parsed) {
            const msg = getMessage('emoji.add.error_invalid_format');
            return interaction.editReply({ content: msg });
        }
        url = parsed.url;
        if (!providedName) emojiName = parsed.name;
    } else if (source.type === 'attachment') {
        url = source.value.url;
    } else if (source.type === 'link') {
        url = source.value;
    }

    try {
        const createdEmoji = await interaction.guild.emojis.create({ attachment: url, name: emojiName });
        const successMsg = getMessage('emoji.add.success', { emoji: createdEmoji.toString() });
        await interaction.editReply({ content: successMsg });
    } catch (error) {
        console.error('Error creating emoji:', error);
        let errorMsg = getMessage('emoji.add.error_unknown');
        if (error.code === 30008) {
            errorMsg = getMessage('emoji.add.error_slots_full');
        } else if (error.code === 50035 && error.message && error.message.includes('larger than')) {
            errorMsg = getMessage('emoji.add.error_too_large');
        } else if (error.code === 50035) {
            errorMsg = getMessage('emoji.add.error_invalid_image');
        }
        await interaction.editReply({ content: errorMsg });
    }
}

async function handleList(interaction) {
    await interaction.deferReply();
    const filter = interaction.options.getString('filter') || 'all';
    
    let emojis = interaction.guild.emojis.cache;
    
    if (filter === 'animated') {
        emojis = emojis.filter(e => e.animated);
    } else if (filter === 'static') {
        emojis = emojis.filter(e => !e.animated);
    }
    
    if (emojis.size === 0) {
        return interaction.editReply(getMessage('emoji.list.error_none_found'));
    }
    
    let listText = emojis.map(e => `${e.toString()} - ${e.name}`).join('\n');
    
    if (listText.length > 2000) {
        const lines = listText.split('\n');
        let currentMsg = '';
        const messages = [];
        for (const line of lines) {
            if (currentMsg.length + line.length + 1 > 1900) {
                messages.push(currentMsg);
                currentMsg = line + '\n';
            } else {
                currentMsg += line + '\n';
            }
        }
        if (currentMsg) messages.push(currentMsg);
        
        await interaction.editReply(getMessage('emoji.list.title_paginated', { count: emojis.size, current: 1, total: messages.length, content: messages[0] }));
        for (let i = 1; i < messages.length; i++) {
            await interaction.followUp(getMessage('emoji.list.title_paginated', { count: emojis.size, current: i + 1, total: messages.length, content: messages[i] }));
        }
    } else {
        await interaction.editReply(getMessage('emoji.list.title_full', { count: emojis.size, content: listText }));
    }
}

async function handleDelete(interaction) {
    await interaction.deferReply();
    const inputEmoji = interaction.options.getString('emoji');
    const parsed = parseEmoji(inputEmoji);

    if (!parsed) {
        return interaction.editReply(getMessage('emoji.delete.error_invalid_format'));
    }

    const emojiToDel = interaction.guild.emojis.cache.get(parsed.id);

    if (!emojiToDel) {
        return interaction.editReply(getMessage('emoji.delete.error_not_found', { name: parsed.name }));
    }

    try {
        await emojiToDel.delete();
        await interaction.editReply(getMessage('emoji.delete.success', { name: parsed.name }));
    } catch (error) {
        console.error('Error deleting emoji:', error);
        await interaction.editReply(getMessage('emoji.delete.error_failed', { name: parsed.name }));
    }
}

async function handleRename(interaction) {
    await interaction.deferReply();
    const inputEmoji = interaction.options.getString('emoji');
    const newName = interaction.options.getString('new_name');
    
    const parsed = parseEmoji(inputEmoji);
    if (!parsed) return interaction.editReply(getMessage('emoji.rename.error_invalid_format'));
    
    const emojiToEdit = interaction.guild.emojis.cache.get(parsed.id);
    if (!emojiToEdit) return interaction.editReply(getMessage('emoji.rename.error_not_found', { name: parsed.name }));
    
    try {
        await emojiToEdit.edit({ name: newName });
        await interaction.editReply(getMessage('emoji.rename.success', { newName, emoji: emojiToEdit.toString() }));
    } catch (e) {
        console.error('Error renaming emoji:', e);
        await interaction.editReply(getMessage('emoji.rename.error_failed'));
    }
}

async function handleInfo(interaction) {
    await interaction.deferReply();
    const inputEmoji = interaction.options.getString('emoji');
    
    const parsed = parseEmoji(inputEmoji);
    if (!parsed) return interaction.editReply(getMessage('emoji.info.error_invalid_format'));
    
    const emojiInfo = interaction.guild.emojis.cache.get(parsed.id);
    if (!emojiInfo) return interaction.editReply(getMessage('emoji.info.error_not_found', { name: parsed.name }));
    
    const embed = new EmbedBuilder()
        .setTitle(`Emoji Info: ${emojiInfo.name}`)
        .setThumbnail(emojiInfo.url)
        .addFields(
            { name: 'ID', value: `\`${emojiInfo.id}\``, inline: true },
            { name: 'Animated', value: emojiInfo.animated ? 'Yes' : 'No', inline: true },
            { name: 'Created At', value: `<t:${Math.floor(emojiInfo.createdTimestamp / 1000)}:F>`, inline: false },
            { name: 'Raw Format', value: `\`${emojiInfo.toString()}\``, inline: false }
        )
        .setColor('#2b2d31');

    await interaction.editReply({ embeds: [embed] });
}

async function handleBulkAdd(interaction) {
    await interaction.deferReply();
    const inputEmojis = interaction.options.getString('emojis');
    
    const regex = /<(a?):([a-zA-Z0-9_]+):([0-9]+)>/g;
    const matches = [...inputEmojis.matchAll(regex)];

    if (matches.length === 0) {
        return interaction.editReply(getMessage('emoji.bulk.add.error_no_valid'));
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

        try {
            const createdEmoji = await interaction.guild.emojis.create({ attachment: url, name: name });
            results.success.push(createdEmoji.toString());
        } catch (error) {
            console.error(`Error creating bulk emoji ${name}:`, error);
            let reason = 'Unknown error';
            if (error.code === 30008) reason = 'Server slots full';
            else if (error.code === 50035 && error.message && error.message.includes('larger than')) reason = 'File too large';
            else if (error.code === 50035) reason = 'Invalid format/name';
            
            results.failed.push(`\`${name}\` (${reason})`);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    let successList = '';
    let failedList = '';
    if (results.success.length > 0) {
        successList = `Added (${results.success.length}): ${results.success.join(' ')}\n`;
    }
    if (results.failed.length > 0) {
        failedList = `Failed (${results.failed.length}): ${results.failed.join(', ')}\n`;
    }
    let replyMessage = getMessage('emoji.bulk.add.results', { successList, failedList });

    if (replyMessage.length > 2000) {
        replyMessage = replyMessage.substring(0, 1995) + '...';
    }

    await interaction.editReply(replyMessage);
}

async function handleBulkDelete(interaction) {
    await interaction.deferReply();
    const inputEmojis = interaction.options.getString('emojis');
    
    const regex = /<(a?):([a-zA-Z0-9_]+):([0-9]+)>/g;
    const matches = [...inputEmojis.matchAll(regex)];

    if (matches.length === 0) {
        return interaction.editReply(getMessage('emoji.bulk.delete.error_no_valid'));
    }

    const results = {
        success: [],
        failed: []
    };

    for (const match of matches) {
        const name = match[2];
        const id = match[3];

        const emojiToDel = interaction.guild.emojis.cache.get(id);

        if (!emojiToDel) {
            results.failed.push(`\`${name}\` (Not found in server)`);
            continue;
        }

        try {
            await emojiToDel.delete();
            results.success.push(`\`${name}\``);
        } catch (error) {
            console.error(`Error deleting bulk emoji ${name}:`, error);
            results.failed.push(`\`${name}\` (Unknown error)`);
        }

        await new Promise(resolve => setTimeout(resolve, 500));
    }

    let successList = '';
    let failedList = '';
    if (results.success.length > 0) {
        successList = `Deleted (${results.success.length}): ${results.success.join(', ')}\n`;
    }
    if (results.failed.length > 0) {
        failedList = `Failed (${results.failed.length}): ${results.failed.join(', ')}\n`;
    }
    let replyMessage = getMessage('emoji.bulk.delete.results', { successList, failedList });

    if (replyMessage.length > 2000) {
        replyMessage = replyMessage.substring(0, 1995) + '...';
    }

    await interaction.editReply(replyMessage);
}
