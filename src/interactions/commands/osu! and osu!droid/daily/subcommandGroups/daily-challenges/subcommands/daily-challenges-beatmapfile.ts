import { DatabaseManager } from "@alice-database/DatabaseManager";
import { Challenge } from "@alice-database/utils/aliceDb/Challenge";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { DailyLocalization } from "@alice-localization/interactions/commands/osu! and osu!droid/daily/DailyLocalization";
import { MessageCreator } from "@alice-utils/creators/MessageCreator";
import { CommandHelper } from "@alice-utils/helpers/CommandHelper";
import { InteractionHelper } from "@alice-utils/helpers/InteractionHelper";
import { BeatmapManager } from "@alice-utils/managers/BeatmapManager";
import { MapInfo } from "@rian8337/osu-base";
import { AttachmentBuilder } from "discord.js";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization: DailyLocalization = new DailyLocalization(
        await CommandHelper.getLocale(interaction)
    );

    const challenge: Challenge | null =
        await DatabaseManager.aliceDb.collections.challenge.getById(
            interaction.options.getString("id", true)
        );

    if (!challenge) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("challengeNotFound")
            ),
        });
    }

    await InteractionHelper.deferReply(interaction);

    const beatmap: MapInfo<false> | null = await BeatmapManager.getBeatmap(
        challenge.beatmapid,
        { checkFile: false }
    );

    if (!beatmap) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("beatmapNotFound")
            ),
        });
    }

    const beatmapFile: string | null = await challenge.getBeatmapFile();

    if (!beatmapFile) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("beatmapDownloadFailed")
            ),
        });
    }

    const attachment: AttachmentBuilder = new AttachmentBuilder(
        Buffer.from(beatmapFile),
        { name: `${beatmap.fullTitle}.osu` }
    );

    InteractionHelper.reply(interaction, {
        files: [attachment],
    });
};

export const config: SlashSubcommand["config"] = {
    permissions: [],
};
