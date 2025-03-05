import { TimeoutLocalization } from "@localization/interactions/commands/Staff/timeout/TimeoutLocalization";
import { SlashSubcommand } from "@structures/core/SlashSubcommand";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { TimeoutManager } from "@utils/managers/TimeoutManager";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
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
