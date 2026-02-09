import { Config } from "@core/Config";
import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { SupportTicket } from "@database/utils/aliceDb/SupportTicket";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { TicketLocalization } from "@localization/interactions/commands/General/ticket/TicketLocalization";
import { SlashSubcommand } from "@structures/core/SlashSubcommand";
import { DatabaseSupportTicket } from "@structures/database/aliceDb/DatabaseSupportTicket";
import { MessageButtonCreator } from "@utils/creators/MessageButtonCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { ChannelType } from "discord.js";
import { FindOptions } from "mongodb";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    if (!interaction.inCachedGuild()) {
        return;
    }

    const dbManager = DatabaseManager.aliceDb.collections.supportTicket;
    const language = CommandHelper.getLocale(interaction);
    const localization = new TicketLocalization(language);

    const channel = interaction.options.getChannel("name", true, [
        ChannelType.GuildText,
        ChannelType.GuildForum,
    ]);
    const author = interaction.options.getUser("author");
    const ticketId = interaction.options.getInteger("id");

    let ticket: SupportTicket | null;
    const findOptions: FindOptions = {
        projection: {
            _id: 0,
            id: 1,
            authorId: 1,
            status: 1,
        },
    };

    await InteractionHelper.deferReply(interaction);

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

    if (!ticket.isOpen) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("ticketIsNotOpen"),
            ),
        });
    }

    if (
        ticket.authorId !== interaction.user.id &&
        !interaction.member.roles.cache.hasAny(...Config.verifyPerm)
    ) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                new ConstantsLocalization(language).getTranslation(
                    Constants.noPermissionReject,
                ),
            ),
        });
    }

    const confirmation = await MessageButtonCreator.createConfirmation(
        interaction,
        {
            content: MessageCreator.createWarn(
                localization.getTranslation("moveTicketConfirm"),
                channel.toString(),
            ),
        },
        [interaction.user.id],
        15,
        language,
    );

    if (!confirmation) {
        return;
    }

    const result = await ticket.move(channel);

    if (result.failed()) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("moveTicketFailed"),
                result.reason,
            ),
        });
    }

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("moveTicketSuccess"),
            channel.toString(),
        ),
    });
};
