const {
    SlashCommandBuilder,
    PermissionsBitField,
    MessageFlags,
    ChannelType,
    PermissionFlagsBits,
    Routes,
} = require("discord.js");
const { REST } = require("@discordjs/rest");
const MESSAGES = {
    server: {
        error_no_permission: ":x_: You do not have permission to manage server settings.",
        auditlog: {
            set: ":checkmark: Audit log channel has been set to <#{channelId}>.",
            disable: ":checkmark: Audit logging has been disabled."
        },
        verification: {
            success: ":checkmark: Successfully set the server verification level to **{levelName}**."
        },
        community: {
            error_already_enabled: ":x_: Community features are already enabled for this server.",
            success_updated: ":checkmark: Community settings updated: {parts}.",
            error_update_failed: ":x_: Failed to update community channels: {error}",
            error_create_rules: ":x_: Failed to create rules channel. Please provide an existing channel or check bot permissions.",
            error_create_updates: ":x_: Failed to create community updates channel. Please provide an existing channel or check bot permissions.",
            success_enabled: ":checkmark: Community features have been enabled! Rules channel set to <#{rulesId}> and updates channel set to <#{updatesId}>.\n*Note: The server verification level was adjusted to at least Low and explicit content filter to All Members to meet requirements.*{createdChannelsInfo}",
            created_channels_info: "\n\nThe following channels were automatically created: {channels}.\nYou may want to customize these channels with appropriate content.",
            error_enable_failed: ":x_: Failed to enable community: {error}",
            success_disabled: ":checkmark: Community features have been disabled for this server.",
            error_disable_failed: ":x_: Failed to disable community features: {error}"
        },
        error_generic: ":x_: Failed to update community settings.",
        error_permissions: " The bot lacks necessary permissions to manage server settings.",
        error_validation: " Invalid form body. Discord API validation failed.",
        error_details: " Details: {details}",
        error_message: " Error: {error}"
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
        .setName("server")
        .setDescription("manage server-level settings")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .setDMPermission(false)
        .addSubcommand((subcommand) =>
            subcommand
                .setName("community")
                .setDescription("toggle community features")
                .addBooleanOption((option) =>
                    option
                        .setName("enabled")
                        .setDescription("enable or disable community")
                        .setRequired(true)
                )
                .addChannelOption((option) =>
                    option
                        .setName("rules_channel")
                        .setDescription("channel for server rules (optional)")
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
                )
                .addChannelOption((option) =>
                    option
                        .setName("updates_channel")
                        .setDescription("channel for community updates (optional)")
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
                )
                .addBooleanOption((option) =>
                    option
                        .setName("ephemeral")
                        .setDescription("Whether the response should be ephemeral (default: true)")
                        .setRequired(false)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("verification")
                .setDescription("set server verification level")
                .addIntegerOption((option) =>
                    option
                        .setName("level")
                        .setDescription("the verification level to set")
                        .setRequired(true)
                        .addChoices(
                            { name: "None (Unrestricted)", value: 0 },
                            { name: "Low (Verified Email)", value: 1 },
                            { name: "Medium (Registered 5+ mins)", value: 2 },
                            { name: "High (Member 10+ mins)", value: 3 },
                            { name: "Highest (Verified Phone)", value: 4 }
                        )
                )
                .addBooleanOption((option) =>
                    option
                        .setName("ephemeral")
                        .setDescription("Whether the response should be ephemeral (default: true)")
                        .setRequired(false)
                )
        )
        .addSubcommandGroup((group) =>
            group
                .setName("auditlog")
                .setDescription("configure the audit logging system")
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("set")
                        .setDescription("set the channel for audit logs")
                        .addChannelOption((option) =>
                            option
                                .setName("channel")
                                .setDescription("the channel to send logs to")
                                .addChannelTypes(ChannelType.GuildText)
                                .setRequired(true)
                        )
                        .addBooleanOption((option) =>
                            option
                                .setName("ephemeral")
                                .setDescription("Whether the response should be ephemeral (default: true)")
                                .setRequired(false)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("disable")
                        .setDescription("disable audit logging")
                        .addBooleanOption((option) =>
                            option
                                .setName("ephemeral")
                                .setDescription("Whether the response should be ephemeral (default: true)")
                                .setRequired(false)
                        )
                )
        ),

    async execute(interaction) {
        // Check permissions (though setDefaultMemberPermissions should handle this)
        if (
            !interaction.memberPermissions.has(
                PermissionsBitField.Flags.ManageGuild
            )
        ) {
            return interaction.reply({
                content: getMessage('server.error_no_permission'),
                flags: MessageFlags.Ephemeral,
            });
        }

        const subcommandGroup = interaction.options.getSubcommandGroup(false);
        const subcommand = interaction.options.getSubcommand();
        // Defer the reply immediately to avoid interaction timeouts
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const guild = interaction.guild;
            const rest = new REST().setToken(process.env.TOKEN);

            if (subcommandGroup === "auditlog") {
                const { setSetting } = require("../../utils/db.js");
                if (subcommand === "set") {
                    const channel = interaction.options.getChannel("channel");
                    await setSetting(guild.id, "auditLogChannel", channel.id);
                    await interaction.editReply(getMessage('server.auditlog.set', { channelId: channel.id }));
                } else if (subcommand === "disable") {
                    await setSetting(guild.id, "auditLogChannel", null);
                    await interaction.editReply(getMessage('server.auditlog.disable'));
                }
                return;
            }

            if (subcommand === "verification") {
                const level = interaction.options.getInteger("level");
                await rest.patch(Routes.guild(guild.id), {
                    body: { verification_level: level }
                });
                const levelNames = ["None", "Low", "Medium", "High", "Highest"];
                await interaction.editReply(getMessage('server.verification.success', { levelName: levelNames[level] }));
                return;
            } else if (subcommand === "community") {
                const enableCommunity = interaction.options.getBoolean("enabled");

                if (enableCommunity) {
                    await guild.fetch();
                    console.log("Guild features after fetch:", guild.features);
                    const isAlreadyEnabled = guild.features.includes("COMMUNITY");
                    let rulesChannel = interaction.options.getChannel("rules_channel");
                    let updatesChannel = interaction.options.getChannel("updates_channel");

                    if (isAlreadyEnabled) {
                        if (!rulesChannel && !updatesChannel) {
                            return interaction.editReply({
                                content: getMessage('server.community.error_already_enabled'),
                            });
                        }

                        try {
                            const body = {};
                            let responseParts = [];
                            if (rulesChannel) {
                                body.rules_channel_id = rulesChannel.id;
                                responseParts.push(`rules channel set to ${rulesChannel}`);
                            }
                            if (updatesChannel) {
                                body.public_updates_channel_id = updatesChannel.id;
                                responseParts.push(`updates channel set to ${updatesChannel}`);
                            }

                            await rest.patch(Routes.guild(guild.id), { body });

                            return interaction.editReply({
                                content: getMessage('server.community.success_updated', { parts: responseParts.join(" and ") }),
                            });
                        } catch (err) {
                            console.error("Error updating community channels:", err);
                            return interaction.editReply({
                                content: getMessage('server.community.error_update_failed', { error: err.message || "Unknown error" }),
                            });
                        }
                    }

                    let createdChannels = [];

                    // Create a rules channel if not provided
                    if (!rulesChannel) {
                        try {
                            rulesChannel = await guild.channels.create({
                                name: "rules",
                                type: ChannelType.GuildText,
                                // Make read-only for regular members
                                permissionOverwrites: [
                                    {
                                        id: guild.roles.everyone.id,
                                        deny: [PermissionFlagsBits.SendMessages],
                                        allow: [PermissionFlagsBits.ViewChannel],
                                    },
                                ],
                            });
                            createdChannels.push("rules");
                        } catch (err) {
                            console.error("Error creating rules channel:", err);
                            return interaction.editReply({
                                content: getMessage('server.community.error_create_rules'),
                            });
                        }
                    }

                    // Create an updates channel if not provided
                    if (!updatesChannel) {
                        try {
                            updatesChannel = await guild.channels.create({
                                name: "community-updates",
                                type: ChannelType.GuildText,
                                // Make read-only for regular members
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
                            createdChannels.push("community-updates");
                        } catch (err) {
                            console.error("Error creating updates channel:", err);
                            return interaction.editReply({
                                content: getMessage('server.community.error_create_updates'),
                            });
                        }
                    }

                    try {
                        // Directly use REST API with the raw string IDs
                        const response = await rest.patch(Routes.guild(guild.id), {
                            body: {
                                features: [
                                    ...guild.features.filter((f) => f !== "COMMUNITY"),
                                    "COMMUNITY",
                                ],
                                rules_channel_id: rulesChannel.id,
                                public_updates_channel_id: updatesChannel.id,
                                verification_level: Math.max(guild.verificationLevel, 1),
                                explicit_content_filter: 2, // 2 is ALL_MEMBERS
                            },
                        });

                        console.log("Community enabled response:", response);

                        let replyContent = getMessage('server.community.success_enabled', { rulesId: rulesChannel.id, updatesId: updatesChannel.id, createdChannelsInfo: '' });

                        // Add info about created channels
                        if (createdChannels.length > 0) {
                            replyContent = getMessage('server.community.success_enabled', { rulesId: rulesChannel.id, updatesId: updatesChannel.id, createdChannelsInfo: getMessage('server.community.created_channels_info', { channels: createdChannels.join(", ") }) });
                        }

                        await interaction.editReply({
                            content: replyContent,
                        });
                    } catch (err) {
                        console.error("Error enabling community:", err);
                        return interaction.editReply({
                            content: getMessage('server.community.error_enable_failed', { error: err.message || "Unknown error" }),
                        });
                    }
                } else {
                    try {
                        // Disable community directly with REST API
                        const response = await rest.patch(Routes.guild(guild.id), {
                            body: {
                                features: guild.features.filter(
                                    (feature) => feature !== "COMMUNITY"
                                ),
                            },
                        });

                        console.log("Community disabled response:", response);

                        await interaction.editReply({
                            content: getMessage('server.community.success_disabled'),
                        });
                    } catch (err) {
                        console.error("Error disabling community:", err);
                        return interaction.editReply({
                            content: getMessage('server.community.error_disable_failed', { error: err.message || "Unknown error" }),
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Error updating community settings:", error);
            let errorMessage = getMessage('server.error_generic');

            // Provide more specific error messages
            if (error.code === 50013) {
                errorMessage += getMessage('server.error_permissions');
            } else if (error.code === 50035) {
                errorMessage += getMessage('server.error_validation');
                // Add detailed error information from the rawError if available
                if (error.rawError && error.rawError.errors) {
                    errorMessage += getMessage('server.error_details', { details: JSON.stringify(error.rawError.errors) });
                }
            } else if (error.message) {
                errorMessage += getMessage('server.error_message', { error: error.message });
            }

            // Make sure we're responding only if we haven't already
            await interaction
                .editReply({ content: errorMessage })
                .catch((e) => {
                    console.error("Error sending error response:", e);
                });
        }
    },
};
