const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    MessageFlags,
    ActionRowBuilder,
    RoleSelectMenuBuilder,
    ChannelSelectMenuBuilder,
    AutoModerationRuleTriggerType,
    AutoModerationRuleEventType,
    AutoModerationActionType,
    AutoModerationRuleKeywordPresetType,
} = require("discord.js");
const { logAction } = require("../../utils/logger.js");

const COMMAND_ID = "1541299934291173507";

const MESSAGES = {
    list: {
        header: "# Server AutoMod Configuration ({size}/10 Rules Active)\n\n",
        starter_header: "## Starter Rules (4 Slots)\n",
        custom_header:
            "\n## Custom Keyword & Regex Rules ({size}/6 Slots Used)\n",
        no_custom: `No custom rules created yet. Run </automod create:${COMMAND_ID}> to make one.\n`,
        mention_active:
            "* **Mention Spam Filter:** [Active]\n  * **Trigger:** >{limit} mentions\n  * **Actions:** {actions}\n",
        spam_active:
            "* **Suspected Spam Filter:** [Active]\n  * **Actions:** {actions}\n",
        flagged_active:
            "* **Flagged Words Filter:** [Active]\n  * **Presets:** {presets}\n  * **Whitelist:** {whitelistCount} bypass words\n  * **Actions:** {actions}\n",
        profile_active:
            "* **Member Profile Filter:** [Active]\n  * **Keywords:** {kwCount} | **Regex:** {regexCount} | **Whitelist:** {whitelistCount}\n  * **Actions:** {actions}\n",
        inactive_starters: `* **Inactive Starter Rules:** {rules} (Run </automod enable:${COMMAND_ID}> to activate)\n`,
        custom_item:
            "* **{name}** {status}\n  * **Filters:** {kwCount} Keywords | {regexCount} Regex | {whitelistCount} Whitelisted\n  * **Actions:** {actions}\n  * **Exemptions:** {exemptRoles} Roles, {exemptChannels} Channels\n",
        detail_header:
            "# AutoMod Rule Details: **{name}**\n\n* **Status:** {status}\n* **Trigger Type:** {triggerType}\n* **Actions:** {actions}\n* **Exemptions:** {exemptRoles} Roles, {exemptChannels} Channels\n\n",
        detail_keywords: "**Blocked Keywords** ({count}/1000):\n{list}\n\n",
        detail_whitelist: "**Whitelisted Phrases** ({count}/100):\n{list}\n\n",
        detail_regex: "**Regex Patterns** ({count}/10):\n{list}\n\n",
    },
    create: {
        max_rules:
            "**Error:** Maximum Custom Rules Reached. Discord allows up to 6 custom keyword rules per server.",
        success: `**Custom Rule Created:** **{name}**\n* **Action:** Block Message (Default)\nNext steps:\n* </automod keyword add:${COMMAND_ID}>\n* </automod regex add:${COMMAND_ID}>\n* </automod config:${COMMAND_ID}>`,
    },
    enable: {
        already_enabled: "**Rule is already enabled:** **{name}**",
        success: "**Rule Enabled:** **{name}**",
        starter_created: `**{name} Enabled!**\nDefault settings applied. Run </automod config:${COMMAND_ID}> to customize.`,
    },
    disable: {
        already_disabled:
            "**Rule is already disabled or inactive:** **{name}**",
        success: "**Rule Disabled:** **{name}**",
    },
    config: {
        not_found: "**Error:** Rule not found.",
        success:
            "**Rule Updated:** **{name}**\n* **Actions:** {actions}{extra}",
    },
    keyword: {
        not_supported:
            "**Error:** This rule does not support keywords. Keywords are supported on Member Profile and Custom rules.",
        limit_reached:
            "**Error:** Keyword limit reached. Discord allows up to 1,000 keywords per rule (currently {count}).",
        add_success:
            '**Added Keyword(s) to "{name}":**\n{words}\nTotal keywords: **{count}/1000**',
        not_found:
            '**Error:** Keyword "{word}" was not found in rule "{name}".',
        edit_success:
            '**Updated Keyword in "{name}":**\n`{oldWord}` -> `{newWord}`',
        remove_success:
            '**Removed Keyword from "{name}":**\n`{word}`\nRemaining keywords: **{count}/1000**',
    },
    whitelist: {
        not_supported:
            "**Error:** This rule does not support whitelists. Whitelists are supported on Flagged Words, Member Profile, and Custom rules.",
        limit_reached:
            "**Error:** Whitelist limit reached. Discord allows up to 100 bypass words per rule (currently {count}).",
        add_success:
            '**Added Whitelist Word(s) to "{name}":**\n{words}\nTotal whitelist words: **{count}/100**',
        not_found:
            '**Error:** Whitelist word "{word}" was not found in rule "{name}".',
        edit_success:
            '**Updated Whitelist Word in "{name}":**\n`{oldWord}` -> `{newWord}`',
        remove_success:
            '**Removed Whitelist Word from "{name}":**\n`{word}`\nRemaining whitelist words: **{count}/100**',
    },
    regex: {
        not_supported:
            "**Error:** This rule does not support regex patterns. Regex is supported on Member Profile and Custom rules.",
        limit_reached:
            "**Error:** Regex limit reached. Discord allows up to 10 regex patterns per rule (currently {count}).",
        invalid_pattern:
            "**Error:** Invalid regex pattern. JavaScript RegExp error: `{error}`",
        too_long:
            "**Error:** Regex pattern exceeds maximum allowed length of 260 characters.",
        add_success:
            '**Added Regex Pattern to "{name}":**\n```regex\n{pattern}\n```\nTotal patterns: **{count}/10**',
        not_found: '**Error:** Regex pattern was not found in rule "{name}".',
        edit_success:
            '**Updated Regex Pattern in "{name}":**\n```regex\n{pattern}\n```',
        remove_success:
            '**Removed Regex Pattern from "{name}":**\n```regex\n{pattern}\n```\nRemaining patterns: **{count}/10**',
    },
    exempt: {
        header: "# Exemption Settings: **{name}**\n\n### Exempted Roles ({roleCount}/20):\n{roles}\n### Exempted Channels ({channelCount}/50):\n{channels}\nUse the dropdown menus below to update exempted roles or channels in real time.",
        no_roles: "No roles exempted.\n",
        no_channels: "No channels exempted.\n",
    },
    common: {
        unknown_subcommand: "Unknown AutoMod subcommand.",
        error: "**Error:** {error}",
    },
};

function getMessage(keyPath, variables = {}) {
    const keys = keyPath.split(".");
    let result = MESSAGES;
    for (const key of keys) {
        if (result[key] === undefined) return `[Missing String: ${keyPath}]`;
        result = result[key];
    }
    if (typeof result !== "string") return `[Invalid String: ${keyPath}]`;
    let formatted = result;
    for (const [vKey, vVal] of Object.entries(variables)) {
        formatted = formatted.replace(new RegExp(`\\{${vKey}\\}`, "g"), vVal);
    }
    return formatted;
}

// Timeout duration choices
const TIMEOUT_CHOICES = [
    { name: "None / Remove Timeout", value: "0" },
    { name: "60 Seconds (1m)", value: "60" },
    { name: "5 Minutes", value: "300" },
    { name: "10 Minutes", value: "600" },
    { name: "1 Hour", value: "3600" },
    { name: "1 Day (24h)", value: "86400" },
    { name: "1 Week (7d)", value: "604800" },
];

function formatTimeout(seconds) {
    if (!seconds || seconds <= 0) return "None";
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
}

function buildActions({
    block,
    alertChannelId,
    timeoutSeconds,
    customMessage,
    isProfile = false,
}) {
    const actions = [];

    if (isProfile) {
        actions.push({ type: AutoModerationActionType.BlockMemberInteraction });
        if (alertChannelId) {
            actions.push({
                type: AutoModerationActionType.SendAlertMessage,
                metadata: { channel: alertChannelId },
            });
        }
        return actions;
    }

    if (block !== false) {
        const metadata = {};
        if (customMessage && customMessage.trim().length > 0) {
            metadata.customMessage = customMessage.trim().slice(0, 150);
        }
        actions.push({
            type: AutoModerationActionType.BlockMessage,
            metadata,
        });
    }

    if (alertChannelId) {
        actions.push({
            type: AutoModerationActionType.SendAlertMessage,
            metadata: { channel: alertChannelId },
        });
    }

    if (timeoutSeconds && timeoutSeconds > 0) {
        actions.push({
            type: AutoModerationActionType.Timeout,
            metadata: { durationSeconds: timeoutSeconds },
        });
    }

    return actions;
}

function summarizeActions(actions) {
    if (!actions || actions.length === 0) return "No active actions";
    const parts = [];
    for (const act of actions) {
        if (act.type === AutoModerationActionType.BlockMessage) {
            parts.push("`Block Message`");
        } else if (
            act.type === AutoModerationActionType.BlockMemberInteraction
        ) {
            parts.push("`Block Profile Interaction`");
        } else if (act.type === AutoModerationActionType.SendAlertMessage) {
            parts.push(
                `\`Alert\` (<#${act.metadata?.channelId || act.metadata?.channel}>)`,
            );
        } else if (act.type === AutoModerationActionType.Timeout) {
            parts.push(
                `\`Timeout\` (${formatTimeout(act.metadata?.durationSeconds)})`,
            );
        }
    }
    return parts.join(", ") || "None";
}

// Clean regex pattern for human-readable autocomplete display
function stripRegexSyntax(pattern) {
    let clean = pattern
        .replace(/\(\?:/g, "")
        .replace(/\\b/g, "")
        .replace(/\\d/g, "num")
        .replace(/\\w/g, "word")
        .replace(/\\s/g, " ")
        .replace(/\\[\.\/\?\*\+\^\$\(\)\[\]\{\}\|]/g, (match) => match[1])
        .replace(/[\[\]\(\)\^\$\+\*\{\}\?]/g, "")
        .replace(/\|/g, " / ")
        .replace(/\s+/g, " ")
        .trim();
    return clean.slice(0, 75) || pattern.slice(0, 75);
}

module.exports = {
    category: "slash",
    data: new SlashCommandBuilder()
        .setName("automod")
        .setDescription("Manage server AutoMod safety filters and custom rules")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)

        // 1. LIST OVERVIEW OR DETAIL
        .addSubcommand((sub) =>
            sub
                .setName("list")
                .setDescription(
                    "List all AutoMod rules or view detailed configuration for a specific rule",
                )
                .addStringOption((opt) =>
                    opt
                        .setName("rule")
                        .setDescription(
                            "Select a rule to view detailed settings for",
                        )
                        .setRequired(false)
                        .setAutocomplete(true),
                ),
        )

        // 2. CREATE CUSTOM RULE
        .addSubcommand((sub) =>
            sub
                .setName("create")
                .setDescription(
                    "Create a new custom AutoMod keyword rule container",
                )
                .addStringOption((opt) =>
                    opt
                        .setName("name")
                        .setDescription("Name for the custom rule")
                        .setRequired(true),
                ),
        )

        // 3. ENABLE RULE
        .addSubcommand((sub) =>
            sub
                .setName("enable")
                .setDescription("Enable a built-in starter rule or custom rule")
                .addStringOption((opt) =>
                    opt
                        .setName("rule")
                        .setDescription("Target rule to enable")
                        .setRequired(true)
                        .setAutocomplete(true),
                ),
        )

        // 4. DISABLE RULE
        .addSubcommand((sub) =>
            sub
                .setName("disable")
                .setDescription(
                    "Disable a built-in starter rule or custom rule",
                )
                .addStringOption((opt) =>
                    opt
                        .setName("rule")
                        .setDescription("Target rule to disable")
                        .setRequired(true)
                        .setAutocomplete(true),
                ),
        )

        // 5. CONFIG RULE
        .addSubcommand((sub) =>
            sub
                .setName("config")
                .setDescription(
                    "Configure trigger settings, thresholds, and actions for a rule",
                )
                .addStringOption((opt) =>
                    opt
                        .setName("rule")
                        .setDescription("Target rule to configure")
                        .setRequired(true)
                        .setAutocomplete(true),
                )
                .addStringOption((opt) =>
                    opt
                        .setName("new_name")
                        .setDescription("Rename custom rule")
                        .setRequired(false),
                )
                .addIntegerOption((opt) =>
                    opt
                        .setName("limit")
                        .setDescription(
                            "Max unique mentions per message (1-50, for Mention Spam)",
                        )
                        .setMinValue(1)
                        .setMaxValue(50)
                        .setRequired(false),
                )
                .addBooleanOption((opt) =>
                    opt
                        .setName("profanity")
                        .setDescription(
                            "Filter profanity preset (Flagged Words)",
                        )
                        .setRequired(false),
                )
                .addBooleanOption((opt) =>
                    opt
                        .setName("sexual_content")
                        .setDescription(
                            "Filter sexually explicit content (Flagged Words)",
                        )
                        .setRequired(false),
                )
                .addBooleanOption((opt) =>
                    opt
                        .setName("slurs")
                        .setDescription(
                            "Filter hate speech preset (Flagged Words)",
                        )
                        .setRequired(false),
                )
                .addBooleanOption((opt) =>
                    opt
                        .setName("block")
                        .setDescription("Block matching messages/interactions")
                        .setRequired(false),
                )
                .addStringOption((opt) =>
                    opt
                        .setName("timeout")
                        .setDescription("Timeout duration for violators")
                        .setRequired(false)
                        .addChoices(...TIMEOUT_CHOICES),
                )
                .addChannelOption((opt) =>
                    opt
                        .setName("alert_channel")
                        .setDescription("Channel to send violation alerts")
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false),
                )
                .addStringOption((opt) =>
                    opt
                        .setName("custom_message")
                        .setDescription(
                            "Explanation note shown to user when blocked",
                        )
                        .setRequired(false),
                ),
        )

        // 6. EXEMPT DASHBOARD
        .addSubcommand((sub) =>
            sub
                .setName("exempt")
                .setDescription(
                    "Configure exempted roles and channels for a rule",
                )
                .addStringOption((opt) =>
                    opt
                        .setName("rule")
                        .setDescription("Target rule")
                        .setRequired(true)
                        .setAutocomplete(true),
                ),
        )

        // 7. KEYWORD GROUP
        .addSubcommandGroup((group) =>
            group
                .setName("keyword")
                .setDescription("Manage blocked keywords for rules")
                .addSubcommand((sub) =>
                    sub
                        .setName("add")
                        .setDescription("Add keyword(s) to a rule")
                        .addStringOption((opt) =>
                            opt
                                .setName("rule")
                                .setDescription("Target rule")
                                .setRequired(true)
                                .setAutocomplete(true),
                        )
                        .addStringOption((opt) =>
                            opt
                                .setName("keyword")
                                .setDescription(
                                    "Keyword or comma-separated keywords to block (use * for wildcards)",
                                )
                                .setRequired(true),
                        ),
                )
                .addSubcommand((sub) =>
                    sub
                        .setName("edit")
                        .setDescription("Edit an existing keyword in a rule")
                        .addStringOption((opt) =>
                            opt
                                .setName("rule")
                                .setDescription("Target rule")
                                .setRequired(true)
                                .setAutocomplete(true),
                        )
                        .addStringOption((opt) =>
                            opt
                                .setName("old")
                                .setDescription("Existing keyword to replace")
                                .setRequired(true)
                                .setAutocomplete(true),
                        )
                        .addStringOption((opt) =>
                            opt
                                .setName("new")
                                .setDescription("New replacement keyword")
                                .setRequired(true),
                        ),
                )
                .addSubcommand((sub) =>
                    sub
                        .setName("remove")
                        .setDescription("Remove a keyword from a rule")
                        .addStringOption((opt) =>
                            opt
                                .setName("rule")
                                .setDescription("Target rule")
                                .setRequired(true)
                                .setAutocomplete(true),
                        )
                        .addStringOption((opt) =>
                            opt
                                .setName("keyword")
                                .setDescription("Keyword to delete")
                                .setRequired(true)
                                .setAutocomplete(true),
                        ),
                ),
        )

        // 8. WHITELIST GROUP
        .addSubcommandGroup((group) =>
            group
                .setName("whitelist")
                .setDescription("Manage bypass whitelist words for rules")
                .addSubcommand((sub) =>
                    sub
                        .setName("add")
                        .setDescription("Add bypass word(s) to a rule")
                        .addStringOption((opt) =>
                            opt
                                .setName("rule")
                                .setDescription("Target rule")
                                .setRequired(true)
                                .setAutocomplete(true),
                        )
                        .addStringOption((opt) =>
                            opt
                                .setName("word")
                                .setDescription(
                                    "Word or comma-separated words to bypass",
                                )
                                .setRequired(true),
                        ),
                )
                .addSubcommand((sub) =>
                    sub
                        .setName("edit")
                        .setDescription(
                            "Edit an existing whitelist word in a rule",
                        )
                        .addStringOption((opt) =>
                            opt
                                .setName("rule")
                                .setDescription("Target rule")
                                .setRequired(true)
                                .setAutocomplete(true),
                        )
                        .addStringOption((opt) =>
                            opt
                                .setName("old")
                                .setDescription(
                                    "Existing whitelist word to replace",
                                )
                                .setRequired(true)
                                .setAutocomplete(true),
                        )
                        .addStringOption((opt) =>
                            opt
                                .setName("new")
                                .setDescription(
                                    "New replacement whitelist word",
                                )
                                .setRequired(true),
                        ),
                )
                .addSubcommand((sub) =>
                    sub
                        .setName("remove")
                        .setDescription("Remove a whitelist word from a rule")
                        .addStringOption((opt) =>
                            opt
                                .setName("rule")
                                .setDescription("Target rule")
                                .setRequired(true)
                                .setAutocomplete(true),
                        )
                        .addStringOption((opt) =>
                            opt
                                .setName("word")
                                .setDescription("Whitelist word to delete")
                                .setRequired(true)
                                .setAutocomplete(true),
                        ),
                ),
        )

        // 9. REGEX GROUP
        .addSubcommandGroup((group) =>
            group
                .setName("regex")
                .setDescription("Manage regular expression patterns for rules")
                .addSubcommand((sub) =>
                    sub
                        .setName("add")
                        .setDescription("Add a regex pattern to a rule")
                        .addStringOption((opt) =>
                            opt
                                .setName("rule")
                                .setDescription("Target rule")
                                .setRequired(true)
                                .setAutocomplete(true),
                        )
                        .addStringOption((opt) =>
                            opt
                                .setName("pattern")
                                .setDescription(
                                    "Regex pattern (max 260 characters)",
                                )
                                .setRequired(true),
                        ),
                )
                .addSubcommand((sub) =>
                    sub
                        .setName("edit")
                        .setDescription(
                            "Edit an existing regex pattern in a rule",
                        )
                        .addStringOption((opt) =>
                            opt
                                .setName("rule")
                                .setDescription("Target rule")
                                .setRequired(true)
                                .setAutocomplete(true),
                        )
                        .addStringOption((opt) =>
                            opt
                                .setName("old")
                                .setDescription(
                                    "Existing regex pattern to replace",
                                )
                                .setRequired(true)
                                .setAutocomplete(true),
                        )
                        .addStringOption((opt) =>
                            opt
                                .setName("new")
                                .setDescription(
                                    "New regex pattern (max 260 characters)",
                                )
                                .setRequired(true),
                        ),
                )
                .addSubcommand((sub) =>
                    sub
                        .setName("remove")
                        .setDescription("Remove a regex pattern from a rule")
                        .addStringOption((opt) =>
                            opt
                                .setName("rule")
                                .setDescription("Target rule")
                                .setRequired(true)
                                .setAutocomplete(true),
                        )
                        .addStringOption((opt) =>
                            opt
                                .setName("pattern")
                                .setDescription("Regex pattern to delete")
                                .setRequired(true)
                                .setAutocomplete(true),
                        ),
                ),
        ),

    // ==========================================
    // AUTOCOMPLETE HANDLER
    // ==========================================
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        const group = interaction.options.getSubcommandGroup(false);
        const sub = interaction.options.getSubcommand(false);

        try {
            const rules = await interaction.guild.autoModerationRules.fetch();
            const query = focusedOption.value.toLowerCase();

            // 1. AUTOCOMPLETE FOR "rule" OPTION
            if (focusedOption.name === "rule") {
                const choices = [];

                if (sub === "enable") {
                    // Check starter rules that are not yet created or currently disabled
                    const hasMention = rules.some(
                        (r) =>
                            r.triggerType ===
                            AutoModerationRuleTriggerType.MentionSpam,
                    );
                    const hasSpam = rules.some(
                        (r) =>
                            r.triggerType ===
                            AutoModerationRuleTriggerType.Spam,
                    );
                    const hasFlagged = rules.some(
                        (r) =>
                            r.triggerType ===
                            AutoModerationRuleTriggerType.KeywordPreset,
                    );
                    const hasProfile = rules.some(
                        (r) =>
                            r.triggerType ===
                            AutoModerationRuleTriggerType.MemberProfile,
                    );

                    if (!hasMention)
                        choices.push({
                            name: "Mention Spam Filter",
                            value: "starter_mention",
                        });
                    if (!hasSpam)
                        choices.push({
                            name: "Suspected Spam Filter",
                            value: "starter_spam",
                        });
                    if (!hasFlagged)
                        choices.push({
                            name: "Flagged Words Filter",
                            value: "starter_flagged",
                        });
                    if (!hasProfile)
                        choices.push({
                            name: "Member Profile Filter",
                            value: "starter_profile",
                        });

                    for (const rule of rules.values()) {
                        if (!rule.enabled) {
                            choices.push({
                                name: rule.name.slice(0, 100),
                                value: rule.id,
                            });
                        }
                    }
                } else if (sub === "disable") {
                    for (const rule of rules.values()) {
                        if (rule.enabled) {
                            choices.push({
                                name: rule.name.slice(0, 100),
                                value: rule.id,
                            });
                        }
                    }
                } else if (group === "keyword") {
                    // Keyword subcommands support Member Profile & Custom Keyword rules
                    for (const rule of rules.values()) {
                        if (
                            rule.triggerType ===
                                AutoModerationRuleTriggerType.MemberProfile ||
                            rule.triggerType ===
                                AutoModerationRuleTriggerType.Keyword
                        ) {
                            choices.push({
                                name: rule.name.slice(0, 100),
                                value: rule.id,
                            });
                        }
                    }
                } else if (group === "whitelist") {
                    // Whitelist supports Flagged Words, Member Profile & Custom Keyword rules
                    for (const rule of rules.values()) {
                        if (
                            rule.triggerType ===
                                AutoModerationRuleTriggerType.KeywordPreset ||
                            rule.triggerType ===
                                AutoModerationRuleTriggerType.MemberProfile ||
                            rule.triggerType ===
                                AutoModerationRuleTriggerType.Keyword
                        ) {
                            choices.push({
                                name: rule.name.slice(0, 100),
                                value: rule.id,
                            });
                        }
                    }
                } else if (group === "regex") {
                    // Regex supports Member Profile & Custom Keyword rules
                    for (const rule of rules.values()) {
                        if (
                            rule.triggerType ===
                                AutoModerationRuleTriggerType.MemberProfile ||
                            rule.triggerType ===
                                AutoModerationRuleTriggerType.Keyword
                        ) {
                            choices.push({
                                name: rule.name.slice(0, 100),
                                value: rule.id,
                            });
                        }
                    }
                } else {
                    // Default for config, exempt, list
                    for (const rule of rules.values()) {
                        choices.push({
                            name: rule.name.slice(0, 100),
                            value: rule.id,
                        });
                    }
                }

                const filtered = choices
                    .filter((c) => c.name.toLowerCase().includes(query))
                    .slice(0, 25);

                return await interaction.respond(filtered);
            }

            // 2. AUTOCOMPLETE FOR WORD / KEYWORD / PATTERN OPTIONS
            const ruleId = interaction.options.getString("rule");
            if (!ruleId) return await interaction.respond([]);

            const rule =
                rules.get(ruleId) || rules.find((r) => r.name === ruleId);
            if (!rule) return await interaction.respond([]);

            if (
                group === "keyword" &&
                (focusedOption.name === "old" ||
                    focusedOption.name === "keyword")
            ) {
                const keywords = rule.triggerMetadata?.keywordFilter || [];
                const matched = keywords
                    .filter((kw) => kw.toLowerCase().includes(query))
                    .slice(0, 25)
                    .map((kw) => ({
                        name: kw.slice(0, 100),
                        value: kw.slice(0, 100),
                    }));
                return await interaction.respond(matched);
            }

            if (
                group === "whitelist" &&
                (focusedOption.name === "old" || focusedOption.name === "word")
            ) {
                const allowList = rule.triggerMetadata?.allowList || [];
                const matched = allowList
                    .filter((w) => w.toLowerCase().includes(query))
                    .slice(0, 25)
                    .map((w) => ({
                        name: w.slice(0, 100),
                        value: w.slice(0, 100),
                    }));
                return await interaction.respond(matched);
            }

            if (
                group === "regex" &&
                (focusedOption.name === "old" ||
                    focusedOption.name === "pattern")
            ) {
                const regexes = rule.triggerMetadata?.regexPatterns || [];
                const matched = regexes
                    .map((pat) => ({
                        raw: pat,
                        clean: stripRegexSyntax(pat),
                    }))
                    .filter(
                        (item) =>
                            item.clean.toLowerCase().includes(query) ||
                            item.raw.toLowerCase().includes(query),
                    )
                    .slice(0, 25)
                    .map((item) => ({
                        name: item.clean.slice(0, 100),
                        value: item.raw.slice(0, 100),
                    }));
                return await interaction.respond(matched);
            }

            return await interaction.respond([]);
        } catch (error) {
            console.error("AutoMod autocomplete error:", error);
            await interaction.respond([]);
        }
    },

    // ==========================================
    // MAIN EXECUTE HANDLER
    // ==========================================
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const group = interaction.options.getSubcommandGroup(false);
        const sub = interaction.options.getSubcommand();

        try {
            if (!group) {
                if (sub === "list") return await handleList(interaction);
                if (sub === "create") return await handleCreate(interaction);
                if (sub === "enable") return await handleEnable(interaction);
                if (sub === "disable") return await handleDisable(interaction);
                if (sub === "config") return await handleConfig(interaction);
                if (sub === "exempt") return await handleExempt(interaction);
            }

            if (group === "keyword") {
                if (sub === "add") return await handleKeywordAdd(interaction);
                if (sub === "edit") return await handleKeywordEdit(interaction);
                if (sub === "remove")
                    return await handleKeywordRemove(interaction);
            }

            if (group === "whitelist") {
                if (sub === "add") return await handleWhitelistAdd(interaction);
                if (sub === "edit")
                    return await handleWhitelistEdit(interaction);
                if (sub === "remove")
                    return await handleWhitelistRemove(interaction);
            }

            if (group === "regex") {
                if (sub === "add") return await handleRegexAdd(interaction);
                if (sub === "edit") return await handleRegexEdit(interaction);
                if (sub === "remove")
                    return await handleRegexRemove(interaction);
            }

            return interaction.editReply(
                getMessage("common.unknown_subcommand"),
            );
        } catch (error) {
            console.error("AutoMod command execution error:", error);
            return interaction.editReply(
                getMessage("common.error", {
                    error: error.message || "Unknown error",
                }),
            );
        }
    },
};

// ====================================================================
// 1. LIST OVERVIEW OR DETAIL HANDLER
// ====================================================================
async function handleList(interaction) {
    const rules = await interaction.guild.autoModerationRules.fetch();
    const ruleQuery = interaction.options.getString("rule");

    // Single Rule Detailed View
    if (ruleQuery) {
        const rule =
            rules.get(ruleQuery) ||
            rules.find((r) => r.name.toLowerCase() === ruleQuery.toLowerCase());
        if (!rule) {
            return interaction.editReply(getMessage("config.not_found"));
        }

        let triggerTypeName = "Custom Keywords";
        if (rule.triggerType === AutoModerationRuleTriggerType.MentionSpam)
            triggerTypeName = "Mention Spam";
        else if (rule.triggerType === AutoModerationRuleTriggerType.Spam)
            triggerTypeName = "Suspected Spam";
        else if (
            rule.triggerType === AutoModerationRuleTriggerType.KeywordPreset
        )
            triggerTypeName = "Flagged Word Presets";
        else if (
            rule.triggerType === AutoModerationRuleTriggerType.MemberProfile
        )
            triggerTypeName = "Member Profile";

        let detail = getMessage("list.detail_header", {
            name: rule.name,
            status: rule.enabled ? "[Active]" : "[Disabled]",
            triggerType: triggerTypeName,
            actions: summarizeActions(rule.actions),
            exemptRoles: rule.exemptRoles?.size || 0,
            exemptChannels: rule.exemptChannels?.size || 0,
        });

        // Keywords list
        const keywords = rule.triggerMetadata?.keywordFilter || [];
        if (keywords.length > 0) {
            const formattedKw = keywords.map((k) => `\`${k}\``).join(", ");
            detail += getMessage("list.detail_keywords", {
                count: keywords.length,
                list:
                    formattedKw.length > 800
                        ? formattedKw.slice(0, 800) + "... (and more)"
                        : formattedKw,
            });
        }

        // Whitelist list
        const whitelist = rule.triggerMetadata?.allowList || [];
        if (whitelist.length > 0) {
            const formattedWl = whitelist.map((w) => `\`${w}\``).join(", ");
            detail += getMessage("list.detail_whitelist", {
                count: whitelist.length,
                list:
                    formattedWl.length > 600
                        ? formattedWl.slice(0, 600) + "... (and more)"
                        : formattedWl,
            });
        }

        // Regex patterns list
        const regexes = rule.triggerMetadata?.regexPatterns || [];
        if (regexes.length > 0) {
            const formattedRg = regexes.map((r) => `* \`${r}\``).join("\n");
            detail += getMessage("list.detail_regex", {
                count: regexes.length,
                list: formattedRg,
            });
        }

        return interaction.editReply(detail);
    }

    // Full Server Overview
    const mentionSpamRule = rules.find(
        (r) => r.triggerType === AutoModerationRuleTriggerType.MentionSpam,
    );
    const spamRule = rules.find(
        (r) => r.triggerType === AutoModerationRuleTriggerType.Spam,
    );
    const flaggedWordsRule = rules.find(
        (r) => r.triggerType === AutoModerationRuleTriggerType.KeywordPreset,
    );
    const profileRule = rules.find(
        (r) => r.triggerType === AutoModerationRuleTriggerType.MemberProfile,
    );
    const customRules = rules.filter(
        (r) => r.triggerType === AutoModerationRuleTriggerType.Keyword,
    );

    let output = getMessage("list.header", { size: rules.size });
    output += getMessage("list.starter_header");

    const inactiveStarters = [];

    if (mentionSpamRule && mentionSpamRule.enabled) {
        output += getMessage("list.mention_active", {
            limit:
                mentionSpamRule.triggerMetadata?.mentionTotalLimit || "Default",
            actions: summarizeActions(mentionSpamRule.actions),
        });
    } else {
        inactiveStarters.push("Mention Spam Filter");
    }

    if (spamRule && spamRule.enabled) {
        output += getMessage("list.spam_active", {
            actions: summarizeActions(spamRule.actions),
        });
    } else {
        inactiveStarters.push("Suspected Spam Filter");
    }

    if (flaggedWordsRule && flaggedWordsRule.enabled) {
        const presets = flaggedWordsRule.triggerMetadata?.presets || [];
        const presetNames = presets.map((p) =>
            p === 1
                ? "Profanity"
                : p === 2
                  ? "Sexual Content"
                  : p === 3
                    ? "Slurs"
                    : `Preset ${p}`,
        );
        output += getMessage("list.flagged_active", {
            presets: presetNames.join(", ") || "None",
            whitelistCount:
                flaggedWordsRule.triggerMetadata?.allowList?.length || 0,
            actions: summarizeActions(flaggedWordsRule.actions),
        });
    } else {
        inactiveStarters.push("Flagged Words Filter");
    }

    if (profileRule && profileRule.enabled) {
        output += getMessage("list.profile_active", {
            kwCount: profileRule.triggerMetadata?.keywordFilter?.length || 0,
            regexCount: profileRule.triggerMetadata?.regexPatterns?.length || 0,
            whitelistCount: profileRule.triggerMetadata?.allowList?.length || 0,
            actions: summarizeActions(profileRule.actions),
        });
    } else {
        inactiveStarters.push("Member Profile Filter");
    }

    if (inactiveStarters.length > 0) {
        output += getMessage("list.inactive_starters", {
            rules: inactiveStarters.join(", "),
        });
    }

    output += getMessage("list.custom_header", { size: customRules.size });
    if (customRules.size === 0) {
        output += getMessage("list.no_custom");
    } else {
        for (const [, rule] of customRules) {
            output += getMessage("list.custom_item", {
                name: rule.name,
                status: rule.enabled ? "[Active]" : "[Disabled]",
                kwCount: rule.triggerMetadata?.keywordFilter?.length || 0,
                regexCount: rule.triggerMetadata?.regexPatterns?.length || 0,
                whitelistCount: rule.triggerMetadata?.allowList?.length || 0,
                actions: summarizeActions(rule.actions),
                exemptRoles: rule.exemptRoles?.size || 0,
                exemptChannels: rule.exemptChannels?.size || 0,
            });
        }
    }

    return interaction.editReply(output);
}

// ====================================================================
// 2. CREATE HANDLER
// ====================================================================
async function handleCreate(interaction) {
    const name = interaction.options.getString("name");
    const rules = await interaction.guild.autoModerationRules.fetch();
    const customRules = rules.filter(
        (r) => r.triggerType === AutoModerationRuleTriggerType.Keyword,
    );

    if (customRules.size >= 6) {
        return interaction.editReply(getMessage("create.max_rules"));
    }

    const newRule = await interaction.guild.autoModerationRules.create({
        name: name,
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: AutoModerationRuleTriggerType.Keyword,
        triggerMetadata: { keywordFilter: ["placeholder_keyword"] },
        actions: buildActions({ block: true }),
        enabled: true,
        reason: `Created by ${interaction.user.tag}`,
    });

    await logAction(
        interaction.guild,
        `Created Custom AutoMod Rule: "${name}" by ${interaction.user.tag}`,
    );
    return interaction.editReply(
        getMessage("create.success", { name: newRule.name }),
    );
}

// ====================================================================
// 3. ENABLE HANDLER
// ====================================================================
async function handleEnable(interaction) {
    const ruleQuery = interaction.options.getString("rule");
    const rules = await interaction.guild.autoModerationRules.fetch();

    // Handle starter rule creation if not yet initialized
    if (ruleQuery === "starter_mention") {
        await interaction.guild.autoModerationRules.create({
            name: "Mention Spam Filter",
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.MentionSpam,
            triggerMetadata: { mentionTotalLimit: 5 },
            actions: buildActions({ block: true, timeoutSeconds: 300 }),
            enabled: true,
            reason: `Enabled by ${interaction.user.tag}`,
        });
        await logAction(
            interaction.guild,
            `Enabled Mention Spam Filter by ${interaction.user.tag}`,
        );
        return interaction.editReply(
            getMessage("enable.starter_created", {
                name: "Mention Spam Filter",
            }),
        );
    }

    if (ruleQuery === "starter_spam") {
        await interaction.guild.autoModerationRules.create({
            name: "Suspected Spam Filter",
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.Spam,
            actions: buildActions({ block: true }),
            enabled: true,
            reason: `Enabled by ${interaction.user.tag}`,
        });
        await logAction(
            interaction.guild,
            `Enabled Suspected Spam Filter by ${interaction.user.tag}`,
        );
        return interaction.editReply(
            getMessage("enable.starter_created", {
                name: "Suspected Spam Filter",
            }),
        );
    }

    if (ruleQuery === "starter_flagged") {
        await interaction.guild.autoModerationRules.create({
            name: "Flagged Words Filter",
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.KeywordPreset,
            triggerMetadata: {
                presets: [
                    AutoModerationRuleKeywordPresetType.Profanity,
                    AutoModerationRuleKeywordPresetType.SexualContent,
                    AutoModerationRuleKeywordPresetType.Slurs,
                ],
            },
            actions: buildActions({ block: true }),
            enabled: true,
            reason: `Enabled by ${interaction.user.tag}`,
        });
        await logAction(
            interaction.guild,
            `Enabled Flagged Words Filter by ${interaction.user.tag}`,
        );
        return interaction.editReply(
            getMessage("enable.starter_created", {
                name: "Flagged Words Filter",
            }),
        );
    }

    if (ruleQuery === "starter_profile") {
        await interaction.guild.autoModerationRules.create({
            name: "Member Profile Filter",
            eventType: AutoModerationRuleEventType.MemberUpdate,
            triggerType: AutoModerationRuleTriggerType.MemberProfile,
            triggerMetadata: {
                keywordFilter: ["discord.gg/*", "discord.com/invite/*"],
            },
            actions: buildActions({ isProfile: true }),
            enabled: true,
            reason: `Enabled by ${interaction.user.tag}`,
        });
        await logAction(
            interaction.guild,
            `Enabled Member Profile Filter by ${interaction.user.tag}`,
        );
        return interaction.editReply(
            getMessage("enable.starter_created", {
                name: "Member Profile Filter",
            }),
        );
    }

    // Existing rule enable
    const rule =
        rules.get(ruleQuery) ||
        rules.find((r) => r.name.toLowerCase() === ruleQuery.toLowerCase());
    if (!rule) return interaction.editReply(getMessage("config.not_found"));

    if (rule.enabled) {
        return interaction.editReply(
            getMessage("enable.already_enabled", { name: rule.name }),
        );
    }

    await rule.edit({
        enabled: true,
        reason: `Enabled by ${interaction.user.tag}`,
    });
    await logAction(
        interaction.guild,
        `Enabled AutoMod Rule: "${rule.name}" by ${interaction.user.tag}`,
    );
    return interaction.editReply(
        getMessage("enable.success", { name: rule.name }),
    );
}

// ====================================================================
// 4. DISABLE HANDLER
// ====================================================================
async function handleDisable(interaction) {
    const ruleQuery = interaction.options.getString("rule");
    const rules = await interaction.guild.autoModerationRules.fetch();
    const rule =
        rules.get(ruleQuery) ||
        rules.find((r) => r.name.toLowerCase() === ruleQuery.toLowerCase());

    if (!rule) return interaction.editReply(getMessage("config.not_found"));

    if (!rule.enabled) {
        return interaction.editReply(
            getMessage("disable.already_disabled", { name: rule.name }),
        );
    }

    await rule.edit({
        enabled: false,
        reason: `Disabled by ${interaction.user.tag}`,
    });
    await logAction(
        interaction.guild,
        `Disabled AutoMod Rule: "${rule.name}" by ${interaction.user.tag}`,
    );
    return interaction.editReply(
        getMessage("disable.success", { name: rule.name }),
    );
}

// ====================================================================
// 5. CONFIG HANDLER
// ====================================================================
async function handleConfig(interaction) {
    const ruleQuery = interaction.options.getString("rule");
    const rules = await interaction.guild.autoModerationRules.fetch();
    const rule =
        rules.get(ruleQuery) ||
        rules.find((r) => r.name.toLowerCase() === ruleQuery.toLowerCase());

    if (!rule) return interaction.editReply(getMessage("config.not_found"));

    const newName = interaction.options.getString("new_name");
    const limit = interaction.options.getInteger("limit");
    const profanity = interaction.options.getBoolean("profanity");
    const sexualContent = interaction.options.getBoolean("sexual_content");
    const slurs = interaction.options.getBoolean("slurs");
    const block = interaction.options.getBoolean("block");
    const timeoutChoice = interaction.options.getString("timeout");
    const alertChannel = interaction.options.getChannel("alert_channel");
    const customMessage = interaction.options.getString("custom_message");

    const isProfile =
        rule.triggerType === AutoModerationRuleTriggerType.MemberProfile;
    const isMentionSpam =
        rule.triggerType === AutoModerationRuleTriggerType.MentionSpam;
    const isFlagged =
        rule.triggerType === AutoModerationRuleTriggerType.KeywordPreset;

    const newTriggerMeta = { ...rule.triggerMetadata };
    let extraSummary = "";

    // Trigger metadata updates
    if (isMentionSpam && limit !== null) {
        newTriggerMeta.mentionTotalLimit = limit;
        extraSummary += `\n* **Mention Limit:** ${limit}`;
    }

    if (isFlagged) {
        const presetsSet = new Set(rule.triggerMetadata?.presets || []);
        if (profanity !== null)
            profanity ? presetsSet.add(1) : presetsSet.delete(1);
        if (sexualContent !== null)
            sexualContent ? presetsSet.add(2) : presetsSet.delete(2);
        if (slurs !== null) slurs ? presetsSet.add(3) : presetsSet.delete(3);

        if (presetsSet.size > 0) {
            newTriggerMeta.presets = Array.from(presetsSet);
            const names = newTriggerMeta.presets.map((p) =>
                p === 1 ? "Profanity" : p === 2 ? "Sexual Content" : "Slurs",
            );
            extraSummary += `\n* **Active Presets:** ${names.join(", ")}`;
        }
    }

    // Actions update
    let timeoutSeconds = undefined;
    if (timeoutChoice !== null) timeoutSeconds = parseInt(timeoutChoice, 10);

    const existingBlock = rule.actions.some(
        (a) => a.type === AutoModerationActionType.BlockMessage,
    );
    const existingAlert = rule.actions.find(
        (a) => a.type === AutoModerationActionType.SendAlertMessage,
    )?.metadata?.channelId;
    const existingTimeout = rule.actions.find(
        (a) => a.type === AutoModerationActionType.Timeout,
    )?.metadata?.durationSeconds;
    const existingMsg = rule.actions.find(
        (a) => a.type === AutoModerationActionType.BlockMessage,
    )?.metadata?.customMessage;

    const newActions = buildActions({
        block: block !== null ? block : existingBlock,
        alertChannelId: alertChannel ? alertChannel.id : existingAlert,
        timeoutSeconds:
            timeoutSeconds !== undefined ? timeoutSeconds : existingTimeout,
        customMessage: customMessage !== null ? customMessage : existingMsg,
        isProfile,
    });

    const editPayload = {
        actions: newActions,
        triggerMetadata: newTriggerMeta,
        reason: `Configured by ${interaction.user.tag}`,
    };

    if (newName && rule.triggerType === AutoModerationRuleTriggerType.Keyword) {
        editPayload.name = newName;
    }

    await rule.edit(editPayload);
    await logAction(
        interaction.guild,
        `Configured AutoMod Rule: "${rule.name}" by ${interaction.user.tag}`,
    );

    return interaction.editReply(
        getMessage("config.success", {
            name: editPayload.name || rule.name,
            actions: summarizeActions(newActions),
            extra: extraSummary,
        }),
    );
}

// ====================================================================
// 6. EXEMPT HANDLER
// ====================================================================
async function handleExempt(interaction) {
    const ruleQuery = interaction.options.getString("rule");
    const rules = await interaction.guild.autoModerationRules.fetch();
    const rule =
        rules.get(ruleQuery) ||
        rules.find((r) => r.name.toLowerCase() === ruleQuery.toLowerCase());

    if (!rule) return interaction.editReply(getMessage("config.not_found"));

    const roleMenu = new RoleSelectMenuBuilder()
        .setCustomId(`exempt_roles_${rule.id}`)
        .setPlaceholder("Select roles to exempt (up to 20)...")
        .setMinValues(0)
        .setMaxValues(
            Math.min(20, Math.max(1, interaction.guild.roles.cache.size)),
        );

    const channelMenu = new ChannelSelectMenuBuilder()
        .setCustomId(`exempt_channels_${rule.id}`)
        .setPlaceholder("Select channels to exempt (up to 25)...")
        .setMinValues(0)
        .setMaxValues(25)
        .addChannelTypes(
            ChannelType.GuildText,
            ChannelType.GuildVoice,
            ChannelType.GuildAnnouncement,
            ChannelType.GuildForum,
        );

    const row1 = new ActionRowBuilder().addComponents(roleMenu);
    const row2 = new ActionRowBuilder().addComponents(channelMenu);

    function buildExemptOutput() {
        let rolesStr = "";
        if (rule.exemptRoles.size === 0) {
            rolesStr = getMessage("exempt.no_roles");
        } else {
            rolesStr =
                Array.from(rule.exemptRoles.keys())
                    .map((rId) => `<@&${rId}>`)
                    .join(", ") + "\n";
        }

        let channelsStr = "";
        if (rule.exemptChannels.size === 0) {
            channelsStr = getMessage("exempt.no_channels");
        } else {
            channelsStr =
                Array.from(rule.exemptChannels.keys())
                    .map((cId) => `<#${cId}>`)
                    .join(", ") + "\n";
        }

        return getMessage("exempt.header", {
            name: rule.name,
            roleCount: rule.exemptRoles.size,
            roles: rolesStr,
            channelCount: rule.exemptChannels.size,
            channels: channelsStr,
        });
    }

    const response = await interaction.editReply({
        content: buildExemptOutput(),
        components: [row1, row2],
    });

    const collector = response.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        time: 120000,
    });

    collector.on("collect", async (selectInteraction) => {
        await selectInteraction.deferUpdate();

        if (selectInteraction.customId.startsWith("exempt_roles_")) {
            const selectedRoleIds = selectInteraction.values;
            await rule.edit({
                exemptRoles: selectedRoleIds,
                reason: `Updated exempt roles by ${interaction.user.tag}`,
            });
            await logAction(
                interaction.guild,
                `Updated Exempt Roles for "${rule.name}" (${selectedRoleIds.length} roles) by ${interaction.user.tag}`,
            );
        } else if (selectInteraction.customId.startsWith("exempt_channels_")) {
            const selectedChannelIds = selectInteraction.values;
            await rule.edit({
                exemptChannels: selectedChannelIds,
                reason: `Updated exempt channels by ${interaction.user.tag}`,
            });
            await logAction(
                interaction.guild,
                `Updated Exempt Channels for "${rule.name}" (${selectedChannelIds.length} channels) by ${interaction.user.tag}`,
            );
        }

        await rule.fetch();
        await interaction.editReply({
            content: buildExemptOutput(),
            components: [row1, row2],
        });
    });
}

// ====================================================================
// 7. KEYWORD SUBCOMMAND GROUP HANDLERS (ADD / EDIT / REMOVE)
// ====================================================================
async function handleKeywordAdd(interaction) {
    const ruleQuery = interaction.options.getString("rule");
    const rawKeyword = interaction.options.getString("keyword");
    const rules = await interaction.guild.autoModerationRules.fetch();
    const rule =
        rules.get(ruleQuery) ||
        rules.find((r) => r.name.toLowerCase() === ruleQuery.toLowerCase());

    if (!rule) return interaction.editReply(getMessage("config.not_found"));
    if (
        rule.triggerType !== AutoModerationRuleTriggerType.Keyword &&
        rule.triggerType !== AutoModerationRuleTriggerType.MemberProfile
    ) {
        return interaction.editReply(getMessage("keyword.not_supported"));
    }

    const currentKeywords = rule.triggerMetadata?.keywordFilter || [];
    const newWords = rawKeyword
        .split(/[\n,]+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 0 && w.length <= 60);

    const merged = [...new Set([...currentKeywords, ...newWords])];
    if (merged.length > 1000) {
        return interaction.editReply(
            getMessage("keyword.limit_reached", {
                count: currentKeywords.length,
            }),
        );
    }

    await rule.edit({
        triggerMetadata: { ...rule.triggerMetadata, keywordFilter: merged },
        reason: `Added keyword(s) by ${interaction.user.tag}`,
    });

    await logAction(
        interaction.guild,
        `Added Keyword(s) to "${rule.name}": ${newWords.join(", ")} by ${interaction.user.tag}`,
    );
    return interaction.editReply(
        getMessage("keyword.add_success", {
            name: rule.name,
            words: newWords.map((w) => `* \`${w}\``).join("\n"),
            count: merged.length,
        }),
    );
}

async function handleKeywordEdit(interaction) {
    const ruleQuery = interaction.options.getString("rule");
    const oldWord = interaction.options.getString("old").trim();
    const newWord = interaction.options.getString("new").trim();
    const rules = await interaction.guild.autoModerationRules.fetch();
    const rule =
        rules.get(ruleQuery) ||
        rules.find((r) => r.name.toLowerCase() === ruleQuery.toLowerCase());

    if (!rule) return interaction.editReply(getMessage("config.not_found"));
    if (
        rule.triggerType !== AutoModerationRuleTriggerType.Keyword &&
        rule.triggerType !== AutoModerationRuleTriggerType.MemberProfile
    ) {
        return interaction.editReply(getMessage("keyword.not_supported"));
    }

    const currentKeywords = rule.triggerMetadata?.keywordFilter || [];
    const targetIndex = currentKeywords.findIndex(
        (k) => k.toLowerCase() === oldWord.toLowerCase(),
    );

    if (targetIndex === -1) {
        return interaction.editReply(
            getMessage("keyword.not_found", { word: oldWord, name: rule.name }),
        );
    }

    const updated = [...currentKeywords];
    updated[targetIndex] = newWord;

    await rule.edit({
        triggerMetadata: { ...rule.triggerMetadata, keywordFilter: updated },
        reason: `Edited keyword by ${interaction.user.tag}`,
    });

    await logAction(
        interaction.guild,
        `Edited Keyword in "${rule.name}": "${oldWord}" -> "${newWord}" by ${interaction.user.tag}`,
    );
    return interaction.editReply(
        getMessage("keyword.edit_success", {
            name: rule.name,
            oldWord,
            newWord,
        }),
    );
}

async function handleKeywordRemove(interaction) {
    const ruleQuery = interaction.options.getString("rule");
    const wordToRemove = interaction.options.getString("keyword").trim();
    const rules = await interaction.guild.autoModerationRules.fetch();
    const rule =
        rules.get(ruleQuery) ||
        rules.find((r) => r.name.toLowerCase() === ruleQuery.toLowerCase());

    if (!rule) return interaction.editReply(getMessage("config.not_found"));
    if (
        rule.triggerType !== AutoModerationRuleTriggerType.Keyword &&
        rule.triggerType !== AutoModerationRuleTriggerType.MemberProfile
    ) {
        return interaction.editReply(getMessage("keyword.not_supported"));
    }

    const currentKeywords = rule.triggerMetadata?.keywordFilter || [];
    const updated = currentKeywords.filter(
        (k) => k.toLowerCase() !== wordToRemove.toLowerCase(),
    );

    if (updated.length === currentKeywords.length) {
        return interaction.editReply(
            getMessage("keyword.not_found", {
                word: wordToRemove,
                name: rule.name,
            }),
        );
    }

    await rule.edit({
        triggerMetadata: { ...rule.triggerMetadata, keywordFilter: updated },
        reason: `Removed keyword by ${interaction.user.tag}`,
    });

    await logAction(
        interaction.guild,
        `Removed Keyword from "${rule.name}": "${wordToRemove}" by ${interaction.user.tag}`,
    );
    return interaction.editReply(
        getMessage("keyword.remove_success", {
            name: rule.name,
            word: wordToRemove,
            count: updated.length,
        }),
    );
}

// ====================================================================
// 8. WHITELIST SUBCOMMAND GROUP HANDLERS (ADD / EDIT / REMOVE)
// ====================================================================
async function handleWhitelistAdd(interaction) {
    const ruleQuery = interaction.options.getString("rule");
    const rawWord = interaction.options.getString("word");
    const rules = await interaction.guild.autoModerationRules.fetch();
    const rule =
        rules.get(ruleQuery) ||
        rules.find((r) => r.name.toLowerCase() === ruleQuery.toLowerCase());

    if (!rule) return interaction.editReply(getMessage("config.not_found"));
    if (
        rule.triggerType !== AutoModerationRuleTriggerType.Keyword &&
        rule.triggerType !== AutoModerationRuleTriggerType.MemberProfile &&
        rule.triggerType !== AutoModerationRuleTriggerType.KeywordPreset
    ) {
        return interaction.editReply(getMessage("whitelist.not_supported"));
    }

    const currentAllowList = rule.triggerMetadata?.allowList || [];
    const newWords = rawWord
        .split(/[\n,]+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 0 && w.length <= 60);

    const merged = [...new Set([...currentAllowList, ...newWords])];
    if (merged.length > 100) {
        return interaction.editReply(
            getMessage("whitelist.limit_reached", {
                count: currentAllowList.length,
            }),
        );
    }

    await rule.edit({
        triggerMetadata: { ...rule.triggerMetadata, allowList: merged },
        reason: `Added whitelist word(s) by ${interaction.user.tag}`,
    });

    await logAction(
        interaction.guild,
        `Added Whitelist Word(s) to "${rule.name}": ${newWords.join(", ")} by ${interaction.user.tag}`,
    );
    return interaction.editReply(
        getMessage("whitelist.add_success", {
            name: rule.name,
            words: newWords.map((w) => `* \`${w}\``).join("\n"),
            count: merged.length,
        }),
    );
}

async function handleWhitelistEdit(interaction) {
    const ruleQuery = interaction.options.getString("rule");
    const oldWord = interaction.options.getString("old").trim();
    const newWord = interaction.options.getString("new").trim();
    const rules = await interaction.guild.autoModerationRules.fetch();
    const rule =
        rules.get(ruleQuery) ||
        rules.find((r) => r.name.toLowerCase() === ruleQuery.toLowerCase());

    if (!rule) return interaction.editReply(getMessage("config.not_found"));
    if (
        rule.triggerType !== AutoModerationRuleTriggerType.Keyword &&
        rule.triggerType !== AutoModerationRuleTriggerType.MemberProfile &&
        rule.triggerType !== AutoModerationRuleTriggerType.KeywordPreset
    ) {
        return interaction.editReply(getMessage("whitelist.not_supported"));
    }

    const currentAllowList = rule.triggerMetadata?.allowList || [];
    const targetIndex = currentAllowList.findIndex(
        (w) => w.toLowerCase() === oldWord.toLowerCase(),
    );

    if (targetIndex === -1) {
        return interaction.editReply(
            getMessage("whitelist.not_found", {
                word: oldWord,
                name: rule.name,
            }),
        );
    }

    const updated = [...currentAllowList];
    updated[targetIndex] = newWord;

    await rule.edit({
        triggerMetadata: { ...rule.triggerMetadata, allowList: updated },
        reason: `Edited whitelist word by ${interaction.user.tag}`,
    });

    await logAction(
        interaction.guild,
        `Edited Whitelist Word in "${rule.name}": "${oldWord}" -> "${newWord}" by ${interaction.user.tag}`,
    );
    return interaction.editReply(
        getMessage("whitelist.edit_success", {
            name: rule.name,
            oldWord,
            newWord,
        }),
    );
}

async function handleWhitelistRemove(interaction) {
    const ruleQuery = interaction.options.getString("rule");
    const wordToRemove = interaction.options.getString("word").trim();
    const rules = await interaction.guild.autoModerationRules.fetch();
    const rule =
        rules.get(ruleQuery) ||
        rules.find((r) => r.name.toLowerCase() === ruleQuery.toLowerCase());

    if (!rule) return interaction.editReply(getMessage("config.not_found"));
    if (
        rule.triggerType !== AutoModerationRuleTriggerType.Keyword &&
        rule.triggerType !== AutoModerationRuleTriggerType.MemberProfile &&
        rule.triggerType !== AutoModerationRuleTriggerType.KeywordPreset
    ) {
        return interaction.editReply(getMessage("whitelist.not_supported"));
    }

    const currentAllowList = rule.triggerMetadata?.allowList || [];
    const updated = currentAllowList.filter(
        (w) => w.toLowerCase() !== wordToRemove.toLowerCase(),
    );

    if (updated.length === currentAllowList.length) {
        return interaction.editReply(
            getMessage("whitelist.not_found", {
                word: wordToRemove,
                name: rule.name,
            }),
        );
    }

    await rule.edit({
        triggerMetadata: { ...rule.triggerMetadata, allowList: updated },
        reason: `Removed whitelist word by ${interaction.user.tag}`,
    });

    await logAction(
        interaction.guild,
        `Removed Whitelist Word from "${rule.name}": "${wordToRemove}" by ${interaction.user.tag}`,
    );
    return interaction.editReply(
        getMessage("whitelist.remove_success", {
            name: rule.name,
            word: wordToRemove,
            count: updated.length,
        }),
    );
}

// ====================================================================
// 9. REGEX SUBCOMMAND GROUP HANDLERS (ADD / EDIT / REMOVE)
// ====================================================================
async function handleRegexAdd(interaction) {
    const ruleQuery = interaction.options.getString("rule");
    const pattern = interaction.options.getString("pattern").trim();
    const rules = await interaction.guild.autoModerationRules.fetch();
    const rule =
        rules.get(ruleQuery) ||
        rules.find((r) => r.name.toLowerCase() === ruleQuery.toLowerCase());

    if (!rule) return interaction.editReply(getMessage("config.not_found"));
    if (
        rule.triggerType !== AutoModerationRuleTriggerType.Keyword &&
        rule.triggerType !== AutoModerationRuleTriggerType.MemberProfile
    ) {
        return interaction.editReply(getMessage("regex.not_supported"));
    }

    if (pattern.length > 260) {
        return interaction.editReply(getMessage("regex.too_long"));
    }

    try {
        new RegExp(pattern);
    } catch (err) {
        return interaction.editReply(
            getMessage("regex.invalid_pattern", { error: err.message }),
        );
    }

    const currentPatterns = rule.triggerMetadata?.regexPatterns || [];
    if (currentPatterns.length >= 10) {
        return interaction.editReply(
            getMessage("regex.limit_reached", {
                count: currentPatterns.length,
            }),
        );
    }

    const updated = [...currentPatterns, pattern];
    await rule.edit({
        triggerMetadata: { ...rule.triggerMetadata, regexPatterns: updated },
        reason: `Added regex pattern by ${interaction.user.tag}`,
    });

    await logAction(
        interaction.guild,
        `Added Regex Pattern to "${rule.name}": \`${pattern}\` by ${interaction.user.tag}`,
    );
    return interaction.editReply(
        getMessage("regex.add_success", {
            name: rule.name,
            pattern,
            count: updated.length,
        }),
    );
}

async function handleRegexEdit(interaction) {
    const ruleQuery = interaction.options.getString("rule");
    const oldPattern = interaction.options.getString("old").trim();
    const newPattern = interaction.options.getString("new").trim();
    const rules = await interaction.guild.autoModerationRules.fetch();
    const rule =
        rules.get(ruleQuery) ||
        rules.find((r) => r.name.toLowerCase() === ruleQuery.toLowerCase());

    if (!rule) return interaction.editReply(getMessage("config.not_found"));
    if (
        rule.triggerType !== AutoModerationRuleTriggerType.Keyword &&
        rule.triggerType !== AutoModerationRuleTriggerType.MemberProfile
    ) {
        return interaction.editReply(getMessage("regex.not_supported"));
    }

    if (newPattern.length > 260) {
        return interaction.editReply(getMessage("regex.too_long"));
    }

    try {
        new RegExp(newPattern);
    } catch (err) {
        return interaction.editReply(
            getMessage("regex.invalid_pattern", { error: err.message }),
        );
    }

    const currentPatterns = rule.triggerMetadata?.regexPatterns || [];
    const targetIndex = currentPatterns.findIndex((p) => p === oldPattern);

    if (targetIndex === -1) {
        return interaction.editReply(
            getMessage("regex.not_found", { name: rule.name }),
        );
    }

    const updated = [...currentPatterns];
    updated[targetIndex] = newPattern;

    await rule.edit({
        triggerMetadata: { ...rule.triggerMetadata, regexPatterns: updated },
        reason: `Edited regex pattern by ${interaction.user.tag}`,
    });

    await logAction(
        interaction.guild,
        `Edited Regex in "${rule.name}": \`${oldPattern}\` -> \`${newPattern}\` by ${interaction.user.tag}`,
    );
    return interaction.editReply(
        getMessage("regex.edit_success", {
            name: rule.name,
            pattern: newPattern,
        }),
    );
}

async function handleRegexRemove(interaction) {
    const ruleQuery = interaction.options.getString("rule");
    const patternToRemove = interaction.options.getString("pattern").trim();
    const rules = await interaction.guild.autoModerationRules.fetch();
    const rule =
        rules.get(ruleQuery) ||
        rules.find((r) => r.name.toLowerCase() === ruleQuery.toLowerCase());

    if (!rule) return interaction.editReply(getMessage("config.not_found"));
    if (
        rule.triggerType !== AutoModerationRuleTriggerType.Keyword &&
        rule.triggerType !== AutoModerationRuleTriggerType.MemberProfile
    ) {
        return interaction.editReply(getMessage("regex.not_supported"));
    }

    const currentPatterns = rule.triggerMetadata?.regexPatterns || [];
    const updated = currentPatterns.filter((p) => p !== patternToRemove);

    if (updated.length === currentPatterns.length) {
        return interaction.editReply(
            getMessage("regex.not_found", { name: rule.name }),
        );
    }

    await rule.edit({
        triggerMetadata: { ...rule.triggerMetadata, regexPatterns: updated },
        reason: `Removed regex pattern by ${interaction.user.tag}`,
    });

    await logAction(
        interaction.guild,
        `Removed Regex Pattern from "${rule.name}": \`${patternToRemove}\` by ${interaction.user.tag}`,
    );
    return interaction.editReply(
        getMessage("regex.remove_success", {
            name: rule.name,
            pattern: patternToRemove,
            count: updated.length,
        }),
    );
}
