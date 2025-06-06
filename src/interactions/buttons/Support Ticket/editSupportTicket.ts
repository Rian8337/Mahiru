import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { EditSupportTicketLocalization } from "@localization/interactions/buttons/Support Ticket/editSupportTicket/EditSupportTicketLocalization";
import { ButtonCommand } from "@structures/core/ButtonCommand";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { ModalCreator } from "@utils/creators/ModalCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { TextInputBuilder, TextInputStyle } from "discord.js";

export const run: ButtonCommand["run"] = async (_, interaction) => {
    const language = CommandHelper.getLocale(interaction);
    const localization = new EditSupportTicketLocalization(language);

    const threadChannelId = interaction.customId.split("#")[1];
    const ticket =
        await DatabaseManager.aliceDb.collections.supportTicket.getFromChannel(
            threadChannelId,
            {
                projection: {
                    _id: 0,
                    description: 1,
                    title: 1,
                    status: 1,
                },
            },
        );

    if (!ticket) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("ticketNotFound"),
            ),
        });
    }

    if (!ticket.isOpen) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("ticketIsNotOpen"),
            ),
        });
    }

    if (!ticket.canModify(interaction.user.id)) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                new ConstantsLocalization(language).getTranslation(
                    Constants.noPermissionReject,
                ),
            ),
        });
    }

    ModalCreator.createModal(
        interaction,
        `ticket-edit#${threadChannelId}`,
        localization.getTranslation("modalTitle"),
        new TextInputBuilder()
            .setCustomId("title")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
            .setMaxLength(100)
            .setPlaceholder(
                localization.getTranslation("modalTitlePlaceholder"),
            )
            .setLabel(localization.getTranslation("modalTitleLabel"))
            .setValue(ticket.title),
        new TextInputBuilder()
            .setCustomId("description")
            .setRequired(true)
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(1500)
            .setPlaceholder(
                localization.getTranslation("modalDescriptionPlaceholder"),
            )
            .setLabel(localization.getTranslation("modalDescriptionLabel"))
            .setValue(ticket.description),
    );
};

export const config: ButtonCommand["config"] = {
    cooldown: 5,
    replyEphemeral: true,
    instantDeferInDebug: false,
};
