import { TimeoutLocalization } from "@localization/interactions/commands/Staff/timeout/TimeoutLocalization";
import { SlashSubcommand } from "@structures/core/SlashSubcommand";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { TimeoutManager } from "@utils/managers/TimeoutManager";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    if (!interaction.inCachedGuild()) {
        return;
    }

    const localization = new TimeoutLocalization(
        CommandHelper.getLocale(interaction)
    );

    const toUntimeout = await interaction.guild.members.fetch(
        interaction.options.getUser("user", true)
    );

    if (
        !TimeoutManager.userCanTimeout(
            interaction.member,
            Number.POSITIVE_INFINITY
        )
    ) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("userCannotUntimeoutError")
            ),
        });
    }

    const reason = interaction.options.getString("reason") ?? "Not specified.";

    await InteractionHelper.deferReply(interaction);

    const result = await TimeoutManager.removeTimeout(
        toUntimeout,
        interaction,
        reason,
        localization.language
    );

    if (result.failed()) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("untimeoutFailed"),
                result.reason
            ),
        });
    }

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("untimeoutSuccessful")
        ),
    });
};
