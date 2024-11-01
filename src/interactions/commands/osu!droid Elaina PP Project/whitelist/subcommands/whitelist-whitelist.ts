import { Constants } from "@core/Constants";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { OperationResult } from "structures/core/OperationResult";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { BeatmapManager } from "@utils/managers/BeatmapManager";
import { WhitelistManager } from "@utils/managers/WhitelistManager";
import {
    EmbedBuilder,
    GuildMember,
    BaseMessageOptions,
    bold,
} from "discord.js";
import { MapInfo } from "@rian8337/osu-base";
import { WhitelistLocalization } from "@localization/interactions/commands/osu!droid Elaina PP Project/whitelist/WhitelistLocalization";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization: WhitelistLocalization = new WhitelistLocalization(
        CommandHelper.getLocale(interaction),
    );

    if (
        !CommandHelper.isExecutedByBotOwner(interaction) &&
        !(<GuildMember>interaction.member).roles.cache.has(
            WhitelistManager.whitelistRole,
        )
    ) {
        interaction.ephemeral = true;

        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                new ConstantsLocalization(localization.language).getTranslation(
                    Constants.noPermissionReject,
                ),
            ),
        });
    }

    const beatmapLink: string = interaction.options.getString("beatmap", true);

    if (!beatmapLink) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("noBeatmapProvided"),
            ),
        });
    }

    const beatmapID: number = BeatmapManager.getBeatmapID(beatmapLink)[0];
    let beatmapsetID: number = BeatmapManager.getBeatmapsetID(beatmapLink)[0];

    if (!beatmapID && !beatmapsetID) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("noBeatmapIDorSetIDFound"),
            ),
        });
    }

    // It is possible for the user to use beatmap ID and it gets interpreted as beatmapset ID
    // This check will cover that use case
    if (beatmapID === beatmapsetID) {
        // Prioritize beatmap ID over beatmapset ID like command usage example
        beatmapsetID = 0;
    }

    // Collect beatmaps first
    await InteractionHelper.deferReply(interaction);

    const beatmaps: MapInfo[] = [];

    if (beatmapsetID) {
        beatmaps.push(
            ...(await BeatmapManager.getBeatmaps(beatmapsetID, false)),
        );
    } else {
        const beatmapInfo: MapInfo<false> | null =
            await BeatmapManager.getBeatmap(beatmapID, { checkFile: false });

        if (beatmapInfo) {
            beatmaps.push(beatmapInfo);
        }
    }

    if (beatmaps.length === 0) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("noBeatmapsFound"),
            ),
        });
    }

    const embedOptions: BaseMessageOptions = EmbedCreator.createBeatmapEmbed(
        beatmaps[0],
        undefined,
        localization.language,
    );

    const embed: EmbedBuilder = EmbedBuilder.from(embedOptions.embeds![0]);

    embed.spliceFields(0, embed.data.fields!.length).addFields({
        name: BeatmapManager.showStatistics(beatmaps[0], 6),
        value: `${localization.getTranslation("starRating")}:\n${beatmaps
            .map(
                (v) =>
                    `- [${v.version}](${v.beatmapLink}) - ${bold(
                        v.totalDifficulty !== null
                            ? v.totalDifficulty.toFixed(2)
                            : "Unknown",
                    )}`,
            )
            .join("\n")}`,
    });

    const whitelistResponseStrings: string[] = [];

    for (const beatmap of beatmaps) {
        const whitelistResult: OperationResult =
            await WhitelistManager.whitelist(beatmap, localization.language);

        if (!whitelistResult.success) {
            whitelistResponseStrings.push(
                MessageCreator.createReject(
                    localization.getTranslation("whitelistFailed"),
                    beatmap.fullTitle,
                    whitelistResult.reason!,
                ),
            );
            continue;
        }

        whitelistResponseStrings.push(
            MessageCreator.createAccept(
                localization.getTranslation("whitelistSuccess"),
                beatmap.fullTitle,
            ),
        );
    }

    InteractionHelper.reply(interaction, {
        content: whitelistResponseStrings.join("\n"),
        ...embedOptions,
    });
};

export const config: SlashSubcommand["config"] = {
    permissions: ["Special"],
};
