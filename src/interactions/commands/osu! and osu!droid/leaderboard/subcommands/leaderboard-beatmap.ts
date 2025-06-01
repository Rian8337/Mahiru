import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { NumberHelper } from "@utils/helpers/NumberHelper";
import { BeatmapManager } from "@utils/managers/BeatmapManager";
import { LeaderboardLocalization } from "@localization/interactions/commands/osu! and osu!droid/leaderboard/LeaderboardLocalization";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { ScoreDisplayHelper } from "@utils/helpers/ScoreDisplayHelper";
import { BeatmapLeaderboardSortMode } from "@enums/interactions/BeatmapLeaderboardSortMode";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization = new LeaderboardLocalization(
        CommandHelper.getLocale(interaction)
    );

    const beatmapID = BeatmapManager.getBeatmapID(
        interaction.options.getString("beatmap") ?? ""
    )[0];

    let hash = BeatmapManager.getChannelLatestBeatmap(interaction.channelId);

    const page = interaction.options.getInteger("page") ?? 1;
    const order = (interaction.options.getInteger("order") ??
        BeatmapLeaderboardSortMode.score) as BeatmapLeaderboardSortMode;

    if (!beatmapID && !hash) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("noBeatmapFound")
            ),
        });
    }

    if (!NumberHelper.isPositive(page)) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("invalidPage")
            ),
        });
    }

    await InteractionHelper.deferReply(interaction);

    if (beatmapID) {
        const beatmapInfo = await BeatmapManager.getBeatmap(beatmapID, {
            checkFile: false,
        });

        hash = beatmapInfo?.hash;
    }

    if (!hash) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("noBeatmapFound")
            ),
        });
    }

    ScoreDisplayHelper.showBeatmapLeaderboard(interaction, hash, page, order);
};
