const {
    SlashCommandBuilder,
    PermissionsBitField,
    MessageFlags,
    ChannelType,
    PermissionFlagsBits,
    Routes,
    AttachmentBuilder,
    EmbedBuilder,
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
        tag: {
            error_invalid_id: ":x_: Invalid Guild ID. Discord Guild IDs must be a 17-20 digit snowflake number.",
            error_target_not_found: ":x_: Could not fetch the target server with ID `{guildId}`. Make sure the bot is present in that server.",
            members: {
                none_found: ":x_: No members were found with Guild ID `{guildId}` equipped{activeNote}.",
                none_found_summary: ":x_: No members in this server currently have any guild tags equipped.",
                success_title: "Members with Guild Tag Equipped",
            },
            user: {
                not_found: ":x_: Could not fetch that user.",
                no_tag: ":information_source: **{username}** (`{userId}`) does not have any guild tag equipped.",
            },
            error_generic: ":x_: An error occurred while processing the tag command: {error}"
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
        )
        .addSubcommandGroup((group) =>
            group
                .setName("tag")
                .setDescription("inspect members with equipped guild tags or clans")
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("members")
                        .setDescription("fetch members who have equipped a specific guild ID tag")
                        .addStringOption((option) =>
                            option
                                .setName("guild_id")
                                .setDescription("the ID of the guild/clan whose tag is equipped")
                                .setRequired(true)
                        )
                        .addStringOption((option) =>
                            option
                                .setName("scope")
                                .setDescription("server to search within (default: Current Server)")
                                .setRequired(false)
                                .addChoices(
                                    { name: "Current Server (default)", value: "current" },
                                    { name: "Target Server (bot must be a member)", value: "target" }
                                )
                        )
                        .addBooleanOption((option) =>
                            option
                                .setName("active_only")
                                .setDescription("only match members actively displaying the tag (default: true)")
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
                        .setName("user")
                        .setDescription("check the equipped guild tag of a specific user")
                        .addUserOption((option) =>
                            option
                                .setName("target")
                                .setDescription("the user to check")
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
                        .setName("summary")
                        .setDescription("summary of all equipped guild tags in this server")
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
        const isEphemeral = interaction.options.getBoolean("ephemeral") ?? true;
        // Defer the reply immediately to avoid interaction timeouts
        await interaction.deferReply({ flags: isEphemeral ? MessageFlags.Ephemeral : 0 });

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

            if (subcommandGroup === "tag") {
                if (subcommand === "members") {
                    const guildId = interaction.options.getString("guild_id").trim();
                    const scope = interaction.options.getString("scope") || "current";
                    const activeOnly = interaction.options.getBoolean("active_only") ?? true;

                    if (!/^\d{17,20}$/.test(guildId)) {
                        return interaction.editReply({
                            content: getMessage("server.tag.error_invalid_id"),
                        });
                    }

                    let targetGuild = guild;
                    if (scope === "target") {
                        try {
                            targetGuild =
                                interaction.client.guilds.cache.get(guildId) ||
                                (await interaction.client.guilds.fetch(guildId));
                        } catch {
                            return interaction.editReply({
                                content: getMessage("server.tag.error_target_not_found", { guildId }),
                            });
                        }
                    }

                    const fetchedMembers = await targetGuild.members.fetch();

                    const matching = [];
                    for (const [, member] of fetchedMembers) {
                        const pg = member.user.primaryGuild;
                        if (!pg || pg.identityGuildId !== guildId) continue;
                        if (activeOnly && pg.identityEnabled === false) continue;
                        matching.push(member);
                    }

                    if (matching.length === 0) {
                        const activeNote = activeOnly ? " (with display enabled)" : "";
                        return interaction.editReply({
                            content: getMessage("server.tag.members.none_found", { guildId, activeNote }),
                        });
                    }

                    const firstUser = matching[0].user;
                    const tagName = firstUser.primaryGuild?.tag || "N/A";
                    const badgeUrl =
                        typeof firstUser.guildTagBadgeURL === "function"
                            ? firstUser.guildTagBadgeURL({ size: 128 })
                            : null;
                    const knownGuild = interaction.client.guilds.cache.get(guildId);
                    const guildName = knownGuild ? knownGuild.name : null;

                    const lines = matching.map((m, idx) => {
                        const tagDisplay = m.user.primaryGuild?.tag ? `\`[${m.user.primaryGuild.tag}]\` ` : "";
                        const activeState = m.user.primaryGuild?.identityEnabled ? "Active" : "Hidden";
                        return `${idx + 1}. <@${m.id}> - \`${m.user.tag}\` (${tagDisplay}${activeState})`;
                    });

                    const embed = new EmbedBuilder()
                        .setTitle(getMessage("server.tag.members.success_title"))
                        .setColor("#2b2d31")
                        .addFields(
                            {
                                name: "Equipped Guild ID",
                                value: `\`${guildId}\`${guildName ? ` (${guildName})` : ""}`,
                                inline: true,
                            },
                            { name: "Server Tag", value: `\`${tagName}\``, inline: true },
                            {
                                name: "Matched Members",
                                value: `**${matching.length}** / ${fetchedMembers.size}`,
                                inline: true,
                            },
                            {
                                name: "Search Scope",
                                value:
                                    scope === "target"
                                        ? `Target Server (\`${targetGuild.name}\`)`
                                        : `Current Server (\`${targetGuild.name}\`)`,
                                inline: true,
                            },
                            { name: "Active Only", value: activeOnly ? "Yes" : "No", inline: true }
                        )
                        .setTimestamp();

                    if (badgeUrl) {
                        embed.setThumbnail(badgeUrl);
                    }

                    if (matching.length <= 25) {
                        embed.setDescription(`### Members List (${matching.length}):\n${lines.join("\n")}`);
                        return interaction.editReply({
                            embeds: [embed],
                            allowedMentions: { users: [] },
                        });
                    } else {
                        const previewLines = lines.slice(0, 20).join("\n");
                        embed.setDescription(
                            `### Members List (Showing first 20 of ${matching.length}):\n${previewLines}\n\n*The complete list of ${matching.length} members is attached as a file below.*`
                        );

                        const fullExport = [
                            `=== Guild Tag Member Export ===`,
                            `Guild ID: ${guildId}`,
                            `Guild Name: ${guildName || "Unknown / Bot Not In Guild"}`,
                            `Server Tag: ${tagName}`,
                            `Total Matched Members: ${matching.length}`,
                            `Total Members Scanned: ${fetchedMembers.size}`,
                            `Active Filter: ${activeOnly ? "Active Only" : "All (Including Hidden)"}`,
                            `Server Scanned: ${targetGuild.name} (${targetGuild.id})`,
                            `Export Timestamp: ${new Date().toISOString()}`,
                            `===============================\n`,
                            matching
                                .map((m, idx) => {
                                    const pg = m.user.primaryGuild;
                                    return `${idx + 1}. ${m.user.tag} (ID: ${m.id}) | Tag: [${pg?.tag || "N/A"}] | Display Active: ${pg?.identityEnabled ? "Yes" : "No"} | Joined Server: ${m.joinedAt ? m.joinedAt.toISOString() : "Unknown"}`;
                                })
                                .join("\n"),
                        ].join("\n");

                        const attachment = new AttachmentBuilder(Buffer.from(fullExport, "utf-8"), {
                            name: `guildtag-${guildId}-members.txt`,
                        });

                        return interaction.editReply({
                            embeds: [embed],
                            files: [attachment],
                            allowedMentions: { users: [] },
                        });
                    }
                } else if (subcommand === "user") {
                    const targetUser = interaction.options.getUser("target");
                    const member = await guild.members.fetch(targetUser.id).catch(() => null);
                    let userObj = member?.user || targetUser;

                    if (!userObj.primaryGuild) {
                        userObj = await interaction.client.users.fetch(targetUser.id, { force: true }).catch(() => targetUser);
                    }

                    const pg = userObj.primaryGuild;
                    if (!pg || !pg.identityGuildId) {
                        return interaction.editReply({
                            content: getMessage("server.tag.user.no_tag", {
                                username: userObj.tag || userObj.username,
                                userId: userObj.id,
                            }),
                        });
                    }

                    const badgeUrl =
                        typeof userObj.guildTagBadgeURL === "function"
                            ? userObj.guildTagBadgeURL({ size: 128 })
                            : null;
                    const knownGuild = interaction.client.guilds.cache.get(pg.identityGuildId);

                    const embed = new EmbedBuilder()
                        .setTitle(`Equipped Guild Tag: ${userObj.tag || userObj.username}`)
                        .setColor("#2b2d31")
                        .setThumbnail(badgeUrl || userObj.displayAvatarURL())
                        .addFields(
                            { name: "User", value: `<@${userObj.id}> (\`${userObj.id}\`)`, inline: false },
                            {
                                name: "Equipped Guild ID",
                                value: `\`${pg.identityGuildId}\`${knownGuild ? ` (${knownGuild.name})` : ""}`,
                                inline: true,
                            },
                            { name: "Server Tag", value: `\`${pg.tag || "N/A"}\``, inline: true },
                            { name: "Display Active", value: pg.identityEnabled ? "Yes" : "No", inline: true },
                            { name: "Badge Hash", value: pg.badge ? `\`${pg.badge}\`` : "*None*", inline: true }
                        )
                        .setTimestamp();

                    return interaction.editReply({
                        embeds: [embed],
                        allowedMentions: { users: [] },
                    });
                } else if (subcommand === "summary") {
                    const members = await guild.members.fetch();
                    const tagMap = new Map();

                    for (const [, member] of members) {
                        const pg = member.user.primaryGuild;
                        if (!pg || !pg.identityGuildId) continue;

                        const key = pg.identityGuildId;
                        if (!tagMap.has(key)) {
                            tagMap.set(key, {
                                guildId: key,
                                tag: pg.tag || "N/A",
                                count: 0,
                                activeCount: 0,
                            });
                        }
                        const item = tagMap.get(key);
                        item.count++;
                        if (pg.identityEnabled) item.activeCount++;
                    }

                    if (tagMap.size === 0) {
                        return interaction.editReply({
                            content: getMessage("server.tag.members.none_found_summary"),
                        });
                    }

                    const sorted = Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
                    const totalTagUsers = sorted.reduce((sum, item) => sum + item.count, 0);

                    const embed = new EmbedBuilder()
                        .setTitle(`Guild Tags Summary: ${guild.name}`)
                        .setColor("#2b2d31")
                        .setDescription(
                            `**${totalTagUsers}** members in this server are wearing tags from **${sorted.length}** distinct guild(s).`
                        )
                        .setTimestamp();

                    const topList = sorted.slice(0, 10).map((item, idx) => {
                        const known = interaction.client.guilds.cache.get(item.guildId);
                        const guildInfo = known ? ` (${known.name})` : "";
                        return `**${idx + 1}. [${item.tag}]** \`${item.guildId}\`${guildInfo}\n└ **${item.count}** member(s) (${item.activeCount} active)`;
                    });

                    embed.addFields({
                        name: "Top Equipped Guilds",
                        value: topList.join("\n\n"),
                        inline: false,
                    });

                    return interaction.editReply({
                        embeds: [embed],
                        allowedMentions: { users: [] },
                    });
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
