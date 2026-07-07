const {
    SlashCommandBuilder,
    ChannelType,
    PermissionsBitField,
    MessageFlags,
    PermissionFlagsBits, // Use PermissionFlagsBits for easier access to flags
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    ChannelSelectMenuBuilder,
    RoleSelectMenuBuilder,
    UserSelectMenuBuilder,
    Routes,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require("discord.js");
const { REST } = require("@discordjs/rest");
const { setTimeout: wait } = require("node:timers/promises"); // For delays
const { confirmAction } = require("../../utils/confirm.js");
const { ProgressReporter } = require("../../utils/progress.js");
const { logAction } = require("../../utils/logger.js");

const DIVIDER_CHOICES = [
    { name: "Line │", value: "│" },
    { name: "Dot ・", value: "・" },
    { name: "Custom", value: "custom" },
    { name: "Undo", value: "undo" },
];

const RENAMEABLE_CHANNEL_TYPES = [
    ChannelType.GuildText,
    ChannelType.GuildVoice,
    ChannelType.GuildAnnouncement,
    ChannelType.GuildStageVoice,
    ChannelType.GuildForum,
    ChannelType.GuildMedia,
];

// Mapping command option names to permission flags
// *** Keys MUST be lowercase_with_underscores ***
const permissionMap = {
    create_invite: PermissionFlagsBits.CreateInstantInvite,
    send_msgs: PermissionFlagsBits.SendMessages,
    send_thrd_msgs: PermissionFlagsBits.SendMessagesInThreads,
    create_pub_thrd: PermissionFlagsBits.CreatePublicThreads,
    create_priv_thrd: PermissionFlagsBits.CreatePrivateThreads,
    embed_links: PermissionFlagsBits.EmbedLinks,
    attach_files: PermissionFlagsBits.AttachFiles,
    add_react: PermissionFlagsBits.AddReactions,
    mention_roles: PermissionFlagsBits.MentionEveryone, // Maps to Mention @everyone, @here, and All Roles
    create_polls: PermissionFlagsBits.SendPolls,
    use_app_cmnds: PermissionFlagsBits.UseApplicationCommands,
    // start_embedded_activities: PermissionFlagsBits.StartEmbeddedActivities, // Still commented out
    use_external_emojis: PermissionFlagsBits.UseExternalEmojis,
    use_external_stickers: PermissionFlagsBits.UseExternalStickers,
};

const permissionChoices = [
    { name: "Allow", value: "allow" },
    { name: "Deny", value: "deny" },
    { name: "Inherit", value: "inherit" },
];

// --- Channel Preset Structure ---\
const channelPresets = {
    general: [
        // Top-level channels (no category)
        {
            name: "announcements",
            type: ChannelType.GuildAnnouncement,
            readOnly: true,
        },
        { name: "rules", type: ChannelType.GuildText, readOnly: true },
        { name: "welcome", type: ChannelType.GuildText, readOnly: true },
        // STAFF Category (private)
        {
            name: "STAFF",
            type: ChannelType.GuildCategory,
            private: true,
            children: [
                {
                    name: "discord-updates",
                    type: ChannelType.GuildText,
                    readOnly: true,
                },
                { name: "staff-chat", type: ChannelType.GuildText },
                { name: "bot-config", type: ChannelType.GuildText },
            ],
        },
        // CHAT Category
        {
            name: "CHAT",
            type: ChannelType.GuildCategory,
            children: [
                { name: "general", type: ChannelType.GuildText },
                { name: "media", type: ChannelType.GuildText },
                { name: "off-topic", type: ChannelType.GuildText },
            ],
        },
        // VOICE AND BOTS Category
        {
            name: "VOICE AND BOTS",
            type: ChannelType.GuildCategory,
            children: [
                { name: "bot-commands", type: ChannelType.GuildText },
                { name: "general", type: ChannelType.GuildVoice },
                { name: "music", type: ChannelType.GuildVoice },
            ],
        },
    ],
    // Add more presets here in the future if needed
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("channel")
        .setDescription(
            "manage server channels (create, preset, settings, etc.)"
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .setDMPermission(false)

        // --- CREATE-BULK SUBCOMMAND ---
        .addSubcommand((subcommand) =>
            subcommand
                .setName("create-bulk")
                .setDescription("create multiple channels via modal")
                .addStringOption((option) =>
                    option
                        .setName("category")
                        .setDescription("parent category (start typing...)")
                        .setRequired(false)
                        .setAutocomplete(true)
                )
        )

        // --- Preset Subcommand ---\
        .addSubcommand((subcommand) =>
            subcommand
                .setName("preset")
                .setDescription("creates channels from a template")
                .addStringOption((option) =>
                    option
                        .setName("preset_name")
                        .setDescription("the preset template to use")
                        .setRequired(true)
                        .addChoices({
                            name: "General Server Setup",
                            value: "general",
                        })
                )
        )

        // --- Create Subcommand ---
        .addSubcommand((subcommand) =>
            subcommand
                .setName("create")
                .setDescription("create a new channel")
                .addStringOption((option) =>
                    option
                        .setName("name")
                        .setDescription("name for the new channel")
                        .setRequired(true)
                )
                .addIntegerOption((option) =>
                    option
                        .setName("type")
                        .setDescription("type of channel to create")
                        .setRequired(true)
                        .addChoices(
                            { name: "text", value: ChannelType.GuildText },
                            { name: "voice", value: ChannelType.GuildVoice },
                            {
                                name: "category",
                                value: ChannelType.GuildCategory,
                            },
                            {
                                name: "announcement",
                                value: ChannelType.GuildAnnouncement,
                            },
                            {
                                name: "stage",
                                value: ChannelType.GuildStageVoice,
                            },
                            { name: "forum", value: ChannelType.GuildForum },
                            { name: "media", value: ChannelType.GuildMedia }
                        )
                )
                .addStringOption((option) =>
                    option
                        .setName("category")
                        .setDescription("parent category (start typing...)")
                        .setRequired(false)
                        .setAutocomplete(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("description")
                        .setDescription("topic or description")
                        .setRequired(false)
                )
                .addBooleanOption((option) =>
                    option
                        .setName("readonly")
                        .setDescription("make read-only for everyone")
                        .setRequired(false)
                )
        )

        // --- Manage Subcommand ---
        .addSubcommand((subcommand) => {
            subcommand
                .setName("manage")
                .setDescription("adjust permissions or rename a channel");

            subcommand.addChannelOption((option) =>
                option
                    .setName("channel")
                    .setDescription("the channel to configure")
                    .setRequired(true)
            );

            subcommand.addMentionableOption((option) =>
                option
                    .setName("target")
                    .setDescription("the role or user to adjust")
                    .setRequired(true)
            );

            subcommand.addStringOption((option) =>
                option.setName("rename").setDescription("rename the channel")
            );

            for (const [optionName, flagBit] of Object.entries(permissionMap)) {
                const flagName =
                    Object.keys(PermissionFlagsBits).find(
                        (key) => PermissionFlagsBits[key] === flagBit
                    ) || optionName;
                subcommand.addStringOption((option) =>
                    option
                        .setName(optionName)
                        .setDescription(`set permission: ${flagName}`)
                        .setRequired(false)
                        .addChoices(...permissionChoices)
                );
            }
            return subcommand;
        })

        // --- Sync Subcommand ---
        .addSubcommand((subcommand) =>
            subcommand
                .setName("sync")
                .setDescription("sync permissions from category")
                .addChannelOption((option) =>
                    option
                        .setName("category")
                        .setDescription("the category to sync permissions from")
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildCategory)
                )
        )

        // --- Delete Subcommand ---
        .addSubcommand((subcommand) =>
            subcommand
                .setName("delete")
                .setDescription("delete channels")
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setDescription("channel to delete (leave empty for multiple)")
                        .setRequired(false)
                )
                .addBooleanOption((option) =>
                    option
                        .setName("delete_all")
                        .setDescription("delete all channels in category")
                        .setRequired(false)
                )
        )

        // --- Clear Subcommand ---
        .addSubcommand((subcommand) =>
            subcommand
                .setName("clear")
                .setDescription("clear permission overwrites")
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setDescription("channel to clear (leave empty for multiple)")
                        .setRequired(false)
                )
        )

        // --- Divider Subcommand Group ---
        .addSubcommandGroup((group) =>
            group
                .setName("divider")
                .setDescription("adds a divider prefix to channel names")
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("server")
                        .setDescription("apply divider to all channels in server")
                        .addStringOption((option) =>
                            option
                                .setName("divider_type")
                                .setDescription("the divider symbol to use")
                                .setRequired(true)
                                .addChoices(...DIVIDER_CHOICES)
                        )
                        .addStringOption((option) =>
                            option
                                .setName("custom_divider")
                                .setDescription("custom divider symbol")
                                .setRequired(false)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("category")
                        .setDescription("apply divider to channels in a category")
                        .addStringOption((option) =>
                            option
                                .setName("target_category")
                                .setDescription("the category to apply dividers within")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                        .addStringOption((option) =>
                            option
                                .setName("divider_type")
                                .setDescription("the divider symbol to use")
                                .setRequired(true)
                                .addChoices(...DIVIDER_CHOICES)
                        )
                        .addStringOption((option) =>
                            option
                                .setName("custom_divider")
                                .setDescription("custom divider symbol")
                                .setRequired(false)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("channel")
                        .setDescription("apply divider to a specific channel")
                        .addChannelOption((option) =>
                            option
                                .setName("target_channel")
                                .setDescription("the channel to apply the divider to")
                                .setRequired(true)
                        )
                        .addStringOption((option) =>
                            option
                                .setName("divider_type")
                                .setDescription("the divider symbol to use")
                                .setRequired(true)
                                .addChoices(...DIVIDER_CHOICES)
                        )
                        .addStringOption((option) =>
                            option
                                .setName("custom_divider")
                                .setDescription("custom divider symbol")
                                .setRequired(false)
                        )
                )
        ),

    // --- Execute Function ---
    async execute(interaction) {
        if (
            !interaction.memberPermissions.has(
                PermissionsBitField.Flags.ManageGuild
            )
        ) {
            return interaction.reply({
                content:
                    "you do not have permission to manage server channels.",
                flags: MessageFlags.Ephemeral,
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const subcommandGroup = interaction.options.getSubcommandGroup();

        if (subcommand === "create-bulk") {
            const modal = new ModalBuilder()
                .setCustomId('bulk_channel_create_modal')
                .setTitle('Bulk Channel Create');

            const channelsInput = new TextInputBuilder()
                .setCustomId('channels_input')
                .setLabel('Channels (new line or comma separated)')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('text -c, general, media\nnews --a --ro\nrules --ros\nmod-chat --priv')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(channelsInput));

            await interaction.showModal(modal);

            try {
                const submitted = await interaction.awaitModalSubmit({
                    time: 300000,
                    filter: i => i.user.id === interaction.user.id && i.customId === 'bulk_channel_create_modal',
                });

                if (submitted) {
                    await submitted.deferReply({ flags: MessageFlags.Ephemeral });

                    const input = submitted.fields.getTextInputValue('channels_input');
                    const parts = input.split(/[\n,]+/).map(p => p.trim()).filter(p => p.length > 0);

                    const categoryId = interaction.options.getString("category");
                    let currentCategory = categoryId ? interaction.guild.channels.cache.get(categoryId) : null;

                    if (categoryId && (!currentCategory || currentCategory.type !== ChannelType.GuildCategory)) {
                        await submitted.editReply("Selected category is invalid.");
                        return;
                    }

                    const reporter = new ProgressReporter(submitted, parts.length, "Bulk Creating Channels");
                    let createdCount = 0;
                    let failedCount = 0;

                    for (const part of parts) {
                        let isCategory = false, type = '--t', isReadonly = false, isReadonlyStrict = false, isPrivate = false, isPublic = false;
                        let cleanWords = [];
                        for (const word of part.split(/\s+/)) {
                            if (word === '--c' || word === '-c') isCategory = true;
                            else if (word === '--v') type = '--v';
                            else if (word === '--s') type = '--s';
                            else if (word === '--f') type = '--f';
                            else if (word === '--a') type = '--a';
                            else if (word === '--t') type = '--t';
                            else if (word === '--ro') isReadonly = true;
                            else if (word === '--ros') isReadonlyStrict = true;
                            else if (word === '--priv') isPrivate = true;
                            else if (word === '--pub') isPublic = true;
                            else cleanWords.push(word);
                        }
                        let cleanName = cleanWords.join('-').toLowerCase();

                        try {
                            if (isCategory) {
                                const catName = cleanWords.join(' ');
                                currentCategory = await interaction.guild.channels.create({
                                    name: catName,
                                    type: ChannelType.GuildCategory
                                });
                                createdCount++;
                            } else {
                                let channelTypeEnum = ChannelType.GuildText;
                                if (type === '--v') channelTypeEnum = ChannelType.GuildVoice;
                                else if (type === '--s') channelTypeEnum = ChannelType.GuildStageVoice;
                                else if (type === '--f') channelTypeEnum = ChannelType.GuildForum;
                                else if (type === '--a') channelTypeEnum = ChannelType.GuildAnnouncement;

                                let permissionOverwrites = [];

                                if (isPrivate) {
                                    permissionOverwrites.push({
                                        id: interaction.guild.roles.everyone.id,
                                        deny: [PermissionFlagsBits.ViewChannel],
                                    });
                                } else if (isReadonlyStrict) {
                                    permissionOverwrites.push({
                                        id: interaction.guild.roles.everyone.id,
                                        deny: [
                                            PermissionFlagsBits.SendMessages,
                                            PermissionFlagsBits.SendMessagesInThreads,
                                            PermissionFlagsBits.AddReactions,
                                            PermissionFlagsBits.CreatePublicThreads,
                                            PermissionFlagsBits.CreatePrivateThreads,
                                            PermissionFlagsBits.UseApplicationCommands
                                        ],
                                    });
                                } else if (isReadonly) {
                                    permissionOverwrites.push({
                                        id: interaction.guild.roles.everyone.id,
                                        deny: [
                                            PermissionFlagsBits.SendMessages,
                                        ],
                                    });
                                }

                                const channelOptions = {
                                    name: cleanName,
                                    type: channelTypeEnum,
                                    permissionOverwrites: permissionOverwrites.length > 0 ? permissionOverwrites : undefined,
                                    parent: currentCategory?.id || null
                                };

                                await interaction.guild.channels.create(channelOptions);
                                createdCount++;
                            }
                            await reporter.update(true);
                            await wait(1000); // Rate limit delay
                        } catch (error) {
                            console.error("Failed to create channel/category:", error);
                            failedCount++;
                            await reporter.update(false);
                        }
                    }

                    const finalMsg = `Successfully created ${createdCount} channels/categories. ${failedCount > 0 ? `(${failedCount} failed)` : ''}`;
                    await reporter.finish(finalMsg);
                    await logAction(interaction.guild, `**Bulk Created Channels**\nCreated ${createdCount} channels/categories by ${interaction.user.tag}`);
                }
            } catch (err) {
                if (err.code !== 'InteractionCollectorError') {
                    console.error("Bulk create modal error:", err);
                }
            }
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // ============================
        // === PRESET Subcommand ====
        // ============================
        if (subcommand === "preset") {
            const presetName = interaction.options.getString("preset_name");
            const presetData = channelPresets[presetName];
            const guild = interaction.guild;
            const rest = new REST().setToken(process.env.TOKEN);

            if (!presetData) {
                return interaction.editReply({
                    content: `Invalid preset name: ${presetName}.`,
                    flags: MessageFlags.Ephemeral,
                });
            }

            // --- 1. Ensure Community is Enabled (if needed by preset logic, or just good practice) ---
            let communityEnabled = guild.features.includes("COMMUNITY");
            let communityRulesChannel = null;
            let communityUpdatesChannel = null;

            if (!communityEnabled) {
                await interaction.editReply({
                    content:
                        "Community features are not enabled. Attempting to enable first... (Requires rules & updates channels)",
                    flags: MessageFlags.Ephemeral,
                });

                // Find or create rules channel
                communityRulesChannel = guild.channels.cache.find(
                    (ch) =>
                        ch.name === "rules" && ch.type === ChannelType.GuildText
                );
                if (!communityRulesChannel) {
                    try {
                        communityRulesChannel = await guild.channels.create({
                            name: "rules",
                            type: ChannelType.GuildText,
                            permissionOverwrites: [
                                {
                                    id: guild.roles.everyone.id,
                                    deny: [PermissionFlagsBits.SendMessages],
                                    allow: [PermissionFlagsBits.ViewChannel],
                                },
                            ],
                        });
                        await wait(1100); // Delay
                    } catch (err) {
                        console.error(
                            "Preset: Error creating prerequisite rules channel:",
                            err
                        );
                        return interaction.editReply({
                            content:
                                "Failed to create prerequisite rules channel for community setup. Cannot proceed.",
                            flags: MessageFlags.Ephemeral,
                        });
                    }
                }

                // Find or create updates channel
                communityUpdatesChannel = guild.channels.cache.find(
                    (ch) =>
                        ch.name === "community-updates" &&
                        ch.type === ChannelType.GuildText
                );
                if (!communityUpdatesChannel) {
                    try {
                        communityUpdatesChannel = await guild.channels.create({
                            name: "community-updates",
                            type: ChannelType.GuildText,
                            permissionOverwrites: [
                                {
                                    id: guild.roles.everyone.id,
                                    deny: [
                                        PermissionFlagsBits.SendMessages,
                                        PermissionFlagsBits.ViewChannel,
                                    ],
                                },
                            ],
                        });
                        await wait(1100); // Delay
                    } catch (err) {
                        console.error(
                            "Preset: Error creating prerequisite updates channel:",
                            err
                        );
                        return interaction.editReply({
                            content:
                                "Failed to create prerequisite community updates channel for community setup. Cannot proceed.",
                            flags: MessageFlags.Ephemeral,
                        });
                    }
                }

                // Enable community via REST
                try {
                    await rest.patch(Routes.guild(guild.id), {
                        body: {
                            features: [
                                ...guild.features.filter(
                                    (f) => f !== "COMMUNITY"
                                ),
                                "COMMUNITY",
                            ],
                            rules_channel_id: communityRulesChannel.id,
                            public_updates_channel_id:
                                communityUpdatesChannel.id,
                        },
                    });
                    communityEnabled = true;
                    await interaction.editReply({
                        content: `Community features enabled. Preparing channel preview... (Rules: <#${communityRulesChannel.id}>, Updates: <#${communityUpdatesChannel.id}>)`,
                        flags: MessageFlags.Ephemeral,
                    });
                    await wait(1500); // Wait a bit after enabling community
                } catch (err) {
                    console.error(
                        "Preset: Error enabling community features:",
                        err
                    );
                    return interaction.editReply({
                        content: `Failed to enable community features: ${err.message || "Unknown error"
                            }. Cannot proceed with preset.`,
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }

            // --- 2. Generate Preview & Confirmation ---
            let previewMessage = `**Channel Preset Preview: '${presetName}'**\nThis will create the following channels and categories:\n`;
            let totalChannels = 0;
            let topLevelChannels = [];
            let categoryChannels = {};

            // Separate top-level and categorized channels
            presetData.forEach((item) => {
                if (item.type === ChannelType.GuildCategory) {
                    categoryChannels[item.name] = { ...item }; // Store category info and children
                    totalChannels += item.children ? item.children.length : 0;
                } else {
                    topLevelChannels.push(item);
                    totalChannels++;
                }
            });

            // Build the formatted preview string
            if (topLevelChannels.length > 0) {
                previewMessage += `\n- No Category\n`;
                topLevelChannels.forEach((channel) => {
                    previewMessage += `  - ${channel.name} (${ChannelType[channel.type]
                        }${channel.readOnly ? " - Read Only" : ""})\n`;
                });
            }

            for (const categoryName in categoryChannels) {
                const category = categoryChannels[categoryName];
                previewMessage += `\n- ${category.name} (Category${category.private ? " - Private Staff" : ""
                    })\n`;
                if (category.children) {
                    category.children.forEach((child) => {
                        previewMessage += `  - ${child.name} (${ChannelType[child.type]
                            }${child.readOnly ? " - Read Only" : ""})\n`;
                    });
                }
            }

            const confirmId = `confirm-preset-${interaction.id}`;
            const cancelId = `cancel-preset-${interaction.id}`;

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(confirmId)
                    .setLabel("Confirm & Create")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(cancelId)
                    .setLabel("Cancel")
                    .setStyle(ButtonStyle.Danger)
            );

            const response = await interaction.editReply({
                content: previewMessage,
                components: [row],
                flags: MessageFlags.Ephemeral,
            });

            // --- 3. Handle Confirmation ---
            const collectorFilter = (i) =>
                i.user.id === interaction.user.id &&
                (i.customId === confirmId || i.customId === cancelId);

            try {
                const confirmation = await response.awaitMessageComponent({
                    filter: collectorFilter,
                    time: 60_000,
                }); // 60 seconds timeout

                if (confirmation.customId === cancelId) {
                    return confirmation.update({
                        content: "Channel preset creation cancelled.",
                        components: [],
                    });
                }

                // --- 4. Create Channels on Confirmation ---
                if (confirmation.customId === confirmId) {
                    await confirmation.update({
                        content: `Creating ${totalChannels} channels... This may take a while. Please wait.`,
                        components: [],
                    });

                    const createdCategories = {}; // Store created category IDs
                    let createdCount = 0;
                    let failedCount = 0;
                    let logMessages = [];

                    // Create categories first
                    for (const item of presetData) {
                        if (item.type === ChannelType.GuildCategory) {
                            try {
                                const categoryOptions = {
                                    name: item.name,
                                    type: item.type,
                                };
                                if (item.private) {
                                    categoryOptions.permissionOverwrites = [
                                        {
                                            id: guild.roles.everyone.id,
                                            deny: [
                                                PermissionFlagsBits.ViewChannel,
                                            ],
                                        },
                                    ];
                                }
                                const newCategory = await guild.channels.create(
                                    categoryOptions
                                );
                                createdCategories[item.name] = newCategory.id;
                                logMessages.push(
                                    `✅ Created Category: ${newCategory.name}`
                                );
                                createdCount++;
                                await wait(1100); // Rate limit delay
                            } catch (err) {
                                console.error(
                                    `Preset: Error creating category ${item.name}:`,
                                    err
                                );
                                logMessages.push(
                                    `❌ Failed Category: ${item.name} (${err.message})`
                                );
                                failedCount++;
                            }
                        }
                    }

                    // Create channels within categories or at top-level
                    for (const item of presetData) {
                        const itemsToCreate = item.children
                            ? item.children
                            : item.type !== ChannelType.GuildCategory
                                ? [item]
                                : [];
                        const parentId = item.children
                            ? createdCategories[item.name]
                            : undefined;

                        if (item.children && !parentId) {
                            logMessages.push(
                                `⚠️ Skipping channels in category '${item.name}' because category creation failed.`
                            );
                            failedCount += item.children.length;
                            continue; // Skip children if category failed
                        }

                        for (const channel of itemsToCreate) {
                            try {
                                const channelOptions = {
                                    name: channel.name,
                                    type: channel.type,
                                    parent: parentId, // Assign parent if applicable
                                };
                                if (channel.readOnly) {
                                    channelOptions.permissionOverwrites = [
                                        {
                                            id: guild.roles.everyone.id,
                                            deny: [
                                                PermissionFlagsBits.SendMessages,
                                                PermissionFlagsBits.AddReactions,
                                            ],
                                        },
                                    ];
                                }
                                const newChannel = await guild.channels.create(
                                    channelOptions
                                );
                                logMessages.push(
                                    `✅ Created Channel: ${newChannel.name} ${parentId ? `in ${item.name}` : ""
                                    }`
                                );
                                createdCount++;
                                await wait(1100); // Rate limit delay
                            } catch (err) {
                                console.error(
                                    `Preset: Error creating channel ${channel.name}:`,
                                    err
                                );
                                logMessages.push(
                                    `❌ Failed Channel: ${channel.name} (${err.message})`
                                );
                                failedCount++;
                            }
                        }
                    }

                    // --- 5. Final Summary ---
                    let finalMessage = `**Channel Preset '${presetName}' Creation Complete!**\nCreated: ${createdCount} | Failed: ${failedCount}\n\n`;
                    // Send log in chunks if too long
                    const logString = logMessages.join("\n");
                    if (logString.length + finalMessage.length <= 2000) {
                        finalMessage += logString;
                        await interaction.editReply({
                            content: finalMessage,
                            components: [],
                        });
                    } else {
                        await interaction.editReply({
                            content: finalMessage,
                            components: [],
                        });
                        // Send log as separate message(s) or file
                        const logChunks =
                            logString.match(/[\s\S]{1,1990}/g) || []; // Split into chunks
                        for (const chunk of logChunks) {
                            await interaction.followUp({
                                content: `\`\`\`\n${chunk}\n\`\`\``,
                                flags: MessageFlags.Ephemeral,
                            });
                            await wait(500);
                        }
                    }
                    await logAction(interaction.guild, `**Created Channels with Preset**\nPreset: ${presetName}\nCreated: ${createdCount} by ${interaction.user.tag}`);
                }
            } catch (err) {
                console.error(
                    "Preset: Error during confirmation/creation:",
                    err
                );
                // Handle timeout
                if (err.message.includes("time")) {
                    await interaction
                        .editReply({
                            content:
                                "Preset confirmation timed out. No channels were created.",
                            components: [],
                        })
                        .catch(() => { });
                } else {
                    await interaction
                        .editReply({
                            content:
                                "An unexpected error occurred during preset creation.",
                            components: [],
                        })
                        .catch(() => { });
                }
            }
        }
        // ============================
        // === CREATE Subcommand ====
        // ============================
        else if (subcommand === "create") {
            const channelName = interaction.options.getString("name");
            const channelType = interaction.options.getInteger("type");
            const categoryId = interaction.options.getString("category"); // Autocomplete sends the ID
            const description = interaction.options.getString("description");
            const readOnly = interaction.options.getBoolean("readonly");

            try {
                const channelOptions = { name: channelName, type: channelType };

                if (
                    description &&
                    (channelType === ChannelType.GuildText ||
                        channelType === ChannelType.GuildForum ||
                        channelType === ChannelType.GuildAnnouncement)
                ) {
                    channelOptions.topic = description;
                }
                if (categoryId) {
                    const categoryChannel =
                        interaction.guild.channels.cache.get(categoryId);
                    if (
                        !categoryChannel ||
                        categoryChannel.type !== ChannelType.GuildCategory
                    ) {
                        return interaction.editReply({
                            content: `Selected category (ID: ${categoryId}) no longer exists or is not a category.`,
                            flags: MessageFlags.Ephemeral,
                        });
                    }
                    channelOptions.parent = categoryId;
                }
                if (
                    readOnly &&
                    (channelType === ChannelType.GuildText ||
                        channelType === ChannelType.GuildAnnouncement)
                ) {
                    channelOptions.permissionOverwrites = [
                        {
                            id: interaction.guild.roles.everyone.id,
                            deny: [
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.CreatePublicThreads,
                                PermissionFlagsBits.CreatePrivateThreads,
                                PermissionFlagsBits.AddReactions,
                            ],
                        },
                    ];
                } else if (readOnly) {
                    console.log(
                        `Note: readonly=true ignored for channel type ${ChannelType[channelType]}`
                    );
                }

                const newChannel = await interaction.guild.channels.create(
                    channelOptions
                );
                await interaction.editReply({
                    content: `Successfully created ${ChannelType[channelType]} channel: <#${newChannel.id}>`,
                    flags: MessageFlags.Ephemeral,
                });
                await logAction(interaction.guild, `**Created Channel**\nCreated ${newChannel.name} by ${interaction.user.tag}`);
            } catch (error) {
                console.error(
                    `Error creating channel "${channelName}":`,
                    error
                );
                await interaction.editReply({
                    content: "There was an error trying to create the channel.",
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
        // ============================
        // === MANAGE Subcommand ==
        // ============================
        else if (subcommand === "manage") {
            const targetChannel = interaction.options.getChannel("channel");
            const newName = interaction.options.getString("rename");
            const targetMentionable =
                interaction.options.getMentionable("target");

            // If a new name was provided, rename the channel
            if (newName !== null) {
                try {
                    const oldName = targetChannel.name;
                    await targetChannel.setName(
                        newName,
                        `Renamed by ${interaction.user.tag}`
                    );
                    await interaction.editReply({
                        content: `Successfully renamed channel from "${oldName}" to "${newName}" (<#${targetChannel.id}>).`,
                        flags: MessageFlags.Ephemeral,
                    });
                    await logAction(interaction.guild, `**Renamed Channel**\nRenamed ${oldName} to ${newName} by ${interaction.user.tag}`);
                    // If no target was provided, we're done
                    if (!targetMentionable) return;
                } catch (error) {
                    console.error(
                        `Error renaming channel ${targetChannel.name} to ${newName}:`,
                        error
                    );
                    await interaction.editReply({
                        content:
                            "An error occurred while renaming the channel. Check my permissions.",
                        flags: MessageFlags.Ephemeral,
                    });
                    // Continue with permissions if a target was provided
                    if (!targetMentionable) return;
                }
            }

            // If a role or user was provided directly
            if (targetMentionable) {
                try {
                    // Determine if it's a role or user
                    const isRole =
                        targetMentionable.constructor.name === "Role";
                    const isUser =
                        targetMentionable.constructor.name === "User";
                    let targetId = targetMentionable.id;
                    let mentionableType = isRole ? "role" : "user";
                    let mentionString = isRole
                        ? `<@&${targetId}>`
                        : `<@${targetId}>`;

                    // For users, we need the GuildMember
                    if (isUser) {
                        const member = await interaction.guild.members
                            .fetch(targetId)
                            .catch(() => null);
                        if (!member) {
                            return interaction.editReply({
                                content: `Could not find ${mentionableType} ${mentionString} in this server.`,
                                flags: MessageFlags.Ephemeral,
                            });
                        }
                        // Use the member ID for permission overwrites
                        targetId = member.id;
                    }

                    // Incremental Approach: Modify existing overwrites
                    const currentOverwrites =
                        targetChannel.permissionOverwrites.cache.get(targetId);
                    let allowBits = currentOverwrites
                        ? new PermissionsBitField(currentOverwrites.allow)
                        : new PermissionsBitField();
                    let denyBits = currentOverwrites
                        ? new PermissionsBitField(currentOverwrites.deny)
                        : new PermissionsBitField();

                    let changesMade = false;

                    // Iterate and modify BitFields
                    for (const optionName of Object.keys(permissionMap)) {
                        const setting =
                            interaction.options.getString(optionName);
                        if (setting === null) continue;
                        changesMade = true;
                        const flag = permissionMap[optionName];
                        if (setting === "allow") {
                            allowBits.add(flag);
                            denyBits.remove(flag);
                        } else if (setting === "deny") {
                            allowBits.remove(flag);
                            denyBits.add(flag);
                        } else if (setting === "inherit") {
                            allowBits.remove(flag);
                            denyBits.remove(flag);
                        }
                    }

                    if (!changesMade) {
                        return interaction.editReply({
                            content: "No permission changes were specified.",
                            flags: MessageFlags.Ephemeral,
                        });
                    }

                    // Apply the edited permissions - convert to permission object format that Discord.js expects
                    const permissionOverwrites = {};

                    // Map permissions to their correct Discord.js permission names
                    for (const [optionName, flagBit] of Object.entries(
                        permissionMap
                    )) {
                        // Find the actual permission name from PermissionFlagsBits
                        const permName = Object.entries(
                            PermissionFlagsBits
                        ).find(([name, bit]) => bit === flagBit)?.[0];

                        if (!permName) continue;

                        if (allowBits.has(flagBit)) {
                            permissionOverwrites[permName] = true;
                        } else if (denyBits.has(flagBit)) {
                            permissionOverwrites[permName] = false;
                        }
                    }

                    await targetChannel.permissionOverwrites.edit(
                        targetId,
                        permissionOverwrites,
                        {
                            reason: `Channel permissions updated by ${interaction.user.tag} (${interaction.id})`,
                        }
                    );

                    await interaction.editReply({
                        content: `Successfully updated permissions for ${mentionableType} ${mentionString} in channel <#${targetChannel.id}>.`,
                        flags: MessageFlags.Ephemeral,
                    });
                    await logAction(interaction.guild, `**Updated Permissions**\nUpdated permissions for ${mentionableType} in ${targetChannel.name} by ${interaction.user.tag}`);
                } catch (error) {
                    console.error(
                        `Error updating permissions in channel ${targetChannel.id}:`,
                        error
                    );
                    await interaction.editReply({
                        content:
                            "An error occurred while updating permissions. Check channel hierarchy and bot permissions.",
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }
            // If no target was provided, show a combined role/user select menu
            else if (!newName) {
                // Only show this if no rename was done
                try {
                    // Create selection rows
                    const roleRow = new ActionRowBuilder().addComponents(
                        new RoleSelectMenuBuilder()
                            .setCustomId("role-select-menu")
                            .setPlaceholder(
                                "Select a role to configure permissions for"
                            )
                    );

                    const userRow = new ActionRowBuilder().addComponents(
                        new UserSelectMenuBuilder()
                            .setCustomId("user-select-menu")
                            .setPlaceholder(
                                "Select a user to configure permissions for"
                            )
                    );

                    // Send message with both selection menus
                    const response = await interaction.editReply({
                        content: `Select a role or user to configure permissions for in <#${targetChannel.id}>:`,
                        components: [roleRow, userRow],
                        flags: MessageFlags.Ephemeral,
                    });

                    // Create a collector for both menus
                    const collector = response.createMessageComponentCollector({
                        filter: (i) => i.user.id === interaction.user.id,
                        time: 60000, // 1 minute timeout
                    });

                    collector.on("collect", async (i) => {
                        await i.deferUpdate();

                        if (
                            (i.componentType === ComponentType.RoleSelect ||
                                i.componentType === ComponentType.UserSelect) &&
                            i.values.length === 0
                        ) {
                            await interaction.editReply({
                                content:
                                    "No selection was made. Command cancelled.",
                                components: [],
                                flags: MessageFlags.Ephemeral,
                            });
                            return collector.stop();
                        }

                        let selectedId,
                            selectedName,
                            isUser = false;

                        // Handle role selection
                        if (i.componentType === ComponentType.RoleSelect) {
                            selectedId = i.values[0];
                            const role =
                                interaction.guild.roles.cache.get(selectedId);
                            if (!role) {
                                await interaction.editReply({
                                    content:
                                        "Selected role could not be found. Please try again.",
                                    components: [],
                                    flags: MessageFlags.Ephemeral,
                                });
                                return collector.stop();
                            }
                            selectedName = role.name;
                        }
                        // Handle user selection
                        else if (i.componentType === ComponentType.UserSelect) {
                            selectedId = i.values[0];
                            const user = await interaction.client.users
                                .fetch(selectedId)
                                .catch(() => null);
                            if (!user) {
                                await interaction.editReply({
                                    content:
                                        "Selected user could not be found. Please try again.",
                                    components: [],
                                    flags: MessageFlags.Ephemeral,
                                });
                                return collector.stop();
                            }
                            selectedName = user.tag;
                            isUser = true;
                        }

                        // Display current permissions and options to change them
                        const currentOverwrites =
                            targetChannel.permissionOverwrites.cache.get(
                                selectedId
                            );
                        const currentAllowBits = currentOverwrites
                            ? new PermissionsBitField(currentOverwrites.allow)
                            : new PermissionsBitField();
                        const currentDenyBits = currentOverwrites
                            ? new PermissionsBitField(currentOverwrites.deny)
                            : new PermissionsBitField();

                        // Create permission option buttons
                        const settingsMessage =
                            `Selected ${isUser ? "user" : "role"
                            }: **${selectedName}** for channel **<#${targetChannel.id
                            }>**\n\n` +
                            `To configure permissions, use the \`/channel manage\` command with the following options:\n` +
                            `- Set channel to **<#${targetChannel.id}>**\n` +
                            `- Set target to **${isUser
                                ? `<@${selectedId}>`
                                : `<@&${selectedId}>`
                            }**\n` +
                            `- Set the permissions you want to change (allow/deny/inherit)`;

                        await interaction.editReply({
                            content: settingsMessage,
                            components: [],
                            flags: MessageFlags.Ephemeral,
                        });

                        // Create a new slash command suggestion for them
                        const commandSuggestion = `/channel manage channel:<#${targetChannel.id
                            }> target:${isUser ? `<@${selectedId}>` : `<@&${selectedId}>`
                            }`;

                        await interaction.followUp({
                            content: `You can run this command:\n\`${commandSuggestion}\``,
                            ephemeral: true,
                        });

                        collector.stop();
                    });

                    collector.on("end", (collected, reason) => {
                        if (reason === "time" && collected.size === 0) {
                            interaction
                                .editReply({
                                    content:
                                        "Selection timed out. Command cancelled.",
                                    components: [],
                                    flags: MessageFlags.Ephemeral,
                                })
                                .catch(() => { });
                        }
                    });
                } catch (error) {
                    console.error("Error creating selection menu:", error);
                    await interaction.editReply({
                        content:
                            "An error occurred while setting up the selection menu. Please try again.",
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }
        }
        // ============================
        // === SYNC Subcommand ===
        // ============================
        else if (subcommand === "sync") {
            const category = interaction.options.getChannel("category");

            // Basic checks
            if (!category || category.type !== ChannelType.GuildCategory) {
                return interaction.editReply({
                    content: "Invalid category specified.",
                    flags: MessageFlags.Ephemeral,
                });
            }
            if (
                !interaction.memberPermissions.has(
                    PermissionsBitField.Flags.ManageChannels
                )
            ) {
                return interaction.editReply({
                    content:
                        "You need the Manage Channels permission to sync permissions.",
                    flags: MessageFlags.Ephemeral,
                });
            }
            if (
                !interaction.appPermissions.has(
                    PermissionsBitField.Flags.ManageChannels
                ) ||
                !interaction.appPermissions.has(
                    PermissionsBitField.Flags.ManageRoles
                )
            ) {
                return interaction.editReply({
                    content:
                        "I need both Manage Channels and Manage Roles permissions to sync permissions.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            try {
                // Get category permissions to copy
                const categoryPermissions = category.permissionOverwrites.cache;

                // Filter channels belonging to this category
                const channelsInCategory =
                    interaction.guild.channels.cache.filter(
                        (channel) => channel.parentId === category.id
                    );

                if (channelsInCategory.size === 0) {
                    return interaction.editReply({
                        content: "No channels found in this category to sync.",
                        flags: MessageFlags.Ephemeral,
                    });
                }

                let syncedCount = 0;
                let failedCount = 0;
                let failedChannels = [];

                // Process each channel
                for (const channel of channelsInCategory.values()) {
                    try {
                        // Apply the *exact* same overwrites from the category
                        // Using `.set()` replaces all existing overwrites on the channel
                        await channel.permissionOverwrites.set(
                            categoryPermissions.map((p) => ({
                                // Map to the expected format
                                id: p.id,
                                type: p.type,
                                allow: p.allow.bitfield,
                                deny: p.deny.bitfield,
                            })),
                            `Synced with category by ${interaction.user.tag}`,
                            {
                                reason: `Synced with category by ${interaction.user.tag}`,
                            }
                        );
                        syncedCount++;
                        await wait(1100); // Rate limit delay
                    } catch (channelError) {
                        console.error(
                            `Error syncing channel ${channel.name} (${channel.id}) to category ${category.name} (${category.id}):`,
                            channelError
                        );
                        failedCount++;
                        failedChannels.push(channel.name);
                    }
                }

                let replyMessage = `Synced permissions for ${syncedCount} channel(s) with category <#${category.id}>.`;
                if (failedCount > 0) {
                    replyMessage += `\n⚠️ Failed to sync ${failedCount} channel(s):\n${failedChannels.map(c => `- ${c}`).join("\n")}`;
                }

                await interaction.editReply({
                    content: replyMessage,
                    flags: MessageFlags.Ephemeral,
                });
                await logAction(interaction.guild, `**Synced Permissions**\nSynced ${syncedCount} channels with category ${category.name} by ${interaction.user.tag}`);
            } catch (error) {
                console.error(
                    `Error syncing permissions for category ${category.id}:`,
                    error
                );
                await interaction.editReply({
                    content: "An error occurred while syncing permissions.",
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
        // ============================
        // === DELETE Subcommand ===
        // ============================
        else if (subcommand === "delete") {
            const targetChannel = interaction.options.getChannel("channel");
            const deleteAll =
                interaction.options.getBoolean("delete_all") || false;

            // If a channel was provided directly
            if (targetChannel) {
                const isCategory = targetChannel?.type === ChannelType.GuildCategory;
                const prompt = isCategory && deleteAll 
                    ? `Are you sure you want to delete category "${targetChannel.name}" and ALL its channels?`
                    : `Are you sure you want to delete ${isCategory ? "category" : "channel"} "${targetChannel.name}"?`;
                
                const confirmed = await confirmAction(interaction, prompt);
                if (!confirmed) return;

                try {

                    // If it's a category and deleteAll is true, delete all child channels first
                    if (isCategory && deleteAll) {
                        const childChannels =
                            interaction.guild.channels.cache.filter(
                                (channel) =>
                                    channel?.parentId === targetChannel.id
                            );

                        if (childChannels.size > 0) {
                            await interaction.editReply({
                                content: `Deleting ${childChannels.size} channels from category ${targetChannel.name}...`,
                                flags: MessageFlags.Ephemeral,
                            });

                            let deletedCount = 0;
                            let failedCount = 0;
                            let failedChannels = [];

                            // Delete each child channel
                            for (const channel of childChannels.values()) {
                                if (!channel) continue;
                                if (channel.messages) {
                                    const msgs = await channel.messages.fetch({ limit: 1 }).catch(() => null);
                                    if (msgs && msgs.size > 0) {
                                        failedCount++;
                                        failedChannels.push(`${channel.name} (Has Messages)`);
                                        continue;
                                    }
                                }
                                try {
                                    await channel.delete(
                                        `Deleted by ${interaction.user.tag} as part of category deletion`
                                    );
                                    deletedCount++;
                                    await wait(1100); // Rate limit delay
                                } catch (error) {
                                    console.error(
                                        `Failed to delete channel ${channel.name} (${channel.id}):`,
                                        error
                                    );
                                    failedCount++;
                                    failedChannels.push(channel.name);
                                }
                            }

                            // If we had failures, report them
                            if (failedCount > 0) {
                                await interaction
                                    .editReply({
                                        content:
                                            `Deleted ${deletedCount} channels from category ${targetChannel.name}.\n` +
                                            `\n⚠️ Failed to delete ${failedCount} channels:\n${failedChannels.map(c => `- ${c}`).join("\n")}` +
                                            `\nNow attempting to delete the category...`,
                                        flags: MessageFlags.Ephemeral,
                                    })
                                    .catch((err) => {
                                        console.error(
                                            "Failed to send progress update about channel deletion:",
                                            err
                                        );
                                    });
                            } else {
                                await interaction
                                    .editReply({
                                        content: `Successfully deleted all ${deletedCount} channels from category ${targetChannel.name}. Now deleting the category...`,
                                        flags: MessageFlags.Ephemeral,
                                    })
                                    .catch((err) => {
                                        console.error(
                                            "Failed to send progress update about channel deletion:",
                                            err
                                        );
                                    });
                            }
                        }
                    }

                    // Now delete the target itself
                    if (targetChannel.messages) {
                        const msgs = await targetChannel.messages.fetch({ limit: 1 }).catch(() => null);
                        if (msgs && msgs.size > 0) {
                            return interaction.editReply({
                                content: `Cannot delete channel "${targetChannel.name}" because it contains messages.`,
                                flags: MessageFlags.Ephemeral
                            });
                        }
                    }
                    const channelName = targetChannel.name;
                    const channelType = targetChannel?.type;
                    const channelId = targetChannel.id;

                    try {
                        await targetChannel.delete(
                            `Deleted by ${interaction.user.tag} using the channel delete command`
                        );
                        await logAction(interaction.guild, `**Deleted Channel**\nDeleted ${channelName} by ${interaction.user.tag}`);

                        // Final response message
                        let finalMessage = `Successfully deleted ${channelType === ChannelType.GuildCategory
                            ? "category"
                            : "channel"
                            } "${channelName}" (was <#${channelId}>).`;
                        if (isCategory && deleteAll) {
                            finalMessage = `Successfully deleted category "${channelName}" and its channels.`;
                        }

                        await interaction.editReply({
                            content: finalMessage,
                            flags: MessageFlags.Ephemeral,
                        });
                    } catch (deleteError) {
                        console.error(
                            `Error deleting channel ${targetChannel?.name || "unknown"
                            } (${targetChannel?.id || "unknown"}):`,
                            deleteError
                        );
                        await interaction
                            .editReply({
                                content: `An error occurred while deleting the channel. Check permissions.`,
                                flags: MessageFlags.Ephemeral,
                            })
                            .catch((err) => {
                                console.error(
                                    "Failed to send error message after deletion failure:",
                                    err
                                );
                            });
                    }
                } catch (error) {
                    console.error(
                        `Error in delete command for channel ${targetChannel?.name || "unknown"
                        } (${targetChannel?.id || "unknown"}):`,
                        error
                    );
                    await interaction
                        .editReply({
                            content: `An error occurred while processing the delete command. Check permissions.`,
                            flags: MessageFlags.Ephemeral,
                        })
                        .catch((err) => {
                            console.error(
                                "Failed to send error message for delete command:",
                                err
                            );
                        });
                }
            }
            // If no channel was provided, show a channel select menu
            else {
                try {
                    // Create a channel select menu
                    const row = new ActionRowBuilder().addComponents(
                        new ChannelSelectMenuBuilder()
                            .setCustomId("channel-delete-menu")
                            .setPlaceholder("Select channels to delete")
                            .setMinValues(1)
                            .setMaxValues(10) // Allow up to 10 channels at once
                    );

                    // Add a confirmation button
                    const confirmRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId("confirm-delete")
                            .setLabel("Confirm Deletion")
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId("cancel-delete")
                            .setLabel("Cancel")
                            .setStyle(ButtonStyle.Secondary)
                    );

                    // Send message with the channel select menu
                    const response = await interaction
                        .editReply({
                            content: "Select the channels you want to delete:",
                            components: [row],
                            flags: MessageFlags.Ephemeral,
                        })
                        .catch((err) => {
                            console.error(
                                "Failed to send initial channel delete selection menu:",
                                err
                            );
                            throw err; // Rethrow
                        });

                    // Create collectors
                    const channelCollector =
                        response.createMessageComponentCollector({
                            filter: (i) =>
                                i.customId === "channel-delete-menu" &&
                                i.user.id === interaction.user.id,
                            time: 60000, // 1 minute timeout
                        });

                    let selectedChannels = [];
                    let selectedChannelObjects = [];

                    channelCollector.on("collect", async (i) => {
                        await i
                            .deferUpdate()
                            .catch((err) =>
                                console.error(
                                    "Failed defer update channel select delete:",
                                    err
                                )
                            );
                        selectedChannels = i.values;
                        selectedChannelObjects = selectedChannels
                            .map((id) =>
                                interaction.guild.channels.cache.get(id)
                            )
                            .filter((c) => c);

                        // Check if any channels were selected
                        if (selectedChannels.length === 0) {
                            await interaction
                                .editReply({
                                    content: "No channels were selected.",
                                    components: [],
                                    flags: MessageFlags.Ephemeral,
                                })
                                .catch((err) =>
                                    console.error(
                                        "Failed editReply no channels selected delete:",
                                        err
                                    )
                                );
                            return channelCollector.stop();
                        }

                        // Show confirmation with selected channel names
                        const channelNames = selectedChannelObjects
                            .map((ch) => `- ${ch.name}`)
                            .join("\n");
                        await interaction
                            .editReply({
                                content: `You are about to delete ${selectedChannels.length} channel(s):\n${channelNames}\n⚠️ **This action cannot be undone!** Are you sure?`,
                                components: [confirmRow],
                                flags: MessageFlags.Ephemeral,
                            })
                            .catch((err) =>
                                console.error(
                                    "Failed editReply confirm delete selection:",
                                    err
                                )
                            );

                        // Stop the channel collector as we now need confirmation
                        channelCollector.stop("channels_selected");
                    });

                    // When channels are selected, start confirmation collector
                    channelCollector.on("end", (collected, reason) => {
                        if (reason === "time" && collected.size === 0) {
                            interaction
                                .editReply({
                                    content:
                                        "Channel selection timed out. No channels were deleted.",
                                    components: [],
                                    flags: MessageFlags.Ephemeral,
                                })
                                .catch(() => { });
                        } else if (reason === "channels_selected") {
                            // Start the confirmation collector
                            const confirmCollector =
                                response.createMessageComponentCollector({
                                    filter: (i) =>
                                        (i.customId === "confirm-delete" ||
                                            i.customId === "cancel-delete") &&
                                        i.user.id === interaction.user.id,
                                    time: 30000, // 30 seconds to confirm
                                    max: 1, // Only collect one interaction
                                });

                            confirmCollector.on("collect", async (i) => {
                                await i.deferUpdate().catch((err) => {
                                    console.error(
                                        "Failed to defer update in confirmation collector:",
                                        err
                                    );
                                });

                                // Handle cancel
                                if (i.customId === "cancel-delete") {
                                    await interaction
                                        .editReply({
                                            content:
                                                "Channel deletion cancelled.",
                                            components: [],
                                            flags: MessageFlags.Ephemeral,
                                        })
                                        .catch((err) => {
                                            console.error(
                                                "Failed to send cancelation message:",
                                                err
                                            );
                                        });
                                    return;
                                }

                                // Handle confirm
                                if (i.customId === "confirm-delete") {
                                    await interaction
                                        .editReply({
                                            content: `Deleting ${selectedChannels.length} channels... This may take a moment.`,
                                            components: [],
                                            flags: MessageFlags.Ephemeral,
                                        })
                                        .catch((err) => {
                                            console.error(
                                                "Failed to send deletion progress message:",
                                                err
                                            );
                                        });

                                    let successCount = 0;
                                    let errorCount = 0;
                                    let errorChannels = [];

                                    // Process each selected channel
                                    for (const channel of selectedChannelObjects) {
                                        // Skip if channel no longer exists
                                        if (!channel) {
                                            errorCount++;
                                            errorChannels.push(
                                                "Unknown Channel"
                                            );
                                            continue;
                                        }

                                        if (channel.messages) {
                                            const msgs = await channel.messages.fetch({ limit: 1 }).catch(() => null);
                                            if (msgs && msgs.size > 0) {
                                                errorCount++;
                                                errorChannels.push(`${channel.name} (Has Messages)`);
                                                continue;
                                            }
                                        }

                                        try {
                                            // Delete the channel
                                            const channelName = channel.name;
                                            await channel.delete(
                                                `Deleted by ${interaction.user.tag} using channel delete command`
                                            );
                                            successCount++;
                                            await logAction(interaction.guild, `**Deleted Channel**\nDeleted ${channelName} by ${interaction.user.tag}`);
                                        } catch (error) {
                                            console.error(
                                                `Error deleting channel ${channel?.name || "unknown"
                                                } (${channel?.id || "unknown"
                                                }):`,
                                                error
                                            );
                                            errorCount++;
                                            errorChannels.push(
                                                channel?.name ||
                                                "Unknown Channel"
                                            );
                                        }
                                    }

                                    // Prepare result message
                                    let resultMessage = `Results of channel deletion:\n✅ Successfully deleted: ${successCount} channel(s)`;

                                    if (errorCount > 0) {
                                        resultMessage += `\n❌ Failed to delete: ${errorCount} channel(s):\n${errorChannels.map(e => `- ${e}`).join("\n")}`;
                                    }

                                    // Update with the final results
                                    await interaction
                                        .editReply({
                                            content: resultMessage,
                                            components: [],
                                            flags: MessageFlags.Ephemeral,
                                        })
                                        .catch((err) => {
                                            console.error(
                                                "Failed to send final results message:",
                                                err
                                            );
                                        });
                                }
                            });

                            confirmCollector.on("end", (collected, reason) => {
                                if (reason === "time" && collected.size === 0) {
                                    interaction
                                        .editReply({
                                            content:
                                                "Confirmation timed out. No channels were deleted.",
                                            components: [],
                                            flags: MessageFlags.Ephemeral,
                                        })
                                        .catch(() => { });
                                }
                            });
                        }
                    });
                } catch (error) {
                    console.error(
                        "Error creating channel deletion menu:",
                        error
                    );
                    await interaction.editReply({
                        content:
                            "An error occurred while setting up the channel deletion menu. Please try again.",
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }
        }

        // ============================
        // === CLEAR Subcommand ===
        // ============================
        else if (subcommand === "clear") {
            const targetChannel = interaction.options.getChannel("channel");

            // If a channel was provided directly
            if (targetChannel) {
                const prompt = `Are you sure you want to clear all permission overwrites from "${targetChannel.name}"?`;
                const confirmed = await confirmAction(interaction, prompt);
                if (!confirmed) return;

                try {
                    // Clear all permission overwrites by setting an empty array
                    await targetChannel.permissionOverwrites.set(
                        [],
                        `Permission overwrites cleared by ${interaction.user.tag}`
                    );
                    await logAction(interaction.guild, `**Cleared Permissions**\nCleared all permissions for ${targetChannel.name} by ${interaction.user.tag}`);

                    await interaction
                        .editReply({
                            content: `Successfully cleared all permission overwrites from <#${targetChannel.id}>.`,
                            flags: MessageFlags.Ephemeral,
                        })
                        .catch((err) => {
                            console.error(
                                "Failed to send confirmation after clearing permissions:",
                                err
                            );
                        });
                } catch (error) {
                    console.error(
                        `Error clearing permission overwrites for channel ${targetChannel?.name || "unknown"
                        } (${targetChannel?.id || "unknown"}):`,
                        error
                    );
                    await interaction
                        .editReply({
                            content:
                                "An error occurred while clearing permission overwrites. Check my permissions.",
                            flags: MessageFlags.Ephemeral,
                        })
                        .catch((err) => {
                            console.error(
                                "Failed to send error message after clearing failure:",
                                err
                            );
                        });
                }
            }
            // If no channel was provided, show a channel select menu
            else {
                try {
                    // Create a channel select menu
                    const row = new ActionRowBuilder().addComponents(
                        new ChannelSelectMenuBuilder()
                            .setCustomId("channel-clear-menu")
                            .setPlaceholder(
                                "Select channels to clear permission overwrites from"
                            )
                            .setMinValues(1)
                            .setMaxValues(10) // Allow up to 10 channels at once
                    );

                    // Send message with the channel select menu
                    const response = await interaction
                        .editReply({
                            content:
                                "Select the channels you want to clear all permission overwrites from:",
                            components: [row],
                            flags: MessageFlags.Ephemeral,
                        })
                        .catch((err) => {
                            console.error(
                                "Failed to send channel selection menu:",
                                err
                            );
                            throw err; // Re-throw to be caught by outer try/catch
                        });

                    // Create a collector for the select menu interaction
                    const collector = response.createMessageComponentCollector({
                        filter: (i) => i.user.id === interaction.user.id,
                        time: 60000, // 1 minute timeout
                        componentType: ComponentType.ChannelSelect,
                    });

                    collector.on("collect", async (i) => {
                        await i.deferUpdate().catch((err) => {
                            console.error(
                                "Failed to defer update in channel select collector:",
                                err
                            );
                        });

                        const selectedChannels = i.values;

                        if (selectedChannels.length === 0) {
                            await interaction
                                .editReply({
                                    content: "No channels were selected.",
                                    components: [],
                                    flags: MessageFlags.Ephemeral,
                                })
                                .catch((err) => {
                                    console.error(
                                        "Failed to send no channels selected message:",
                                        err
                                    );
                                });
                            return collector.stop();
                        }

                        collector.stop();

                        const prompt = `Are you sure you want to clear all permission overwrites from ${selectedChannels.length} channel(s)?`;
                        const confirmed = await confirmAction(i, prompt);
                        if (!confirmed) return;

                        let successCount = 0;
                        let errorCount = 0;
                        let errorChannels = [];

                        // Process each selected channel
                        for (const channelId of selectedChannels) {
                            const channel =
                                interaction.guild.channels.cache.get(channelId);

                            if (!channel) {
                                errorCount++;
                                errorChannels.push(`Unknown Channel`);
                                continue;
                            }

                            try {
                                // Clear the channel's permission overwrites
                                await channel.permissionOverwrites.set(
                                    [],
                                    `Permission overwrites cleared by ${interaction.user.tag}`
                                );
                                successCount++;
                            } catch (error) {
                                console.error(
                                    `Error clearing permission overwrites for channel ${channel?.name || "unknown"
                                    } (${channel?.id || "unknown"}):`,
                                    error
                                );
                                errorCount++;
                                errorChannels.push(
                                    channel?.name || "Unknown Channel"
                                );
                            }
                        }

                        // Prepare result message
                        let resultMessage = `Results of clearing permission overwrites:\n✅ Successfully cleared: ${successCount} channel(s)`;

                        if (errorCount > 0) {
                            resultMessage += `\n❌ Failed to clear: ${errorCount} channel(s):\n${errorChannels.map(e => `- ${e}`).join("\n")}`;
                        }

                        // Update the message with results
                        await interaction
                            .editReply({
                                content: resultMessage,
                                components: [], // Remove the select menu
                                flags: MessageFlags.Ephemeral,
                            })
                            .catch((err) => {
                                console.error(
                                    "Failed to send results of clearing permissions:",
                                    err
                                );
                            });
                        await logAction(interaction.guild, `**Cleared Permissions**\nCleared all permissions for ${successCount} channels by ${interaction.user.tag}`);
                    });

                    collector.on("end", (collected, reason) => {
                        if (reason === "time" && collected.size === 0) {
                            interaction
                                .editReply({
                                    content:
                                        "Channel selection timed out. No permission overwrites were cleared.",
                                    components: [],
                                    flags: MessageFlags.Ephemeral,
                                })
                                .catch(() => { });
                        }
                    });
                } catch (error) {
                    console.error("Error creating channel select menu:", error);
                    await interaction
                        .editReply({
                            content:
                                "An error occurred while setting up the channel selection. Please try again.",
                            flags: MessageFlags.Ephemeral,
                        })
                        .catch((err) => {
                            console.error(
                                "Failed to send error message for clear command:",
                                err
                            );
                        });
                }
            }
        }
        // ============================
        // === DIVIDER Subcommand Group ===
        // ============================
        else if (subcommandGroup === "divider") {
            const dividerType = interaction.options.getString('divider_type');
            const customDivider = interaction.options.getString('custom_divider');

            let dividerSymbol = dividerType;
            const isUndo = dividerType === 'undo';

            // Validate and get custom divider
            if (dividerType === 'custom') {
                if (!customDivider) {
                    return interaction.editReply({ content: 'You must provide a symbol for the `custom_divider` option when selecting type Custom.', flags: MessageFlags.Ephemeral });
                }
                dividerSymbol = customDivider.trim();
            }

            let targetChannels = [];
            let scopeDescription = '';

            try {
                // --- Determine Target Channels based on Subcommand --- 
                if (subcommand === 'server') {
                    scopeDescription = 'the entire server';
                    targetChannels = interaction.guild.channels.cache.filter(ch =>
                        RENAMEABLE_CHANNEL_TYPES.includes(ch.type)
                    ).map(ch => ch); 

                } else if (subcommand === 'category') {
                    const categoryId = interaction.options.getString('target_category');
                    const category = interaction.guild.channels.cache.get(categoryId);

                    if (!category || category.type !== ChannelType.GuildCategory) {
                        return interaction.editReply({ content: `Invalid category selection (ID: ${categoryId}). Please choose a valid category.`, flags: MessageFlags.Ephemeral });
                    }
                    scopeDescription = `category "${category.name}"`;
                    targetChannels = interaction.guild.channels.cache.filter(ch =>
                        RENAMEABLE_CHANNEL_TYPES.includes(ch.type) && ch.parentId === categoryId
                    ).map(ch => ch); 

                } else if (subcommand === 'channel') {
                    const channel = interaction.options.getChannel('target_channel');
                    if (!RENAMEABLE_CHANNEL_TYPES.includes(channel.type)) {
                        return interaction.editReply({ content: `Cannot apply divider to channel type: ${ChannelType[channel.type]}.`, flags: MessageFlags.Ephemeral });
                    }
                    scopeDescription = `channel ${channel.toString()}`;
                    targetChannels.push(channel);
                }

                if (targetChannels.length === 0) {
                    return interaction.editReply({ content: `No applicable channels found for scope: ${scopeDescription}.`, flags: MessageFlags.Ephemeral });
                }

                // --- Process Channels --- 
                let renamedCount = 0;
                let skippedCount = 0;
                let failedCount = 0;

                const actionText = isUndo ? "Removing first character from" : `Applying divider "${dividerSymbol}" to`;
                await interaction.editReply({ content: `${actionText} ${targetChannels.length} channel(s) in ${scopeDescription}... (This may take time)`, flags: MessageFlags.Ephemeral });

                for (const channel of targetChannels) {
                    try {
                        let newName;

                        if (isUndo) {
                            if (channel.name.length <= 1) {
                                skippedCount++;
                                continue;
                            }
                            newName = channel.name.substring(1);
                        } else {
                            if (channel.name.startsWith(dividerSymbol)) {
                                skippedCount++;
                                continue;
                            }
                            newName = dividerSymbol + channel.name;
                            if (newName.length > 100) {
                                failedCount++;
                                continue;
                            }
                        }

                        await channel.edit({ name: newName }, `Divider command by ${interaction.user.tag}`);
                        renamedCount++;
                        await wait(1100);
                    } catch (error) {
                        console.error(`Failed to rename channel ${channel.name} (${channel.id}):`, error);
                        failedCount++;
                    }
                }

                // --- Final Reply --- 
                let finalMessage = `${isUndo ? "Undo" : "Divider"} process finished for ${scopeDescription}.\n- Renamed: ${renamedCount}\n- Skipped${!isUndo ? " (Already Prefixed)" : ""}: ${skippedCount}\n- Failed/Errors: ${failedCount}`;
                await interaction.editReply({ content: finalMessage, flags: MessageFlags.Ephemeral });

            } catch (error) {
                console.error(`Error in divider command (${subcommand}):`, error);
                await interaction.editReply({ content: 'An unexpected error occurred processing the command.', flags: MessageFlags.Ephemeral }).catch(console.error);
            }
        }
    },
};

/**
 * A helper function to clone a single channel with all its properties.
 * @param {import('discord.js').GuildChannel} sourceChannel The channel to clone.
 * @param {import('discord.js').Guild} targetGuild The guild to clone the channel to.
 * @param {string | null} targetParentId The ID of the new parent category, if any.
 * @param {object} options Additional options for cloning.
 * @param {import('discord.js').CommandInteraction} options.interaction The interaction instance for follow-ups.
 * @param {boolean} options.shouldCopyPosts Whether to copy forum posts.
 * @param {string} options.postDescription The description for copied forum posts.
 * @param {Map<string, Array<{emoji: string, tagName: string}>>} options.skippedEmojis A map to store info about skipped emojis.
 */
async function cloneChannel(
    sourceChannel,
    targetGuild,
    targetParentId,
    options
) {
    const { interaction, shouldCopyPosts, postDescription, skippedEmojis } =
        options;

    // --- 1. Prepare base channel options ---
    const channelOptions = {
        name: sourceChannel.name,
        type: sourceChannel.type,
        topic: sourceChannel.topic,
        nsfw: sourceChannel.nsfw,
        parent: targetParentId,
        permissionOverwrites: sourceChannel.permissionOverwrites.cache.map(
            (po) => po.toJSON()
        ),
        position: sourceChannel.position,
        rateLimitPerUser: sourceChannel.rateLimitPerUser || 0,
    };

    // --- 2. Add type-specific options ---
    if (sourceChannel.type === ChannelType.GuildVoice) {
        channelOptions.bitrate = sourceChannel.bitrate;
        channelOptions.userLimit = sourceChannel.userLimit;
        channelOptions.rtcRegion = sourceChannel.rtcRegion;
    }
    if (sourceChannel.type === ChannelType.GuildForum) {
        // Handle available tags
        channelOptions.availableTags = sourceChannel.availableTags.map(
            (tag) => {
                const newTag = {
                    name: tag.name,
                    moderated: tag.moderated,
                };

                if (tag.emoji) {
                    // A custom emoji will have an ID. A unicode emoji will not.
                    // We only want to clone unicode emojis to prevent cross-server errors.
                    if (!tag.emoji.id) {
                        newTag.emoji = {
                            id: null, // Explicitly null for unicode
                            name: tag.emoji.name,
                        };
                    } else {
                        // This is a custom emoji. Record it and skip it.
                        const currentSkipped =
                            skippedEmojis.get(sourceChannel.id) || [];
                        currentSkipped.push({
                            emoji: tag.emoji.toString(),
                            tagName: tag.name,
                        });
                        skippedEmojis.set(sourceChannel.id, currentSkipped);
                    }
                }
                return newTag;
            }
        );

        // Handle default reaction emoji
        if (sourceChannel.defaultReactionEmoji) {
            const reactionEmoji = sourceChannel.defaultReactionEmoji;
            // A custom emoji will have an ID. A unicode emoji will not.
            // We only want to clone unicode emojis.
            if (!reactionEmoji.id) {
                channelOptions.defaultReactionEmoji = {
                    emojiName: reactionEmoji.name,
                };
            } else {
                // This is a custom emoji. Record it and skip it.
                const currentSkipped =
                    skippedEmojis.get(sourceChannel.id) || [];
                currentSkipped.push({
                    emoji: reactionEmoji.toString(),
                    tagName: "(Default Reaction)",
                });
                skippedEmojis.set(sourceChannel.id, currentSkipped);
            }
        }

        channelOptions.defaultAutoArchiveDuration =
            sourceChannel.defaultAutoArchiveDuration;
    }

    // --- 3. Create the channel ---
    const newChannel = await targetGuild.channels.create(channelOptions);
    await wait(1500); // Delay to prevent rate limits

    // --- 4. Handle special cloning for Forum channels ---
    if (sourceChannel.type === ChannelType.GuildForum && shouldCopyPosts) {
        // Create a map to link old tag IDs to new tag IDs
        const tagIdMap = new Map();
        const sourceTags = sourceChannel.availableTags;
        const newTags = newChannel.availableTags;
        for (const sourceTag of sourceTags) {
            const newTag = newTags.find((nt) => nt.name === sourceTag.name);
            if (newTag) {
                tagIdMap.set(sourceTag.id, newTag.id);
            }
        }

        // Fetch both active and archived threads to get all posts
        const activeThreads = await sourceChannel.threads.fetch();
        const archivedThreads = await sourceChannel.threads.fetchArchived();

        // Combine active and archived threads into a single array
        const combinedThreads = [
            ...activeThreads.threads.values(),
            ...archivedThreads.threads.values(),
        ];

        // Sort all threads by their creation date to ensure they are cloned in the correct order
        const allThreads = combinedThreads.sort(
            (a, b) => a.createdTimestamp - b.createdTimestamp
        );

        if (allThreads.length > 0) {
            await interaction
                .followUp({
                    content: `Cloning ${allThreads.length} posts (including closed ones) from **${sourceChannel.name}**...`,
                    flags: MessageFlags.Ephemeral,
                })
                .catch(() =>
                    console.log(
                        "Interaction expired, couldn't send 'cloning posts' follow-up."
                    )
                );
        }

        for (const thread of allThreads) {
            try {
                const newAppliedTagIds = thread.appliedTags
                    .map((tagId) => tagIdMap.get(tagId))
                    .filter(Boolean);
                await newChannel.threads.create({
                    name: thread.name,
                    message: { content: postDescription },
                    appliedTags: newAppliedTagIds,
                });
                await wait(2000); // Rate limit delay per post
            } catch (err) {
                console.error(`Could not clone post "${thread.name}":`, err);
                await interaction
                    .followUp({
                        content: `⚠️ Could not clone post \`${thread.name}\`.`,
                        flags: MessageFlags.Ephemeral,
                    })
                    .catch(() =>
                        console.log(
                            "Interaction expired, couldn't send 'failed to clone post' follow-up."
                        )
                    );
            }
        }
    }
    return newChannel;
}
