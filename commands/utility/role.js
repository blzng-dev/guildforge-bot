const {
    SlashCommandBuilder,
    PermissionsBitField,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    AttachmentBuilder,
    RoleSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require("discord.js");
const fs = require("node:fs/promises");
const path = require("node:path");

// Define permission presets
const permissionPresets = {
    mod: {
        name: "Moderator",
        permissions: [
            PermissionsBitField.Flags.ModerateMembers, // Timeout
            PermissionsBitField.Flags.KickMembers,
            PermissionsBitField.Flags.BanMembers,
            PermissionsBitField.Flags.ManageNicknames,
            PermissionsBitField.Flags.ManageMessages,
            PermissionsBitField.Flags.ManageThreads,
            PermissionsBitField.Flags.PrioritySpeaker,
            PermissionsBitField.Flags.MuteMembers,
            PermissionsBitField.Flags.MoveMembers,
            PermissionsBitField.Flags.DeafenMembers,
        ],
    },
    mod_plus: {
        name: "Moderator+",
        permissions: [
            PermissionsBitField.Flags.ModerateMembers,
            PermissionsBitField.Flags.KickMembers,
            PermissionsBitField.Flags.BanMembers,
            PermissionsBitField.Flags.ManageNicknames,
            PermissionsBitField.Flags.ManageMessages,
            PermissionsBitField.Flags.ManageThreads,
            PermissionsBitField.Flags.PrioritySpeaker,
            PermissionsBitField.Flags.MuteMembers,
            PermissionsBitField.Flags.MoveMembers,
            PermissionsBitField.Flags.DeafenMembers,
            PermissionsBitField.Flags.ManageGuild,
            PermissionsBitField.Flags.ManageRoles,
            PermissionsBitField.Flags.ManageChannels,
            PermissionsBitField.Flags.ViewAuditLog,
        ],
    },
    admin: {
        name: "Administrator",
        permissions: [PermissionsBitField.Flags.Administrator],
    },
};

// For the role manage subcommand
const rolePermissions = {
    view_channel: PermissionsBitField.Flags.ViewChannel,
    change_nickname: PermissionsBitField.Flags.ChangeNickname,
    send_messages: PermissionsBitField.Flags.SendMessages,
    create_public_threads: PermissionsBitField.Flags.CreatePublicThreads,
    create_private_threads: PermissionsBitField.Flags.CreatePrivateThreads,
    send_messages_in_threads: PermissionsBitField.Flags.SendMessagesInThreads,
    embed_links: PermissionsBitField.Flags.EmbedLinks,
    attach_files: PermissionsBitField.Flags.AttachFiles,
    add_reactions: PermissionsBitField.Flags.AddReactions,
    use_external_emojis: PermissionsBitField.Flags.UseExternalEmojis,
    manage_threads: PermissionsBitField.Flags.ManageThreads,
    send_polls: PermissionsBitField.Flags.SendPolls,
    use_app_commands: PermissionsBitField.Flags.UseApplicationCommands, // For slash commands & voice statuses
    use_external_stickers: PermissionsBitField.Flags.UseExternalStickers,
};

const permissionChoices = [
    { name: "Enable", value: "enable" },
    { name: "Disable", value: "disable" },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("role")
        .setDescription(
            "manage server roles (create, preset, list, settings, etc.)"
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .setDMPermission(false)

        // --- Create Subcommand (Permissions option removed) ---
        .addSubcommand((subcommand) =>
            subcommand
                .setName("create")
                .setDescription("creates a new role with custom options")
                .addStringOption((option) =>
                    option
                        .setName("name")
                        .setDescription("the name for the new role")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("color")
                        .setDescription("hex color code (e.g. #ff0000)")
                        .setRequired(false)
                )
                .addBooleanOption((option) =>
                    option
                        .setName("hoist")
                        .setDescription(
                            "display role members separately in member list"
                        )
                        .setRequired(false)
                )
                .addBooleanOption((option) =>
                    option
                        .setName("mentionable")
                        .setDescription("allow anyone to @mention this role")
                        .setRequired(false)
                )
        )

        .addSubcommand((subcommand) =>
            subcommand
                .setName("create-bulk")
                .setDescription("creates multiple roles at once via modal input")
        )

        .addSubcommand((subcommand) =>
            subcommand
                .setName("preset")
                .setDescription(
                    "creates a role based on a predefined permission preset"
                )
                .addStringOption((option) =>
                    option
                        .setName("preset_name")
                        .setDescription("select the permission preset")
                        .setRequired(true)
                        .addChoices(
                            { name: "Moderator", value: "mod" },
                            { name: "Moderator+", value: "mod_plus" },
                            { name: "Administrator", value: "admin" }
                        )
                )
                .addStringOption((option) =>
                    option
                        .setName("role_name")
                        .setDescription(
                            "optional custom name for the role (defaults to preset name)"
                        )
                        .setRequired(false)
                )
        )

        .addSubcommand((subcommand) =>
            subcommand
                .setName("list")
                .setDescription("lists all roles in the server")
        )

        .addSubcommand((subcommand) =>
            subcommand
                .setName("color")
                .setDescription("creates ~40 color roles")
        )

        .addSubcommand((subcommand) =>
            subcommand
                .setName("scrape")
                .setDescription("scrapes server roles into a json file.")
        )

        .addSubcommand((subcommand) =>
            subcommand
                .setName("info")
                .setDescription("Displays information about a role and attaches member list.")
                .addRoleOption((option) =>
                    option
                        .setName("role")
                        .setDescription("The role to get info for")
                        .setRequired(true)
                )
                .addBooleanOption((option) =>
                    option
                        .setName("ephemeral")
                        .setDescription("Whether the reply should be ephemeral (default: false)")
                        .setRequired(false)
                )
        )

        .addSubcommand((subcommand) =>
            subcommand
                .setName("export")
                .setDescription("Exports info for multiple roles as JSON and optionally deletes them.")
                .addRoleOption((option) =>
                    option
                        .setName("target")
                        .setDescription("A single role to export")
                        .setRequired(false)
                )
                .addRoleOption((option) =>
                    option
                        .setName("start_role")
                        .setDescription("Start of role range to export (exclusive)")
                        .setRequired(false)
                )
                .addRoleOption((option) =>
                    option
                        .setName("end_role")
                        .setDescription("End of role range to export (exclusive)")
                        .setRequired(false)
                )
                .addBooleanOption((option) =>
                    option
                        .setName("ephemeral")
                        .setDescription("Whether the reply should be ephemeral (default: false)")
                        .setRequired(false)
                )
        )

        .addSubcommand((subcommand) =>
            subcommand
                .setName("import")
                .setDescription("Imports roles from a JSON file or text.")
                .addAttachmentOption((option) =>
                    option
                        .setName("file")
                        .setDescription("The exported JSON file")
                        .setRequired(false)
                )
        )

        .addSubcommand((subcommand) =>
            subcommand
                .setName("toggle")
                .setDescription("adds or removes a specific role from a user.")
                .addRoleOption((option) =>
                    option
                        .setName("role")
                        .setDescription("the role to toggle.")
                        .setRequired(true)
                )
                .addUserOption((option) =>
                    option
                        .setName("user")
                        .setDescription("the user to toggle the role for.")
                        .setRequired(true)
                )
        )

        .addSubcommand((subcommand) => {
            subcommand
                .setName("manage")
                .setDescription(
                    "Modify settings and permissions for an existing role."
                )
                .addRoleOption((option) =>
                    option
                        .setName("role")
                        .setDescription("The role to modify.")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option.setName("rename").setDescription("rename the role")
                )
                .addStringOption((option) =>
                    option
                        .setName("color")
                        .setDescription("Hex color code (e.g., #FF0000)")
                )
                .addBooleanOption((option) =>
                    option
                        .setName("hoisted")
                        .setDescription(
                            "Display role separately in member list?"
                        )
                )
                .addBooleanOption((option) =>
                    option
                        .setName("mentionable")
                        .setDescription("Allow anyone to @mention this role?")
                );

            for (const [permName, flagBit] of Object.entries(rolePermissions)) {
                subcommand.addStringOption((option) =>
                    option
                        .setName(permName)
                        .setDescription(
                            `Set permission: ${permName.replace(/_/g, " ")}`
                        )
                        .addChoices(...permissionChoices)
                );
            }

            return subcommand;
        })

        .addSubcommand((subcommand) =>
            subcommand
                .setName("clear")
                .setDescription(
                    "clear all permissions from a role or multiple roles"
                )
                .addRoleOption((option) =>
                    option
                        .setName("target")
                        .setDescription(
                            "the role to clear permissions from (leave empty to select multiple)"
                        )
                        .setRequired(false)
                )
        )

        .addSubcommand((subcommand) =>
            subcommand
                .setName("delete")
                .setDescription(
                    "Delete roles: single target, selection menu, or a range."
                )
                .addRoleOption((option) =>
                    option
                        .setName("target")
                        .setDescription(
                            "The role to delete (leave empty to select multiple roles)"
                        )
                        .setRequired(false)
                )
                .addRoleOption((option) =>
                    option
                        .setName("start_role")
                        .setDescription(
                            "Boundary role 1 for range deletion (exclusive)"
                        )
                        .setRequired(false)
                )
                .addRoleOption((option) =>
                    option
                        .setName("end_role")
                        .setDescription(
                            "Boundary role 2 for range deletion (exclusive)"
                        )
                        .setRequired(false)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("transfer")
                .setDescription(
                    "Transfers members from a secondary role to a primary role."
                )
                .addRoleOption((option) =>
                    option
                        .setName("primary_role")
                        .setDescription("The role to assign to members.")
                        .setRequired(true)
                )
                .addRoleOption((option) =>
                    option
                        .setName("secondary_role")
                        .setDescription("The role to select members from.")
                        .setRequired(true)
                )
                .addBooleanOption((option) =>
                    option
                        .setName("transcript")
                        .setDescription(
                            "Generate a .txt file of member IDs before transfer?"
                        )
                        .setRequired(false)
                )
                .addBooleanOption((option) =>
                    option
                        .setName("delete_secondary")
                        .setDescription(
                            "Delete the secondary role after transfer?"
                        )
                        .setRequired(false)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("reorder")
                .setDescription("re-arrange roles by moving them above or below a pivot role.")
                .addRoleOption((option) =>
                    option
                        .setName("pivot")
                        .setDescription("The role to place the selected roles above/below.")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("position")
                        .setDescription("Place roles above or below the pivot? (default: below)")
                        .addChoices(
                            { name: "Above", value: "above" },
                            { name: "Below", value: "below" }
                        )
                        .setRequired(false)
                )
                .addRoleOption((option) =>
                    option
                        .setName("target")
                        .setDescription("A single role to move.")
                        .setRequired(false)
                )
                .addRoleOption((option) =>
                    option
                        .setName("range_start")
                        .setDescription("Start of a role range to move.")
                        .setRequired(false)
                )
                .addRoleOption((option) =>
                    option
                        .setName("range_end")
                        .setDescription("End of a role range to move.")
                        .setRequired(false)
                )
        ),

    async execute(interaction) {
        if (
            !interaction.memberPermissions.has(
                PermissionsBitField.Flags.ManageGuild
            )
        ) {
            return interaction.reply({
                content: "you do not have permission to manage server roles.",
                flags: MessageFlags.Ephemeral,
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const file = interaction.options.getAttachment("file");

        let isEphemeral = true;
        if (subcommand === "info" || subcommand === "export") {
            isEphemeral = interaction.options.getBoolean("ephemeral") ?? false;
        }

        // We cannot show a modal if we defer.
        // So if subcommand is import and no file is provided, we do NOT defer.
        const shouldDefer = subcommand !== "create-bulk" && !(subcommand === "import" && !file);

        if (shouldDefer) {
            await interaction.deferReply({ flags: isEphemeral ? MessageFlags.Ephemeral : undefined });
        }

        // ============================
        // === CREATE-BULK Subcommand ===
        // ============================
        if (subcommand === "create-bulk") {
            const modal = new ModalBuilder()
                .setCustomId('bulkRoleCreateModal')
                .setTitle('Bulk Create Roles');

            const rolesInput = new TextInputBuilder()
                .setCustomId('rolesInput')
                .setLabel("Names (comma or newline separated)")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setPlaceholder("Role 1\\nRole 2, Role 3")
                .setMaxLength(4000);

            const row = new ActionRowBuilder().addComponents(rolesInput);
            modal.addComponents(row);

            await interaction.showModal(modal);

            try {
                const modalSubmit = await interaction.awaitModalSubmit({
                    time: 300000,
                    filter: i => i.user.id === interaction.user.id && i.customId === 'bulkRoleCreateModal'
                });

                await modalSubmit.deferReply({ flags: MessageFlags.Ephemeral });

                const input = modalSubmit.fields.getTextInputValue('rolesInput');
                // Split by newline or comma, then trim and remove empty
                const roleNames = input
                    .split(/,|\\n/)
                    .map(r => r.trim())
                    .filter(r => r.length > 0);

                if (roleNames.length === 0) {
                    return modalSubmit.editReply({ content: "No valid role names provided.", flags: MessageFlags.Ephemeral });
                }

                if (roleNames.length > 50) {
                    return modalSubmit.editReply({ content: "Please limit to 50 roles at a time.", flags: MessageFlags.Ephemeral });
                }

                let createdCount = 0;
                let failedCount = 0;
                const failedNames = [];

                for (const name of roleNames) {
                    try {
                        await interaction.guild.roles.create({
                            name: name,
                            permissions: [],
                            hoist: false,
                            mentionable: false
                        });
                        createdCount++;
                    } catch (error) {
                        console.error(`Failed to create role ${name}:`, error);
                        failedCount++;
                        failedNames.push(name);
                    }
                }

                let resultMsg = `Successfully created ${createdCount} roles.`;
                if (failedCount > 0) {
                    resultMsg += `\\nFailed to create ${failedCount} roles: ${failedNames.join(', ')}`;
                }

                await modalSubmit.editReply({ content: resultMsg, flags: MessageFlags.Ephemeral });
            } catch (error) {
                if (error.code !== 'InteractionCollectorError') {
                    console.error("Error in bulk role creation modal:", error);
                }
            }
        }
        // ============================
        // === CREATE Subcommand (permissions preset logic removed) ===
        // ============================
        else if (subcommand === "create") {
            const roleName = interaction.options.getString("name");
            const color = interaction.options.getString("color");
            const hoisted = interaction.options.getBoolean("hoist");
            const mentionable = interaction.options.getBoolean("mentionable");

            if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
                return interaction.editReply({
                    content: "Invalid hex color format.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            try {
                const roleOptions = {
                    name: roleName,
                    color: color !== null ? color : undefined, // Only include if provided
                    hoist: hoisted !== null ? hoisted : false, // Default false
                    mentionable: mentionable !== null ? mentionable : false, // Default false
                    permissions: [], // Default no permissions for 'create'
                };

                const targetRole = await interaction.guild.roles.create(
                    roleOptions
                );
                console.log(
                    `Created role: ${targetRole.name} (${targetRole.id}) with options:`,
                    roleOptions
                );
                await interaction.editReply({
                    content: `Successfully created role: <@&${targetRole.id}>`,
                    flags: MessageFlags.Ephemeral,
                });
            } catch (error) {
                console.error(`Error creating role "${roleName}":`, error);
                await interaction.editReply({
                    content: "There was an error trying to create the role.",
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
        // ============================
        // === PRESET Subcommand =====
        // ============================
        else if (subcommand === "preset") {
            const presetKey = interaction.options.getString("preset_name");
            const customName = interaction.options.getString("role_name"); // Optional

            const preset = permissionPresets[presetKey];
            if (!preset) {
                // Should not happen due to choices, but good safety check
                return interaction.editReply({
                    content: "Invalid preset selected.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            const roleName = customName || preset.name; // Use custom name or default preset name

            try {
                const roleOptions = {
                    name: roleName,
                    permissions: preset.permissions,
                    hoist: true, // Default hoisted for presets
                    mentionable: true, // Default mentionable for presets
                    // Color can be added later or left as default
                };

                const targetRole = await interaction.guild.roles.create(
                    roleOptions
                );
                console.log(
                    `Created preset role: ${targetRole.name} (${targetRole.id}) using preset "${presetKey}" with options:`,
                    roleOptions
                );
                await interaction.editReply({
                    content: `Successfully created role <@&${targetRole.id}> using the "${preset.name}" preset.`,
                    flags: MessageFlags.Ephemeral,
                });
            } catch (error) {
                console.error(
                    `Error creating preset role "${roleName}" (preset: ${presetKey}):`,
                    error
                );
                await interaction.editReply({
                    content:
                        "There was an error trying to create the preset role.",
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
        // ============================
        // === LIST Subcommand =======
        // ============================
        else if (subcommand === "list") {
            try {
                // Fetch roles, sort by position descending (highest first)
                const roles = interaction.guild.roles.cache
                    .sort((a, b) => b.position - a.position)
                    // Format as markdown list items
                    .map((role) => `- ${role.toString()}`);

                // Remove @everyone if it's included (it usually has position 0)
                const roleList = roles.filter(
                    (listItem) =>
                        !listItem.includes("<@&" + interaction.guild.id + ">")
                );

                if (roleList.length === 0) {
                    return interaction.editReply({
                        content:
                            "There are no roles in this server (besides @everyone).",
                        flags: MessageFlags.Ephemeral,
                    });
                }

                const roleString = roleList.join("\n");

                // Handle potential message length limit (2000 characters)
                if (roleString.length <= 2000) {
                    await interaction.editReply({
                        content: `**Server Roles (${roleList.length}):**\n${roleString}`,
                        flags: MessageFlags.Ephemeral,
                        allowedMentions: { roles: [] }, // Prevent pinging roles
                    });
                } else {
                    // If too long, send as a file or use pagination (simple file approach here)
                    const attachment = new AttachmentBuilder(
                        Buffer.from(roleList.join("\n")),
                        { name: "server-roles.txt" }
                    );
                    await interaction.editReply({
                        content: `There are too many roles (${roleList.length}) to display directly. Here is a list as a file:`,
                        files: [attachment],
                        flags: MessageFlags.Ephemeral,
                    });
                }
            } catch (error) {
                console.error("Error listing roles:", error);
                await interaction.editReply({
                    content:
                        "An error occurred while trying to list the roles.",
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
        // ============================
        // === COLOR Subcommand =====
        // ============================
        else if (subcommand === "color") {
            const filePath = path.join(__dirname, "../../colorRoles.json"); // Path to source file
            let createdCount = 0;
            let skippedCount = 0;
            let errorCount = 0;
            let rolesToCreate = [];
            const createdRoleIds = [];

            try {
                const data = await fs.readFile(filePath, "utf8");
                rolesToCreate = JSON.parse(data);
            } catch (error) {
                console.error("Error reading/parsing colorRoles.json:", error);
                return interaction.editReply({
                    content:
                        "Error reading/parsing `colorRoles.json`. Make sure file exists & is valid JSON.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            if (!Array.isArray(rolesToCreate)) {
                return interaction.editReply({
                    content:
                        "`colorRoles.json` does not contain a valid JSON array.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            const existingRoleNames = interaction.guild.roles.cache.map((r) =>
                r.name.toLowerCase()
            );

            for (const roleData of rolesToCreate) {
                if (!roleData.name || !roleData.color) {
                    console.warn(
                        `Skipping invalid entry: ${JSON.stringify(roleData)}`
                    );
                    errorCount++;
                    continue;
                }
                if (existingRoleNames.includes(roleData.name.toLowerCase())) {
                    console.log(`Role "${roleData.name}" exists. Skipping.`);
                    skippedCount++;
                    continue;
                }
                if (!/^#[0-9A-F]{6}$/i.test(roleData.color)) {
                    console.warn(
                        `Skipping "${roleData.name}" invalid color: ${roleData.color}`
                    );
                    errorCount++;
                    continue;
                }
                try {
                    const newRole = await interaction.guild.roles.create({
                        name: roleData.name,
                        color: roleData.color,
                        permissions: [],
                        hoist: false,
                    });
                    console.log(
                        `Created role: ${newRole.name} (${newRole.id})`
                    );
                    createdRoleIds.push(newRole.id);
                    createdCount++;
                } catch (error) {
                    console.error(
                        `Failed to create role "${roleData.name}":`,
                        error
                    );
                    errorCount++;
                }
            }

            let replyMessage = `Color role creation finished.\n- Created: ${createdCount}\n- Existed: ${skippedCount}\n- Failed: ${errorCount}`;
            const components = [];
            if (createdCount > 0) {
                const deleteButtonId = `delete-color-roles-${interaction.id}`;
                const deleteButton = new ButtonBuilder()
                    .setCustomId(deleteButtonId)
                    .setLabel("Delete Created Roles")
                    .setStyle(ButtonStyle.Danger);
                const row = new ActionRowBuilder().addComponents(deleteButton);
                components.push(row);

                const reply = await interaction.editReply({
                    content: replyMessage,
                    components: components,
                    flags: MessageFlags.Ephemeral,
                });
                const collectorFilter = (i) =>
                    i.customId === deleteButtonId &&
                    i.user.id === interaction.user.id;
                try {
                    const collector = reply.createMessageComponentCollector({
                        componentType: ComponentType.Button,
                        filter: collectorFilter,
                        time: 60_000,
                    });
                    collector.on("collect", async (i) => {
                        await i.deferUpdate();
                        let deletedCount = 0,
                            deleteErrorCount = 0;
                        await i.editReply({
                            content: `Deleting ${createdRoleIds.length} created roles...`,
                            components: [],
                        });
                        for (const roleId of createdRoleIds) {
                            try {
                                await interaction.guild.roles.delete(
                                    roleId,
                                    "Undo color role creation"
                                );
                                deletedCount++;
                            } catch (delErr) {
                                console.error(
                                    `Failed delete role ${roleId}:`,
                                    delErr
                                );
                                deleteErrorCount++;
                            }
                        }
                        await i.editReply({
                            content: `Deletion finished. Deleted: ${deletedCount}. Failed: ${deleteErrorCount}.`,
                            components: [],
                        });
                        collector.stop();
                    });
                    collector.on("end", (collected) => {
                        if (collected.size === 0) {
                            deleteButton.setDisabled(true);
                            interaction
                                .editReply({
                                    content:
                                        replyMessage +
                                        "\n(Delete button timed out)",
                                    components: [row],
                                })
                                .catch(() => { });
                        }
                    });
                } catch (collectorError) {
                    console.error("Collector error:", collectorError);
                    await interaction.editReply({
                        content:
                            replyMessage + "\n(Could not set up delete button)",
                        components: [],
                    });
                }
            } else {
                await interaction.editReply({
                    content: replyMessage,
                    components: [],
                });
            }
        }
        // ============================
        // === SCRAPE Subcommand ====
        // ============================
        else if (subcommand === "scrape") {
            try {
                const roles = interaction.guild.roles.cache;
                // Map ALL roles to name and color
                const allRolesData = roles.map((role) => ({
                    name: role.name,
                    color: role.hexColor,
                }));

                // Convert ALL roles data to JSON string and then Buffer
                const jsonData = JSON.stringify(allRolesData, null, 4); // Use allRolesData
                const buffer = Buffer.from(jsonData, "utf-8");

                // Create the attachment
                const attachment = new AttachmentBuilder(buffer, {
                    name: "all_server_roles.json",
                }); // Changed filename

                // Send the file back to the user
                await interaction.editReply({
                    content: `Successfully scraped ${allRolesData.length} roles. Here is the JSON file:`, // Update count source
                    files: [attachment],
                    flags: MessageFlags.Ephemeral,
                });
            } catch (error) {
                console.error("Error scraping roles:", error);
                await interaction.editReply({
                    content: "There was an error trying to scrape roles.",
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
        // ============================
        // === INFO Subcommand ======
        // ============================
        else if (subcommand === "info") {
            const role = interaction.options.getRole("role");

            try {
                // Fetch members for this specific role with a fallback to cache if it times out
                let roleMembers;
                try {
                    roleMembers = await interaction.guild.members.fetch({ role: role.id });
                } catch (err) {
                    console.warn("Fetch timed out, falling back to cache:", err);
                    roleMembers = role.members;
                }
                // Filter to ensure we only get members who actually have the role
                const memberIds = roleMembers.filter(m => m.roles.cache.has(role.id)).map(m => m.id);

                const permissions = role.permissions.toArray().join(", ") || "None";

                const content = `Role Info for ${role}
- ${role.name} (${role.id})
- hoisted: ${role.hoist}
- pingable: ${role.mentionable}
- color: ${role.hexColor}
- total members: ${memberIds.length}
- permissions: ${permissions}`;

                const jsonString = JSON.stringify(memberIds, null, 4);
                const attachment = new AttachmentBuilder(
                    Buffer.from(jsonString),
                    { name: `role_members_${role.id}.json` }
                );

                await interaction.editReply({
                    content: content,
                    files: [attachment],
                });
            } catch (error) {
                console.error("Error getting role info:", error);
                await interaction.editReply({
                    content: "An error occurred while trying to get role info.",
                });
            }
        }
        // ============================
        // === EXPORT Subcommand ====
        // ============================
        else if (subcommand === "export") {
            const targetRole = interaction.options.getRole("target");
            const startRole = interaction.options.getRole("start_role");
            const endRole = interaction.options.getRole("end_role");

            let rolesToExport = [];

            if (startRole && endRole) {
                const pos1 = startRole.position;
                const pos2 = endRole.position;
                const lowPos = Math.min(pos1, pos2);
                const highPos = Math.max(pos1, pos2);

                rolesToExport = Array.from(interaction.guild.roles.cache.values()).filter(
                    (r) => r.position > lowPos && r.position < highPos
                );
            } else if (targetRole) {
                rolesToExport = [targetRole];
            } else {
                // Show role select menu
                const row = new ActionRowBuilder().addComponents(
                    new RoleSelectMenuBuilder()
                        .setCustomId("export-role-menu")
                        .setPlaceholder("Select roles to export")
                        .setMinValues(1)
                        .setMaxValues(25)
                );

                const response = await interaction.editReply({
                    content: "Please select the roles you want to export:",
                    components: [row],
                });

                try {
                    const selection = await response.awaitMessageComponent({
                        filter: (i) => i.customId === "export-role-menu" && i.user.id === interaction.user.id,
                        time: 60000,
                    });

                    rolesToExport = selection.values.map(id => interaction.guild.roles.cache.get(id)).filter(Boolean);
                    await selection.deferUpdate();
                } catch (error) {
                    return interaction.editReply({ content: "Selection timed out.", components: [] });
                }
            }

            if (rolesToExport.length === 0) {
                return interaction.editReply({ content: "No roles selected or found to export.", components: [] });
            }

            try {
                // Fetch all members once to ensure cache is full
                await interaction.guild.members.fetch();

                const exportData = [];

                for (const role of rolesToExport) {
                    // Explicitly filter cached members to ensure only those with the role are included
                    const memberIds = interaction.guild.members.cache
                        .filter(m => m.roles.cache.has(role.id))
                        .map(m => m.id);
                    exportData.push({
                        name: role.name,
                        color: role.hexColor,
                        id: role.id,
                        hoisted: role.hoist,
                        pingable: role.mentionable,
                        permissions: role.permissions.toArray(),
                        total: memberIds.length,
                        members: memberIds
                    });
                }

                const jsonString = JSON.stringify(exportData, null, 4);
                const attachment = new AttachmentBuilder(
                    Buffer.from(jsonString),
                    { name: `exported_roles_${interaction.id}.json` }
                );

                const deleteButton = new ButtonBuilder()
                    .setCustomId(`delete-exported-roles-${interaction.id}`)
                    .setLabel("Delete These Roles")
                    .setStyle(ButtonStyle.Danger);

                let replyContent = `Successfully exported ${exportData.length} roles.`;
                if (exportData.length === 1) {
                    replyContent = `Role export for **${exportData[0].name}** (${exportData[0].id})`;
                }

                const reply = await interaction.editReply({
                    content: replyContent,
                    files: [attachment],
                    components: [row],
                });

                const collector = reply.createMessageComponentCollector({
                    filter: i => i.customId === `delete-exported-roles-${interaction.id}` && i.user.id === interaction.user.id,
                    time: 60000,
                });

                collector.on("collect", async (i) => {
                    await i.deferUpdate();
                    await i.editReply({ content: "Deleting roles...", components: [] });

                    let deletedCount = 0;
                    let failedCount = 0;
                    const botHighest = interaction.guild.members.me.roles.highest;

                    for (const role of rolesToExport) {
                        try {
                            if (role.position >= botHighest.position) {
                                console.log(`Skipping role ${role.name} due to hierarchy.`);
                                failedCount++;
                                continue;
                            }
                            await role.delete(`Exported and deleted by ${interaction.user.tag}`);
                            deletedCount++;
                        } catch (error) {
                            console.error(`Failed to delete role ${role.name}:`, error);
                            failedCount++;
                        }
                    }

                    await i.editReply({
                        content: `Deletion finished. Deleted: ${deletedCount}. Failed: ${failedCount}.`,
                        components: [],
                    });
                    collector.stop();
                });

                collector.on("end", (collected, reason) => {
                    if (reason === "time") {
                        deleteButton.setDisabled(true);
                        interaction.editReply({
                            components: [new ActionRowBuilder().addComponents(deleteButton)],
                        }).catch(() => { });
                    }
                });

            } catch (error) {
                console.error("Error exporting roles:", error);
                await interaction.editReply({
                    content: "An error occurred while trying to export roles.",
                    components: [],
                });
            }
        }
        // ============================
        // === IMPORT Subcommand ====
        // ============================
        else if (subcommand === "import") {
            const file = interaction.options.getAttachment("file");
            let jsonData;
            let targetInteraction = interaction;

            if (file) {
                try {
                    const response = await fetch(file.url);
                    jsonData = await response.json();
                } catch (error) {
                    console.error("Error reading attached file:", error);
                    return interaction.editReply({ content: "Failed to read the attached file. Make sure it is valid JSON." });
                }
            } else {
                const modal = new ModalBuilder()
                    .setCustomId('roleImportModal')
                    .setTitle('Import Roles');

                const jsonInput = new TextInputBuilder()
                    .setCustomId('jsonInput')
                    .setLabel("JSON Data (Object or Array)")
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setPlaceholder("[\n  {\n    \"name\": \"Role Name\",\n    ...\n  }\n]")
                    .setMaxLength(4000);

                const row = new ActionRowBuilder().addComponents(jsonInput);
                modal.addComponents(row);

                await interaction.showModal(modal);

                try {
                    const modalSubmit = await interaction.awaitModalSubmit({
                        time: 300000,
                        filter: i => i.user.id === interaction.user.id && i.customId === 'roleImportModal'
                    });

                    await modalSubmit.deferReply({ flags: MessageFlags.Ephemeral });

                    const input = modalSubmit.fields.getTextInputValue('jsonInput');
                    jsonData = JSON.parse(input);
                    
                    targetInteraction = modalSubmit;
                } catch (error) {
                    if (error.code !== 'InteractionCollectorError') {
                        console.error("Error in role import modal:", error);
                    }
                    return;
                }
            }

            try {
                let rolesToProcess = [];
                if (Array.isArray(jsonData)) {
                    rolesToProcess = jsonData;
                } else if (typeof jsonData === "object") {
                    rolesToProcess = [jsonData];
                } else {
                    return targetInteraction.editReply({ content: "Invalid JSON format. Expected an object or array of objects." });
                }

                let createdCount = 0;
                let restoredCount = 0;
                let assignedCount = 0;
                let skippedMembers = 0;

                for (const roleData of rolesToProcess) {
                    let role = interaction.guild.roles.cache.find(r => r.id === roleData.id || r.name === roleData.name);
                    
                    if (!role) {
                        // Create the role
                        role = await interaction.guild.roles.create({
                            name: roleData.name,
                            color: roleData.color,
                            hoist: roleData.hoisted,
                            mentionable: roleData.pingable,
                            permissions: roleData.permissions ? roleData.permissions : [],
                        });
                        createdCount++;
                    } else {
                        restoredCount++;
                    }

                    // Assign to users
                    if (Array.isArray(roleData.members)) {
                        for (const memberId of roleData.members) {
                            try {
                                const member = await interaction.guild.members.fetch(memberId).catch(() => null);
                                if (member) {
                                    await member.roles.add(role);
                                    assignedCount++;
                                } else {
                                    skippedMembers++;
                                }
                            } catch (err) {
                                console.error(`Failed to assign role ${role.name} to member ${memberId}:`, err);
                            }
                        }
                    }
                }

                await targetInteraction.editReply({
                    content: `Import finished.\n- Roles Created: ${createdCount}\n- Roles Existing/Restored: ${restoredCount}\n- Role Assignments: ${assignedCount}\n- Skipped Members (not in guild): ${skippedMembers}`,
                });

            } catch (error) {
                console.error("Error processing import:", error);
                await targetInteraction.editReply({ content: "An error occurred while processing the import. Make sure the JSON structure is correct." });
            }
        }
        // ============================
        // === TOGGLE Subcommand ====
        // ============================
        else if (subcommand === "toggle") {
            const roleToToggle = interaction.options.getRole("role");
            const targetUser = interaction.options.getUser("user");
            const member = await interaction.guild.members
                .fetch(targetUser.id)
                .catch(() => null); // Fetch member object

            if (!member) {
                return interaction.editReply({
                    content: `Could not find user ${targetUser.tag} in this server.`,
                    flags: MessageFlags.Ephemeral,
                });
            }

            // Role hierarchy check (cannot assign roles higher than bot's highest role)
            if (
                roleToToggle.position >=
                interaction.guild.members.me.roles.highest.position
            ) {
                return interaction.editReply({
                    content: `I cannot manage the role ${roleToToggle.name} because it's higher than or equal to my highest role.`,
                    flags: MessageFlags.Ephemeral,
                });
            }
            // Optional: Check if command user's highest role is high enough
            if (
                roleToToggle.position >=
                interaction.member.roles.highest.position &&
                interaction.guild.ownerId !== interaction.user.id
            ) {
                return interaction.editReply({
                    content: `You cannot manage the role ${roleToToggle.name} because it's higher than or equal to your highest role.`,
                    flags: MessageFlags.Ephemeral,
                });
            }

            try {
                if (member.roles.cache.has(roleToToggle.id)) {
                    // Role exists, remove it
                    await member.roles.remove(roleToToggle.id);
                    await interaction.editReply({
                        content: `Removed role <@&${roleToToggle.id}> from ${member.user.tag}.`,
                        flags: MessageFlags.Ephemeral,
                    });
                } else {
                    // Role doesn't exist, add it
                    await member.roles.add(roleToToggle.id);
                    await interaction.editReply({
                        content: `Added role <@&${roleToToggle.id}> to ${member.user.tag}.`,
                        flags: MessageFlags.Ephemeral,
                    });
                }
            } catch (error) {
                console.error(
                    `Error toggling role ${roleToToggle.name} for ${member.user.tag}:`,
                    error
                );
                await interaction.editReply({
                    content: `Failed to toggle role <@&${roleToToggle.id}>. Check my permissions and role hierarchy.`,
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
        // ============================
        // === MANAGE Subcommand ====
        // ============================
        else if (subcommand === "manage") {
            const targetRole = interaction.options.getRole("role");
            const newName = interaction.options.getString("rename");
            const color = interaction.options.getString("color");
            const hoisted = interaction.options.getBoolean("hoisted");
            const mentionable = interaction.options.getBoolean("mentionable");

            // Role hierarchy checks
            if (
                targetRole.position >=
                interaction.guild.members.me.roles.highest.position
            ) {
                return interaction.editReply({
                    content: `I cannot manage the role ${targetRole.name} because it's higher than or equal to my highest role.`,
                    flags: MessageFlags.Ephemeral,
                });
            }

            if (
                interaction.user.id !== interaction.guild.ownerId &&
                targetRole.position >= interaction.member.roles.highest.position
            ) {
                return interaction.editReply({
                    content: `You cannot manage the role ${targetRole.name} because it's higher than or equal to your highest role.`,
                    flags: MessageFlags.Ephemeral,
                });
            }

            if (targetRole.id === interaction.guild.id) {
                return interaction.editReply({
                    content: `Cannot modify the @everyone role with this command.`,
                    flags: MessageFlags.Ephemeral,
                });
            }

            try {
                // Prepare role edit options
                const roleOptions = {};
                let permissionsModified = false;

                // Handle basic settings
                if (newName !== null) roleOptions.name = newName;
                if (color !== null) {
                    if (!/^#[0-9A-F]{6}$/i.test(color)) {
                        return interaction.editReply({
                            content:
                                "Invalid hex color format. Use format #RRGGBB (e.g., #FF0000 for red).",
                            flags: MessageFlags.Ephemeral,
                        });
                    }
                    roleOptions.color = color;
                }

                if (hoisted !== null) roleOptions.hoist = hoisted;
                if (mentionable !== null) roleOptions.mentionable = mentionable;

                // Get current permissions to modify
                let currentPermissions = new PermissionsBitField(
                    targetRole.permissions
                );

                // Process each permission individually
                for (const [permName, flagBit] of Object.entries(
                    rolePermissions
                )) {
                    const setting = interaction.options.getString(permName);

                    if (setting !== null) {
                        permissionsModified = true;

                        if (setting === "enable") {
                            currentPermissions.add(flagBit);
                        } else if (setting === "disable") {
                            currentPermissions.remove(flagBit);
                        }
                    }
                }

                // Apply permission changes if any were made
                if (permissionsModified) {
                    roleOptions.permissions = currentPermissions;
                }

                // Check if any changes are being made
                if (Object.keys(roleOptions).length === 0) {
                    return interaction.editReply({
                        content: "No changes specified for the role.",
                        flags: MessageFlags.Ephemeral,
                    });
                }

                // Edit the role
                await targetRole.edit(
                    roleOptions,
                    `Modified by ${interaction.user.tag} using role manage command`
                );

                // Prepare confirmation message
                let changes = [];
                if (newName !== null) changes.push(`name: ${newName}`);
                if (color !== null) changes.push(`color: ${color}`);
                if (hoisted !== null)
                    changes.push(
                        `displayed separately: ${hoisted ? "Yes" : "No"}`
                    );
                if (mentionable !== null)
                    changes.push(`mentionable: ${mentionable ? "Yes" : "No"}`);
                if (permissionsModified) changes.push("permissions updated");

                await interaction.editReply({
                    content: `Successfully updated role <@&${targetRole.id
                        }> (${changes.join(", ")}).`,
                    flags: MessageFlags.Ephemeral,
                });
            } catch (error) {
                console.error(
                    `Error modifying role ${targetRole.name} (${targetRole.id}):`,
                    error
                );
                await interaction.editReply({
                    content:
                        "An error occurred while modifying the role. Check my permissions and role hierarchy.",
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
        // ============================
        // === CLEAR Subcommand ====
        // ============================
        else if (subcommand === "clear") {
            const targetRole = interaction.options.getRole("target");

            // If a role was provided directly
            if (targetRole) {
                // Role hierarchy checks
                if (
                    targetRole.position >=
                    interaction.guild.members.me.roles.highest.position
                ) {
                    return interaction.editReply({
                        content: `I cannot modify the role ${targetRole.name} because it's higher than or equal to my highest role.`,
                        flags: MessageFlags.Ephemeral,
                    });
                }

                if (
                    interaction.user.id !== interaction.guild.ownerId &&
                    targetRole.position >=
                    interaction.member.roles.highest.position
                ) {
                    return interaction.editReply({
                        content: `You cannot modify the role ${targetRole.name} because it's higher than or equal to your highest role.`,
                        flags: MessageFlags.Ephemeral,
                    });
                }

                if (targetRole.id === interaction.guild.id) {
                    return interaction.editReply({
                        content: `Cannot modify the @everyone role with this command.`,
                        flags: MessageFlags.Ephemeral,
                    });
                }

                try {
                    // Edit the role to have no permissions
                    await targetRole.edit(
                        {
                            permissions: [],
                        },
                        `Permissions cleared by ${interaction.user.tag}`
                    );

                    await interaction.editReply({
                        content: `Successfully cleared all permissions from the role <@&${targetRole.id}>.`,
                        flags: MessageFlags.Ephemeral,
                    });
                } catch (error) {
                    console.error(
                        `Error clearing permissions for role ${targetRole.name} (${targetRole.id}):`,
                        error
                    );
                    await interaction.editReply({
                        content:
                            "An error occurred while clearing permissions. Check my permissions and role hierarchy.",
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }
            // If no role was provided, show a role select menu
            else {
                try {
                    // Create a role select menu
                    const row = new ActionRowBuilder().addComponents(
                        new RoleSelectMenuBuilder()
                            .setCustomId("role-clear-menu")
                            .setPlaceholder(
                                "Select roles to clear permissions from"
                            )
                            .setMinValues(1)
                            .setMaxValues(10) // Allow up to 10 roles at once
                    );

                    // Send message with the role select menu
                    const response = await interaction.editReply({
                        content:
                            "Select the roles you want to clear all permissions from:",
                        components: [row],
                        flags: MessageFlags.Ephemeral,
                    });

                    // Create a collector for the select menu interaction
                    const collector = response.createMessageComponentCollector({
                        filter: (i) => i.user.id === interaction.user.id,
                        time: 60000, // 1 minute timeout
                        componentType: ComponentType.RoleSelect,
                    });

                    collector.on("collect", async (i) => {
                        await i.deferUpdate();
                        const selectedRoles = i.values;

                        if (selectedRoles.length === 0) {
                            await interaction.editReply({
                                content: "No roles were selected.",
                                components: [],
                                flags: MessageFlags.Ephemeral,
                            });
                            return collector.stop();
                        }

                        let successCount = 0;
                        let errorCount = 0;
                        let skippedCount = 0;
                        let errorRoles = [];
                        let skippedRoles = [];

                        // Process each selected role
                        for (const roleId of selectedRoles) {
                            const role =
                                interaction.guild.roles.cache.get(roleId);

                            if (!role) {
                                errorCount++;
                                errorRoles.push(`Unknown Role`);
                                continue;
                            }

                            // Role hierarchy checks
                            if (
                                role.position >=
                                interaction.guild.members.me.roles.highest
                                    .position
                            ) {
                                skippedCount++;
                                skippedRoles.push(role.name);
                                continue;
                            }

                            if (
                                interaction.user.id !==
                                interaction.guild.ownerId &&
                                role.position >=
                                interaction.member.roles.highest.position
                            ) {
                                skippedCount++;
                                skippedRoles.push(role.name);
                                continue;
                            }

                            if (role.id === interaction.guild.id) {
                                skippedCount++;
                                skippedRoles.push("@everyone");
                                continue;
                            }

                            try {
                                // Clear the role's permissions
                                await role.edit(
                                    {
                                        permissions: [],
                                    },
                                    `Permissions cleared by ${interaction.user.tag}`
                                );

                                successCount++;
                            } catch (error) {
                                console.error(
                                    `Error clearing permissions for role ${role.name} (${role.id}):`,
                                    error
                                );
                                errorCount++;
                                errorRoles.push(role.name);
                            }
                        }

                        // Prepare result message
                        let resultMessage = `Results of clearing permissions:\n✅ Successfully cleared: ${successCount} role(s)`;

                        if (skippedCount > 0) {
                            resultMessage += `\n⚠️ Skipped due to hierarchy: ${skippedCount} role(s) [${skippedRoles.join(
                                ", "
                            )}]`;
                        }

                        if (errorCount > 0) {
                            resultMessage += `\n❌ Failed to clear: ${errorCount} role(s) [${errorRoles.join(
                                ", "
                            )}]`;
                        }

                        // Update the message with results
                        await interaction.editReply({
                            content: resultMessage,
                            components: [], // Remove the select menu
                            flags: MessageFlags.Ephemeral,
                        });

                        collector.stop();
                    });

                    collector.on("end", (collected, reason) => {
                        if (reason === "time" && collected.size === 0) {
                            interaction
                                .editReply({
                                    content:
                                        "Role selection timed out. No permissions were cleared.",
                                    components: [],
                                    flags: MessageFlags.Ephemeral,
                                })
                                .catch(() => { });
                        }
                    });
                } catch (error) {
                    console.error("Error creating role select menu:", error);
                    await interaction.editReply({
                        content:
                            "An error occurred while setting up the role selection. Please try again.",
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }
        }
        // ============================
        // === DELETE Subcommand ====
        // ============================
        else if (subcommand === "delete") {
            const targetRole = interaction.options.getRole("target");
            const startRole = interaction.options.getRole("start_role");
            const endRole = interaction.options.getRole("end_role");

            // ============================
            // === RANGE Deletion Logic ===
            // ============================
            if (startRole || endRole) {
                if (!startRole || !endRole) {
                    return interaction.editReply({
                        content:
                            "To delete a range of roles, you must specify both `start_role` and `end_role`.",
                        flags: MessageFlags.Ephemeral,
                    });
                }

                if (startRole.id === endRole.id) {
                    return interaction.editReply({
                        content:
                            "The start and end roles cannot be the same for range deletion.",
                        flags: MessageFlags.Ephemeral,
                    });
                }

                const pos1 = startRole.position;
                const pos2 = endRole.position;
                const lowPos = Math.min(pos1, pos2);
                const highPos = Math.max(pos1, pos2);

                // Filter roles strictly between the two boundary roles
                const rolesInRange = interaction.guild.roles.cache.filter(
                    (r) => r.position > lowPos && r.position < highPos
                );

                if (rolesInRange.size === 0) {
                    return interaction.editReply({
                        content: `No roles found between **${startRole.name}** and **${endRole.name}**.`,
                        flags: MessageFlags.Ephemeral,
                    });
                }

                // Identify deleteable vs skipped roles
                const rolesToDelete = [];
                const skippedRoles = [];

                for (const [, role] of rolesInRange) {
                    // Hierarchy checks
                    const botHighest =
                        interaction.guild.members.me.roles.highest;
                    const userHighest = interaction.member.roles.highest;

                    if (role.position >= botHighest.position) {
                        skippedRoles.push(`${role.name} (Higher than Bot)`);
                        continue;
                    }
                    if (
                        interaction.user.id !== interaction.guild.ownerId &&
                        role.position >= userHighest.position
                    ) {
                        skippedRoles.push(`${role.name} (Higher than User)`);
                        continue;
                    }
                    if (role.managed) {
                        skippedRoles.push(`${role.name} (Managed/Integration)`);
                        continue;
                    }
                    if (role.members.size > 0) {
                        skippedRoles.push(`${role.name} (Has Members)`);
                        continue;
                    }
                    rolesToDelete.push(role);
                }

                if (rolesToDelete.length === 0) {
                    const params = skippedRoles.length
                        ? `\nSkipped: ${skippedRoles.join(", ")}`
                        : "";
                    return interaction.editReply({
                        content: `Found ${rolesInRange.size} roles between boundaries, but none can be deleted.${params}`,
                        flags: MessageFlags.Ephemeral,
                    });
                }

                // Sort for display
                rolesToDelete.sort((a, b) => b.position - a.position);
                const roleNames = rolesToDelete.map((r) => r.name).join(", ");

                // Confirmation UI
                const confirmRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("confirm-range-delete")
                        .setLabel("Confirm Range Deletion")
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId("cancel-range-delete")
                        .setLabel("Cancel")
                        .setStyle(ButtonStyle.Secondary)
                );

                const response = await interaction.editReply({
                    content:
                        `Found **${rolesInRange.size}** roles between **${startRole.name}** and **${endRole.name}**.\n` +
                        `**Roles to delete (${rolesToDelete.length}):** ${roleNames}\n` +
                        (skippedRoles.length > 0
                            ? `⚠️ **Skipped (${skippedRoles.length}):** ${skippedRoles.join(", ")}\n`
                            : "") +
                        `\n**Are you sure you want to delete these roles? This cannot be undone.**`,
                    components: [confirmRow],
                    flags: MessageFlags.Ephemeral,
                });

                try {
                    const confirmation = await response.awaitMessageComponent({
                        filter: (i) =>
                            (i.customId === "confirm-range-delete" ||
                                i.customId === "cancel-range-delete") &&
                            i.user.id === interaction.user.id,
                        time: 30000,
                    });

                    if (confirmation.customId === "cancel-range-delete") {
                        await confirmation.update({
                            content: "Range deletion cancelled.",
                            components: [],
                        });
                        return;
                    }

                    // Proceed with deletion
                    await confirmation.update({
                        content: `Deleting ${rolesToDelete.length} roles...`,
                        components: [],
                    });

                    let successCount = 0;
                    let failCount = 0;
                    const failedNames = [];

                    for (const role of rolesToDelete) {
                        try {
                            // Re-check existence just in case
                            if (interaction.guild.roles.cache.has(role.id)) {
                                await role.delete(
                                    `Range delete by ${interaction.user.tag}`
                                );
                                successCount++;
                            }
                        } catch (err) {
                            failCount++;
                            failedNames.push(role.name);
                            console.error(`Failed to delete ${role.name}:`, err);
                        }
                    }

                    await interaction.editReply({
                        content:
                            `**Range Deletion Complete**\n` +
                            `✅ Successfully deleted: ${successCount}\n` +
                            (failCount > 0
                                ? `❌ Failed: ${failCount} (${failedNames.join(
                                    ", "
                                )})`
                                : ""),
                        components: [],
                    });
                } catch (e) {
                    // Timeout or other error
                    await interaction.editReply({
                        content: "Confirmation timed out or an error occurred.",
                        components: [],
                    });
                }
            }

            // ============================
            // === Single Target Logic ===
            // ============================
            // If a role was provided directly
            else if (targetRole) {
                // Role hierarchy checks
                if (
                    targetRole.position >=
                    interaction.guild.members.me.roles.highest.position
                ) {
                    return interaction.editReply({
                        content: `I cannot delete the role ${targetRole.name} because it's higher than or equal to my highest role.`,
                        flags: MessageFlags.Ephemeral,
                    });
                }

                if (
                    interaction.user.id !== interaction.guild.ownerId &&
                    targetRole.position >=
                    interaction.member.roles.highest.position
                ) {
                    return interaction.editReply({
                        content: `You cannot delete the role ${targetRole.name} because it's higher than or equal to your highest role.`,
                        flags: MessageFlags.Ephemeral,
                    });
                }

                if (targetRole.id === interaction.guild.id) {
                    return interaction.editReply({
                        content: `Cannot delete the @everyone role.`,
                        flags: MessageFlags.Ephemeral,
                    });
                }

                if (targetRole.members.size > 0) {
                    return interaction.editReply({
                        content: `Cannot delete the role "${targetRole.name}" because it currently has ${targetRole.members.size} member(s).`,
                        flags: MessageFlags.Ephemeral,
                    });
                }

                try {
                    // Store role name for confirmation message
                    const roleName = targetRole.name;
                    const roleId = targetRole.id;

                    // Delete the role
                    await targetRole.delete(
                        `Deleted by ${interaction.user.tag}`
                    );

                    await interaction.editReply({
                        content: `Successfully deleted the role "${roleName}" (was <@&${roleId}>).`,
                        flags: MessageFlags.Ephemeral,
                    });
                } catch (error) {
                    console.error(
                        `Error deleting role ${targetRole.name} (${targetRole.id}):`,
                        error
                    );
                    await interaction.editReply({
                        content:
                            "An error occurred while deleting the role. Check my permissions and role hierarchy.",
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }
            // ============================
            // === TRANSFER Subcommand ===
            // ============================
            else if (subcommand === "transfer") {
                const primaryRole = interaction.options.getRole("primary_role");
                const secondaryRole =
                    interaction.options.getRole("secondary_role");
                const generateTranscript =
                    interaction.options.getBoolean("transcript") || false;
                const deleteSecondary =
                    interaction.options.getBoolean("delete_secondary") || false;

                // --- 1. Hierarchy & Permission Checks ---

                // Check if the bot can manage these roles
                if (
                    primaryRole.position >=
                    interaction.guild.members.me.roles.highest.position ||
                    secondaryRole.position >=
                    interaction.guild.members.me.roles.highest.position
                ) {
                    return interaction.editReply({
                        content:
                            "I cannot manage one or both of these roles because they are higher than or equal to my highest role.",
                        flags: MessageFlags.Ephemeral,
                    });
                }

                // Check if the user can manage these roles (prevent abuse)
                if (interaction.user.id !== interaction.guild.ownerId) {
                    if (
                        primaryRole.position >=
                        interaction.member.roles.highest.position ||
                        secondaryRole.position >=
                        interaction.member.roles.highest.position
                    ) {
                        return interaction.editReply({
                            content:
                                "You cannot manage one or both of these roles because they are higher than or equal to your highest role.",
                            flags: MessageFlags.Ephemeral,
                        });
                    }
                }

                if (primaryRole.id === secondaryRole.id) {
                    return interaction.editReply({
                        content:
                            "The primary and secondary roles cannot be the same.",
                        flags: MessageFlags.Ephemeral,
                    });
                }

                try {
                    // --- 2. Fetch Members ---
                    // Fetch all members to ensure cache is full so secondaryRole.members is accurate
                    await interaction.guild.members.fetch();

                    const membersToTransfer = secondaryRole.members;
                    const memberCount = membersToTransfer.size;

                    if (memberCount === 0) {
                        return interaction.editReply({
                            content: `No members found with the role ${secondaryRole}.`,
                        });
                    }

                    await interaction.editReply({
                        content: `Found ${memberCount} members with ${secondaryRole}. Starting transfer to ${primaryRole}...`,
                    });

                    // --- 3. Generate Transcript (Optional) ---
                    let attachment = null;
                    if (generateTranscript) {
                        const idList = membersToTransfer
                            .map((m) => m.id)
                            .join("\n");
                        const buffer = Buffer.from(idList, "utf-8");
                        attachment = new AttachmentBuilder(buffer, {
                            name: `${secondaryRole.name}_ids.txt`,
                        });
                    }

                    // --- 4. Transfer Roles ---
                    let successCount = 0;
                    let failCount = 0;

                    for (const [memberId, member] of membersToTransfer) {
                        try {
                            // Only add the role if they don't already have it
                            if (!member.roles.cache.has(primaryRole.id)) {
                                await member.roles.add(primaryRole);
                            }
                            successCount++;
                        } catch (err) {
                            console.error(
                                `Failed to add role to ${member.user.tag}:`,
                                err
                            );
                            failCount++;
                        }
                    }

                    let resultMsg = `**Transfer Complete**\n- Successfully assigned ${primaryRole} to ${successCount} members.\n- Failed: ${failCount}`;

                    // --- 5. Delete Secondary Role (Optional) ---
                    if (deleteSecondary) {
                        try {
                            await secondaryRole.delete(
                                `Role transfer command by ${interaction.user.tag}`
                            );
                            resultMsg += `\n**Secondary Role Deleted**: The role "${secondaryRole.name}" has been deleted from the server.`;
                        } catch (err) {
                            console.error(
                                `Failed to delete role ${secondaryRole.name}:`,
                                err
                            );
                            resultMsg += `\n**Deletion Failed**: Could not delete the secondary role. Check my permissions.`;
                        }
                    }

                    // --- 6. Final Response ---
                    const replyOptions = {
                        content: resultMsg,
                        flags: MessageFlags.Ephemeral,
                    };
                    if (attachment) {
                        replyOptions.files = [attachment];
                        replyOptions.content += `\n📄 **Transcript**: Attached is the list of member IDs who had the secondary role.`;
                    }

                    await interaction.editReply(replyOptions);
                } catch (error) {
                    console.error("Error executing transfer command:", error);
                    await interaction.editReply({
                        content:
                            "An unexpected error occurred while processing the request.",
                    });
                }
            }
            // If no role was provided, show a role select menu
            else {
                try {
                    // Create a role select menu
                    const row = new ActionRowBuilder().addComponents(
                        new RoleSelectMenuBuilder()
                            .setCustomId("role-delete-menu")
                            .setPlaceholder("Select roles to delete")
                            .setMinValues(1)
                            .setMaxValues(10) // Allow up to 10 roles at once
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

                    // Send message with the role select menu
                    const response = await interaction.editReply({
                        content: "Select the roles you want to delete:",
                        components: [row],
                        flags: MessageFlags.Ephemeral,
                    });

                    // Create collectors
                    const roleCollector =
                        response.createMessageComponentCollector({
                            filter: (i) =>
                                i.customId === "role-delete-menu" &&
                                i.user.id === interaction.user.id,
                            time: 60000, // 1 minute timeout
                        });

                    let selectedRoles = [];
                    let selectedRoleObjects = [];

                    roleCollector.on("collect", async (i) => {
                        await i.deferUpdate();
                        selectedRoles = i.values;
                        selectedRoleObjects = selectedRoles
                            .map((id) => interaction.guild.roles.cache.get(id))
                            .filter((r) => r);

                        // Check if any roles were selected
                        if (selectedRoles.length === 0) {
                            await interaction.editReply({
                                content: "No roles were selected.",
                                components: [],
                                flags: MessageFlags.Ephemeral,
                            });
                            return roleCollector.stop();
                        }

                        // Show confirmation with selected role names
                        const roleNames = selectedRoleObjects
                            .map((r) => `"${r?.name || "unknown"}"`)
                            .join(", ");
                        await interaction.editReply({
                            content: `You are about to delete ${selectedRoles.length} role(s): ${roleNames}\n⚠️ **This action cannot be undone!** Are you sure?`,
                            components: [confirmRow],
                            flags: MessageFlags.Ephemeral,
                        });

                        // Stop the role collector as we now need confirmation
                        roleCollector.stop("roles_selected");
                    });

                    // When roles are selected, start confirmation collector
                    roleCollector.on("end", (collected, reason) => {
                        if (reason === "time") {
                            interaction
                                .editReply({
                                    content:
                                        "Role selection timed out. No roles were deleted.",
                                    components: [],
                                    flags: MessageFlags.Ephemeral,
                                })
                                .catch(() => { });
                        } else if (reason === "roles_selected") {
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
                                await i.deferUpdate();

                                // Handle cancel
                                if (i.customId === "cancel-delete") {
                                    await interaction.editReply({
                                        content: "Role deletion cancelled.",
                                        components: [],
                                        flags: MessageFlags.Ephemeral,
                                    });
                                    return;
                                }

                                // Handle confirm
                                if (i.customId === "confirm-delete") {
                                    await interaction.editReply({
                                        content: `Deleting ${selectedRoles.length} roles... This may take a moment.`,
                                        components: [],
                                        flags: MessageFlags.Ephemeral,
                                    });

                                    let successCount = 0;
                                    let errorCount = 0;
                                    let skippedCount = 0;
                                    let errorRoles = [];
                                    let skippedRoles = [];

                                    // Process each selected role
                                    for (const role of selectedRoleObjects) {
                                        // Skip if role no longer exists
                                        if (!role) {
                                            errorCount++;
                                            errorRoles.push("Unknown Role");
                                            continue;
                                        }

                                        // Role hierarchy checks
                                        if (
                                            role.position >=
                                            interaction.guild.members.me.roles
                                                .highest.position
                                        ) {
                                            skippedCount++;
                                            skippedRoles.push(
                                                role?.name || "unknown"
                                            );
                                            continue;
                                        }

                                        if (
                                            interaction.user.id !==
                                            interaction.guild.ownerId &&
                                            role.position >=
                                            interaction.member.roles.highest
                                                .position
                                        ) {
                                            skippedCount++;
                                            skippedRoles.push(
                                                role?.name || "unknown"
                                            );
                                            continue;
                                        }

                                        if (role.id === interaction.guild.id) {
                                            skippedCount++;
                                            skippedRoles.push("@everyone");
                                            continue;
                                        }

                                        try {
                                            // Delete the role
                                            const roleName = role.name;
                                            await role.delete(
                                                `Deleted by ${interaction.user.tag}`
                                            );
                                            successCount++;
                                        } catch (error) {
                                            console.error(
                                                `Error deleting role ${role?.name || "unknown"
                                                } (${role?.id || "unknown"}):`,
                                                error
                                            );
                                            errorCount++;
                                            errorRoles.push(
                                                role?.name || "Unknown Role"
                                            );
                                        }
                                    }

                                    // Prepare result message
                                    let resultMessage = `Results of role deletion:\n✅ Successfully deleted: ${successCount} role(s)`;

                                    if (skippedCount > 0) {
                                        resultMessage += `\n⚠️ Skipped due to hierarchy: ${skippedCount} role(s) [${skippedRoles.join(
                                            ", "
                                        )}]`;
                                    }

                                    if (errorCount > 0) {
                                        resultMessage += `\n❌ Failed to delete: ${errorCount} role(s) [${errorRoles.join(
                                            ", "
                                        )}]`;
                                    }

                                    // Update with the final results
                                    await interaction.editReply({
                                        content: resultMessage,
                                        components: [],
                                        flags: MessageFlags.Ephemeral,
                                    });
                                }
                            });

                            confirmCollector.on("end", (collected, reason) => {
                                if (reason === "time" && collected.size === 0) {
                                    interaction
                                        .editReply({
                                            content:
                                                "Confirmation timed out. No roles were deleted.",
                                            components: [],
                                            flags: MessageFlags.Ephemeral,
                                        })
                                        .catch(() => { });
                                }
                            });
                        }
                    });
                } catch (error) {
                    console.error("Error creating role deletion menu:", error);
                    await interaction.editReply({
                        content:
                            "An error occurred while setting up the role deletion menu. Please try again.",
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }
        }
        // ============================
        // === REORDER Subcommand ===
        // ============================
        else if (subcommand === "reorder") {
            const pivotRole = interaction.options.getRole("pivot");
            const positionOption = interaction.options.getString("position") || "below";
            const targetRole = interaction.options.getRole("target");
            const rangeStart = interaction.options.getRole("range_start");
            const rangeEnd = interaction.options.getRole("range_end");

            const executeReorder = async (rolesToMove) => {
                rolesToMove = rolesToMove.filter(r => r.id !== interaction.guild.id && r.id !== pivotRole.id);

                if (rolesToMove.length === 0) {
                    return interaction.editReply({ content: "No valid roles selected to move.", components: [] });
                }

                const botHighestPos = interaction.guild.members.me.roles.highest.position;
                if (pivotRole.position >= botHighestPos) {
                    return interaction.editReply({ content: "Cannot place roles relative to a pivot role higher than my highest role." });
                }

                for (const r of rolesToMove) {
                    if (r.position >= botHighestPos) {
                        return interaction.editReply({ content: `Cannot move role ${r.name} because it is higher or equal to my highest role.` });
                    }
                }

                await interaction.editReply({ content: "Calculating new role positions...", components: [] });

                const allRoles = Array.from(interaction.guild.roles.cache.values())
                    .sort((a, b) => a.position - b.position);

                const rolesToMoveIds = new Set(rolesToMove.map(r => r.id));
                const remainingRoles = allRoles.filter(r => !rolesToMoveIds.has(r.id));

                const pivotIndex = remainingRoles.findIndex(r => r.id === pivotRole.id);
                if (pivotIndex === -1) {
                    return interaction.editReply({ content: "Pivot role not found." });
                }

                rolesToMove.sort((a, b) => a.position - b.position);

                const insertIndex = positionOption === "above" ? pivotIndex + 1 : pivotIndex;
                remainingRoles.splice(insertIndex, 0, ...rolesToMove);

                const positionUpdates = remainingRoles.map((role, index) => ({
                    role: role.id,
                    position: index
                }));

                try {
                    await interaction.guild.roles.setPositions(positionUpdates);
                    await interaction.editReply({ content: `✅ Successfully moved ${rolesToMove.length} roles ${positionOption} ${pivotRole.name}.` });
                } catch (error) {
                    console.error("Error setting role positions:", error);
                    await interaction.editReply({ content: "❌ Failed to reorder roles due to an error." });
                }
            };

            if (targetRole) {
                await executeReorder([targetRole]);
            } else if (rangeStart && rangeEnd) {
                const pos1 = rangeStart.position;
                const pos2 = rangeEnd.position;
                const lowPos = Math.min(pos1, pos2);
                const highPos = Math.max(pos1, pos2);
                const rolesInRange = Array.from(interaction.guild.roles.cache.values())
                    .filter(r => r.position > lowPos && r.position < highPos);

                await executeReorder(rolesInRange);
            } else {
                const row = new ActionRowBuilder().addComponents(
                    new RoleSelectMenuBuilder()
                        .setCustomId("reorder-role-menu")
                        .setPlaceholder("Select roles to move")
                        .setMinValues(1)
                        .setMaxValues(10)
                );

                const confirmRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("confirm-reorder")
                        .setLabel("Confirm Move")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId("cancel-reorder")
                        .setLabel("Cancel")
                        .setStyle(ButtonStyle.Secondary)
                );

                const response = await interaction.editReply({
                    content: `Select the roles you want to move **${positionOption}** ${pivotRole.name}:`,
                    components: [row]
                });

                const collector = response.createMessageComponentCollector({
                    filter: i => i.user.id === interaction.user.id,
                    time: 60000
                });

                let selectedRoles = [];

                collector.on("collect", async i => {
                    await i.deferUpdate();
                    if (i.customId === "reorder-role-menu") {
                        selectedRoles = i.values;
                        await interaction.editReply({
                            content: `You've selected ${selectedRoles.length} roles to move **${positionOption}** ${pivotRole.name}. Confirm?`,
                            components: [confirmRow]
                        });
                        collector.stop("menu_selected");
                    }
                });

                collector.on("end", async (collected, reason) => {
                    if (reason === "time") {
                        await interaction.editReply({ content: "Selection timed out.", components: [] }).catch(() => { });
                    } else if (reason === "menu_selected") {
                        const btnCollector = response.createMessageComponentCollector({
                            filter: i => i.user.id === interaction.user.id && (i.customId === "confirm-reorder" || i.customId === "cancel-reorder"),
                            time: 30000,
                            max: 1
                        });

                        btnCollector.on("collect", async i => {
                            await i.deferUpdate();
                            if (i.customId === "cancel-reorder") {
                                await interaction.editReply({ content: "Role reorder cancelled.", components: [] });
                            } else if (i.customId === "confirm-reorder") {
                                const roleObjects = selectedRoles.map(id => interaction.guild.roles.cache.get(id)).filter(Boolean);
                                await executeReorder(roleObjects);
                            }
                        });

                        btnCollector.on("end", (btnCollected, btnReason) => {
                            if (btnReason === "time") {
                                interaction.editReply({ content: "Confirmation timed out.", components: [] }).catch(() => { });
                            }
                        });
                    }
                });
            }
        }
    },
};
