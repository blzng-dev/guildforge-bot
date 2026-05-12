# GuildForge Bot

GuildForge is a powerful utility bot I made completely with AI to streamline my Discord server management. It offers comprehensive tools for managing channels, roles, and community settings, along with unique features like channel cloning and aesthetic dividers.

## Features

-   **Advanced Channel Management:** Create, clone, sync, and organize channels with ease. Includes presets for quick server setup.
-   **Role Administration:** extensive role management including creation, permission presets, color role generation.
-   **Server Organization:** "Divider" commands to aesthetically prefix channel names and keep your server looking aesthetically pleasing
-   **Community Tools:** Quickly enable or disable Discord Community features with automatic channel setup.

## Commands

### 📂 Channel Management (`/channel`)

Manage your server's channel structure effectively.

-   **/channel create**
    -   Creates a new channel with specific types (Text, Voice, Forum, etc.) and optional parent categories.
-   **/channel clone channel**
    -   Clones a specific channel from a source server to a target server, including permission overwrites.
-   **/channel clone category**
    -   Clones an entire category and all its children channels from one server to another.
-   **/channel preset**
    -   Instantly generates a set of channels based on templates (e.g., "General Server Setup").
-   **/channel manage**
    -   Renames channels or granularly adjusts permissions for specific users/roles.
-   **/channel sync**
    -   Syncs a channel's permissions to match its parent category.
-   **/channel clear**
    -   Wipes all permission overwrites from a selected channel.
-   **/channel delete**
    -   Deletes a specific channel or bulk deletes a category and its contents. **Note:** Safely restricts deletion to channels that contain 0 messages to prevent accidental data loss.

### Cw Role Management (`/role`)

A complete suite for handling server roles.

-   **/role create**
    -   Creates a custom role with name, color, hoist, and mentionable settings.
-   **/role preset**
    -   Quickly creates roles with standard permission sets (Moderator, Administrator, etc.).
-   **/role color**
    -   Automatically generates ~40 pre-defined color roles for your community.
-   **/role manage**
    -   Edit an existing role's name, color, settings, and individual permissions.
-   **/role toggle**
    -   Easily add or remove a specific role from a user.
-   **/role transfer**
    -   Moves all members from a "secondary" role to a "primary" role, with options to generate a transcript or delete the old role.
-   **/role list**
    -   Displays a list of all server roles (sends a file if the list is too long).
-   **/role scrape**
    -   Exports all server roles and their data into a JSON file.
-   **/role clear**
    -   Strips all permissions from a target role.
-   **/role delete**
    -   Deletes roles from the server. **Note:** Only allows deleting roles that currently have 0 members assigned. Supports three modes:
        -   **Single:** Select a specific role to delete.
        -   **Range:** Deletes all roles strictly between two boundary roles (`start_role` and `end_role`).
        -   **Bulk:** Leave options empty to open a multi-select menu to delete up to 10 roles at once.
-   **/role reorder**
    -   Re-arranges roles by moving a single role, a range of roles, or multiple selected roles above or below a specified pivot role.

### wm Server Aesthetics (`/divider`)

Add visual flair to your channel list by adding prefixes (dividers).

-   **/divider server**
    -   Applies a chosen symbol (Line │, Dot ・, or Custom) to the start of **all** applicable channel names.
-   **/divider category**
    -   Applies a divider symbol to all channels within a specific category.
-   **/divider channel**
    -   Applies a divider symbol to a single channel.
-   **Undo Option:** All divider commands include an `undo` option to strip the prefixes.

### 🛠️ Utilities

-   **/community**
    -   `enabled: true/false`: Toggles Discord Community features. Automatically creates "rules" and "community-updates" channels if they don't exist.
-   **/invite**
    -   Generates an invite link for this bot or lists invite links for other popular utility bots.
-   **/ping**
    -   Checks the bot's responsiveness.
-   **/reload**
    -   (Dev) Reloads a specific command file to apply changes without restarting.
