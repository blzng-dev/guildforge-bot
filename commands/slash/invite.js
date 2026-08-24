const {
    SlashCommandBuilder,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const MESSAGES = {
    invite: {
        self: ":invite: Click the button below to invite me to your server:",
        others: "## Bot Invite Links\nsome useful free bot invite links\n- **[Carl](<https://discord.com/oauth2/authorize?&client_id=235148962103951360&scope=applications.commands+bot&permissions=2088234230&response_type=code&redirect_uri=https://carl.gg/api/server_auth>)** - logging, welcome, notifications\n- **[Sapphire](<https://discord.com/oauth2/authorize?scope=bot+applications.commands&response_type=code&redirect_uri=https://sapph.xyz/dashboard&permissions=1101596716286&client_id=678344927997853742&guild_id=1355771301259771965>)** - menus, logging, welcome\n- **[Statbot](<https://discord.com/oauth2/authorize?client_id=491769129318088714&scope=bot+applications.commands&permissions=275147508760>)** - message tracking\n- **[Activity Rank](<https://discord.com/oauth2/authorize?client_id=534589798267224065&permissions=294172224721&scope=bot%20applications.commands>)** - levelling\n- **[Formify](<https://ptb.discord.com/oauth2/authorize?client_id=945331235977310280&permissions=395405740048&scope=applications.commands+bot>)** - forms, ticketing\n- **[Discohook](<https://discord.com/oauth2/authorize?client_id=792842038332358656&permissions=805694528&scope=bot%20applications.commands>)** - menus\n- **[X Follow-Up](<https://discord.com/oauth2/authorize?client_id=1174332637322674186&permissions=2147862592&scope=bot%20applications.commands>)** - twitter notifications\n- **[Fredboat](<https://discord.com/oauth2/authorize?client_id=184405253028970496&scope=bot+identify&redirect_uri=https%3A%2F%2Ffredboat.com%2Fcallback%2Fmusic&response_type=code>)** - music\n- **[Tickets](<https://discord.com/oauth2/authorize?client_id=1325579039888511056&scope=bot+applications.commands&permissions=395942816984>)** - ticketing"
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
        .setName("invite")
        .setDescription("get invite links for bots")
        .addBooleanOption((option) =>
            option
                .setName("self")
                .setDescription("show invite for this bot only")
                .setRequired(true),
        ),

    async execute(interaction) {
        const showSelf = interaction.options.getBoolean("self");

        if (showSelf) {
            const inviteButton = new ButtonBuilder()
                .setLabel("Add Bot to Server")
                .setURL(
                    "https://discord.com/oauth2/authorize?client_id=1360109607183323206&permissions=8&integration_type=0&scope=bot",
                )
                .setStyle(ButtonStyle.Link);
            const row = new ActionRowBuilder().addComponents(inviteButton);

            await interaction.reply({
                content: getMessage('invite.self'),
                components: [row],
            });
        } else {
            // Return the list of other bots
            await interaction.reply({
                content: getMessage('invite.others'),
                flags: MessageFlags.Ephemeral | MessageFlags.SuppressEmbeds,
            });
        }
    },
};
