const {
    SlashCommandBuilder,
    PermissionsBitField,
    MessageFlags,
    ChannelType,
    PermissionFlagsBits,
    Routes,
} = require("discord.js");
const { REST } = require("@discordjs/rest");

module.exports = {
    category: "utility",
    data: new SlashCommandBuilder()
        .setName("server")
        .setDescription("Manage server-level settings.")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .setDMPermission(false)
        .addSubcommand((subcommand) =>
            subcommand
                .setName("community")
                .setDescription("Enable or disable community features for this server.")
                .addBooleanOption((option) =>
                    option
                        .setName("enabled")
                        .setDescription("Whether to enable or disable community features.")
                        .setRequired(true)
                )
                .addChannelOption((option) =>
                    option
                        .setName("rules_channel")
                        .setDescription("The channel to use for server rules (optional: will be created if not specified).")
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
                )
                .addChannelOption((option) =>
                    option
                        .setName("updates_channel")
                        .setDescription("The channel to use for community updates (optional: will be created if not specified).")
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("verification")
                .setDescription("Set the server's verification level.")
                .addIntegerOption((option) =>
                    option
                        .setName("level")
                        .setDescription("The verification level to set.")
                        .setRequired(true)
                        .addChoices(
                            { name: "None (Unrestricted)", value: 0 },
                            { name: "Low (Verified Email)", value: 1 },
                            { name: "Medium (Registered 5+ mins)", value: 2 },
                            { name: "High (Member 10+ mins)", value: 3 },
                            { name: "Highest (Verified Phone)", value: 4 }
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
                content:
                    "You do not have permission to manage server settings.",
                flags: MessageFlags.Ephemeral,
            });
        }

        const subcommand = interaction.options.getSubcommand();
        // Defer the reply immediately to avoid interaction timeouts
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const guild = interaction.guild;
            const rest = new REST().setToken(process.env.TOKEN);

            if (subcommand === "verification") {
                const level = interaction.options.getInteger("level");
                await rest.patch(Routes.guild(guild.id), {
                    body: { verification_level: level }
                });
                const levelNames = ["None", "Low", "Medium", "High", "Highest"];
                await interaction.editReply(`Successfully set the server verification level to **${levelNames[level]}**.`);
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
                                content: "Community features are already enabled for this server.",
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
                                content: `Community settings updated: ${responseParts.join(" and ")}.`,
                            });
                        } catch (err) {
                            console.error("Error updating community channels:", err);
                            return interaction.editReply({
                                content: `Failed to update community channels: ${err.message || "Unknown error"}`,
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
                                content: "Failed to create rules channel. Please provide an existing channel or check bot permissions.",
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
                                content: "Failed to create community updates channel. Please provide an existing channel or check bot permissions.",
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

                        let replyContent = `Community features have been enabled! Rules channel set to ${rulesChannel} and updates channel set to ${updatesChannel}.\n` +
                            `*Note: The server verification level was adjusted to at least Low and explicit content filter to All Members to meet requirements.*`;

                        // Add info about created channels
                        if (createdChannels.length > 0) {
                            replyContent += `\n\nThe following channels were automatically created: ${createdChannels.join(", ")}.`;
                            replyContent += `\nYou may want to customize these channels with appropriate content.`;
                        }

                        await interaction.editReply({
                            content: replyContent,
                        });
                    } catch (err) {
                        console.error("Error enabling community:", err);
                        return interaction.editReply({
                            content: `Failed to enable community: ${err.message || "Unknown error"}`,
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
                            content:
                                "Community features have been disabled for this server.",
                        });
                    } catch (err) {
                        console.error("Error disabling community:", err);
                        return interaction.editReply({
                            content: `Failed to disable community features: ${err.message || "Unknown error"
                                }`,
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Error updating community settings:", error);
            let errorMessage = "Failed to update community settings.";

            // Provide more specific error messages
            if (error.code === 50013) {
                errorMessage +=
                    " The bot lacks necessary permissions to manage server settings.";
            } else if (error.code === 50035) {
                errorMessage +=
                    " Invalid form body. Discord API validation failed.";
                // Add detailed error information from the rawError if available
                if (error.rawError && error.rawError.errors) {
                    errorMessage +=
                        " Details: " + JSON.stringify(error.rawError.errors);
                }
            } else if (error.message) {
                errorMessage += ` Error: ${error.message}`;
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
