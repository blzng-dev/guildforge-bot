const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');

/**
 * Prompts the user for confirmation before performing a destructive action.
 * @param {import('discord.js').CommandInteraction} interaction 
 * @param {string} promptMessage The message to display.
 * @returns {Promise<boolean>} True if confirmed, false if cancelled or timed out.
 */
async function confirmAction(interaction, promptMessage) {
    const confirm = new ButtonBuilder()
        .setCustomId('confirm')
        .setLabel('Confirm')
        .setStyle(ButtonStyle.Danger);

    const cancel = new ButtonBuilder()
        .setCustomId('cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(cancel, confirm);

    // Ensure we reply or edit depending on state
    let response;
    const payload = {
        content: promptMessage,
        components: [row],
        flags: MessageFlags.Ephemeral
    };

    if (interaction.deferred || interaction.replied) {
        response = await interaction.editReply(payload);
    } else {
        response = await interaction.reply({ ...payload, fetchReply: true });
    }

    try {
        const confirmation = await response.awaitMessageComponent({
            filter: (i) => i.user.id === interaction.user.id,
            time: 60000,
            componentType: ComponentType.Button
        });

        if (confirmation.customId === 'confirm') {
            await confirmation.deferUpdate();
            return true;
        } else {
            await confirmation.update({ content: 'Action cancelled.', components: [] });
            return false;
        }
    } catch (e) {
        await interaction.editReply({ content: 'Confirmation timed out, action cancelled.', components: [] });
        return false;
    }
}

module.exports = { confirmAction };
