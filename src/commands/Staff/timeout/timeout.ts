import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";
import { CommandCategory } from "@alice-enums/core/CommandCategory";
import { SlashCommand } from "@alice-interfaces/core/SlashCommand";
import { GuildMember } from "discord.js";
import { OperationResult } from "@alice-interfaces/core/OperationResult";
import { TimeoutManager } from "@alice-utils/managers/TimeoutManager";
import { MessageCreator } from "@alice-utils/creators/MessageCreator";
import { CommandHelper } from "@alice-utils/helpers/CommandHelper";
import { DateTimeFormatHelper } from "@alice-utils/helpers/DateTimeFormatHelper";
import { TimeoutLocalization } from "@alice-localization/commands/Staff/timeout/TimeoutLocalization";
import { InteractionHelper } from "@alice-utils/helpers/InteractionHelper";

export const run: SlashCommand["run"] = async (_, interaction) => {
    const localization: TimeoutLocalization = new TimeoutLocalization(
        await CommandHelper.getLocale(interaction)
    );

    const toTimeout: GuildMember = await interaction.guild!.members.fetch(
        interaction.options.getUser("user", true)
    );

    if (!toTimeout) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("userToTimeoutNotFound")
            ),
        });
    }

    const duration: number = CommandHelper.convertStringTimeFormat(
        interaction.options.getString("duration", true)
    );

    const reason: string = interaction.options.getString("reason", true);

    await InteractionHelper.defer(interaction);

    const result: OperationResult = await TimeoutManager.addTimeout(
        interaction,
        toTimeout,
        reason,
        duration,
        localization.language
    );

    if (!result.success) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("timeoutFailed"),
                result.reason!
            ),
        });
    }

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("timeoutSuccess"),
            DateTimeFormatHelper.secondsToDHMS(duration, localization.language)
        ),
    });
};

export const category: SlashCommand["category"] = CommandCategory.STAFF;

export const config: SlashCommand["config"] = {
    name: "timeout",
    description:
        "Timeouts a user. This command's permission can be configured using the /settings command.",
    options: [
        {
            name: "user",
            required: true,
            type: ApplicationCommandOptionTypes.USER,
            description: "The user to timeout.",
        },
        {
            name: "duration",
            required: true,
            type: ApplicationCommandOptionTypes.STRING,
            description:
                "The duration to timeout for, in time format (e.g. 6:01:24:33 or 2d14h55m34s). Minimum is 30 seconds.",
        },
        {
            name: "reason",
            required: true,
            type: ApplicationCommandOptionTypes.STRING,
            description:
                "The reason for timeouting the user. Maximum length is 1500 characters.",
        },
    ],
    example: [
        {
            command: "timeout",
            arguments: [
                {
                    name: "user",
                    value: "132783516176875520",
                },
                {
                    name: "duration",
                    value: "2h",
                },
                {
                    name: "reason",
                    value: "bad",
                },
            ],
            description:
                'will timeout the user with that Discord ID for 2 hours with reason "bad".',
        },
    ],
    permissions: ["SPECIAL"],
    replyEphemeral: true,
    scope: "GUILD_CHANNEL",
};
