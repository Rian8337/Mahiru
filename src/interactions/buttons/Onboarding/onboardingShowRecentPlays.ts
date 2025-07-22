import { DatabaseManager } from "@database/DatabaseManager";
import { OnboardingShowRecentPlaysLocalization } from "@localization/interactions/buttons/Onboarding/onboardingShowRecentPlays/OnboardingShowRecentPlaysLocalization";
import { ButtonCommand } from "@structures/core/ButtonCommand";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { DroidHelper } from "@utils/helpers/DroidHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { ScoreDisplayHelper } from "@utils/helpers/ScoreDisplayHelper";
import { ScoreHelper } from "@utils/helpers/ScoreHelper";
import { Player } from "@rian8337/osu-droid-utilities";

export const run: ButtonCommand["run"] = async (_, interaction) => {
    const localization = new OnboardingShowRecentPlaysLocalization(
        CommandHelper.getLocale(interaction)
    );

    await InteractionHelper.deferReply(interaction);

    const bindInfo =
        await DatabaseManager.elainaDb.collections.userBind.getFromUser(
            interaction.user,
            {
                projection: {
                    _id: 0,
                    uid: 1,
                },
            }
        );

    if (!bindInfo) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("userNotBinded")
            ),
        });
    }

    const player = await DroidHelper.getPlayer(bindInfo.uid, [
        "id",
        "username",
    ]);

    if (!player) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("profileNotFound")
            ),
        });
    }

    const recentPlays = await ScoreHelper.getRecentScores(
        bindInfo.uid,
        player instanceof Player
            ? player.recentPlays
            : await DroidHelper.getRecentScores(
                  player.id,
                  undefined,
                  undefined,
                  [
                      "id",
                      "filename",
                      "mark",
                      "mods",
                      "score",
                      "combo",
                      "date",
                      "perfect",
                      "good",
                      "bad",
                      "miss",
                      "pp",
                  ]
              )
    );

    if (recentPlays.length === 0) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("playerHasNoRecentPlays")
            ),
        });
    }

    await ScoreDisplayHelper.showRecentPlays(
        interaction,
        player.username,
        recentPlays
    );
};

export const config: ButtonCommand["config"] = {
    replyEphemeral: true,
};
