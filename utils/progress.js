const { MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

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

class InteractiveProgress {
    constructor(interaction, total, actionName) {
        this.interaction = interaction;
        this.total = total;
        this.current = 0;
        this.failed = 0;
        this.actionName = actionName;
        this.lastUpdateTime = 0;
        this.isPaused = false;
        this.isCancelled = false;
        this.message = null;
        this.collector = null;
    }

    async start() {
        const content = this._buildContent();
        const components = this._buildComponents();
        
        if (this.interaction.deferred || this.interaction.replied) {
            this.message = await this.interaction.editReply({ content, components });
        } else {
            this.message = await this.interaction.reply({ content, components, fetchReply: true });
        }

        this.collector = this.message.createMessageComponentCollector({
            filter: (i) => i.user.id === this.interaction.user.id,
            componentType: ComponentType.Button,
            time: 3600000 // 1 hour max
        });

        this.collector.on('collect', async (i) => {
            if (i.customId === 'pause_resume') {
                this.isPaused = !this.isPaused;
                await i.update({ content: this._buildContent(), components: this._buildComponents() });
            } else if (i.customId === 'cancel') {
                this.isCancelled = true;
                this.isPaused = false; // Unpause so the loop can exit
                this.collector.stop('cancelled');
                await i.update({ content: this._buildContent() + '\n**Cancelled by user.**', components: [] });
            }
        });
        
        this.collector.on('end', (collected, reason) => {
             if(reason === 'time') {
                 this.isCancelled = true;
                 this.isPaused = false;
                 this.interaction.editReply({ components: [] }).catch(() => {});
             }
        });
    }

    _buildContent() {
        const percent = this.total > 0 ? Math.floor((this.current / this.total) * 100) : 100;
        const barLength = 10;
        const filledLength = Math.round((percent / 100) * barLength);
        const emptyLength = barLength - filledLength;
        const bar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);

        let status = '[In Progress]';
        if (this.isCancelled) status = '[Cancelled]';
        else if (this.isPaused) status = '[Paused]';
        else if (this.current >= this.total) status = '[Completed]';

        let content = `**${this.actionName}** - ${status}\n`;
        content += `Progress: [${bar}] ${percent}%\n`;
        content += `Processed: ${this.current}/${this.total}`;
        if (this.failed > 0) {
            content += ` (${this.failed} failed)`;
        }
        return content;
    }

    _buildComponents() {
        if (this.current >= this.total || this.isCancelled) return [];

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('pause_resume')
                .setLabel(this.isPaused ? 'Resume' : 'Pause')
                .setStyle(this.isPaused ? ButtonStyle.Success : ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger)
        );
        return [row];
    }

    async waitIfPaused() {
        while (this.isPaused && !this.isCancelled) {
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    async update(success = true) {
        if (this.isCancelled) return;
        
        this.current++;
        if (!success) this.failed++;

        const now = Date.now();
        if (now - this.lastUpdateTime > 3000 || this.current >= this.total) {
            this.lastUpdateTime = now;
            try {
                await this.interaction.editReply({
                    content: this._buildContent(),
                    components: this._buildComponents()
                });
            } catch (e) {
                console.error("Failed to update interactive progress:", e);
            }
        }
    }

    async finish(finalMessage) {
        this.current = this.total;
        if (this.collector) this.collector.stop('finished');
        try {
            await this.interaction.editReply({ 
                content: this._buildContent() + '\n\n' + finalMessage, 
                components: [] 
            });
        } catch (e) {
            console.error("Failed to finish interactive progress:", e);
        }
    }
}

module.exports = { ProgressReporter, InteractiveProgress };
