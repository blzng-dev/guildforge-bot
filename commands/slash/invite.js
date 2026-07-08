const {
    SlashCommandBuilder,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const { getMessage } = require("../../utils/messages");

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
