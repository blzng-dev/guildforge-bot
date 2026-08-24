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
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder
} = require("discord.js");
const MESSAGES = {
  role: {
    error_no_permission: "you do not have permission to manage server roles.",
    create_bulk: {
      error_no_names: "No valid role names provided.",
      error_limit: "Please limit to 50 roles at a time.",
      success: "Successfully created {createdCount} roles.",
      failed: "\nFailed to create {failedCount} roles:\n{failedNames}"
    },
    create: {
      error_invalid_color: "Invalid hex color format.",
      error_invalid_secondary_color: "Invalid secondary hex color format.",
      error_missing_primary_color: "A primary color is required when specifying a secondary color for a gradient.",
      position_error_everyone: "\n*(Cannot position below @everyone)*",
      position_error_hierarchy_below: "\n*(Could not position below {roleName} due to hierarchy)*",
      position_success_below: "\n*(Positioned below {roleName})*",
      position_error_hierarchy_above: "\n*(Could not position above {roleName} due to hierarchy)*",
      position_success_above: "\n*(Positioned above {roleName})*",
      success: "Successfully created role: <@&{roleId}>{positionMessage}",
      error_unknown: "There was an error trying to create the role."
    },
    preset: {
      error_invalid: "Invalid preset selected.",
      success: "Successfully created role <@&{roleId}> using the \"{presetName}\" preset.",
      error_unknown: "There was an error trying to create the preset role."
    },
    list: {
      error_empty: "There are no roles in this server (besides @everyone).",
      success: "**Server Roles ({count}):**\n{roleString}",
      success_file: "There are too many roles ({count}) to display directly. Here is a list as a file:",
      error_unknown: "An error occurred while trying to list the roles."
    },
    color: {
      error_read: "Error reading/parsing `colorRoles.json`. Make sure file exists & is valid JSON.",
      error_invalid_json: "`colorRoles.json` does not contain a valid JSON array.",
      results: "Color role creation finished.\n- Created: {createdCount}\n- Existed: {skippedCount}\n- Failed: {errorCount}"
    },
    msg_1: "There are no roles in this server (besides @everyone).",
    msg_2: "Deleting {length} created roles...",
    msg_3: "Deletion finished. Deleted: {deletedCount}. Failed: {deleteErrorCount}.",
    msg_4: "Successfully scraped {length} roles. Here is the JSON file:",
    msg_5: "There was an error trying to scrape roles.",
    msg_6: "An error occurred while trying to get role info.",
    msg_7: "Please select the roles you want to export:",
    msg_8: "Selection timed out.",
    msg_9: "No roles selected or found to export.",
    msg_10: "Deleting roles...",
    msg_11: "Deletion finished. Deleted: {deletedCount}. Failed: {failedCount}.",
    msg_12: "Select the roles you want to delete:",
    msg_13: "Deleting selected roles...",
    msg_14: "Deletion finished. Deleted: {deletedCount}. Failed: {failedCount}.",
    msg_15: "An error occurred while trying to export roles.",
    msg_16: "Failed to read the attached file. Make sure it is valid JSON.",
    msg_17: "Invalid JSON format. Expected an object or array of objects.",
    msg_18: "Import finished.\n- Roles Created: {createdCount}\n- Roles Existing/Restored: {restoredCount}\n- Role Assignments: {assignedCount}\n- Skipped Members (not in guild): {skippedMembers}",
    msg_19: "An error occurred while processing the import. Make sure the JSON structure is correct.",
    msg_20: "Could not find user {tag} in this server.",
    msg_21: "I cannot manage the role {name} because it's higher than or equal to my highest role.",
    msg_22: "You cannot manage the role {name} because it's higher than or equal to your highest role.",
    msg_23: "Removed role <@&{id}> from {tag}.",
    msg_24: "Added role <@&{id}> to {tag}.",
    msg_25: "Failed to toggle role <@&{id}>. Check my permissions and role hierarchy.",
    msg_26: "I cannot manage the role {name} because it's higher than or equal to my highest role.",
    msg_27: "You cannot manage the role {name} because it's higher than or equal to your highest role.",
    msg_28: "Cannot modify the @everyone role with this command.",
    msg_29: "Invalid hex color format. Use format #RRGGBB (e.g., #FF0000 for red).",
    msg_30: "No changes specified for the role.",
    msg_31: "Successfully updated role <@&{id}> ({var2}).",
    msg_32: "An error occurred while modifying the role. Check my permissions and role hierarchy.",
    msg_33: "I cannot modify the role {name} because it's higher than or equal to my highest role.",
    msg_34: "You cannot modify the role {name} because it's higher than or equal to your highest role.",
    msg_35: "Cannot modify the @everyone role with this command.",
    msg_36: "Successfully cleared all permissions from the role <@&{id}>.",
    msg_37: "An error occurred while clearing permissions. Check my permissions and role hierarchy.",
    msg_38: "Select the roles you want to clear all permissions from:",
    msg_39: "No roles were selected.",
    msg_40: "Role selection timed out. No permissions were cleared.",
    msg_41: "An error occurred while setting up the role selection. Please try again.",
    msg_42: "To delete a range of roles, you must specify both `start_role` and `end_role`.",
    msg_43: "The start and end roles cannot be the same for range deletion.",
    msg_44: "No roles found between **{name}** and **{name}**.",
    msg_45: "Found {size} roles between boundaries, but none can be deleted.{params}",
    msg_46: "Deleting {length} roles...",
    msg_47: "I cannot delete the role {name} because it's higher than or equal to my highest role.",
    msg_48: "You cannot delete the role {name} because it's higher than or equal to your highest role.",
    msg_49: "Cannot delete the @everyone role.",
    msg_50: "Cannot delete the role \"{name}\" because it currently has {size} member(s).",
    msg_51: "Successfully deleted the role \"{roleName}\" (was <@&{roleId}>).",
    msg_52: "An error occurred while deleting the role. Check my permissions and role hierarchy.",
    msg_53: "I cannot manage one or both of these roles because they are higher than or equal to my highest role.",
    msg_54: "You cannot manage one or both of these roles because they are higher than or equal to your highest role.",
    msg_55: "The primary and secondary roles cannot be the same.",
    msg_56: "No members found with the role {secondaryRole}.",
    msg_57: "Found {memberCount} members with {secondaryRole}. Starting transfer to {primaryRole}...",
    msg_58: "An unexpected error occurred while processing the request.",
    msg_59: "Select the roles you want to delete:",
    msg_60: "No roles were selected.",
    msg_61: "You are about to delete {length} role(s):\n{roleNames}\n\n**This action cannot be undone!** Are you sure?",
    msg_62: "Role selection timed out. No roles were deleted.",
    msg_63: "Role deletion cancelled.",
    msg_64: "Deleting {length} roles... This may take a moment.",
    msg_65: "Confirmation timed out. No roles were deleted.",
    msg_66: "An error occurred while setting up the role deletion menu. Please try again.",
    msg_67: "No valid roles selected to move.",
    msg_68: "Cannot place roles relative to a pivot role higher than my highest role.",
    msg_69: "Cannot move role {name} because it is higher or equal to my highest role.",
    msg_70: "Calculating new role positions...",
    msg_71: "Pivot role not found.",
    msg_72: ":checkmark: Successfully moved {length} roles {positionOption} {name}.",
    msg_73: ":x_: Failed to reorder roles due to an error.",
    msg_74: "No roles found strictly between the specified range.",
    msg_75: "The following roles will be moved {positionOption} **{name}**:\n{roleList}\n\nDo you want to proceed?",
    msg_76: "Reorder cancelled.",
    msg_77: "Confirmation timed out. Reorder cancelled.",
    msg_78: "Select the roles you want to move **{positionOption}** {name}:",
    msg_79: "You've selected {length} roles to move **{positionOption}** {name}. Confirm?",
    msg_80: "Selection timed out.",
    msg_81: "Role reorder cancelled.",
    msg_82: "Confirmation timed out."
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

function normalizeHexColor(input) {
  if (!input || typeof input !== "string") return null;
  const val = input.trim().replace(/^#/, "");
  if (/^f$/i.test(val)) return "#ffffff";
  if (/^0$/i.test(val)) return "#000000";
  if (/^[0-9a-fA-F]{3}$/.test(val)) {
    return `#${val[0]}${val[0]}${val[1]}${val[1]}${val[2]}${val[2]}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(val)) {
    return `#${val}`;
  }
  return null;
}

const fs = require("node:fs/promises");
const path = require("node:path");
const {
  confirmAction
} = require("../../utils/confirm.js");
const {
  ProgressReporter
} = require("../../utils/progress.js");

// Define permission presets
const permissionPresets = {
  mod: {
    name: "Moderator",
    permissions: [PermissionsBitField.Flags.ModerateMembers,
    // Timeout
    PermissionsBitField.Flags.KickMembers, PermissionsBitField.Flags.BanMembers, PermissionsBitField.Flags.ManageNicknames, PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ManageThreads, PermissionsBitField.Flags.PrioritySpeaker, PermissionsBitField.Flags.MuteMembers, PermissionsBitField.Flags.MoveMembers, PermissionsBitField.Flags.DeafenMembers]
  },
  mod_plus: {
    name: "Moderator+",
    permissions: [PermissionsBitField.Flags.ModerateMembers, PermissionsBitField.Flags.KickMembers, PermissionsBitField.Flags.BanMembers, PermissionsBitField.Flags.ManageNicknames, PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ManageThreads, PermissionsBitField.Flags.PrioritySpeaker, PermissionsBitField.Flags.MuteMembers, PermissionsBitField.Flags.MoveMembers, PermissionsBitField.Flags.DeafenMembers, PermissionsBitField.Flags.ManageGuild, PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ViewAuditLog]
  },
  admin: {
    name: "Administrator",
    permissions: [PermissionsBitField.Flags.Administrator]
  }
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
  use_app_commands: PermissionsBitField.Flags.UseApplicationCommands,
  // For slash commands & voice statuses
  use_external_stickers: PermissionsBitField.Flags.UseExternalStickers
};
const permissionChoices = [{
  name: "Enable",
  value: "enable"
}, {
  name: "Disable",
  value: "disable"
}];
module.exports = {
  data: new SlashCommandBuilder().setName("role").setDescription("manage server roles").setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild).setDMPermission(false)

  // --- Create Subcommand (Permissions option removed) ---
  .addSubcommand(subcommand => subcommand.setName("create").setDescription("create a new role").addStringOption(option => option.setName("name").setDescription("name for the new role").setRequired(true)).addStringOption(option => option.setName("color").setDescription("hex color code").setRequired(false)).addStringOption(option => option.setName("secondary_color").setDescription("secondary hex color code for gradient role").setRequired(false)).addBooleanOption(option => option.setName("hoist").setDescription("hoist role in member list").setRequired(false)).addBooleanOption(option => option.setName("mentionable").setDescription("allow anyone to mention this role").setRequired(false)).addRoleOption(option => option.setName("below_role").setDescription("position below this role").setRequired(false)).addRoleOption(option => option.setName("above_role").setDescription("position above this role").setRequired(false))).addSubcommand(subcommand => subcommand.setName("create-bulk").setDescription("create multiple roles via modal")).addSubcommand(subcommand => subcommand.setName("preset").setDescription("create a role from preset").addStringOption(option => option.setName("preset_name").setDescription("select permission preset").setRequired(true).addChoices({
    name: "Moderator",
    value: "mod"
  }, {
    name: "Moderator+",
    value: "mod_plus"
  }, {
    name: "Administrator",
    value: "admin"
  })).addStringOption(option => option.setName("role_name").setDescription("optional custom name").setRequired(false))).addSubcommand(subcommand => subcommand.setName("list").setDescription("list server roles").addBooleanOption(option => option.setName("hoisted").setDescription("filter by hoisted roles").setRequired(false)).addBooleanOption(option => option.setName("pingable").setDescription("filter by pingable roles").setRequired(false)).addBooleanOption(option => option.setName("has_admin").setDescription("filter by admin roles").setRequired(false))).addSubcommand(subcommand => subcommand.setName("color").setDescription("create color roles")).addSubcommand(subcommand => subcommand.setName("scrape").setDescription("scrapes server roles into a json file.")).addSubcommand(subcommand => subcommand.setName("info").setDescription("display role information").addRoleOption(option => option.setName("role").setDescription("the role to get info for").setRequired(true)).addBooleanOption(option => option.setName("ephemeral").setDescription("reply ephemerally (default false)").setRequired(false))).addSubcommand(subcommand => subcommand.setName("export").setDescription("export roles to json").addRoleOption(option => option.setName("target").setDescription("single role to export").setRequired(false)).addRoleOption(option => option.setName("start_role").setDescription("start of role range to export").setRequired(false)).addRoleOption(option => option.setName("end_role").setDescription("end of role range to export").setRequired(false)).addBooleanOption(option => option.setName("ephemeral").setDescription("reply ephemerally (default false)").setRequired(false))).addSubcommand(subcommand => subcommand.setName("import").setDescription("import roles from json").addAttachmentOption(option => option.setName("file").setDescription("the exported json file").setRequired(false))).addSubcommand(subcommand => subcommand.setName("toggle").setDescription("toggle role for a user").addRoleOption(option => option.setName("role").setDescription("the role to toggle").setRequired(true)).addUserOption(option => option.setName("user").setDescription("the user to toggle the role for").setRequired(true))).addSubcommand(subcommand => {
    subcommand.setName("manage").setDescription("modify role settings and permissions").addRoleOption(option => option.setName("role").setDescription("the role to modify").setRequired(true)).addStringOption(option => option.setName("rename").setDescription("rename the role")).addStringOption(option => option.setName("color").setDescription("hex color code")).addBooleanOption(option => option.setName("hoisted").setDescription("hoist role in member list")).addBooleanOption(option => option.setName("mentionable").setDescription("allow anyone to mention this role"));
    for (const [permName, flagBit] of Object.entries(rolePermissions)) {
      subcommand.addStringOption(option => option.setName(permName).setDescription(`set permission: ${permName.replace(/_/g, " ")}`).addChoices(...permissionChoices));
    }
    return subcommand;
  }).addSubcommand(subcommand => subcommand.setName("clear").setDescription("clear all permissions from roles").addRoleOption(option => option.setName("target").setDescription("role to clear (leave empty for multiple)").setRequired(false))).addSubcommand(subcommand => subcommand.setName("delete").setDescription("delete roles").addRoleOption(option => option.setName("target").setDescription("role to delete (leave empty for multiple)").setRequired(false)).addRoleOption(option => option.setName("start_role").setDescription("start role for range deletion").setRequired(false)).addRoleOption(option => option.setName("end_role").setDescription("end role for range deletion").setRequired(false)).addBooleanOption(option => option.setName("include_boundaries").setDescription("include start/end roles in deletion? (default false)").setRequired(false))).addSubcommand(subcommand => subcommand.setName("migrate").setDescription("migrate members between roles").addRoleOption(option => option.setName("primary_role").setDescription("the role to assign").setRequired(true)).addRoleOption(option => option.setName("secondary_role").setDescription("the role to select from").setRequired(true)).addBooleanOption(option => option.setName("transcript").setDescription("generate transcript before migration").setRequired(false)).addBooleanOption(option => option.setName("delete_secondary").setDescription("delete secondary role after migration").setRequired(false))).addSubcommand(subcommand => subcommand.setName("transfer").setDescription("copy roles from one user to another").addUserOption(option => option.setName("from").setDescription("the user to copy roles from").setRequired(true)).addUserOption(option => option.setName("to").setDescription("the user to copy roles to").setRequired(true))).addSubcommand(subcommand => subcommand.setName("reorder").setDescription("re-arrange roles by moving them above or below a pivot role.").addRoleOption(option => option.setName("pivot").setDescription("the pivot role").setRequired(true)).addStringOption(option => option.setName("position").setDescription("place above or below pivot (default below)").addChoices({
    name: "Above",
    value: "above"
  }, {
    name: "Below",
    value: "below"
  }).setRequired(false)).addRoleOption(option => option.setName("target").setDescription("single role to move").setRequired(false)).addRoleOption(option => option.setName("range_start").setDescription("start of role range to move").setRequired(false)).addRoleOption(option => option.setName("range_end").setDescription("end of role range to move").setRequired(false))),
  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return interaction.reply({
        content: getMessage('role.error_no_permission'),
        flags: MessageFlags.Ephemeral
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
      await interaction.deferReply({
        flags: isEphemeral ? MessageFlags.Ephemeral : undefined
      });
    }

    // ============================
    // === CREATE-BULK Subcommand ===
    // ============================
    if (subcommand === "create-bulk") {
      const modal = new ModalBuilder().setCustomId('bulkRoleCreateModal').setTitle('Bulk Create Roles');
      const rolesInput = new TextInputBuilder().setCustomId('rolesInput').setLabel("Names (comma or newline separated)").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("Role 1\\nRole 2, Role 3").setMaxLength(4000);
      const row = new ActionRowBuilder().addComponents(rolesInput);
      modal.addComponents(row);
      await interaction.showModal(modal);
      try {
        const modalSubmit = await interaction.awaitModalSubmit({
          time: 300000,
          filter: i => i.user.id === interaction.user.id && i.customId === 'bulkRoleCreateModal'
        });
        await modalSubmit.deferReply({
          flags: MessageFlags.Ephemeral
        });
        const input = modalSubmit.fields.getTextInputValue('rolesInput');
        // Split by newline or comma, then trim and remove empty
        const roleNames = input.split(/,|\n|\\n/).map(r => r.trim()).filter(r => r.length > 0);
        if (roleNames.length === 0) {
          return modalSubmit.editReply({
            content: getMessage('role.create_bulk.error_no_names'),
            flags: MessageFlags.Ephemeral
          });
        }
        if (roleNames.length > 50) {
          return modalSubmit.editReply({
            content: getMessage('role.create_bulk.error_limit'),
            flags: MessageFlags.Ephemeral
          });
        }
        let createdCount = 0;
        let failedCount = 0;
        const failedNames = [];
        const reporter = new ProgressReporter(modalSubmit, roleNames.length, "Bulk Creating Roles");
        for (const name of roleNames) {
          try {
            await interaction.guild.roles.create({
              name: name,
              permissions: [],
              hoist: false,
              mentionable: false
            });
            createdCount++;
            await reporter.update(true);
            await wait(1000); // Add a small delay to avoid rate limits
          } catch (error) {
            console.error(`Failed to create role ${name}:`, error);
            failedCount++;
            failedNames.push(name);
            await reporter.update(false);
          }
        }
        let resultMsg = getMessage('role.create_bulk.success', {
          createdCount
        });
        if (failedCount > 0) {
          resultMsg += getMessage('role.create_bulk.failed', {
            failedCount,
            failedNames: failedNames.map(f => `- ${f}`).join('\n')
          });
        }
        await reporter.finish(resultMsg);
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
      let color = interaction.options.getString("color");
      let secondaryColor = interaction.options.getString("secondary_color");
      const hoisted = interaction.options.getBoolean("hoist");
      const mentionable = interaction.options.getBoolean("mentionable");
      const belowRole = interaction.options.getRole("below_role");
      const aboveRole = interaction.options.getRole("above_role");

      if (color) {
        const normalized = normalizeHexColor(color);
        if (!normalized) {
          return interaction.editReply({
            content: getMessage('role.create.error_invalid_color'),
            flags: MessageFlags.Ephemeral
          });
        }
        color = normalized;
      }

      if (secondaryColor) {
        const normalized = normalizeHexColor(secondaryColor);
        if (!normalized) {
          return interaction.editReply({
            content: getMessage('role.create.error_invalid_secondary_color'),
            flags: MessageFlags.Ephemeral
          });
        }
        secondaryColor = normalized;
      }

      if (secondaryColor && !color) {
        return interaction.editReply({
          content: getMessage('role.create.error_missing_primary_color'),
          flags: MessageFlags.Ephemeral
        });
      }
      const hasEnhancedRoleColors = interaction.guild.features.includes("ENHANCED_ROLE_COLORS");
      try {
        const roleOptions = {
          name: roleName,
          hoist: hoisted !== null ? hoisted : false,
          // Default false
          mentionable: mentionable !== null ? mentionable : false,
          // Default false
          permissions: [] // Default no permissions for 'create'
        };
        if (secondaryColor && color && hasEnhancedRoleColors) {
          roleOptions.colors = {
            primaryColor: color,
            secondaryColor: secondaryColor
          };
        } else if (color) {
          roleOptions.colors = {
            primaryColor: color
          };
        }
        const targetRole = await interaction.guild.roles.create(roleOptions);
        let positionMessage = "";
        if (belowRole || aboveRole) {
          const botHighest = interaction.guild.members.me.roles.highest;
          if (belowRole) {
            if (belowRole.position === 0) {
              positionMessage = getMessage('role.create.position_error_everyone');
            } else if (belowRole.position >= botHighest.position) {
              positionMessage = getMessage('role.create.position_error_hierarchy_below', {
                roleName: belowRole.name
              });
            } else {
              await targetRole.setPosition(belowRole.position - 1);
              positionMessage = getMessage('role.create.position_success_below', {
                roleName: belowRole.name
              });
            }
          } else if (aboveRole) {
            if (aboveRole.position >= botHighest.position - 1) {
              positionMessage = getMessage('role.create.position_error_hierarchy_above', {
                roleName: aboveRole.name
              });
            } else {
              await targetRole.setPosition(aboveRole.position + 1);
              positionMessage = getMessage('role.create.position_success_above', {
                roleName: aboveRole.name
              });
            }
          }
        }
        console.log(`Created role: ${targetRole.name} (${targetRole.id}) with options:`, roleOptions);
        await interaction.editReply({
          content: getMessage('role.create.success', {
            roleId: targetRole.id,
            positionMessage
          }),
          flags: MessageFlags.Ephemeral
        });
      } catch (error) {
        console.error(`Error creating role "${roleName}":`, error);
        await interaction.editReply({
          content: getMessage('role.create.error_unknown'),
          flags: MessageFlags.Ephemeral
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
          content: getMessage('role.preset.error_invalid'),
          flags: MessageFlags.Ephemeral
        });
      }
      const roleName = customName || preset.name; // Use custom name or default preset name

      try {
        const roleOptions = {
          name: roleName,
          permissions: preset.permissions,
          hoist: true,
          // Default hoisted for presets
          mentionable: true // Default mentionable for presets
          // Color can be added later or left as default
        };
        const targetRole = await interaction.guild.roles.create(roleOptions);
        console.log(`Created preset role: ${targetRole.name} (${targetRole.id}) using preset "${presetKey}" with options:`, roleOptions);
        await interaction.editReply({
          content: getMessage('role.preset.success', {
            roleId: targetRole.id,
            presetName: preset.name
          }),
          flags: MessageFlags.Ephemeral
        });
      } catch (error) {
        console.error(`Error creating preset role "${roleName}" (preset: ${presetKey}):`, error);
        await interaction.editReply({
          content: getMessage('role.preset.error_unknown'),
          flags: MessageFlags.Ephemeral
        });
      }
    }
    // ============================
    // === LIST Subcommand =======
    // ============================
    else if (subcommand === "list") {
      try {
        const hoisted = interaction.options.getBoolean("hoisted");
        const pingable = interaction.options.getBoolean("pingable");
        const hasAdmin = interaction.options.getBoolean("has_admin");
        let roles = interaction.guild.roles.cache;
        if (hoisted !== null) roles = roles.filter(r => r.hoist === hoisted);
        if (pingable !== null) roles = roles.filter(r => r.mentionable === pingable);
        if (hasAdmin !== null) roles = roles.filter(r => r.permissions.has(PermissionsBitField.Flags.Administrator) === hasAdmin);

        // Sort by position descending (highest first) and remove @everyone
        const roleList = roles.filter(role => role.id !== interaction.guild.id).sort((a, b) => b.position - a.position).map(role => `- ${role.toString()}`);
        if (roleList.length === 0) {
          return interaction.editReply({
            content: getMessage("role.msg_1"),
            flags: MessageFlags.Ephemeral
          });
        }
        const roleString = roleList.join("\n");

        // Handle potential message length limit (2000 characters)
        if (roleString.length <= 2000) {
          await interaction.editReply({
            content: getMessage('role.list.success', {
              count: roleList.length,
              roleString
            }),
            flags: MessageFlags.Ephemeral,
            allowedMentions: {
              roles: []
            } // Prevent pinging roles
          });
        } else {
          // If too long, send as a file or use pagination (simple file approach here)
          const attachment = new AttachmentBuilder(Buffer.from(roleList.join("\n")), {
            name: "server-roles.txt"
          });
          await interaction.editReply({
            content: getMessage('role.list.success_file', {
              count: roleList.length
            }),
            files: [attachment],
            flags: MessageFlags.Ephemeral
          });
        }
      } catch (error) {
        console.error("Error listing roles:", error);
        await interaction.editReply({
          content: getMessage('role.list.error_unknown'),
          flags: MessageFlags.Ephemeral
        });
      }
    }
    // ============================
    // === COLOR Subcommand =====
    // ============================
    else if (subcommand === "color") {
      const filePath = path.join(__dirname, "../../data/colorRoles.json"); // Path to source file
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
          content: getMessage('role.color.error_read'),
          flags: MessageFlags.Ephemeral
        });
      }
      if (!Array.isArray(rolesToCreate)) {
        return interaction.editReply({
          content: getMessage('role.color.error_invalid_json'),
          flags: MessageFlags.Ephemeral
        });
      }
      const existingRoleNames = interaction.guild.roles.cache.map(r => r.name.toLowerCase());
      for (const roleData of rolesToCreate) {
        if (!roleData.name || !roleData.color) {
          console.warn(`Skipping invalid entry: ${JSON.stringify(roleData)}`);
          errorCount++;
          continue;
        }
        if (existingRoleNames.includes(roleData.name.toLowerCase())) {
          console.log(`Role "${roleData.name}" exists. Skipping.`);
          skippedCount++;
          continue;
        }
        const normalizedColor = normalizeHexColor(roleData.color);
        if (!normalizedColor) {
          console.warn(`Skipping "${roleData.name}" invalid color: ${roleData.color}`);
          errorCount++;
          continue;
        }
        roleData.color = normalizedColor;
        try {
          const newRole = await interaction.guild.roles.create({
            name: roleData.name,
            color: roleData.color,
            permissions: [],
            hoist: false
          });
          console.log(`Created role: ${newRole.name} (${newRole.id})`);
          createdRoleIds.push(newRole.id);
          createdCount++;
        } catch (error) {
          console.error(`Failed to create role "${roleData.name}":`, error);
          errorCount++;
        }
      }
      let replyMessage = getMessage('role.color.results', {
        createdCount,
        skippedCount,
        errorCount
      });
      const components = [];
      if (createdCount > 0) {
        const deleteButtonId = `delete-color-roles-${interaction.id}`;
        const deleteButton = new ButtonBuilder().setCustomId(deleteButtonId).setLabel("Delete Created Roles").setStyle(ButtonStyle.Danger);
        const row = new ActionRowBuilder().addComponents(deleteButton);
        components.push(row);
        const reply = await interaction.editReply({
          content: replyMessage,
          components: components,
          flags: MessageFlags.Ephemeral
        });
        const collectorFilter = i => i.customId === deleteButtonId && i.user.id === interaction.user.id;
        try {
          const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: collectorFilter,
            time: 60_000
          });
          collector.on("collect", async i => {
            await i.deferUpdate();
            let deletedCount = 0,
              deleteErrorCount = 0;
            await i.editReply({
              content: getMessage("role.msg_2", {
                length: createdRoleIds.length
              }),
              components: []
            });
            for (const roleId of createdRoleIds) {
              try {
                await interaction.guild.roles.delete(roleId, "Undo color role creation");
                deletedCount++;
              } catch (delErr) {
                console.error(`Failed delete role ${roleId}:`, delErr);
                deleteErrorCount++;
              }
            }
            await i.editReply({
              content: getMessage("role.msg_3", {
                deletedCount: deletedCount,
                deleteErrorCount: deleteErrorCount
              }),
              components: []
            });
            collector.stop();
          });
          collector.on("end", collected => {
            if (collected.size === 0) {
              deleteButton.setDisabled(true);
              interaction.editReply({
                content: replyMessage + "\n(Delete button timed out)",
                components: [row]
              }).catch(() => {});
            }
          });
        } catch (collectorError) {
          console.error("Collector error:", collectorError);
          await interaction.editReply({
            content: replyMessage + "\n(Could not set up delete button)",
            components: []
          });
        }
      } else {
        await interaction.editReply({
          content: replyMessage,
          components: []
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
        const allRolesData = roles.map(role => ({
          name: role.name,
          color: role.hexColor
        }));

        // Convert ALL roles data to JSON string and then Buffer
        const jsonData = JSON.stringify(allRolesData, null, 4); // Use allRolesData
        const buffer = Buffer.from(jsonData, "utf-8");

        // Create the attachment
        const attachment = new AttachmentBuilder(buffer, {
          name: "all_server_roles.json"
        }); // Changed filename

        // Send the file back to the user
        await interaction.editReply({
          content: getMessage("role.msg_4", {
            length: allRolesData.length
          }),
          // Update count source
          files: [attachment],
          flags: MessageFlags.Ephemeral
        });
      } catch (error) {
        console.error("Error scraping roles:", error);
        await interaction.editReply({
          content: getMessage("role.msg_5"),
          flags: MessageFlags.Ephemeral
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
          roleMembers = await interaction.guild.members.fetch({
            role: role.id
          });
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
        const attachment = new AttachmentBuilder(Buffer.from(jsonString), {
          name: `role_members_${role.id}.json`
        });
        await interaction.editReply({
          content: content,
          files: [attachment]
        });
      } catch (error) {
        console.error("Error getting role info:", error);
        await interaction.editReply({
          content: getMessage("role.msg_6")
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
        rolesToExport = Array.from(interaction.guild.roles.cache.values()).filter(r => r.position > lowPos && r.position < highPos);
      } else if (targetRole) {
        rolesToExport = [targetRole];
      } else {
        // Show role select menu
        const row = new ActionRowBuilder().addComponents(new RoleSelectMenuBuilder().setCustomId("export-role-menu").setPlaceholder("Select roles to export").setMinValues(1).setMaxValues(25));
        const response = await interaction.editReply({
          content: getMessage("role.msg_7"),
          components: [row]
        });
        try {
          const selection = await response.awaitMessageComponent({
            filter: i => i.customId === "export-role-menu" && i.user.id === interaction.user.id,
            time: 60000
          });
          rolesToExport = selection.values.map(id => interaction.guild.roles.cache.get(id)).filter(Boolean);
          await selection.deferUpdate();
        } catch (error) {
          return interaction.editReply({
            content: getMessage("role.msg_8"),
            components: []
          });
        }
      }
      if (rolesToExport.length === 0) {
        return interaction.editReply({
          content: getMessage("role.msg_9"),
          components: []
        });
      }
      try {
        // Fetch all members once to ensure cache is full
        await interaction.guild.members.fetch();
        const exportData = [];
        for (const role of rolesToExport) {
          // Explicitly filter cached members to ensure only those with the role are included
          const memberIds = interaction.guild.members.cache.filter(m => m.roles.cache.has(role.id)).map(m => m.id);
          let secondaryHex = null;
          let tertiaryHex = null;
          if (role.colors) {
            if (role.colors.secondaryColor !== null && role.colors.secondaryColor !== undefined) {
              secondaryHex = `#${role.colors.secondaryColor.toString(16).padStart(6, '0')}`;
            }
            if (role.colors.tertiaryColor !== null && role.colors.tertiaryColor !== undefined) {
              tertiaryHex = `#${role.colors.tertiaryColor.toString(16).padStart(6, '0')}`;
            }
          }
          exportData.push({
            name: role.name,
            color: role.hexColor,
            secondary_color: secondaryHex,
            tertiary_color: tertiaryHex,
            colors: role.colors ? {
              primaryColor: role.colors.primaryColor,
              secondaryColor: role.colors.secondaryColor,
              tertiaryColor: role.colors.tertiaryColor
            } : undefined,
            id: role.id,
            hoisted: role.hoist,
            pingable: role.mentionable,
            permissions: role.permissions.toArray(),
            total: memberIds.length,
            members: memberIds
          });
        }
        const jsonString = JSON.stringify(exportData, null, 4);
        const attachment = new AttachmentBuilder(Buffer.from(jsonString), {
          name: `exported_roles_${interaction.id}.json`
        });
        const deleteButton = new ButtonBuilder().setCustomId(`delete-exported-roles-${interaction.id}`).setLabel("Delete These Roles").setStyle(ButtonStyle.Danger);
        const deleteSomeButton = new ButtonBuilder().setCustomId(`delete-some-roles-${interaction.id}`).setLabel("Delete Some Roles").setStyle(ButtonStyle.Primary);
        const row = new ActionRowBuilder().addComponents(deleteButton, deleteSomeButton);
        let replyContent = `Successfully exported ${exportData.length} roles.`;
        if (exportData.length === 1) {
          replyContent = `Role export for **${exportData[0].name}** (${exportData[0].id})`;
        } else if (exportData.length > 1) {
          const roleList = exportData.map(r => `**${r.name}** (${r.id})`).join(", ");
          replyContent = `Roles export for ${roleList}`;

          // Truncate if too long for Discord (2000 chars)
          if (replyContent.length > 1900) {
            replyContent = replyContent.substring(0, 1900) + "... (and more)";
          }
        }
        const reply = await interaction.editReply({
          content: replyContent,
          files: [attachment],
          components: [row]
        });
        const collector = reply.createMessageComponentCollector({
          filter: i => (i.customId === `delete-exported-roles-${interaction.id}` || i.customId === `delete-some-roles-${interaction.id}`) && i.user.id === interaction.user.id,
          time: 60000
        });
        collector.on("collect", async i => {
          if (i.customId === `delete-exported-roles-${interaction.id}`) {
            await i.deferUpdate();
            await i.editReply({
              content: getMessage("role.msg_10"),
              components: []
            });
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
              content: getMessage("role.msg_11", {
                deletedCount: deletedCount,
                failedCount: failedCount
              }),
              components: []
            });
            collector.stop();
          } else if (i.customId === `delete-some-roles-${interaction.id}`) {
            const selectOptions = rolesToExport.slice(0, 25).map(r => ({
              label: r.name,
              value: r.id
            }));
            const selectMenu = new StringSelectMenuBuilder().setCustomId(`delete-select-${interaction.id}`).setPlaceholder("Select roles to delete").addOptions(selectOptions).setMinValues(1).setMaxValues(selectOptions.length);
            const selectRow = new ActionRowBuilder().addComponents(selectMenu);
            await i.reply({
              content: getMessage("role.msg_12"),
              components: [selectRow],
              flags: MessageFlags.Ephemeral
            });
            const menuCollector = i.channel.createMessageComponentCollector({
              filter: menuI => menuI.customId === `delete-select-${interaction.id}` && menuI.user.id === interaction.user.id,
              time: 30000,
              max: 1
            });
            menuCollector.on("collect", async menuI => {
              await menuI.deferUpdate();
              const selectedIds = menuI.values;
              await menuI.editReply({
                content: getMessage("role.msg_13"),
                components: []
              });
              let deletedCount = 0;
              let failedCount = 0;
              const botHighest = interaction.guild.members.me.roles.highest;
              for (const id of selectedIds) {
                const role = interaction.guild.roles.cache.get(id);
                if (!role) continue;
                try {
                  if (role.position >= botHighest.position) {
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
              await menuI.editReply({
                content: getMessage("role.msg_14", {
                  deletedCount: deletedCount,
                  failedCount: failedCount
                }),
                components: []
              });
            });
          }
        });
        collector.on("end", (collected, reason) => {
          if (reason === "time") {
            deleteButton.setDisabled(true);
            interaction.editReply({
              components: [new ActionRowBuilder().addComponents(deleteButton)]
            }).catch(() => {});
          }
        });
      } catch (error) {
        console.error("Error exporting roles:", error);
        await interaction.editReply({
          content: getMessage("role.msg_15"),
          components: []
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
          return interaction.editReply({
            content: getMessage("role.msg_16")
          });
        }
      } else {
        const modal = new ModalBuilder().setCustomId('roleImportModal').setTitle('Import Roles');
        const jsonInput = new TextInputBuilder().setCustomId('jsonInput').setLabel("JSON Data (Object or Array)").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("[\n  {\n    \"name\": \"Role Name\",\n    ...\n  }\n]").setMaxLength(4000);
        const row = new ActionRowBuilder().addComponents(jsonInput);
        modal.addComponents(row);
        await interaction.showModal(modal);
        try {
          const modalSubmit = await interaction.awaitModalSubmit({
            time: 300000,
            filter: i => i.user.id === interaction.user.id && i.customId === 'roleImportModal'
          });
          await modalSubmit.deferReply({
            flags: MessageFlags.Ephemeral
          });
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
          return targetInteraction.editReply({
            content: getMessage("role.msg_17")
          });
        }
        let createdCount = 0;
        let restoredCount = 0;
        let assignedCount = 0;
        let skippedMembers = 0;
        const hasEnhancedRoleColors = interaction.guild.features.includes("ENHANCED_ROLE_COLORS");
        for (const roleData of rolesToProcess) {
          let role = interaction.guild.roles.cache.find(r => r.id === roleData.id || r.name === roleData.name);
          if (!role) {
            const roleCreateOptions = {
              name: roleData.name,
              hoist: roleData.hoisted ?? false,
              mentionable: roleData.pingable ?? false,
              permissions: roleData.permissions ? roleData.permissions : []
            };

            const secondaryColor = roleData.secondary_color || roleData.colors?.secondaryColor;
            const primaryColor = roleData.color || (roleData.colors?.primaryColor !== undefined ? (typeof roleData.colors.primaryColor === 'number' ? `#${roleData.colors.primaryColor.toString(16).padStart(6, '0')}` : roleData.colors.primaryColor) : undefined);
            const tertiaryColor = roleData.tertiary_color || roleData.colors?.tertiaryColor;

            if (hasEnhancedRoleColors && (secondaryColor || tertiaryColor)) {
              roleCreateOptions.colors = {
                primaryColor: primaryColor,
                secondaryColor: secondaryColor ? (typeof secondaryColor === 'number' ? `#${secondaryColor.toString(16).padStart(6, '0')}` : secondaryColor) : undefined,
                tertiaryColor: tertiaryColor ? (typeof tertiaryColor === 'number' ? `#${tertiaryColor.toString(16).padStart(6, '0')}` : tertiaryColor) : undefined
              };
            } else if (primaryColor) {
              roleCreateOptions.colors = {
                primaryColor: primaryColor
              };
            }

            // Create the role
            role = await interaction.guild.roles.create(roleCreateOptions);
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
          content: getMessage("role.msg_18", {
            createdCount: createdCount,
            restoredCount: restoredCount,
            assignedCount: assignedCount,
            skippedMembers: skippedMembers
          })
        });
      } catch (error) {
        console.error("Error processing import:", error);
        await targetInteraction.editReply({
          content: getMessage("role.msg_19")
        });
      }
    }
    // ============================
    // === TOGGLE Subcommand ====
    // ============================
    else if (subcommand === "toggle") {
      const roleToToggle = interaction.options.getRole("role");
      const targetUser = interaction.options.getUser("user");
      const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null); // Fetch member object

      if (!member) {
        return interaction.editReply({
          content: getMessage("role.msg_20", {
            tag: targetUser.tag
          }),
          flags: MessageFlags.Ephemeral
        });
      }

      // Role hierarchy check (cannot assign roles higher than bot's highest role)
      if (roleToToggle.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.editReply({
          content: getMessage("role.msg_21", {
            name: roleToToggle.name
          }),
          flags: MessageFlags.Ephemeral
        });
      }
      // Optional: Check if command user's highest role is high enough
      if (roleToToggle.position >= interaction.member.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) {
        return interaction.editReply({
          content: getMessage("role.msg_22", {
            name: roleToToggle.name
          }),
          flags: MessageFlags.Ephemeral
        });
      }
      try {
        if (member.roles.cache.has(roleToToggle.id)) {
          // Role exists, remove it
          await member.roles.remove(roleToToggle.id);
          await interaction.editReply({
            content: getMessage("role.msg_23", {
              id: roleToToggle.id,
              tag: member.user.tag
            }),
            flags: MessageFlags.Ephemeral
          });
        } else {
          // Role doesn't exist, add it
          await member.roles.add(roleToToggle.id);
          await interaction.editReply({
            content: getMessage("role.msg_24", {
              id: roleToToggle.id,
              tag: member.user.tag
            }),
            flags: MessageFlags.Ephemeral
          });
        }
      } catch (error) {
        console.error(`Error toggling role ${roleToToggle.name} for ${member.user.tag}:`, error);
        await interaction.editReply({
          content: getMessage("role.msg_25", {
            id: roleToToggle.id
          }),
          flags: MessageFlags.Ephemeral
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
      if (targetRole.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.editReply({
          content: getMessage("role.msg_26", {
            name: targetRole.name
          }),
          flags: MessageFlags.Ephemeral
        });
      }
      if (interaction.user.id !== interaction.guild.ownerId && targetRole.position >= interaction.member.roles.highest.position) {
        return interaction.editReply({
          content: getMessage("role.msg_27", {
            name: targetRole.name
          }),
          flags: MessageFlags.Ephemeral
        });
      }
      if (targetRole.id === interaction.guild.id) {
        return interaction.editReply({
          content: getMessage("role.msg_28"),
          flags: MessageFlags.Ephemeral
        });
      }
      try {
        // Prepare role edit options
        const roleOptions = {};
        let permissionsModified = false;

        // Handle basic settings
        if (newName !== null) roleOptions.name = newName;
        if (color !== null) {
          const normalized = normalizeHexColor(color);
          if (!normalized) {
            return interaction.editReply({
              content: getMessage("role.msg_29"),
              flags: MessageFlags.Ephemeral
            });
          }
          roleOptions.color = normalized;
        }
        if (hoisted !== null) roleOptions.hoist = hoisted;
        if (mentionable !== null) roleOptions.mentionable = mentionable;

        // Get current permissions to modify
        let currentPermissions = new PermissionsBitField(targetRole.permissions);

        // Process each permission individually
        for (const [permName, flagBit] of Object.entries(rolePermissions)) {
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
            content: getMessage("role.msg_30"),
            flags: MessageFlags.Ephemeral
          });
        }

        // Edit the role
        await targetRole.edit(roleOptions, `Modified by ${interaction.user.tag} using role manage command`);

        // Prepare confirmation message
        let changes = [];
        if (newName !== null) changes.push(`name: ${newName}`);
        if (color !== null) changes.push(`color: ${color}`);
        if (hoisted !== null) changes.push(`displayed separately: ${hoisted ? "Yes" : "No"}`);
        if (mentionable !== null) changes.push(`mentionable: ${mentionable ? "Yes" : "No"}`);
        if (permissionsModified) changes.push("permissions updated");
        await interaction.editReply({
          content: getMessage("role.msg_31", {
            id: targetRole.id,
            var2: changes.join(", ")
          }),
          flags: MessageFlags.Ephemeral
        });
      } catch (error) {
        console.error(`Error modifying role ${targetRole.name} (${targetRole.id}):`, error);
        await interaction.editReply({
          content: getMessage("role.msg_32"),
          flags: MessageFlags.Ephemeral
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
        if (targetRole.position >= interaction.guild.members.me.roles.highest.position) {
          return interaction.editReply({
            content: getMessage("role.msg_33", {
              name: targetRole.name
            }),
            flags: MessageFlags.Ephemeral
          });
        }
        if (interaction.user.id !== interaction.guild.ownerId && targetRole.position >= interaction.member.roles.highest.position) {
          return interaction.editReply({
            content: getMessage("role.msg_34", {
              name: targetRole.name
            }),
            flags: MessageFlags.Ephemeral
          });
        }
        if (targetRole.id === interaction.guild.id) {
          return interaction.editReply({
            content: getMessage("role.msg_35"),
            flags: MessageFlags.Ephemeral
          });
        }
        const prompt = `Are you sure you want to clear all permissions from the role "${targetRole.name}"?`;
        const confirmed = await confirmAction(interaction, prompt);
        if (!confirmed) return;
        try {
          // Edit the role to have no permissions
          await targetRole.edit({
            permissions: []
          }, `Permissions cleared by ${interaction.user.tag}`);
          await interaction.editReply({
            content: getMessage("role.msg_36", {
              id: targetRole.id
            }),
            flags: MessageFlags.Ephemeral
          });
        } catch (error) {
          console.error(`Error clearing permissions for role ${targetRole.name} (${targetRole.id}):`, error);
          await interaction.editReply({
            content: getMessage("role.msg_37"),
            flags: MessageFlags.Ephemeral
          });
        }
      }
      // If no role was provided, show a role select menu
      else {
        try {
          // Create a role select menu
          const row = new ActionRowBuilder().addComponents(new RoleSelectMenuBuilder().setCustomId("role-clear-menu").setPlaceholder("Select roles to clear permissions from").setMinValues(1).setMaxValues(10) // Allow up to 10 roles at once
          );

          // Send message with the role select menu
          const response = await interaction.editReply({
            content: getMessage("role.msg_38"),
            components: [row],
            flags: MessageFlags.Ephemeral
          });

          // Create a collector for the select menu interaction
          const collector = response.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 60000,
            // 1 minute timeout
            componentType: ComponentType.RoleSelect
          });
          collector.on("collect", async i => {
            await i.deferUpdate();
            const selectedRoles = i.values;
            if (selectedRoles.length === 0) {
              await interaction.editReply({
                content: getMessage("role.msg_39"),
                components: [],
                flags: MessageFlags.Ephemeral
              });
              return collector.stop();
            }
            collector.stop();
            const prompt = `Are you sure you want to clear all permissions from ${selectedRoles.length} role(s)?`;
            const confirmed = await confirmAction(i, prompt);
            if (!confirmed) return;
            let successCount = 0;
            let errorCount = 0;
            let skippedCount = 0;
            let errorRoles = [];
            let skippedRoles = [];

            // Process each selected role
            for (const roleId of selectedRoles) {
              const role = interaction.guild.roles.cache.get(roleId);
              if (!role) {
                errorCount++;
                errorRoles.push(`Unknown Role`);
                continue;
              }

              // Role hierarchy checks
              if (role.position >= interaction.guild.members.me.roles.highest.position) {
                skippedCount++;
                skippedRoles.push(role.name);
                continue;
              }
              if (interaction.user.id !== interaction.guild.ownerId && role.position >= interaction.member.roles.highest.position) {
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
                await role.edit({
                  permissions: []
                }, `Permissions cleared by ${interaction.user.tag}`);
                successCount++;
              } catch (error) {
                console.error(`Error clearing permissions for role ${role.name} (${role.id}):`, error);
                errorCount++;
                errorRoles.push(role.name);
              }
            }

            // Prepare result message
            let resultMessage = `Results of clearing permissions:\nSuccessfully cleared: ${successCount} role(s)`;
            if (skippedCount > 0) {
              resultMessage += `\nSkipped due to hierarchy: ${skippedCount} role(s):\n${skippedRoles.map(s => `- ${s}`).join("\n")}`;
            }
            if (errorCount > 0) {
              resultMessage += `\nFailed to clear: ${errorCount} role(s):\n${errorRoles.map(e => `- ${e}`).join("\n")}`;
            }

            // Update the message with results
            await interaction.editReply({
              content: resultMessage,
              components: [],
              // Remove the select menu
              flags: MessageFlags.Ephemeral
            });
          });
          collector.on("end", (collected, reason) => {
            if (reason === "time" && collected.size === 0) {
              interaction.editReply({
                content: getMessage("role.msg_40"),
                components: [],
                flags: MessageFlags.Ephemeral
              }).catch(() => {});
            }
          });
        } catch (error) {
          console.error("Error creating role select menu:", error);
          await interaction.editReply({
            content: getMessage("role.msg_41"),
            flags: MessageFlags.Ephemeral
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
            content: getMessage("role.msg_42"),
            flags: MessageFlags.Ephemeral
          });
        }
        if (startRole.id === endRole.id) {
          return interaction.editReply({
            content: getMessage("role.msg_43"),
            flags: MessageFlags.Ephemeral
          });
        }
        const pos1 = startRole.position;
        const pos2 = endRole.position;
        const lowPos = Math.min(pos1, pos2);
        const highPos = Math.max(pos1, pos2);
        const includeBoundaries = interaction.options.getBoolean("include_boundaries") ?? false;

        // Filter roles based on boundaries
        const rolesInRange = interaction.guild.roles.cache.filter(r => includeBoundaries ? r.position >= lowPos && r.position <= highPos : r.position > lowPos && r.position < highPos);
        if (rolesInRange.size === 0) {
          return interaction.editReply({
            content: getMessage("role.msg_44", {
              name: startRole.name,
              name: endRole.name
            }),
            flags: MessageFlags.Ephemeral
          });
        }

        // Identify deleteable vs skipped roles
        const rolesToDelete = [];
        const skippedRoles = [];
        for (const [, role] of rolesInRange) {
          // Hierarchy checks
          const botHighest = interaction.guild.members.me.roles.highest;
          const userHighest = interaction.member.roles.highest;
          if (role.position >= botHighest.position) {
            skippedRoles.push(`${role.name} (Higher than Bot)`);
            continue;
          }
          if (interaction.user.id !== interaction.guild.ownerId && role.position >= userHighest.position) {
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
          const params = skippedRoles.length ? `\nSkipped:\n${skippedRoles.map(s => `- ${s}`).join("\n")}` : "";
          return interaction.editReply({
            content: getMessage("role.msg_45", {
              size: rolesInRange.size,
              params: params
            }),
            flags: MessageFlags.Ephemeral
          });
        }

        // Sort for display
        rolesToDelete.sort((a, b) => b.position - a.position);
        const roleNames = rolesToDelete.map(r => `- ${r.name}`).join("\n");
        const prompt = `Found **${rolesInRange.size}** roles between **${startRole.name}** and **${endRole.name}**.\n` + `**Roles to delete (${rolesToDelete.length}):**\n${roleNames}\n` + (skippedRoles.length > 0 ? `**Skipped (${skippedRoles.length}):**\n${skippedRoles.map(s => `- ${s}`).join("\n")}\n` : "") + `\n**Are you sure you want to delete these roles? This cannot be undone.**`;
        const confirmed = await confirmAction(interaction, prompt);
        if (!confirmed) return;

        // Proceed with deletion
        await interaction.editReply({
          content: getMessage("role.msg_46", {
            length: rolesToDelete.length
          }),
          components: []
        });
        let successCount = 0;
        let failCount = 0;
        const failedNames = [];
        for (const role of rolesToDelete) {
          try {
            // Re-check existence just in case
            if (interaction.guild.roles.cache.has(role.id)) {
              await role.delete(`Range delete by ${interaction.user.tag}`);
              successCount++;
            }
          } catch (err) {
            failCount++;
            failedNames.push(role.name);
            console.error(`Failed to delete ${role.name}:`, err);
          }
        }
        await interaction.editReply({
          content: `**Range Deletion Complete**\n` + `Successfully deleted: ${successCount}\n` + (failCount > 0 ? `Failed: ${failCount}\n${failedNames.map(f => `- ${f}`).join("\n")}` : ""),
          components: []
        });
      }

      // ============================
      // === Single Target Logic ===
      // ============================
      // If a role was provided directly
      else if (targetRole) {
        // Role hierarchy checks
        if (targetRole.position >= interaction.guild.members.me.roles.highest.position) {
          return interaction.editReply({
            content: getMessage("role.msg_47", {
              name: targetRole.name
            }),
            flags: MessageFlags.Ephemeral
          });
        }
        if (interaction.user.id !== interaction.guild.ownerId && targetRole.position >= interaction.member.roles.highest.position) {
          return interaction.editReply({
            content: getMessage("role.msg_48", {
              name: targetRole.name
            }),
            flags: MessageFlags.Ephemeral
          });
        }
        if (targetRole.id === interaction.guild.id) {
          return interaction.editReply({
            content: getMessage("role.msg_49"),
            flags: MessageFlags.Ephemeral
          });
        }
        if (targetRole.members.size > 0) {
          return interaction.editReply({
            content: getMessage("role.msg_50", {
              name: targetRole.name,
              size: targetRole.members.size
            }),
            flags: MessageFlags.Ephemeral
          });
        }
        const prompt = `Are you sure you want to delete the role "${targetRole.name}"?`;
        const confirmed = await confirmAction(interaction, prompt);
        if (!confirmed) return;
        try {
          // Store role name for confirmation message
          const roleName = targetRole.name;
          const roleId = targetRole.id;

          // Delete the role
          await targetRole.delete(`Deleted by ${interaction.user.tag}`);
          await interaction.editReply({
            content: getMessage("role.msg_51", {
              roleName: roleName,
              roleId: roleId
            }),
            flags: MessageFlags.Ephemeral
          });
        } catch (error) {
          console.error(`Error deleting role ${targetRole.name} (${targetRole.id}):`, error);
          await interaction.editReply({
            content: getMessage("role.msg_52"),
            flags: MessageFlags.Ephemeral
          });
        }
      }
      // ============================
      // === MIGRATE Subcommand ===
      // ============================
      else if (subcommand === "migrate") {
        const primaryRole = interaction.options.getRole("primary_role");
        const secondaryRole = interaction.options.getRole("secondary_role");
        const generateTranscript = interaction.options.getBoolean("transcript") || false;
        const deleteSecondary = interaction.options.getBoolean("delete_secondary") || false;

        // --- 1. Hierarchy & Permission Checks ---

        // Check if the bot can manage these roles
        if (primaryRole.position >= interaction.guild.members.me.roles.highest.position || secondaryRole.position >= interaction.guild.members.me.roles.highest.position) {
          return interaction.editReply({
            content: getMessage("role.msg_53"),
            flags: MessageFlags.Ephemeral
          });
        }

        // Check if the user can manage these roles (prevent abuse)
        if (interaction.user.id !== interaction.guild.ownerId) {
          if (primaryRole.position >= interaction.member.roles.highest.position || secondaryRole.position >= interaction.member.roles.highest.position) {
            return interaction.editReply({
              content: getMessage("role.msg_54"),
              flags: MessageFlags.Ephemeral
            });
          }
        }
        if (primaryRole.id === secondaryRole.id) {
          return interaction.editReply({
            content: getMessage("role.msg_55"),
            flags: MessageFlags.Ephemeral
          });
        }
        const prompt = deleteSecondary ? `Are you sure you want to migrate members from "${secondaryRole.name}" to "${primaryRole.name}" AND DELETE "${secondaryRole.name}"?` : `Are you sure you want to migrate members from "${secondaryRole.name}" to "${primaryRole.name}"?`;
        const confirmed = await confirmAction(interaction, prompt);
        if (!confirmed) return;
        try {
          // --- 2. Fetch Members ---
          // Fetch all members to ensure cache is full so secondaryRole.members is accurate
          await interaction.guild.members.fetch();
          const membersToTransfer = secondaryRole.members;
          const memberCount = membersToTransfer.size;
          if (memberCount === 0) {
            return interaction.editReply({
              content: getMessage("role.msg_56", {
                secondaryRole: secondaryRole
              })
            });
          }
          await interaction.editReply({
            content: getMessage("role.msg_57", {
              memberCount: memberCount,
              secondaryRole: secondaryRole,
              primaryRole: primaryRole
            })
          });

          // --- 3. Generate Transcript (Optional) ---
          let attachment = null;
          if (generateTranscript) {
            const idList = membersToTransfer.map(m => m.id).join("\n");
            const buffer = Buffer.from(idList, "utf-8");
            attachment = new AttachmentBuilder(buffer, {
              name: `${secondaryRole.name}_ids.txt`
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
              console.error(`Failed to add role to ${member.user.tag}:`, err);
              failCount++;
            }
          }
          let resultMsg = `**Migration Complete**\n- Successfully assigned ${primaryRole} to ${successCount} members.\n- Failed: ${failCount}`;

          // --- 5. Delete Secondary Role (Optional) ---
          if (deleteSecondary) {
            try {
              await secondaryRole.delete(`Role migration command by ${interaction.user.tag}`);
              resultMsg += `\n**Secondary Role Deleted**: The role "${secondaryRole.name}" has been deleted from the server.`;
            } catch (err) {
              console.error(`Failed to delete role ${secondaryRole.name}:`, err);
              resultMsg += `\n**Deletion Failed**: Could not delete the secondary role. Check my permissions.`;
            }
          }

          // --- 6. Final Response ---
          const replyOptions = {
            content: resultMsg,
            flags: MessageFlags.Ephemeral
          };
          if (attachment) {
            replyOptions.files = [attachment];
            replyOptions.content += `\n**Transcript**: Attached is the list of member IDs who had the secondary role.`;
          }
          await interaction.editReply(replyOptions);
        } catch (error) {
          console.error("Error executing migrate command:", error);
          await interaction.editReply({
            content: getMessage("role.msg_58")
          });
        }
      }
      // ============================
      // === TRANSFER Subcommand ===
      // ============================
      else if (subcommand === "transfer") {
        const fromUser = interaction.options.getUser("from");
        const toUser = interaction.options.getUser("to");

        const fromMember = await interaction.guild.members.fetch(fromUser.id).catch(() => null);
        const toMember = await interaction.guild.members.fetch(toUser.id).catch(() => null);

        if (!fromMember || !toMember) {
          return interaction.editReply({
            content: "Could not find one or both members in the server.",
            flags: MessageFlags.Ephemeral
          });
        }

        if (fromMember.id === toMember.id) {
          return interaction.editReply({
            content: "The 'from' and 'to' users cannot be the same person.",
            flags: MessageFlags.Ephemeral
          });
        }

        // Get bot's highest role position
        const botHighestPosition = interaction.guild.members.me.roles.highest.position;
        // Get author's highest role position
        const authorHighestPosition = interaction.member.roles.highest.position;
        const userIsOwner = interaction.guild.ownerId === interaction.user.id;

        // Get assignable roles from source member
        const rolesToCopy = fromMember.roles.cache.filter(role => {
          if (role.id === interaction.guild.id) return false; // Exclude @everyone
          if (role.managed) return false; // Exclude managed roles (e.g. booster/bot integration roles)
          if (role.position >= botHighestPosition) return false; // Bot cannot assign roles higher than itself
          if (!userIsOwner && role.position >= authorHighestPosition) return false; // Command user cannot assign roles higher than their own
          return !toMember.roles.cache.has(role.id); // Only roles the target doesn't already have
        });

        if (rolesToCopy.size === 0) {
          return interaction.editReply({
            content: `No new copyable/assignable roles found on **${fromMember.user.tag}** to copy to **${toMember.user.tag}** (they may already have them, or roles exceed hierarchy limits).`,
            flags: MessageFlags.Ephemeral
          });
        }

        const roleListString = rolesToCopy.map(role => role.name).join(", ");
        const confirmed = await confirmAction(interaction, `Are you sure you want to copy the following **${rolesToCopy.size}** roles from **${fromMember.user.tag}** to **${toMember.user.tag}**?\n\n**Roles:** *${roleListString}*`);
        if (!confirmed) return;

        try {
          await toMember.roles.add(rolesToCopy);
          await interaction.editReply({
            content: `Successfully copied **${rolesToCopy.size}** roles from **${fromMember.user.tag}** to **${toMember.user.tag}**:\n${rolesToCopy.map(role => `${role}`).join(", ")}`,
            flags: MessageFlags.Ephemeral
          });
        } catch (error) {
          console.error("Error executing transfer roles command:", error);
          await interaction.editReply({
            content: "An error occurred while copying roles. Please check my permissions and role hierarchy.",
            flags: MessageFlags.Ephemeral
          });
        }
      }
      // If no role was provided, show a role select menu
      else {
        try {
          // Create a role select menu
          const row = new ActionRowBuilder().addComponents(new RoleSelectMenuBuilder().setCustomId("role-delete-menu").setPlaceholder("Select roles to delete").setMinValues(1).setMaxValues(10) // Allow up to 10 roles at once
          );

          // Add a confirmation button
          const confirmRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("confirm-delete").setLabel("Confirm Deletion").setStyle(ButtonStyle.Danger), new ButtonBuilder().setCustomId("cancel-delete").setLabel("Cancel").setStyle(ButtonStyle.Secondary));

          // Send message with the role select menu
          const response = await interaction.editReply({
            content: getMessage("role.msg_59"),
            components: [row],
            flags: MessageFlags.Ephemeral
          });

          // Create collectors
          const roleCollector = response.createMessageComponentCollector({
            filter: i => i.customId === "role-delete-menu" && i.user.id === interaction.user.id,
            time: 60000 // 1 minute timeout
          });
          let selectedRoles = [];
          let selectedRoleObjects = [];
          roleCollector.on("collect", async i => {
            await i.deferUpdate();
            selectedRoles = i.values;
            selectedRoleObjects = selectedRoles.map(id => interaction.guild.roles.cache.get(id)).filter(r => r);

            // Check if any roles were selected
            if (selectedRoles.length === 0) {
              await interaction.editReply({
                content: getMessage("role.msg_60"),
                components: [],
                flags: MessageFlags.Ephemeral
              });
              return roleCollector.stop();
            }

            // Show confirmation with selected role names
            const roleNames = selectedRoleObjects.map(r => `- ${r?.name || "Unknown Role"}`).join("\n");
            await interaction.editReply({
              content: getMessage("role.msg_61", {
                length: selectedRoles.length,
                roleNames: roleNames
              }),
              components: [confirmRow],
              flags: MessageFlags.Ephemeral
            });

            // Stop the role collector as we now need confirmation
            roleCollector.stop("roles_selected");
          });

          // When roles are selected, start confirmation collector
          roleCollector.on("end", (collected, reason) => {
            if (reason === "time") {
              interaction.editReply({
                content: getMessage("role.msg_62"),
                components: [],
                flags: MessageFlags.Ephemeral
              }).catch(() => {});
            } else if (reason === "roles_selected") {
              // Start the confirmation collector
              const confirmCollector = response.createMessageComponentCollector({
                filter: i => (i.customId === "confirm-delete" || i.customId === "cancel-delete") && i.user.id === interaction.user.id,
                time: 30000,
                // 30 seconds to confirm
                max: 1 // Only collect one interaction
              });
              confirmCollector.on("collect", async i => {
                await i.deferUpdate();

                // Handle cancel
                if (i.customId === "cancel-delete") {
                  await interaction.editReply({
                    content: getMessage("role.msg_63"),
                    components: [],
                    flags: MessageFlags.Ephemeral
                  });
                  return;
                }

                // Handle confirm
                if (i.customId === "confirm-delete") {
                  await interaction.editReply({
                    content: getMessage("role.msg_64", {
                      length: selectedRoles.length
                    }),
                    components: [],
                    flags: MessageFlags.Ephemeral
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
                    if (role.position >= interaction.guild.members.me.roles.highest.position) {
                      skippedCount++;
                      skippedRoles.push(role?.name || "unknown");
                      continue;
                    }
                    if (interaction.user.id !== interaction.guild.ownerId && role.position >= interaction.member.roles.highest.position) {
                      skippedCount++;
                      skippedRoles.push(role?.name || "unknown");
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
                      await role.delete(`Deleted by ${interaction.user.tag}`);
                      successCount++;
                    } catch (error) {
                      console.error(`Error deleting role ${role?.name || "unknown"} (${role?.id || "unknown"}):`, error);
                      errorCount++;
                      errorRoles.push(role?.name || "Unknown Role");
                    }
                  }

                  // Prepare result message
                  let resultMessage = `Results of role deletion:\nSuccessfully deleted: ${successCount} role(s)`;
                  if (skippedCount > 0) {
                    resultMessage += `\nSkipped due to hierarchy: ${skippedCount} role(s):\n${skippedRoles.map(s => `- ${s}`).join("\n")}`;
                  }
                  if (errorCount > 0) {
                    resultMessage += `\nFailed to delete: ${errorCount} role(s):\n${errorRoles.map(e => `- ${e}`).join("\n")}`;
                  }

                  // Update with the final results
                  await interaction.editReply({
                    content: resultMessage,
                    components: [],
                    flags: MessageFlags.Ephemeral
                  });
                }
              });
              confirmCollector.on("end", (collected, reason) => {
                if (reason === "time" && collected.size === 0) {
                  interaction.editReply({
                    content: getMessage("role.msg_65"),
                    components: [],
                    flags: MessageFlags.Ephemeral
                  }).catch(() => {});
                }
              });
            }
          });
        } catch (error) {
          console.error("Error creating role deletion menu:", error);
          await interaction.editReply({
            content: getMessage("role.msg_66"),
            flags: MessageFlags.Ephemeral
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
      const executeReorder = async rolesToMove => {
        rolesToMove = rolesToMove.filter(r => r.id !== interaction.guild.id && r.id !== pivotRole.id);
        if (rolesToMove.length === 0) {
          return interaction.editReply({
            content: getMessage("role.msg_67"),
            components: []
          });
        }
        const botHighestPos = interaction.guild.members.me.roles.highest.position;
        if (pivotRole.position >= botHighestPos) {
          return interaction.editReply({
            content: getMessage("role.msg_68")
          });
        }
        for (const r of rolesToMove) {
          if (r.position >= botHighestPos) {
            return interaction.editReply({
              content: getMessage("role.msg_69", {
                name: r.name
              })
            });
          }
        }
        await interaction.editReply({
          content: getMessage("role.msg_70"),
          components: []
        });
        const allRoles = Array.from(interaction.guild.roles.cache.values()).sort((a, b) => a.position - b.position);
        const rolesToMoveIds = new Set(rolesToMove.map(r => r.id));
        const remainingRoles = allRoles.filter(r => !rolesToMoveIds.has(r.id));
        const pivotIndex = remainingRoles.findIndex(r => r.id === pivotRole.id);
        if (pivotIndex === -1) {
          return interaction.editReply({
            content: getMessage("role.msg_71")
          });
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
          await interaction.editReply({
            content: getMessage("role.msg_72", {
              length: rolesToMove.length,
              positionOption: positionOption,
              name: pivotRole.name
            })
          });
        } catch (error) {
          console.error("Error setting role positions:", error);
          await interaction.editReply({
            content: getMessage("role.msg_73")
          });
        }
      };
      if (targetRole) {
        await executeReorder([targetRole]);
      } else if (rangeStart && rangeEnd) {
        const pos1 = rangeStart.position;
        const pos2 = rangeEnd.position;
        const lowPos = Math.min(pos1, pos2);
        const highPos = Math.max(pos1, pos2);
        const rolesInRange = Array.from(interaction.guild.roles.cache.values()).filter(r => r.position > lowPos && r.position < highPos);
        if (rolesInRange.length === 0) {
          return interaction.editReply({
            content: getMessage("role.msg_74")
          });
        }
        const roleList = rolesInRange.map(r => `- **${r.name}**`).join("\n");
        const confirmButton = new ButtonBuilder().setCustomId(`confirm-reorder-${interaction.id}`).setLabel("Confirm Move").setStyle(ButtonStyle.Success);
        const cancelButton = new ButtonBuilder().setCustomId(`cancel-reorder-${interaction.id}`).setLabel("Cancel").setStyle(ButtonStyle.Danger);
        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
        const response = await interaction.editReply({
          content: getMessage("role.msg_75", {
            positionOption: positionOption,
            name: pivotRole.name,
            roleList: roleList
          }),
          components: [row]
        });
        try {
          const confirmation = await response.awaitMessageComponent({
            filter: i => i.user.id === interaction.user.id,
            time: 30000
          });
          if (confirmation.customId === `confirm-reorder-${interaction.id}`) {
            await confirmation.deferUpdate();
            await executeReorder(rolesInRange);
          } else {
            await confirmation.deferUpdate();
            await confirmation.editReply({
              content: getMessage("role.msg_76"),
              components: []
            });
          }
        } catch (error) {
          await interaction.editReply({
            content: getMessage("role.msg_77"),
            components: []
          });
        }
      } else {
        const row = new ActionRowBuilder().addComponents(new RoleSelectMenuBuilder().setCustomId("reorder-role-menu").setPlaceholder("Select roles to move").setMinValues(1).setMaxValues(10));
        const confirmRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("confirm-reorder").setLabel("Confirm Move").setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId("cancel-reorder").setLabel("Cancel").setStyle(ButtonStyle.Secondary));
        const response = await interaction.editReply({
          content: getMessage("role.msg_78", {
            positionOption: positionOption,
            name: pivotRole.name
          }),
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
              content: getMessage("role.msg_79", {
                length: selectedRoles.length,
                positionOption: positionOption,
                name: pivotRole.name
              }),
              components: [confirmRow]
            });
            collector.stop("menu_selected");
          }
        });
        collector.on("end", async (collected, reason) => {
          if (reason === "time") {
            await interaction.editReply({
              content: getMessage("role.msg_80"),
              components: []
            }).catch(() => {});
          } else if (reason === "menu_selected") {
            const btnCollector = response.createMessageComponentCollector({
              filter: i => i.user.id === interaction.user.id && (i.customId === "confirm-reorder" || i.customId === "cancel-reorder"),
              time: 30000,
              max: 1
            });
            btnCollector.on("collect", async i => {
              await i.deferUpdate();
              if (i.customId === "cancel-reorder") {
                await interaction.editReply({
                  content: getMessage("role.msg_81"),
                  components: []
                });
              } else if (i.customId === "confirm-reorder") {
                const roleObjects = selectedRoles.map(id => interaction.guild.roles.cache.get(id)).filter(Boolean);
                await executeReorder(roleObjects);
              }
            });
            btnCollector.on("end", (btnCollected, btnReason) => {
              if (btnReason === "time") {
                interaction.editReply({
                  content: getMessage("role.msg_82"),
                  components: []
                }).catch(() => {});
              }
            });
          }
        });
      }
    }
  }
};