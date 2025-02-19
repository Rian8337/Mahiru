import {
    InteractionEditReplyOptions,
    InteractionReplyOptions,
    InteractionResponse,
    Message,
    MessageComponentInteraction,
    MessageFlags,
    RepliableInteraction,
} from "discord.js";

/**
 * A helper for responding to interactions.
 */
export abstract class InteractionHelper {
    /**
     * Defers a reply to an interaction.
     *
     * @param interaction The interaction to defer.
     * @param ephemeral Whether the reply should be ephemeral. Defaults to the interaction's `ephemeral` property.
     */
    static async deferReply(
        interaction: RepliableInteraction,
        ephemeral?: boolean,
    ): Promise<InteractionResponse | void> {
        if (!interaction.deferred && !interaction.replied) {
            return interaction.deferReply({
                flags:
                    ephemeral || interaction.ephemeral
                        ? MessageFlags.Ephemeral
                        : undefined,
            });
        }
    }

    /**
     * Defers an update to an interaction.
     *
     * @param interaction The interaction to defer.
     */
    static async deferUpdate(
        interaction: MessageComponentInteraction,
    ): Promise<InteractionResponse | void> {
        if (!interaction.deferred && !interaction.replied) {
            return interaction.deferUpdate();
        }
    }

    /**
     * Replies to an interaction.
     *
     * @param interaction The interaction to reply to.
     * @param reply The reply to send.
     * @returns The response of the interaction.
     */
    static async reply(
        interaction: RepliableInteraction,
        reply: InteractionEditReplyOptions | InteractionReplyOptions,
    ): Promise<Message> {
        // Reset message components
        reply.components ??= [];

        let message: Message;

        if (interaction.deferred || interaction.replied) {
            message = await interaction.editReply({
                ...reply,
                flags: undefined,
            });
        } else {
            const callback = await interaction.reply({
                ...reply,
                content: reply.content ?? undefined,
                flags: interaction.ephemeral
                    ? MessageFlags.Ephemeral
                    : undefined,
                withResponse: true,
            });

            // Guaranteed to be non-null for initial interaction replies.
            // See https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-callback-interaction-callback-resource-object.
            message = callback.resource!.message!;
        }

        return message;
    }

    /**
     * Sends an update response to an interaction.
     *
     * @param interaction The interaction to update.
     * @param response The response to send.
     * @returns The response of the interaction.
     */
    static async update(
        interaction: MessageComponentInteraction,
        response: InteractionEditReplyOptions | InteractionReplyOptions,
    ): Promise<Message> {
        // Reset message components
        response.components ??= [];

        let message: Message;

        if (interaction.deferred || interaction.replied) {
            message = await interaction.editReply({
                ...response,
                flags: undefined,
            });
        } else {
            const callback = await interaction.reply({
                ...response,
                content: response.content ?? undefined,
                flags: interaction.ephemeral
                    ? MessageFlags.Ephemeral
                    : undefined,
                withResponse: true,
            });

            // Guaranteed to be non-null for initial interaction replies.
            // See https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-callback-interaction-callback-resource-object.
            message = callback.resource!.message!;
        }

        return message;
    }
}
