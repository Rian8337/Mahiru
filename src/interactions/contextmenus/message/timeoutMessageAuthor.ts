import { Constants } from "@core/Constants";
import { MessageContextMenuCommand } from "structures/core/MessageContextMenuCommand";
import { OperationResult } from "structures/core/OperationResult";
import { TimeoutMessageAuthorLocalization } from "@localization/interactions/contextmenus/message/timeoutMessageAuthor/TimeoutMessageAuthorLocalization";
import { MessageButtonCreator } from "@utils/creators/MessageButtonCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { SelectMenuCreator } from "@utils/creators/SelectMenuCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { StringHelper } from "@utils/helpers/StringHelper";
import { TimeoutManager } from "@utils/managers/TimeoutManager";
import {
    Embed,
    Guild,
    GuildMember,
    StringSelectMenuInteraction,
} from "discord.js";

export const run: MessageContextMenuCommand["run"] = async (
    client,
    interaction,
) => {
    const localization: TimeoutMessageAuthorLocalization =
        new TimeoutMessageAuthorLocalization(
            CommandHelper.getLocale(interaction),
        );

    const selectMenuInteraction: StringSelectMenuInteraction | null =
        await SelectMenuCreator.createStringSelectMenu(
            interaction,
            {
                content: MessageCreator.createWarn(
                    localization.getTranslation("selectDuration"),
                ),
            },
            [
                // 1 minute
                60,
                // 5 minutes
                60 * 5,
                // 10 minutes
                60 * 10,
                // 1 hour
                3600,
                // 6 hours
                3600 * 6,
                // 12 hours
                3600 * 12,
                // 1 day
                86400,
                // 2 days
                86400 * 2,
                // 4 days
                86400 * 4,
                // 1 week
                86400 * 7,
            ].map((v) => {
                return {
                    label: DateTimeFormatHelper.secondsToDHMS(
                        v,
                        localization.language,
                    ),
                    value: v.toString(),
                };
            }),
            [interaction.user.id],
            20,
        );

    if (!selectMenuInteraction) {
        return;
    }

    await selectMenuInteraction.deferUpdate();

    const duration: number = parseInt(selectMenuInteraction.values[0]);

    const confirmation: boolean = await MessageButtonCreator.createConfirmation(
        interaction,
        {
            content: MessageCreator.createWarn(
                localization.getTranslation("timeoutConfirmation"),
                interaction.targetMessage.author.toString(),
                DateTimeFormatHelper.secondsToDHMS(
                    duration,
                    localization.language,
                ),
            ),
        },
        [interaction.user.id],
        15,
    );

    if (!confirmation) {
        return;
    }

    let member: GuildMember | null = interaction.targetMessage.member;

    if (!member) {
        const guild: Guild = await client.guilds.fetch(Constants.mainServer);

        member = await guild.members.fetch(interaction.targetMessage.author);
    }

    const embed: Embed = interaction.targetMessage.embeds[0];

    let loggedContent: string = embed.description!;

    if (loggedContent.length > 256) {
        loggedContent = loggedContent.substring(0, 256) + "...";
    }

    const channelId: string = embed.fields[1].value;
    const messageId: string = embed.fields[5].value;

    const result: OperationResult = await TimeoutManager.addTimeout(
        interaction,
        member,
        StringHelper.formatString(
            localization.getTranslation("timeoutReason"),
            loggedContent,
            // interaction.targetMessage.url returns the wrong link, so constructing manually for now.
            `https://discord.com/channels/${Constants.mainServer}/${channelId}/${messageId}`,
        ),
        duration,
        localization.language,
        channelId,
    );

    if (!result.success) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("timeoutFailed"),
                result.reason!,
            ),
        });
    }

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("timeoutSuccess"),
            DateTimeFormatHelper.secondsToDHMS(duration, localization.language),
        ),
    });
};

export const config: MessageContextMenuCommand["config"] = {
    name: "Timeout Message Author",
    replyEphemeral: true,
};
