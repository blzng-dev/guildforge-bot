const { MessageFlags } = require('discord.js');

class ProgressReporter {
    /**
     * @param {import('discord.js').CommandInteraction|import('discord.js').ModalSubmitInteraction} interaction 
     * @param {number} total 
     * @param {string} actionName 
     */
    constructor(interaction, total, actionName) {
        this.interaction = interaction;
        this.total = total;
        this.current = 0;
        this.failed = 0;
        this.actionName = actionName;
        this.lastUpdateTime = 0;
    }

    /**
     * @param {boolean} success Whether the current item succeeded
     */
    async update(success = true) {
        this.current++;
        if (!success) this.failed++;

        const now = Date.now();
        // Update at most once every 3 seconds to avoid Discord rate limits, or if it's the last item
        if (now - this.lastUpdateTime > 3000 || this.current === this.total) {
            this.lastUpdateTime = now;
            const percent = Math.floor((this.current / this.total) * 100);
            
            // Plain text progress bar (e.g., [██████░░░░])
            const barLength = 10;
            const filledLength = Math.round((percent / 100) * barLength);
            const emptyLength = barLength - filledLength;
            const bar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);

            let content = `**${this.actionName}**\n`;
            content += `Progress: [${bar}] ${percent}%\n`;
            content += `Processed: ${this.current}/${this.total}`;
            if (this.failed > 0) {
                content += ` (${this.failed} failed)`;
            }

            try {
                if (this.interaction.deferred || this.interaction.replied) {
                    await this.interaction.editReply({ content, flags: MessageFlags.Ephemeral });
                } else {
                    await this.interaction.reply({ content, flags: MessageFlags.Ephemeral });
                }
            } catch (e) {
                console.error("Failed to update progress:", e);
            }
        }
    }

    /**
     * Send final summary when done or timed out.
     * @param {string} finalMessage 
     */
    async finish(finalMessage) {
        try {
            if (this.interaction.deferred || this.interaction.replied) {
                await this.interaction.editReply({ content: finalMessage, flags: MessageFlags.Ephemeral });
            } else {
                await this.interaction.reply({ content: finalMessage, flags: MessageFlags.Ephemeral });
            }
        } catch (e) {
            console.error("Failed to send final progress message:", e);
        }
    }
}

module.exports = { ProgressReporter };
