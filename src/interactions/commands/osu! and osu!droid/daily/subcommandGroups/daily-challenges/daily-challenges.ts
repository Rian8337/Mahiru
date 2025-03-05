import { Challenge } from "@database/utils/aliceDb/Challenge";
import { SlashSubcommandGroup } from "structures/core/SlashSubcommandGroup";
import { Language } from "@localization/base/Language";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashSubcommandGroup["run"] = async (_, interaction) => {
    if (!interaction.inCachedGuild()) {
        return;
    }

    const language = CommandHelper.getLocale(interaction);

    if (
        !CommandHelper.isExecutedByBotOwner(interaction) &&
        !interaction.member.roles.cache.has(Challenge.challengeManagerRole)
    ) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                new ConstantsLocalization(language).getTranslation(
                    "noPermissionToExecuteCommand"
                )
            ),
        });
    }

    CommandHelper.runSlashSubcommandFromInteraction(interaction, language);
};

export const config: SlashSubcommandGroup["config"] = {
    permissions: ["Special"],
    replyEphemeral: true,
};
