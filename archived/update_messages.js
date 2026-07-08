const fs = require('fs');

const data = JSON.parse(fs.readFileSync('utils/messages.json', 'utf8'));

data.clone = {
    "error_target_not_found": "❌ **Error:** Could not find the target server with ID `{targetGuildId}`. Make sure the bot is in that server.",
    "error_source_admin": "❌ **Error:** You must have the `Administrator` permission in the **source** server to perform cross-server cloning.",
    "error_target_admin": "❌ **Error:** You must have the `Administrator` permission in the **target** server to perform cross-server cloning.",
    "channel": {
        "error_invalid": "❌ Invalid channel ID. Ensure it's a valid non-forum channel.",
        "success": "✅ Cloned channel **{name}** successfully."
    },
    "forum": {
        "error_invalid": "❌ Invalid channel ID. Ensure it's a valid forum channel.",
        "success": "✅ Cloned forum **{name}** successfully.",
        "progress_finish": "Cloned posts in **{name}**."
    },
    "category": {
        "error_invalid": "❌ Invalid category ID. Ensure it's a valid category.",
        "progress_finish": "Successfully cloned category into **{name}**."
    },
    "server": {
        "error_cross_server": "❌ **Error:** You must specify a different target server for server cloning.",
        "cloning_roles": "🔄 Cloning {count} roles...",
        "progress_finish": "Successfully cloned server {sourceName} to {targetName}."
    }
};

data.server = {
    "error_no_permission": "You do not have permission to manage server settings.",
    "auditlog": {
        "set": "Audit log channel has been set to <#{channelId}>.",
        "disable": "Audit logging has been disabled."
    },
    "verification": {
        "success": "Successfully set the server verification level to **{levelName}**."
    },
    "community": {
        "error_already_enabled": "Community features are already enabled for this server.",
        "success_updated": "Community settings updated: {parts}.",
        "error_update_failed": "Failed to update community channels: {error}",
        "error_create_rules": "Failed to create rules channel. Please provide an existing channel or check bot permissions.",
        "error_create_updates": "Failed to create community updates channel. Please provide an existing channel or check bot permissions.",
        "success_enabled": "Community features have been enabled! Rules channel set to <#{rulesId}> and updates channel set to <#{updatesId}>.\\n*Note: The server verification level was adjusted to at least Low and explicit content filter to All Members to meet requirements.*{createdChannelsInfo}",
        "created_channels_info": "\\n\\nThe following channels were automatically created: {channels}.\\nYou may want to customize these channels with appropriate content.",
        "error_enable_failed": "Failed to enable community: {error}",
        "success_disabled": "Community features have been disabled for this server.",
        "error_disable_failed": "Failed to disable community features: {error}"
    },
    "error_generic": "Failed to update community settings.",
    "error_permissions": " The bot lacks necessary permissions to manage server settings.",
    "error_validation": " Invalid form body. Discord API validation failed.",
    "error_details": " Details: {details}",
    "error_message": " Error: {error}"
};

fs.writeFileSync('utils/messages.json', JSON.stringify(data, null, 4));
console.log('Updated messages.json');
