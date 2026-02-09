import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { SupportTicket } from "@database/utils/aliceDb/SupportTicket";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { TicketLocalization } from "@localization/interactions/commands/General/ticket/TicketLocalization";
import { SlashSubcommand } from "@structures/core/SlashSubcommand";
import { DatabaseSupportTicket } from "@structures/database/aliceDb/DatabaseSupportTicket";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { ModalCreator } from "@utils/creators/ModalCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { TextInputBuilder, TextInputStyle } from "discord.js";
import { FindOptions } from "mongodb";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const dbManager = DatabaseManager.aliceDb.collections.supportTicket;
    const language = CommandHelper.getLocale(interaction);
    const localization = new TicketLocalization(language);

    const author = interaction.options.getUser("author");
    const ticketId = interaction.options.getInteger("id");

    let ticket: SupportTicket | null;
    const findOptions: FindOptions = {
        projection: {
            _id: 0,
            id: 1,
            authorId: 1,
            description: 1,
            status: 1,
            threadChannelId: 1,
            title: 1,
        },
    };

    if (author !== null && ticketId !== null) {
        ticket = await dbManager.getFromUser(author.id, ticketId, findOptions);
    } else {
        ticket = await dbManager.getFromChannel(
            interaction.channelId,
            findOptions,
        );
    }

    if (!ticket) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("ticketNotFound"),
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
        `ticket-edit#${ticket.threadChannelId}`,
        localization.getTranslation("ticketEditModalTitle"),
        new TextInputBuilder()
            .setCustomId("title")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
            .setMaxLength(100)
            .setPlaceholder(
                localization.getTranslation("ticketModalTitlePlaceholder"),
            )
            .setLabel(localization.getTranslation("ticketModalTitleLabel"))
            .setValue(ticket.title),
        new TextInputBuilder()
            .setCustomId("description")
            .setRequired(true)
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(1500)
            .setPlaceholder(
                localization.getTranslation(
                    "ticketModalDescriptionPlaceholder",
                ),
            )
            .setLabel(
                localization.getTranslation("ticketModalDescriptionLabel"),
            )
            .setValue(ticket.description),
    );
};

export const config: SlashSubcommand["config"] = {
    cooldown: 5,
    instantDeferInDebug: false,
};
