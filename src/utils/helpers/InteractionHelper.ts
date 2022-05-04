import {
    Interaction,
    InteractionResponseFields,
    Message,
    WebhookEditMessageOptions,
} from "discord.js";

/**
 * A helper for responding to interactions.
 */
export abstract class InteractionHelper {
    /**
     * Defers an interaction.
     *
     * @param interaction The interaction to defer.
     * @param ephemeral Whether the reply should be ephemeral. Defaults to the interaction's `ephemeral` property.
     */
    static async defer(
        interaction: Interaction & InteractionResponseFields,
        ephemeral?: boolean
    ): Promise<void> {
        if (!interaction.deferred && !interaction.replied) {
            return interaction.deferReply({
                ephemeral: ephemeral ?? interaction.ephemeral ?? false,
            });
        }
    }

    /**
     * Replies to an interaction.
     *
     * @param interaction The interaction to reply to.
     * @param reply The reply to send.
     * @returns The response of the command.
     */
    static async reply(
        interaction: Interaction & InteractionResponseFields,
        reply: WebhookEditMessageOptions
    ): Promise<Message> {
        let message: Message;

        if (interaction.deferred || interaction.replied) {
            message = <Message>await interaction.editReply(reply);
        } else {
            message = <Message>await interaction.reply({
                ...reply,
                fetchReply: true,
                ephemeral: interaction.ephemeral ?? false,
            });
        }

        return message;
    }
}