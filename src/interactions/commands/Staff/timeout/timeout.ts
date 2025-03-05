import {
    ApplicationCommandOptionType,
    InteractionContextType,
} from "discord.js";
import { CommandCategory } from "@enums/core/CommandCategory";
import { SlashCommand } from "structures/core/SlashCommand";
import { TimeoutManager } from "@utils/managers/TimeoutManager";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { TimeoutLocalization } from "@localization/interactions/commands/Staff/timeout/TimeoutLocalization";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashCommand["run"] = async (_, interaction) => {
    if (!interaction.inCachedGuild()) {
        return;
    }

    const localization = new TimeoutLocalization(
        CommandHelper.getLocale(interaction)
    );

    await InteractionHelper.deferReply(interaction);

    const toTimeout = await interaction.guild.members.fetch(
        interaction.options.getUser("user", true)
    );

    if (!toTimeout) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("userToTimeoutNotFound")
            ),
        });
    }

    const duration = CommandHelper.convertStringTimeFormat(
        interaction.options.getString("duration", true)
    );

    const reason = interaction.options.getString("reason", true);

    const result = await TimeoutManager.addTimeout(
        interaction,
        toTimeout,
        reason,
        duration > 0 ? duration : Number.POSITIVE_INFINITY,
        localization.language
    );

    if (result.failed()) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("timeoutFailed"),
                result.reason
            ),
        });
    }

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("timeoutSuccess"),
            Number.isFinite(duration)
                ? DateTimeFormatHelper.secondsToDHMS(
                      duration,
                      localization.language
                  )
                : localization.getTranslation("indefiniteTimeout")
        ),
    });
};

export const category: SlashCommand["category"] = CommandCategory.staff;

export const config: SlashCommand["config"] = {
    name: "timeout",
    description:
        "Timeouts a user. This command's permission can be configured using the /settings command.",
    options: [
        {
            name: "user",
            required: true,
            type: ApplicationCommandOptionType.User,
            description: "The user to timeout.",
        },
        {
            name: "duration",
            required: true,
            type: ApplicationCommandOptionType.String,
            description:
                "The timeout duration (e.g. 6:01:24:33 or 2d14h55m34s). Minimum is 30 seconds. -1 for indefinite.",
        },
        {
            name: "reason",
            required: true,
            type: ApplicationCommandOptionType.String,
            description: "The reason for timeouting the user.",
            maxLength: 1500,
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
    permissions: ["Special"],
    contexts: [InteractionContextType.Guild],
    replyEphemeral: true,
};
