const { MessageFlags } = require('discord.js');

/**
 * Emoji utility for resolving custom application and guild emojis.
 * Converts emoji names like :checkmark: or :x_: to Discord formatted emojis <:name:id> or <a:name:id>.
 */

/**
 * Replace :emoji_name: placeholders in a string with custom/application emojis.
 * @param {string} text 
 * @param {import('discord.js').Client} client 
 * @param {import('discord.js').Guild} [guild] 
 * @returns {string}
 */
function formatEmojisInString(text, client, guild) {
    if (typeof text !== 'string' || !text.includes(':')) return text;

    return text.replace(/(<a?:[a-zA-Z0-9_]+:[0-9]+>)|:([a-zA-Z0-9_]+):/g, (match, customEmoji, name) => {
        // If it's already a full custom emoji (<:name:id> or <a:name:id>), leave it untouched
        if (customEmoji) return customEmoji;

        const lowerName = name.toLowerCase();

        // 1. Search in bot's application emojis cache (up to 2000 application emojis)
        let found = client?.application?.emojis?.cache?.find(
            (e) => e.name?.toLowerCase() === lowerName
        );

        // 2. Search in guild emojis cache
        if (!found && guild?.emojis?.cache) {
            found = guild.emojis.cache.find(
                (e) => e.name?.toLowerCase() === lowerName
            );
        }

        // 3. Search in global client emojis cache
        if (!found && client?.emojis?.cache) {
            found = client.emojis.cache.find(
                (e) => e.name?.toLowerCase() === lowerName
            );
        }

        return found ? found.toString() : match;
    });
}

/**
 * Formats embeds to replace :emoji_name: in title, description, fields, footer, author.
 * @param {object} data 
 * @param {import('discord.js').Client} client 
 * @param {import('discord.js').Guild} [guild] 
 */
function formatEmbedData(data, client, guild) {
    if (!data || typeof data !== 'object') return;
    if (typeof data.title === 'string') {
        data.title = formatEmojisInString(data.title, client, guild);
    }
    if (typeof data.description === 'string') {
        data.description = formatEmojisInString(data.description, client, guild);
    }
    if (data.footer && typeof data.footer.text === 'string') {
        data.footer.text = formatEmojisInString(data.footer.text, client, guild);
    }
    if (data.author && typeof data.author.name === 'string') {
        data.author.name = formatEmojisInString(data.author.name, client, guild);
    }
    if (Array.isArray(data.fields)) {
        for (const field of data.fields) {
            if (field) {
                if (typeof field.name === 'string') {
                    field.name = formatEmojisInString(field.name, client, guild);
                }
                if (typeof field.value === 'string') {
                    field.value = formatEmojisInString(field.value, client, guild);
                }
            }
        }
    }
}

/**
 * Format any interaction / message payload (string, embed, object with content/embeds).
 * Also attaches allowedMentions to disable pinging actual users or roles.
 * @param {any} payload 
 * @param {import('discord.js').Client} client 
 * @param {import('discord.js').Guild} [guild] 
 * @returns {any}
 */
function formatPayload(payload, client, guild) {
    if (!payload) return payload;

    let resPayload = payload;

    if (typeof resPayload === 'string') {
        resPayload = {
            content: formatEmojisInString(resPayload, client, guild),
        };
    } else if (typeof resPayload === 'object') {
        // If payload is an EmbedBuilder or object with .data (without .embeds array)
        if (resPayload.data && typeof resPayload.data === 'object') {
            formatEmbedData(resPayload.data, client, guild);
        }

        // Format content if present
        if (typeof resPayload.content === 'string') {
            resPayload.content = formatEmojisInString(resPayload.content, client, guild);
        }

        // Format embeds array if present
        if (Array.isArray(resPayload.embeds)) {
            for (const embed of resPayload.embeds) {
                if (embed && embed.data) {
                    formatEmbedData(embed.data, client, guild);
                } else if (embed && typeof embed === 'object') {
                    formatEmbedData(embed, client, guild);
                }
            }
        }
    }

    // Disable pinging actual users or roles for all command output payloads
    if (typeof resPayload === 'object' && resPayload !== null) {
        if (!resPayload.allowedMentions) {
            resPayload.allowedMentions = { parse: [], users: [], roles: [], repliedUser: false };
        }
    }

    return resPayload;
}

/**
 * Wrap a message object to ensure its component collectors/awaitMessageComponent also wrap interactions.
 * @param {import('discord.js').Message} message 
 */
function wrapMessage(message) {
    if (!message || message._emojisWrapped) return message;
    message._emojisWrapped = true;

    if (typeof message.awaitMessageComponent === 'function') {
        const origAwait = message.awaitMessageComponent.bind(message);
        message.awaitMessageComponent = async function (...args) {
            const compInteraction = await origAwait(...args);
            return wrapInteraction(compInteraction);
        };
    }

    if (typeof message.createMessageComponentCollector === 'function') {
        const origCollector = message.createMessageComponentCollector.bind(message);
        message.createMessageComponentCollector = function (...args) {
            const collector = origCollector(...args);
            const origOn = collector.on.bind(collector);
            collector.on = function (event, listener) {
                if (event === 'collect') {
                    return origOn('collect', (compInteraction) => {
                        wrapInteraction(compInteraction);
                        return listener(compInteraction);
                    });
                }
                return origOn(event, listener);
            };
            return collector;
        };
    }

    return message;
}

/**
 * Wraps an interaction instance so reply, editReply, followUp, update, and deferReply
 * automatically resolve emojis, disable user/role pings, and respect the 'ephemeral' option (default: true).
 * @param {import('discord.js').BaseInteraction} interaction 
 */
function wrapInteraction(interaction) {
    if (!interaction || interaction._emojisWrapped) return interaction;
    interaction._emojisWrapped = true;

    const client = interaction.client;
    const guild = interaction.guild;

    // Check if the command options specify 'ephemeral' (default: true)
    let isEphemeral = true;
    if (interaction.options && typeof interaction.options.getBoolean === 'function') {
        const ephemOpt = interaction.options.getBoolean('ephemeral');
        if (ephemOpt === false) {
            isEphemeral = false;
        }
    }

    function applyEphemeralSetting(options) {
        if (!options || typeof options !== 'object') return options;
        if (!isEphemeral) {
            if (typeof options.flags === 'number') {
                options.flags &= ~MessageFlags.Ephemeral;
                if (options.flags === 0) delete options.flags;
            }
            options.ephemeral = false;
        } else {
            options.flags = (options.flags || 0) | MessageFlags.Ephemeral;
            options.ephemeral = true;
        }
        return options;
    }

    if (typeof interaction.deferReply === 'function') {
        const origDefer = interaction.deferReply.bind(interaction);
        interaction.deferReply = async function (options = {}) {
            let opts = typeof options === 'object' && options ? { ...options } : {};
            opts = applyEphemeralSetting(opts);
            return await origDefer(opts);
        };
    }

    if (typeof interaction.reply === 'function') {
        const origReply = interaction.reply.bind(interaction);
        interaction.reply = async function (options) {
            let formatted = formatPayload(options, client, guild);
            if (formatted && typeof formatted === 'object') {
                formatted = applyEphemeralSetting(formatted);
            }
            const res = await origReply(formatted);
            return wrapMessage(res);
        };
    }

    if (typeof interaction.editReply === 'function') {
        const origEdit = interaction.editReply.bind(interaction);
        interaction.editReply = async function (options) {
            const res = await origEdit(formatPayload(options, client, guild));
            return wrapMessage(res);
        };
    }

    if (typeof interaction.followUp === 'function') {
        const origFollowUp = interaction.followUp.bind(interaction);
        interaction.followUp = async function (options) {
            let formatted = formatPayload(options, client, guild);
            if (formatted && typeof formatted === 'object') {
                formatted = applyEphemeralSetting(formatted);
            }
            const res = await origFollowUp(formatted);
            return wrapMessage(res);
        };
    }

    if (typeof interaction.update === 'function') {
        const origUpdate = interaction.update.bind(interaction);
        interaction.update = async function (options) {
            const res = await origUpdate(formatPayload(options, client, guild));
            return wrapMessage(res);
        };
    }

    return interaction;
}

/**
 * Fetch and cache all application emojis for the bot client.
 * @param {import('discord.js').Client} client 
 */
async function fetchApplicationEmojis(client) {
    if (client?.application && typeof client.application.emojis?.fetch === 'function') {
        try {
            const emojis = await client.application.emojis.fetch();
            console.log(`[EMOJI] Successfully fetched ${emojis.size} application emojis.`);
            return emojis;
        } catch (err) {
            console.error('[EMOJI] Error fetching application emojis:', err);
        }
    }
}

module.exports = {
    formatEmojisInString,
    formatPayload,
    wrapInteraction,
    wrapMessage,
    fetchApplicationEmojis,
};
