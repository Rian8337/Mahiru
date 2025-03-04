import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { MapShare } from "@database/utils/aliceDb/MapShare";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { OperationResult } from "structures/core/OperationResult";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { BeatmapManager } from "@utils/managers/BeatmapManager";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { MapshareLocalization } from "@localization/interactions/commands/osu! and osu!droid/mapshare/MapshareLocalization";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization: MapshareLocalization = new MapshareLocalization(
        CommandHelper.getLocale(interaction),
    );

    if (interaction.channelId !== Constants.mapShareChannel) {
        interaction.ephemeral = true;

        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                new ConstantsLocalization(localization.language).getTranslation(
                    Constants.notAvailableInChannelReject,
                ),
            ),
        });
    }

    const beatmapId: number = BeatmapManager.getBeatmapID(
        interaction.options.getString("beatmap", true),
    )[0];

    if (!beatmapId) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("noBeatmapFound"),
            ),
        });
    }

    const submission: MapShare | null =
        await DatabaseManager.aliceDb.collections.mapShare.getByBeatmapId(
            beatmapId,
        );

    if (!submission) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("noSubmissionWithBeatmap"),
            ),
        });
    }

    if (submission.status !== "pending") {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("submissionIsNotPending"),
            ),
        });
    }

    const result: OperationResult = await submission.accept();

    if (!result.success) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("acceptFailed"),
                result.reason!,
            ),
        });
    }

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("acceptSuccess"),
        ),
    });
};

export const config: SlashSubcommand["config"] = {
    permissions: ["Special"],
};
