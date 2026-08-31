const {
    SlashCommandBuilder,
    ChannelType,
    PermissionsBitField,
    MessageFlags,
    EmbedBuilder,
    ForumLayoutType,
    SortOrderType,
} = require("discord.js");
const { setTimeout: wait } = require("node:timers/promises");
const { confirmAction } = require("../../utils/confirm.js");
const { InteractiveProgress } = require("../../utils/progress.js");
const { logAction } = require("../../utils/logger.js");

const MESSAGES = {
    forum: {
        error_no_permission: ":x_: You do not have permission to manage forum channels.",
        error_invalid_channel: ":x_: Please select a valid Forum Channel.",
        error_invalid_post: ":x_: Please specify a forum post or run this command inside a forum post.",
        error_tag_not_found: ":x_: Tag `{tag}` was not found in forum <#{channelId}>.",
        error_tag_exists: ":x_: A tag named `{tag}` already exists in <#{channelId}>.",
        error_tag_limit: ":x_: Maximum tag limit (20 tags) reached for <#{channelId}>.",
        tag_added: ":checkmark: Added tag **{tag}** {emoji} to <#{channelId}>.",
        tag_removed: ":checkmark: Removed tag **{tag}** from <#{channelId}>.",
        tags_list_title: ":tag: Tags for #{channelName}",
        tags_none: ":search: No tags configured in this forum channel.",
        config_updated: ":checkmark: Updated forum settings for <#{channelId}>:\n{details}",
        guidelines_updated: ":checkmark: Updated posting guidelines for <#{channelId}>.",
        post_closed: ":checkmark: Closed post **{title}** (<#{id}>).",
        post_opened: ":checkmark: Opened/unarchived post **{title}** (<#{id}>).",
        post_locked: ":checkmark: Locked post **{title}** (<#{id}>).",
        post_unlocked: ":checkmark: Unlocked post **{title}** (<#{id}>).",
        post_pinned: ":checkmark: Pinned post **{title}** (<#{id}>).",
        post_unpinned: ":checkmark: Unpinned post **{title}** (<#{id}>).",
        post_tag_added: ":checkmark: Added tag **{tag}** to post **{title}**.",
        post_tag_removed: ":checkmark: Removed tag **{tag}** from post **{title}**.",
        post_tag_limit: ":x_: A post can have at most 5 tags applied.",
        bulk_none_found: ":search: No matching posts found in <#{channelId}> for this operation.",
        bulk_confirm_close: "Are you sure you want to **close (archive)** **{count}** post(s) in <#{channelId}>?{filterText}",
        bulk_confirm_open: "Are you sure you want to **open (unarchive)** **{count}** post(s) in <#{channelId}>?{filterText}",
        bulk_confirm_lock: "Are you sure you want to **lock** **{count}** post(s) in <#{channelId}>?{filterText}",
        bulk_confirm_unlock: "Are you sure you want to **unlock** **{count}** post(s) in <#{channelId}>?{filterText}",
        bulk_confirm_tag: "Are you sure you want to add tag **{tag}** to **{count}** post(s) in <#{channelId}>?{filterText}",
        bulk_finish: ":checkmark: Finished processing **{count}** posts in <#{channelId}>.",
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

/**
 * Parses user emoji input into an emoji object for Discord API tags and default reaction.
 * @param {string} input 
 * @param {import('discord.js').Guild} guild 
 */
function parseEmojiInput(input, guild) {
    if (!input) return null;
    const trimmed = input.trim();
    
    // Custom emoji pattern <:name:1234567890> or <a:name:1234567890>
    const customMatch = trimmed.match(/<a?:([a-zA-Z0-9_]+):(\d+)>/);
    if (customMatch) {
        return { emojiId: customMatch[2], emojiName: null };
    }
    // Raw numeric ID
    if (/^\d{17,20}$/.test(trimmed)) {
        return { emojiId: trimmed, emojiName: null };
    }
    // Search guild emojis by name
    if (guild) {
        const guildEmoji = guild.emojis.cache.find(
            (e) => e.name.toLowerCase() === trimmed.toLowerCase() || e.toString() === trimmed
        );
        if (guildEmoji) {
            return { emojiId: guildEmoji.id, emojiName: null };
        }
    }
    // Standard unicode emoji
    return { emojiId: null, emojiName: trimmed };
}

/**
 * Formats a tag's emoji for display.
 * @param {object} emojiObj 
 * @param {import('discord.js').Client} client 
 */
function formatTagEmoji(emojiObj, client) {
    if (!emojiObj) return "";
    if (emojiObj.id || emojiObj.emojiId) {
        const id = emojiObj.id || emojiObj.emojiId;
        const cached = client.emojis.cache.get(id);
        return cached ? cached.toString() : `<:emoji:${id}>`;
    }
    return emojiObj.name || emojiObj.emojiName || "";
}

/**
 * Paginates through all archived threads for a forum channel.
 * @param {import('discord.js').ForumChannel} channel 
 * @returns {Promise<import('discord.js').ThreadChannel[]>}
 */
async function fetchAllArchivedThreads(channel) {
    const allArchived = [];
    let before = undefined;
    while (true) {
        const res = await channel.threads.fetchArchived({ limit: 100, before }).catch((err) => {
            console.error("Error fetching archived threads:", err);
            return null;
        });
        if (!res || !res.threads || res.threads.size === 0) break;
        allArchived.push(...res.threads.values());
        if (!res.hasMore) break;
        const last = res.threads.last();
        before = last?.archivedAt || last?.archiveTimestamp || last?.id;
    }
    return allArchived;
}

/**
 * Fetches all posts (both active and archived) for a forum channel.
 * @param {import('discord.js').ForumChannel} channel 
 * @returns {Promise<import('discord.js').ThreadChannel[]>}
 */
async function fetchAllForumPosts(channel) {
    const activeRes = await channel.threads.fetchActive().catch(() => null);
    const active = activeRes ? Array.from(activeRes.threads.values()) : [];
    const archived = await fetchAllArchivedThreads(channel);

    const postMap = new Map();
    for (const post of [...active, ...archived]) {
        postMap.set(post.id, post);
    }
    return Array.from(postMap.values());
}

/**
 * Resolves the target forum post / thread from options or current channel.
 * @param {import('discord.js').CommandInteraction} interaction 
 * @param {import('discord.js').ThreadChannel} postOption 
 */
function resolveForumPost(interaction, postOption) {
    if (postOption) {
        if (postOption.isThread() && postOption.parent?.type === ChannelType.GuildForum) {
            return postOption;
        }
        return null;
    }

    if (interaction.channel?.isThread() && interaction.channel.parent?.type === ChannelType.GuildForum) {
        return interaction.channel;
    }

    return null;
}

module.exports = {
    category: "slash",
    data: new SlashCommandBuilder()
        .setName("forum")
        .setDescription("manage forum channels, tags, posts, and bulk operations")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)

        // ==========================================
        // SUBCOMMAND GROUP: TAG
        // ==========================================
        .addSubcommandGroup((group) =>
            group
                .setName("tag")
                .setDescription("manage forum tags")
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("add")
                        .setDescription("add a tag to a forum channel")
                        .addChannelOption((option) =>
                            option
                                .setName("channel")
                                .setDescription("the forum channel")
                                .setRequired(true)
                                .addChannelTypes(ChannelType.GuildForum)
                        )
                        .addStringOption((option) =>
                            option
                                .setName("name")
                                .setDescription("tag name (up to 20 characters)")
                                .setMaxLength(20)
                                .setRequired(true)
                        )
                        .addStringOption((option) =>
                            option
                                .setName("emoji")
                                .setDescription("emoji for the tag (unicode or custom emoji)")
                                .setRequired(false)
                        )
                        .addBooleanOption((option) =>
                            option
                                .setName("moderated")
                                .setDescription("only moderators can apply this tag (default false)")
                                .setRequired(false)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("remove")
                        .setDescription("remove a tag from a forum channel")
                        .addChannelOption((option) =>
                            option
                                .setName("channel")
                                .setDescription("the forum channel")
                                .setRequired(true)
                                .addChannelTypes(ChannelType.GuildForum)
                        )
                        .addStringOption((option) =>
                            option
                                .setName("tag")
                                .setDescription("tag to remove")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("list")
                        .setDescription("list all tags in a forum channel")
                        .addChannelOption((option) =>
                            option
                                .setName("channel")
                                .setDescription("the forum channel")
                                .setRequired(true)
                                .addChannelTypes(ChannelType.GuildForum)
                        )
                )
        )

        // ==========================================
        // SUBCOMMAND GROUP: CONFIG
        // ==========================================
        .addSubcommandGroup((group) =>
            group
                .setName("config")
                .setDescription("manage forum channel settings")
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("set")
                        .setDescription("configure layout, sort order, default reaction, or tag requirement")
                        .addChannelOption((option) =>
                            option
                                .setName("channel")
                                .setDescription("the forum channel")
                                .setRequired(true)
                                .addChannelTypes(ChannelType.GuildForum)
                        )
                        .addIntegerOption((option) =>
                            option
                                .setName("layout")
                                .setDescription("default forum layout view")
                                .setRequired(false)
                                .addChoices(
                                    { name: "List View", value: ForumLayoutType.ListView },
                                    { name: "Gallery / Grid View", value: ForumLayoutType.GalleryView }
                                )
                        )
                        .addIntegerOption((option) =>
                            option
                                .setName("sort_order")
                                .setDescription("default sort order for posts")
                                .setRequired(false)
                                .addChoices(
                                    { name: "Latest Activity", value: SortOrderType.LatestActivity },
                                    { name: "Creation Date", value: SortOrderType.CreationDate }
                                )
                        )
                        .addStringOption((option) =>
                            option
                                .setName("default_reaction")
                                .setDescription("default emoji reaction for new posts (e.g. 👍 or custom emoji)")
                                .setRequired(false)
                        )
                        .addBooleanOption((option) =>
                            option
                                .setName("require_tag")
                                .setDescription("require users to select at least one tag before posting")
                                .setRequired(false)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("guidelines")
                        .setDescription("set or update forum posting guidelines / topic")
                        .addChannelOption((option) =>
                            option
                                .setName("channel")
                                .setDescription("the forum channel")
                                .setRequired(true)
                                .addChannelTypes(ChannelType.GuildForum)
                        )
                        .addStringOption((option) =>
                            option
                                .setName("text")
                                .setDescription("the guidelines text (channel topic)")
                                .setMaxLength(4096)
                                .setRequired(true)
                        )
                )
        )

        // ==========================================
        // SUBCOMMAND GROUP: POST
        // ==========================================
        .addSubcommandGroup((group) =>
            group
                .setName("post")
                .setDescription("manage individual forum posts / threads")
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("close")
                        .setDescription("close (archive) a forum post")
                        .addChannelOption((option) =>
                            option
                                .setName("post")
                                .setDescription("the forum post to close (defaults to current post)")
                                .setRequired(false)
                                .addChannelTypes(ChannelType.PublicThread, ChannelType.PrivateThread)
                        )
                        .addBooleanOption((option) =>
                            option
                                .setName("lock")
                                .setDescription("also lock the thread (default false)")
                                .setRequired(false)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("open")
                        .setDescription("open (unarchive) an archived forum post")
                        .addChannelOption((option) =>
                            option
                                .setName("post")
                                .setDescription("the forum post to open (defaults to current post)")
                                .setRequired(false)
                                .addChannelTypes(ChannelType.PublicThread, ChannelType.PrivateThread)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("lock")
                        .setDescription("lock or unlock a forum post")
                        .addStringOption((option) =>
                            option
                                .setName("state")
                                .setDescription("lock or unlock")
                                .setRequired(true)
                                .addChoices(
                                    { name: "Lock", value: "lock" },
                                    { name: "Unlock", value: "unlock" }
                                )
                        )
                        .addChannelOption((option) =>
                            option
                                .setName("post")
                                .setDescription("the forum post (defaults to current post)")
                                .setRequired(false)
                                .addChannelTypes(ChannelType.PublicThread, ChannelType.PrivateThread)
                        )
                        .addStringOption((option) =>
                            option
                                .setName("reason")
                                .setDescription("optional reason for audit logs")
                                .setRequired(false)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("pin")
                        .setDescription("pin or unpin a forum post")
                        .addStringOption((option) =>
                            option
                                .setName("state")
                                .setDescription("pin or unpin")
                                .setRequired(true)
                                .addChoices(
                                    { name: "Pin", value: "pin" },
                                    { name: "Unpin", value: "unpin" }
                                )
                        )
                        .addChannelOption((option) =>
                            option
                                .setName("post")
                                .setDescription("the forum post (defaults to current post)")
                                .setRequired(false)
                                .addChannelTypes(ChannelType.PublicThread, ChannelType.PrivateThread)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("tag")
                        .setDescription("add or remove a tag from a forum post")
                        .addStringOption((option) =>
                            option
                                .setName("action")
                                .setDescription("add or remove")
                                .setRequired(true)
                                .addChoices(
                                    { name: "Add", value: "add" },
                                    { name: "Remove", value: "remove" }
                                )
                        )
                        .addStringOption((option) =>
                            option
                                .setName("tag")
                                .setDescription("tag name")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                        .addChannelOption((option) =>
                            option
                                .setName("post")
                                .setDescription("the forum post (defaults to current post)")
                                .setRequired(false)
                                .addChannelTypes(ChannelType.PublicThread, ChannelType.PrivateThread)
                        )
                )
        )

        // ==========================================
        // SUBCOMMAND GROUP: BULK
        // ==========================================
        .addSubcommandGroup((group) =>
            group
                .setName("bulk")
                .setDescription("bulk operations on forum posts")
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("close-all")
                        .setDescription("close (archive) all active posts in a forum")
                        .addChannelOption((option) =>
                            option
                                .setName("channel")
                                .setDescription("the forum channel")
                                .setRequired(true)
                                .addChannelTypes(ChannelType.GuildForum)
                        )
                        .addStringOption((option) =>
                            option
                                .setName("filter_tag")
                                .setDescription("optional tag to filter posts by")
                                .setRequired(false)
                                .setAutocomplete(true)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("open-all")
                        .setDescription("open (unarchive) all archived posts in a forum")
                        .addChannelOption((option) =>
                            option
                                .setName("channel")
                                .setDescription("the forum channel")
                                .setRequired(true)
                                .addChannelTypes(ChannelType.GuildForum)
                        )
                        .addStringOption((option) =>
                            option
                                .setName("filter_tag")
                                .setDescription("optional tag to filter posts by")
                                .setRequired(false)
                                .setAutocomplete(true)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("lock-all")
                        .setDescription("lock all posts in a forum")
                        .addChannelOption((option) =>
                            option
                                .setName("channel")
                                .setDescription("the forum channel")
                                .setRequired(true)
                                .addChannelTypes(ChannelType.GuildForum)
                        )
                        .addStringOption((option) =>
                            option
                                .setName("filter_tag")
                                .setDescription("optional tag to filter posts by")
                                .setRequired(false)
                                .setAutocomplete(true)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("unlock-all")
                        .setDescription("unlock all locked posts in a forum")
                        .addChannelOption((option) =>
                            option
                                .setName("channel")
                                .setDescription("the forum channel")
                                .setRequired(true)
                                .addChannelTypes(ChannelType.GuildForum)
                        )
                        .addStringOption((option) =>
                            option
                                .setName("filter_tag")
                                .setDescription("optional tag to filter posts by")
                                .setRequired(false)
                                .setAutocomplete(true)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("tag-all")
                        .setDescription("add a tag to all posts in a forum")
                        .addChannelOption((option) =>
                            option
                                .setName("channel")
                                .setDescription("the forum channel")
                                .setRequired(true)
                                .addChannelTypes(ChannelType.GuildForum)
                        )
                        .addStringOption((option) =>
                            option
                                .setName("tag")
                                .setDescription("tag to add to all posts")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                        .addStringOption((option) =>
                            option
                                .setName("filter_tag")
                                .setDescription("optional tag to filter which posts get the new tag")
                                .setRequired(false)
                                .setAutocomplete(true)
                        )
                )
        ),

    // ==========================================
    // AUTOCOMPLETE HANDLER
    // ==========================================
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        const focusedValue = (focusedOption.value || "").toLowerCase();

        // 1. Attempt to resolve target forum channel
        const channelId = interaction.options.get("channel")?.value || interaction.options.getChannel("channel")?.id;
        let targetChannel = channelId ? (interaction.guild.channels.cache.get(channelId) || await interaction.guild.channels.fetch(channelId).catch(() => null)) : null;

        if (!targetChannel) {
            const postId = interaction.options.get("post")?.value || interaction.options.getChannel("post")?.id;
            if (postId) {
                const post = interaction.guild.channels.cache.get(postId) || await interaction.guild.channels.fetch(postId).catch(() => null);
                if (post?.isThread() && post.parent?.type === ChannelType.GuildForum) {
                    targetChannel = post.parent;
                }
            } else if (interaction.channel?.isThread() && interaction.channel.parent?.type === ChannelType.GuildForum) {
                targetChannel = interaction.channel.parent;
            } else if (interaction.channel?.type === ChannelType.GuildForum) {
                targetChannel = interaction.channel;
            }
        }

        let tags = [];
        if (targetChannel && targetChannel.availableTags) {
            tags = targetChannel.availableTags;
        }

        const filtered = tags
            .filter((tag) => tag.name.toLowerCase().includes(focusedValue))
            .slice(0, 25)
            .map((tag) => ({
                name: `${tag.name}${tag.moderated ? " [Mod]" : ""}`,
                value: tag.name,
            }));

        return interaction.respond(filtered).catch(() => {});
    },

    // ==========================================
    // EXECUTION HANDLER
    // ==========================================
    async execute(interaction) {
        if (!interaction.memberPermissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return interaction.reply({
                content: getMessage("forum.error_no_permission"),
                flags: MessageFlags.Ephemeral,
            });
        }

        const group = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();

        // ----------------------------------------------------
        // GROUP: TAG
        // ----------------------------------------------------
        if (group === "tag") {
            const channel = interaction.options.getChannel("channel");
            if (!channel || channel.type !== ChannelType.GuildForum) {
                return interaction.reply({
                    content: getMessage("forum.error_invalid_channel"),
                    flags: MessageFlags.Ephemeral,
                });
            }

            if (subcommand === "add") {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const name = interaction.options.getString("name", true).trim();
                const emojiInput = interaction.options.getString("emoji");
                const moderated = interaction.options.getBoolean("moderated") ?? false;

                const currentTags = channel.availableTags || [];
                if (currentTags.length >= 20) {
                    return interaction.editReply({
                        content: getMessage("forum.error_tag_limit", { channelId: channel.id }),
                    });
                }

                if (currentTags.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
                    return interaction.editReply({
                        content: getMessage("forum.error_tag_exists", { tag: name, channelId: channel.id }),
                    });
                }

                const parsedEmoji = parseEmojiInput(emojiInput, interaction.guild);
                const newTag = {
                    name,
                    moderated,
                };
                if (parsedEmoji) {
                    if (parsedEmoji.emojiId) newTag.emoji = { id: parsedEmoji.emojiId, name: null };
                    else if (parsedEmoji.emojiName) newTag.emoji = { id: null, name: parsedEmoji.emojiName };
                }

                try {
                    await channel.setAvailableTags([...currentTags, newTag]);
                    const emojiDisplay = formatTagEmoji(newTag.emoji, interaction.client);
                    await interaction.editReply({
                        content: getMessage("forum.tag_added", {
                            tag: name,
                            emoji: emojiDisplay,
                            channelId: channel.id,
                        }),
                    });
                    await logAction(
                        interaction.guild,
                        `**Added Forum Tag**\nAdded tag \`${name}\` to <#${channel.id}> by ${interaction.user.tag}`
                    );
                } catch (err) {
                    console.error("Error adding forum tag:", err);
                    return interaction.editReply({ content: `:x_: Failed to add tag: ${err.message}` });
                }
            } else if (subcommand === "remove") {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const tagName = interaction.options.getString("tag", true).trim();
                const currentTags = channel.availableTags || [];

                const tagToRemove = currentTags.find(
                    (t) => t.name.toLowerCase() === tagName.toLowerCase() || t.id === tagName
                );
                if (!tagToRemove) {
                    return interaction.editReply({
                        content: getMessage("forum.error_tag_not_found", { tag: tagName, channelId: channel.id }),
                    });
                }

                try {
                    const updatedTags = currentTags.filter((t) => t.id !== tagToRemove.id && t.name !== tagToRemove.name);
                    await channel.setAvailableTags(updatedTags);
                    await interaction.editReply({
                        content: getMessage("forum.tag_removed", { tag: tagToRemove.name, channelId: channel.id }),
                    });
                    await logAction(
                        interaction.guild,
                        `**Removed Forum Tag**\nRemoved tag \`${tagToRemove.name}\` from <#${channel.id}> by ${interaction.user.tag}`
                    );
                } catch (err) {
                    console.error("Error removing forum tag:", err);
                    return interaction.editReply({ content: `:x_: Failed to remove tag: ${err.message}` });
                }
            } else if (subcommand === "list") {
                const tags = channel.availableTags || [];
                if (tags.length === 0) {
                    return interaction.reply({
                        content: getMessage("forum.tags_none"),
                        flags: MessageFlags.Ephemeral,
                    });
                }

                const embed = new EmbedBuilder()
                    .setTitle(getMessage("forum.tags_list_title", { channelName: channel.name }))
                    .setColor(0x5865f2)
                    .setDescription(
                        tags
                            .map((t, idx) => {
                                const emoji = formatTagEmoji(t.emoji, interaction.client);
                                const modBadge = t.moderated ? " `[Moderator Only]`" : "";
                                return `**${idx + 1}.** ${emoji} **${t.name}**${modBadge} \`(${t.id})\``;
                            })
                            .join("\n")
                    )
                    .setFooter({ text: `Total Tags: ${tags.length}/20` });

                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }
        }

        // ----------------------------------------------------
        // GROUP: CONFIG
        // ----------------------------------------------------
        else if (group === "config") {
            const channel = interaction.options.getChannel("channel");
            if (!channel || channel.type !== ChannelType.GuildForum) {
                return interaction.reply({
                    content: getMessage("forum.error_invalid_channel"),
                    flags: MessageFlags.Ephemeral,
                });
            }

            if (subcommand === "set") {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const layout = interaction.options.getInteger("layout");
                const sortOrder = interaction.options.getInteger("sort_order");
                const defaultReactionInput = interaction.options.getString("default_reaction");
                const requireTag = interaction.options.getBoolean("require_tag");

                const updatePayload = {};
                const changes = [];

                if (layout !== null) {
                    updatePayload.defaultForumLayout = layout;
                    changes.push(`• **Layout**: ${layout === ForumLayoutType.GalleryView ? "Gallery / Grid View" : "List View"}`);
                }

                if (sortOrder !== null) {
                    updatePayload.defaultSortOrder = sortOrder;
                    changes.push(`• **Sort Order**: ${sortOrder === SortOrderType.CreationDate ? "Creation Date" : "Latest Activity"}`);
                }

                if (defaultReactionInput !== null) {
                    if (defaultReactionInput.toLowerCase() === "none" || defaultReactionInput.toLowerCase() === "clear") {
                        updatePayload.defaultReactionEmoji = null;
                        changes.push(`• **Default Reaction**: Cleared`);
                    } else {
                        const parsed = parseEmojiInput(defaultReactionInput, interaction.guild);
                        if (parsed) {
                            updatePayload.defaultReactionEmoji = parsed.emojiId
                                ? { emojiId: parsed.emojiId, emojiName: null }
                                : { emojiId: null, emojiName: parsed.emojiName };
                            const emojiDisplay = formatTagEmoji(parsed, interaction.client);
                            changes.push(`• **Default Reaction**: ${emojiDisplay}`);
                        }
                    }
                }

                if (requireTag !== null) {
                    const REQUIRE_TAG_FLAG = 1 << 4;
                    const currentFlags = channel.flags.bitfield;
                    updatePayload.flags = requireTag
                        ? currentFlags | REQUIRE_TAG_FLAG
                        : currentFlags & ~REQUIRE_TAG_FLAG;
                    changes.push(`• **Require Tag**: ${requireTag ? "Enabled" : "Disabled"}`);
                }

                if (changes.length === 0) {
                    return interaction.editReply({ content: ":note: No configuration changes were specified." });
                }

                try {
                    await channel.edit(updatePayload);
                    await interaction.editReply({
                        content: getMessage("forum.config_updated", {
                            channelId: channel.id,
                            details: changes.join("\n"),
                        }),
                    });
                    await logAction(
                        interaction.guild,
                        `**Updated Forum Config**\nModified settings for <#${channel.id}> by ${interaction.user.tag}\n${changes.join("\n")}`
                    );
                } catch (err) {
                    console.error("Error setting forum config:", err);
                    return interaction.editReply({ content: `:x_: Failed to update forum config: ${err.message}` });
                }
            } else if (subcommand === "guidelines") {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const text = interaction.options.getString("text", true);

                try {
                    await channel.setTopic(text);
                    await interaction.editReply({
                        content: getMessage("forum.guidelines_updated", { channelId: channel.id }),
                    });
                    await logAction(
                        interaction.guild,
                        `**Updated Forum Guidelines**\nUpdated guidelines for <#${channel.id}> by ${interaction.user.tag}`
                    );
                } catch (err) {
                    console.error("Error setting guidelines:", err);
                    return interaction.editReply({ content: `:x_: Failed to update guidelines: ${err.message}` });
                }
            }
        }

        // ----------------------------------------------------
        // GROUP: POST
        // ----------------------------------------------------
        else if (group === "post") {
            const postOption = interaction.options.getChannel("post");
            const post = resolveForumPost(interaction, postOption);

            if (!post) {
                return interaction.reply({
                    content: getMessage("forum.error_invalid_post"),
                    flags: MessageFlags.Ephemeral,
                });
            }

            if (subcommand === "close") {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const lock = interaction.options.getBoolean("lock") ?? false;
                try {
                    if (lock) await post.setLocked(true);
                    await post.setArchived(true);
                    await interaction.editReply({
                        content: getMessage("forum.post_closed", { title: post.name, id: post.id }),
                    });
                } catch (err) {
                    console.error("Error closing post:", err);
                    return interaction.editReply({ content: `:x_: Failed to close post: ${err.message}` });
                }
            } else if (subcommand === "open") {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                try {
                    await post.setArchived(false);
                    await interaction.editReply({
                        content: getMessage("forum.post_opened", { title: post.name, id: post.id }),
                    });
                } catch (err) {
                    console.error("Error opening post:", err);
                    return interaction.editReply({ content: `:x_: Failed to open post: ${err.message}` });
                }
            } else if (subcommand === "lock") {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const state = interaction.options.getString("state", true);
                const reason = interaction.options.getString("reason");
                const shouldLock = state === "lock";

                try {
                    if (post.archived) {
                        await post.edit({ archived: false, locked: shouldLock, reason: reason || undefined });
                        await post.setArchived(true);
                    } else {
                        await post.setLocked(shouldLock, reason || undefined);
                    }
                    await interaction.editReply({
                        content: getMessage(shouldLock ? "forum.post_locked" : "forum.post_unlocked", {
                            title: post.name,
                            id: post.id,
                        }),
                    });
                } catch (err) {
                    console.error("Error locking/unlocking post:", err);
                    return interaction.editReply({ content: `:x_: Failed to update post lock state: ${err.message}` });
                }
            } else if (subcommand === "pin") {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const state = interaction.options.getString("state", true);
                const shouldPin = state === "pin";

                try {
                    if (post.archived) {
                        await post.edit({ archived: false, pinned: shouldPin });
                        await post.setArchived(true);
                    } else {
                        await post.setPinned(shouldPin);
                    }
                    await interaction.editReply({
                        content: getMessage(shouldPin ? "forum.post_pinned" : "forum.post_unpinned", {
                            title: post.name,
                            id: post.id,
                        }),
                    });
                } catch (err) {
                    console.error("Error pinning/unpinning post:", err);
                    return interaction.editReply({ content: `:x_: Failed to update post pin state: ${err.message}` });
                }
            } else if (subcommand === "tag") {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const action = interaction.options.getString("action", true);
                const tagName = interaction.options.getString("tag", true).trim();

                const forumParent = post.parent;
                const availableTags = forumParent?.availableTags || [];
                const targetTag = availableTags.find(
                    (t) => t.name.toLowerCase() === tagName.toLowerCase() || t.id === tagName
                );

                if (!targetTag) {
                    return interaction.editReply({
                        content: getMessage("forum.error_tag_not_found", {
                            tag: tagName,
                            channelId: forumParent?.id || "",
                        }),
                    });
                }

                const currentAppliedTags = [...post.appliedTags];

                if (action === "add") {
                    if (currentAppliedTags.includes(targetTag.id)) {
                        return interaction.editReply({
                            content: `:tag: Post **${post.name}** already has tag **${targetTag.name}**.`,
                        });
                    }
                    if (currentAppliedTags.length >= 5) {
                        return interaction.editReply({ content: getMessage("forum.post_tag_limit") });
                    }
                    currentAppliedTags.push(targetTag.id);
                } else if (action === "remove") {
                    const tagIndex = currentAppliedTags.indexOf(targetTag.id);
                    if (tagIndex === -1) {
                        return interaction.editReply({
                            content: `:x_: Post **${post.name}** does not have tag **${targetTag.name}**.`,
                        });
                    }
                    currentAppliedTags.splice(tagIndex, 1);
                }

                try {
                    if (post.archived) {
                        await post.edit({ archived: false, appliedTags: currentAppliedTags });
                        await post.setArchived(true);
                    } else {
                        await post.setAppliedTags(currentAppliedTags);
                    }
                    await interaction.editReply({
                        content: getMessage(action === "add" ? "forum.post_tag_added" : "forum.post_tag_removed", {
                            tag: targetTag.name,
                            title: post.name,
                        }),
                    });
                } catch (err) {
                    console.error("Error updating post tags:", err);
                    return interaction.editReply({ content: `:x_: Failed to update post tags: ${err.message}` });
                }
            }
        }

        // ----------------------------------------------------
        // GROUP: BULK
        // ----------------------------------------------------
        else if (group === "bulk") {
            const channel = interaction.options.getChannel("channel");
            if (!channel || channel.type !== ChannelType.GuildForum) {
                return interaction.reply({
                    content: getMessage("forum.error_invalid_channel"),
                    flags: MessageFlags.Ephemeral,
                });
            }

            const filterTagName = interaction.options.getString("filter_tag")?.trim();
            let filterTagObj = null;
            if (filterTagName) {
                filterTagObj = channel.availableTags?.find(
                    (t) => t.name.toLowerCase() === filterTagName.toLowerCase() || t.id === filterTagName
                );
                if (!filterTagObj) {
                    return interaction.reply({
                        content: getMessage("forum.error_tag_not_found", {
                            tag: filterTagName,
                            channelId: channel.id,
                        }),
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }

            const filterText = filterTagObj ? ` (filtered by tag: **${filterTagObj.name}**)` : "";

            // --- BULK CLOSE-ALL ---
            if (subcommand === "close-all") {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const allPosts = await fetchAllForumPosts(channel);
                let targetThreads = allPosts;

                if (filterTagObj) {
                    targetThreads = targetThreads.filter((t) => t.appliedTags?.includes(filterTagObj.id));
                }
                targetThreads = targetThreads.filter((t) => !t.archived);

                if (targetThreads.length === 0) {
                    return interaction.editReply({
                        content: getMessage("forum.bulk_none_found", { channelId: channel.id }),
                    });
                }

                const confirmed = await confirmAction(
                    interaction,
                    getMessage("forum.bulk_confirm_close", {
                        count: targetThreads.length,
                        channelId: channel.id,
                        filterText,
                    })
                );
                if (!confirmed) return;

                const progress = new InteractiveProgress(
                    interaction,
                    targetThreads.length,
                    `Closing Forum Posts in #${channel.name}`
                );
                await progress.start();

                for (const thread of targetThreads) {
                    if (progress.isCancelled) break;
                    await progress.waitIfPaused();
                    try {
                        await thread.setArchived(true);
                        await progress.update(true);
                    } catch (err) {
                        await progress.update(false);
                    }
                    await wait(200);
                }

                await progress.finish(getMessage("forum.bulk_finish", { count: progress.current, channelId: channel.id }));
                await logAction(
                    interaction.guild,
                    `**Bulk Closed Forum Posts**\nClosed ${progress.current}/${targetThreads.length} posts in <#${channel.id}> by ${interaction.user.tag}`
                );
            }

            // --- BULK OPEN-ALL ---
            else if (subcommand === "open-all") {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const allPosts = await fetchAllForumPosts(channel);
                let targetThreads = allPosts;

                if (filterTagObj) {
                    targetThreads = targetThreads.filter((t) => t.appliedTags?.includes(filterTagObj.id));
                }
                targetThreads = targetThreads.filter((t) => t.archived);

                if (targetThreads.length === 0) {
                    return interaction.editReply({
                        content: getMessage("forum.bulk_none_found", { channelId: channel.id }),
                    });
                }

                const confirmed = await confirmAction(
                    interaction,
                    getMessage("forum.bulk_confirm_open", {
                        count: targetThreads.length,
                        channelId: channel.id,
                        filterText,
                    })
                );
                if (!confirmed) return;

                const progress = new InteractiveProgress(
                    interaction,
                    targetThreads.length,
                    `Opening Forum Posts in #${channel.name}`
                );
                await progress.start();

                for (const thread of targetThreads) {
                    if (progress.isCancelled) break;
                    await progress.waitIfPaused();
                    try {
                        await thread.setArchived(false);
                        await progress.update(true);
                    } catch (err) {
                        await progress.update(false);
                    }
                    await wait(200);
                }

                await progress.finish(getMessage("forum.bulk_finish", { count: progress.current, channelId: channel.id }));
                await logAction(
                    interaction.guild,
                    `**Bulk Opened Forum Posts**\nOpened ${progress.current}/${targetThreads.length} posts in <#${channel.id}> by ${interaction.user.tag}`
                );
            }

            // --- BULK LOCK-ALL ---
            else if (subcommand === "lock-all") {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const allPosts = await fetchAllForumPosts(channel);
                let targetThreads = allPosts;

                if (filterTagObj) {
                    targetThreads = targetThreads.filter((t) => t.appliedTags?.includes(filterTagObj.id));
                }
                targetThreads = targetThreads.filter((t) => !t.locked);

                if (targetThreads.length === 0) {
                    return interaction.editReply({
                        content: getMessage("forum.bulk_none_found", { channelId: channel.id }),
                    });
                }

                const confirmed = await confirmAction(
                    interaction,
                    getMessage("forum.bulk_confirm_lock", {
                        count: targetThreads.length,
                        channelId: channel.id,
                        filterText,
                    })
                );
                if (!confirmed) return;

                const progress = new InteractiveProgress(
                    interaction,
                    targetThreads.length,
                    `Locking Forum Posts in #${channel.name}`
                );
                await progress.start();

                for (const thread of targetThreads) {
                    if (progress.isCancelled) break;
                    await progress.waitIfPaused();
                    try {
                        if (thread.archived) {
                            await thread.edit({ archived: false, locked: true });
                            await thread.setArchived(true);
                        } else {
                            await thread.setLocked(true);
                        }
                        await progress.update(true);
                    } catch (err) {
                        console.error(`Error locking post ${thread.id}:`, err);
                        await progress.update(false);
                    }
                    await wait(200);
                }

                await progress.finish(getMessage("forum.bulk_finish", { count: progress.current, channelId: channel.id }));
                await logAction(
                    interaction.guild,
                    `**Bulk Locked Forum Posts**\nLocked ${progress.current}/${targetThreads.length} posts in <#${channel.id}> by ${interaction.user.tag}`
                );
            }

            // --- BULK UNLOCK-ALL ---
            else if (subcommand === "unlock-all") {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const allPosts = await fetchAllForumPosts(channel);
                let targetThreads = allPosts;

                if (filterTagObj) {
                    targetThreads = targetThreads.filter((t) => t.appliedTags?.includes(filterTagObj.id));
                }
                targetThreads = targetThreads.filter((t) => t.locked);

                if (targetThreads.length === 0) {
                    return interaction.editReply({
                        content: getMessage("forum.bulk_none_found", { channelId: channel.id }),
                    });
                }

                const confirmed = await confirmAction(
                    interaction,
                    getMessage("forum.bulk_confirm_unlock", {
                        count: targetThreads.length,
                        channelId: channel.id,
                        filterText,
                    })
                );
                if (!confirmed) return;

                const progress = new InteractiveProgress(
                    interaction,
                    targetThreads.length,
                    `Unlocking Forum Posts in #${channel.name}`
                );
                await progress.start();

                for (const thread of targetThreads) {
                    if (progress.isCancelled) break;
                    await progress.waitIfPaused();
                    try {
                        if (thread.archived) {
                            await thread.edit({ archived: false, locked: false });
                            await thread.setArchived(true);
                        } else {
                            await thread.setLocked(false);
                        }
                        await progress.update(true);
                    } catch (err) {
                        console.error(`Error unlocking post ${thread.id}:`, err);
                        await progress.update(false);
                    }
                    await wait(200);
                }

                await progress.finish(getMessage("forum.bulk_finish", { count: progress.current, channelId: channel.id }));
                await logAction(
                    interaction.guild,
                    `**Bulk Unlocked Forum Posts**\nUnlocked ${progress.current}/${targetThreads.length} posts in <#${channel.id}> by ${interaction.user.tag}`
                );
            }

            // --- BULK TAG-ALL ---
            else if (subcommand === "tag-all") {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const tagName = interaction.options.getString("tag", true).trim();
                const targetTag = channel.availableTags?.find(
                    (t) => t.name.toLowerCase() === tagName.toLowerCase() || t.id === tagName
                );

                if (!targetTag) {
                    return interaction.editReply({
                        content: getMessage("forum.error_tag_not_found", { tag: tagName, channelId: channel.id }),
                    });
                }

                const allPosts = await fetchAllForumPosts(channel);
                let targetThreads = allPosts;

                if (filterTagObj) {
                    targetThreads = targetThreads.filter((t) => t.appliedTags?.includes(filterTagObj.id));
                }
                // Only posts that don't already have this tag and have fewer than 5 tags
                targetThreads = targetThreads.filter(
                    (t) => !t.appliedTags?.includes(targetTag.id) && (t.appliedTags?.length || 0) < 5
                );

                if (targetThreads.length === 0) {
                    return interaction.editReply({
                        content: getMessage("forum.bulk_none_found", { channelId: channel.id }),
                    });
                }

                const confirmed = await confirmAction(
                    interaction,
                    getMessage("forum.bulk_confirm_tag", {
                        tag: targetTag.name,
                        count: targetThreads.length,
                        channelId: channel.id,
                        filterText,
                    })
                );
                if (!confirmed) return;

                const progress = new InteractiveProgress(
                    interaction,
                    targetThreads.length,
                    `Applying Tag "${targetTag.name}" in #${channel.name}`
                );
                await progress.start();

                for (const thread of targetThreads) {
                    if (progress.isCancelled) break;
                    await progress.waitIfPaused();
                    try {
                        const currentApplied = thread.appliedTags ? [...thread.appliedTags] : [];
                        if (!currentApplied.includes(targetTag.id) && currentApplied.length < 5) {
                            currentApplied.push(targetTag.id);
                            if (thread.archived) {
                                await thread.edit({ archived: false, appliedTags: currentApplied });
                                await thread.setArchived(true);
                            } else {
                                await thread.setAppliedTags(currentApplied);
                            }
                            await progress.update(true);
                        } else {
                            await progress.update(false);
                        }
                    } catch (err) {
                        console.error(`Error applying tag to post ${thread.id}:`, err);
                        await progress.update(false);
                    }
                    await wait(200);
                }

                await progress.finish(getMessage("forum.bulk_finish", { count: progress.current, channelId: channel.id }));
                await logAction(
                    interaction.guild,
                    `**Bulk Tagged Forum Posts**\nApplied tag \`${targetTag.name}\` to ${progress.current}/${targetThreads.length} posts in <#${channel.id}> by ${interaction.user.tag}`
                );
            }
        }
    },
};
