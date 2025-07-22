import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { UserContextMenuCommand } from "structures/core/UserContextMenuCommand";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { ViewRecentPlaysLocalization } from "@localization/interactions/contextmenus/user/viewRecentPlays/ViewRecentPlaysLocalization";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { ScoreDisplayHelper } from "@utils/helpers/ScoreDisplayHelper";
import { Player, Score } from "@rian8337/osu-droid-utilities";
import { RecentPlay } from "@database/utils/aliceDb/RecentPlay";
import { DroidHelper } from "@utils/helpers/DroidHelper";
import { OfficialDatabaseScore } from "@database/official/schema/OfficialDatabaseScore";

export const run: UserContextMenuCommand["run"] = async (_, interaction) => {
    const localization = new ViewRecentPlaysLocalization(
        CommandHelper.getLocale(interaction)
    );

    if (interaction.targetUser.bot) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                new ConstantsLocalization(localization.language).getTranslation(
                    Constants.userNotBindedReject
                )
            ),
        });
    }

    const isSelfExecution = interaction.user.id === interaction.targetUser.id;

    const bindInfo =
        await DatabaseManager.elainaDb.collections.userBind.getFromUser(
            interaction.targetUser,
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
                new ConstantsLocalization(localization.language).getTranslation(
                    isSelfExecution
                        ? Constants.selfNotBindedReject
                        : Constants.userNotBindedReject
                )
            ),
        });
    }

    await InteractionHelper.deferReply(interaction);

    const player = await DroidHelper.getPlayer(bindInfo.uid, [
        "id",
        "username",
    ]);

    if (!player) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation(
                    isSelfExecution
                        ? "selfProfileNotFound"
                        : "userProfileNotFound"
                )
            ),
        });
    }

    let recentPlays: (
        | Pick<
              OfficialDatabaseScore,
              | "filename"
              | "mark"
              | "mods"
              | "score"
              | "combo"
              | "date"
              | "perfect"
              | "good"
              | "bad"
              | "miss"
              | "pp"
          >
        | Score
        | RecentPlay
    )[];

    if (player instanceof Player) {
        recentPlays = player.recentPlays;
    } else {
        recentPlays = await DroidHelper.getRecentScores(
            player.id,
            undefined,
            undefined,
            [
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
        );
    }

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

export const config: UserContextMenuCommand["config"] = {
    name: "View Recent Plays",
    replyEphemeral: true,
};
