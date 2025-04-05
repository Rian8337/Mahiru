import { DatabaseManager } from "@database/DatabaseManager";
import { PPCalculationMethod } from "@enums/utils/PPCalculationMethod";
import { OnboardingShowMostRecentPlayLocalization } from "@localization/interactions/buttons/Onboarding/onboardingShowMostRecentPlay/OnboardingShowMostRecentPlayLocalization";
import { ButtonCommand } from "@structures/core/ButtonCommand";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageButtonCreator } from "@utils/creators/MessageButtonCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { DroidHelper } from "@utils/helpers/DroidHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { ReplayHelper } from "@utils/helpers/ReplayHelper";
import { BeatmapManager } from "@utils/managers/BeatmapManager";
import { PPProcessorRESTManager } from "@utils/managers/PPProcessorRESTManager";
import { DroidLegacyModConverter, Modes } from "@rian8337/osu-base";
import { Player, Score } from "@rian8337/osu-droid-utilities";
import { InteractionReplyOptions } from "discord.js";

export const run: ButtonCommand["run"] = async (_, interaction) => {
    if (!interaction.inCachedGuild()) {
        return;
    }

    const localization = new OnboardingShowMostRecentPlayLocalization(
        CommandHelper.getLocale(interaction)
    );

    await InteractionHelper.deferReply(interaction);

    const bindInfo =
        await DatabaseManager.elainaDb.collections.userBind.getFromUser(
            interaction.user.id,
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

    const recentPlays =
        player instanceof Player
            ? player.recentPlays
            : await DroidHelper.getRecentScores(player.id, 1, undefined, [
                  "id",
                  "uid",
                  "hash",
                  "score",
                  "filename",
                  "hash",
                  "mode",
                  "combo",
                  "mark",
                  "perfect",
                  "good",
                  "bad",
                  "miss",
                  "date",
              ]);

    if (recentPlays.length === 0) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("playerHasNoRecentPlays")
            ),
        });
    }

    const score = recentPlays[0];

    const scoreAttribs = await PPProcessorRESTManager.getOnlineScoreAttributes(
        score.uid,
        score.hash,
        Modes.droid,
        PPCalculationMethod.live
    );

    const options: InteractionReplyOptions = {
        content: MessageCreator.createAccept(
            localization.getTranslation("recentPlayDisplay"),
            player.username
        ),
        embeds: [
            await EmbedCreator.createRecentPlayEmbed(
                score,
                interaction.member.displayColor,
                scoreAttribs?.attributes,
                undefined,
                localization.language
            ),
        ],
        ephemeral: true,
    };

    if ((score instanceof Score ? score.accuracy.nmiss : score.miss) > 0) {
        const replay = await ReplayHelper.analyzeReplay(score);

        if (!replay.data) {
            return InteractionHelper.reply(interaction, options);
        }

        const beatmapInfo = await BeatmapManager.getBeatmap(score.hash, {
            checkFile: true,
        });

        if (beatmapInfo?.hasDownloadedBeatmap()) {
            MessageButtonCreator.createRecentScoreButton(
                interaction,
                options,
                beatmapInfo.beatmap,
                replay.data,
                score instanceof Score
                    ? score.mods
                    : DroidLegacyModConverter.convert(score.mode)
            );
        } else {
            InteractionHelper.reply(interaction, options);
        }
    } else {
        InteractionHelper.reply(interaction, options);
    }
};

export const config: ButtonCommand["config"] = {
    replyEphemeral: true,
};
