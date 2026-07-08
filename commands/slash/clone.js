const {
    SlashCommandBuilder,
    ChannelType,
    PermissionsBitField,
    MessageFlags,
} = require("discord.js");
const { getMessage } = require("../../utils/messages");
const { InteractiveProgress } = require("../../utils/progress.js");
const { logAction } = require("../../utils/logger.js");

async function cloneSingleChannel(sourceChannel, targetGuild, targetParentId, newName, copyPerms, isCrossServer, roleMap = new Map()) {
    const channelOptions = {
        name: newName || sourceChannel.name,
        type: sourceChannel.type,
        topic: sourceChannel.topic,
        nsfw: sourceChannel.nsfw,
        parent: targetParentId || null,
        position: sourceChannel.position,
        rateLimitPerUser: sourceChannel.rateLimitPerUser || 0,
    };
    
    if (sourceChannel.type === ChannelType.GuildVoice) {
        channelOptions.bitrate = sourceChannel.bitrate;
        channelOptions.userLimit = sourceChannel.userLimit;
        channelOptions.rtcRegion = sourceChannel.rtcRegion;
    }

    if (copyPerms && (!isCrossServer || roleMap.size > 0)) {
        channelOptions.permissionOverwrites = sourceChannel.permissionOverwrites.cache.map(po => {
            let newId = po.id;
            if (isCrossServer && roleMap.has(po.id)) {
                newId = roleMap.get(po.id);
            } else if (isCrossServer) {
                return null; // Skip unknown roles/users cross-server
            }
            return {
                id: newId,
                allow: po.allow.bitfield,
                deny: po.deny.bitfield,
                type: po.type
            };
        }).filter(Boolean);
    }

    return await targetGuild.channels.create(channelOptions);
}

async function cloneForumChannel(sourceChannel, targetGuild, targetParentId, newName, copyPerms, isCrossServer, copyTags, clonePosts, clonePostDesc, roleMap = new Map(), progressManager = null) {
    const channelOptions = {
        name: newName || sourceChannel.name,
        type: sourceChannel.type,
        topic: sourceChannel.topic,
        nsfw: sourceChannel.nsfw,
        parent: targetParentId || null,
        position: sourceChannel.position,
        rateLimitPerUser: sourceChannel.rateLimitPerUser || 0,
        defaultAutoArchiveDuration: sourceChannel.defaultAutoArchiveDuration,
    };

    if (copyPerms && (!isCrossServer || roleMap.size > 0)) {
        channelOptions.permissionOverwrites = sourceChannel.permissionOverwrites.cache.map(po => {
            let newId = po.id;
            if (isCrossServer && roleMap.has(po.id)) {
                newId = roleMap.get(po.id);
            } else if (isCrossServer) {
                return null; 
            }
            return {
                id: newId,
                allow: po.allow.bitfield,
                deny: po.deny.bitfield,
                type: po.type
            };
        }).filter(Boolean);
    }

    if (copyTags) {
        channelOptions.availableTags = sourceChannel.availableTags.map(tag => {
            const newTag = { name: tag.name, moderated: tag.moderated };
            if (tag.emoji && !tag.emoji.id) {
                newTag.emoji = { id: null, name: tag.emoji.name };
            }
            return newTag;
        });

        if (sourceChannel.defaultReactionEmoji && !sourceChannel.defaultReactionEmoji.id) {
            channelOptions.defaultReactionEmoji = { emojiName: sourceChannel.defaultReactionEmoji.name };
        }
    }

    const newChannel = await targetGuild.channels.create(channelOptions);

    if (clonePosts) {
        const tagIdMap = new Map();
        if (copyTags) {
            for (const sourceTag of sourceChannel.availableTags) {
                const newTag = newChannel.availableTags.find((nt) => nt.name === sourceTag.name);
                if (newTag) tagIdMap.set(sourceTag.id, newTag.id);
            }
        }

        const activeThreads = await sourceChannel.threads.fetch();
        const archivedThreads = await sourceChannel.threads.fetchArchived();
        const allThreads = [...activeThreads.threads.values(), ...archivedThreads.threads.values()]
            .sort((a, b) => a.createdTimestamp - b.createdTimestamp);
        
        if (allThreads.length > 0 && progressManager) {
            progressManager.total = allThreads.length;
            await progressManager.start();

            for (const thread of allThreads) {
                await progressManager.waitIfPaused();
                if (progressManager.isCancelled) break;

                try {
                    const newAppliedTagIds = thread.appliedTags.map((tagId) => tagIdMap.get(tagId)).filter(Boolean);
                    let msgContent = '_ _';
                    if (clonePostDesc) {
                        try {
                            const starterMsg = await thread.fetchStarterMessage();
                            msgContent = starterMsg?.content || '_ _';
                        } catch (e) {}
                    }

                    await newChannel.threads.create({
                        name: thread.name,
                        message: { content: msgContent },
                        appliedTags: newAppliedTagIds,
                    });
                    await progressManager.update(true);
                } catch (err) {
                    await progressManager.update(false);
                }
            }
            await progressManager.finish(getMessage('clone.forum.progress_finish', { name: newChannel.name }));
        }
    }

    return newChannel;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("clone")
        .setDescription("Clones channels, categories, or entire servers")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .addSubcommand((subcommand) =>
            subcommand
                .setName("channel")
                .setDescription("Clones a single non-forum channel")
                .addStringOption((option) => option.setName("id").setDescription("The ID of the channel to clone").setRequired(true))
                .addStringOption((option) => option.setName("name").setDescription("Name for the cloned channel").setRequired(false))
                .addBooleanOption((option) => option.setName("copy_permissions").setDescription("Copy role/user permissions (default true)").setRequired(false))
                .addStringOption((option) => option.setName("target_server_id").setDescription("ID of target server for cross-server cloning").setRequired(false))
                .addStringOption((option) => option.setName("target_category_id").setDescription("ID of category to place the cloned channel in").setRequired(false))
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("forum")
                .setDescription("Clones a forum channel")
                .addStringOption((option) => option.setName("id").setDescription("The ID of the forum channel to clone").setRequired(true))
                .addStringOption((option) => option.setName("name").setDescription("Name for the cloned forum").setRequired(false))
                .addBooleanOption((option) => option.setName("copy_permissions").setDescription("Copy role/user permissions (default true)").setRequired(false))
                .addStringOption((option) => option.setName("target_server_id").setDescription("ID of target server for cross-server cloning").setRequired(false))
                .addStringOption((option) => option.setName("target_category_id").setDescription("ID of category to place the cloned forum in").setRequired(false))
                .addBooleanOption((option) => option.setName("copy_tags").setDescription("Copy tags (default true)").setRequired(false))
                .addBooleanOption((option) => option.setName("clone_posts").setDescription("Clone posts (default false)").setRequired(false))
                .addBooleanOption((option) => option.setName("clone_post_description").setDescription("Clone post descriptions (default true)").setRequired(false))
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("category")
                .setDescription("Clones an entire category and its channels")
                .addStringOption((option) => option.setName("id").setDescription("The ID of the category to clone").setRequired(true))
                .addStringOption((option) => option.setName("name").setDescription("Name for the new category").setRequired(false))
                .addBooleanOption((option) => option.setName("copy_permissions").setDescription("Copy role/user permissions (default true)").setRequired(false))
                .addStringOption((option) => option.setName("target_server_id").setDescription("ID of target server for cross-server cloning").setRequired(false))
                .addBooleanOption((option) => option.setName("clone_posts").setDescription("Clone posts in forum channels (default false)").setRequired(false))
                .addBooleanOption((option) => option.setName("clone_post_description").setDescription("Clone post descriptions (default true)").setRequired(false))
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("server")
                .setDescription("Clones all channels from current server to a target server")
                .addStringOption((option) => option.setName("target_server_id").setDescription("The server ID to clone into").setRequired(true))
                .addBooleanOption((option) => option.setName("clone_roles").setDescription("Clone roles and map permissions (default false)").setRequired(false))
                .addBooleanOption((option) => option.setName("clone_posts").setDescription("Clone posts in forum channels (default false)").setRequired(false))
                .addBooleanOption((option) => option.setName("clone_post_description").setDescription("Clone post descriptions (default true)").setRequired(false))
        ),
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const subcommand = interaction.options.getSubcommand();
        const targetGuildId = interaction.options.getString("target_server_id");
        
        let sourceGuild = interaction.guild;
        let targetGuild = interaction.guild;
        let isCrossServer = false;

        if (targetGuildId && targetGuildId !== sourceGuild.id) {
            isCrossServer = true;
            targetGuild = await interaction.client.guilds.fetch(targetGuildId).catch(() => null);
            
            if (!targetGuild) {
                return interaction.editReply({ content: getMessage('clone.error_target_not_found', { targetGuildId }) });
            }

            const sourceMember = await sourceGuild.members.fetch(interaction.user.id).catch(() => null);
            if (!sourceMember || !sourceMember.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.editReply({ content: getMessage('clone.error_source_admin') });
            }
            const targetMember = await targetGuild.members.fetch(interaction.user.id).catch(() => null);
            if (!targetMember || !targetMember.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.editReply({ content: getMessage('clone.error_target_admin') });
            }
        }

        const roleMap = new Map();

        if (subcommand === "channel") {
            const channelId = interaction.options.getString("id");
            const newName = interaction.options.getString("name");
            const copyPerms = interaction.options.getBoolean("copy_permissions") ?? true;
            const targetCatId = interaction.options.getString("target_category_id");

            const sourceChannel = await sourceGuild.channels.fetch(channelId).catch(() => null);
            if (!sourceChannel || sourceChannel.type === ChannelType.GuildForum || sourceChannel.type === ChannelType.GuildCategory) {
                return interaction.editReply({ content: getMessage('clone.channel.error_invalid') });
            }
            
            await cloneSingleChannel(sourceChannel, targetGuild, targetCatId, newName, copyPerms, isCrossServer, roleMap);
            await interaction.editReply({ content: getMessage('clone.channel.success', { name: newName || sourceChannel.name }) });
            await logAction(interaction.guild, `**Cloned Channel**\nCloned ${sourceChannel.name} to ${targetGuild.name} by ${interaction.user.tag}`);
        } 
        else if (subcommand === "forum") {
            const channelId = interaction.options.getString("id");
            const newName = interaction.options.getString("name");
            const copyPerms = interaction.options.getBoolean("copy_permissions") ?? true;
            const targetCatId = interaction.options.getString("target_category_id");
            const copyTags = interaction.options.getBoolean("copy_tags") ?? true;
            const clonePosts = interaction.options.getBoolean("clone_posts") ?? false;
            const clonePostDesc = interaction.options.getBoolean("clone_post_description") ?? true;

            const sourceChannel = await sourceGuild.channels.fetch(channelId).catch(() => null);
            if (!sourceChannel || sourceChannel.type !== ChannelType.GuildForum) {
                return interaction.editReply({ content: getMessage('clone.forum.error_invalid') });
            }

            const progressManager = clonePosts ? new InteractiveProgress(interaction, 0, `Cloning Forum Posts: ${sourceChannel.name}`) : null;
            await cloneForumChannel(sourceChannel, targetGuild, targetCatId, newName, copyPerms, isCrossServer, copyTags, clonePosts, clonePostDesc, roleMap, progressManager);
            if (!clonePosts) {
                await interaction.editReply({ content: getMessage('clone.forum.success', { name: newName || sourceChannel.name }) });
            }
            await logAction(interaction.guild, `**Cloned Forum**\nCloned ${sourceChannel.name} to ${targetGuild.name} by ${interaction.user.tag}`);
        }
        else if (subcommand === "category") {
            const categoryId = interaction.options.getString("id");
            const newName = interaction.options.getString("name");
            const copyPerms = interaction.options.getBoolean("copy_permissions") ?? true;
            const clonePosts = interaction.options.getBoolean("clone_posts") ?? false;
            const clonePostDesc = interaction.options.getBoolean("clone_post_description") ?? true;

            const sourceCategory = await sourceGuild.channels.fetch(categoryId).catch(() => null);
            if (!sourceCategory || sourceCategory.type !== ChannelType.GuildCategory) {
                return interaction.editReply({ content: getMessage('clone.category.error_invalid') });
            }

            const channelsToClone = sourceGuild.channels.cache
                .filter((ch) => ch.parentId === sourceCategory.id)
                .sort((a, b) => a.position - b.position);

            const progressManager = new InteractiveProgress(interaction, channelsToClone.size, `Cloning Category: ${newName || sourceCategory.name}`);
            await progressManager.start();

            // Clone category first
            const catOptions = {
                name: newName || sourceCategory.name,
                type: ChannelType.GuildCategory,
                position: sourceCategory.position,
            };
            if (copyPerms && !isCrossServer) {
                catOptions.permissionOverwrites = sourceCategory.permissionOverwrites.cache.map(po => po.toJSON());
            }
            const newCategory = await targetGuild.channels.create(catOptions);

            for (const channel of channelsToClone.values()) {
                await progressManager.waitIfPaused();
                if (progressManager.isCancelled) break;

                try {
                    if (channel.type === ChannelType.GuildForum) {
                        await cloneForumChannel(channel, targetGuild, newCategory.id, null, copyPerms, isCrossServer, true, clonePosts, clonePostDesc, roleMap, null); // don't nest progress tracking
                    } else {
                        await cloneSingleChannel(channel, targetGuild, newCategory.id, null, copyPerms, isCrossServer, roleMap);
                    }
                    await progressManager.update(true);
                } catch (e) {
                    console.error(e);
                    await progressManager.update(false);
                }
            }
            await progressManager.finish(getMessage('clone.category.progress_finish', { name: newCategory.name }));
            await logAction(interaction.guild, `**Cloned Category**\nCloned ${sourceCategory.name} to ${targetGuild.name} by ${interaction.user.tag}`);
        }
        else if (subcommand === "server") {
            const cloneRoles = interaction.options.getBoolean("clone_roles") ?? false;
            const clonePosts = interaction.options.getBoolean("clone_posts") ?? false;
            const clonePostDesc = interaction.options.getBoolean("clone_post_description") ?? true;

            // We must have target_server_id for server cloning.
            if (!isCrossServer) {
                return interaction.editReply({ content: getMessage('clone.server.error_cross_server') });
            }

            if (cloneRoles) {
                const roles = sourceGuild.roles.cache.sort((a, b) => b.position - a.position);
                roleMap.set(sourceGuild.roles.everyone.id, targetGuild.roles.everyone.id);
                
                await interaction.editReply({ content: getMessage('clone.server.cloning_roles', { count: roles.size }) });
                
                for (const role of roles.values()) {
                    if (role.id === sourceGuild.roles.everyone.id) continue;
                    if (role.managed) continue; 
                    
                    try {
                        const newRole = await targetGuild.roles.create({
                            name: role.name,
                            color: role.color,
                            hoist: role.hoist,
                            permissions: role.permissions,
                            mentionable: role.mentionable,
                        });
                        roleMap.set(role.id, newRole.id);
                    } catch(e) {}
                }
            }

            const channels = sourceGuild.channels.cache;
            const categories = channels.filter(ch => ch.type === ChannelType.GuildCategory).sort((a, b) => a.position - b.position);
            const parentlessChannels = channels.filter(ch => !ch.parentId && ch.type !== ChannelType.GuildCategory).sort((a, b) => a.position - b.position);
            
            const totalItems = categories.size + parentlessChannels.size + channels.filter(ch => ch.parentId).size;
            const progressManager = new InteractiveProgress(interaction, totalItems, `Cloning Server: ${sourceGuild.name} ➡️ ${targetGuild.name}`);
            await progressManager.start();

            // Clone categories and their children
            for (const category of categories.values()) {
                await progressManager.waitIfPaused();
                if (progressManager.isCancelled) break;

                try {
                    const catOptions = { name: category.name, type: ChannelType.GuildCategory, position: category.position };
                    if (cloneRoles) {
                        catOptions.permissionOverwrites = category.permissionOverwrites.cache.map(po => {
                            if (roleMap.has(po.id)) {
                                return { id: roleMap.get(po.id), allow: po.allow.bitfield, deny: po.deny.bitfield, type: po.type };
                            }
                            return null;
                        }).filter(Boolean);
                    }
                    const newCategory = await targetGuild.channels.create(catOptions);
                    await progressManager.update(true);

                    const children = channels.filter(ch => ch.parentId === category.id).sort((a, b) => a.position - b.position);
                    for (const child of children.values()) {
                         await progressManager.waitIfPaused();
                         if (progressManager.isCancelled) break;
                         try {
                             if (child.type === ChannelType.GuildForum) {
                                 await cloneForumChannel(child, targetGuild, newCategory.id, null, cloneRoles, isCrossServer, true, clonePosts, clonePostDesc, roleMap, null);
                             } else {
                                 await cloneSingleChannel(child, targetGuild, newCategory.id, null, cloneRoles, isCrossServer, roleMap);
                             }
                             await progressManager.update(true);
                         } catch(e) { await progressManager.update(false); }
                    }
                } catch(e) { await progressManager.update(false); }
            }

            // Clone parentless channels
            if (!progressManager.isCancelled) {
                for (const child of parentlessChannels.values()) {
                    await progressManager.waitIfPaused();
                    if (progressManager.isCancelled) break;
                    try {
                        if (child.type === ChannelType.GuildForum) {
                            await cloneForumChannel(child, targetGuild, null, null, cloneRoles, isCrossServer, true, clonePosts, clonePostDesc, roleMap, null);
                        } else {
                            await cloneSingleChannel(child, targetGuild, null, null, cloneRoles, isCrossServer, roleMap);
                        }
                        await progressManager.update(true);
                    } catch(e) { await progressManager.update(false); }
                }
            }

            await progressManager.finish(getMessage('clone.server.progress_finish', { sourceName: sourceGuild.name, targetName: targetGuild.name }));
            await logAction(interaction.guild, `**Cloned Server**\nCloned ${sourceGuild.name} to ${targetGuild.name} by ${interaction.user.tag}`);
        }
    }
};
