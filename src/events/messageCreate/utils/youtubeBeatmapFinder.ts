import { PPCalculationMethod } from "@enums/utils/PPCalculationMethod";
import { YoutubeBeatmapFinderLocalization } from "@localization/events/messageCreate/youtubeBeatmapFinder/YoutubeBeatmapFinderLocalization";
import { Modes } from "@rian8337/osu-base";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { BeatmapDifficultyHelper } from "@utils/helpers/BeatmapDifficultyHelper";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { BeatmapManager } from "@utils/managers/BeatmapManager";
import { PPProcessorRESTManager } from "@utils/managers/PPProcessorRESTManager";
import { YouTubeRESTManager } from "@utils/managers/YouTubeRESTManager";
import {
    bold,
    ContainerBuilder,
    heading,
    HeadingLevel,
    hyperlink,
    Message,
    MessageFlags,
    SeparatorBuilder,
    TextDisplayBuilder,
    underline,
} from "discord.js";
import { EventUtil } from "structures/core/EventUtil";

export const run: EventUtil["run"] = async (_, message: Message) => {
    if (message.author.bot || !message.channel.isSendable()) {
        return;
    }

    const localization = new YoutubeBeatmapFinderLocalization(
        message.channel.isDMBased()
            ? CommandHelper.getLocale(message.author)
            : CommandHelper.getLocale(message.channelId, message.guildId!)
    );

    const ytRegex =
        /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]+).*/;

    const calcParams = BeatmapDifficultyHelper.getCalculationParamsFromMessage(
        message.content
    );

    for (const arg of message.content.split(/\s+/g)) {
        const match = ytRegex.exec(arg);

        if (!match) {
            continue;
        }

        const videoId = match[1];

        if (!videoId) {
            continue;
        }

        const data = await YouTubeRESTManager.getInformation(videoId);

        if (!data) {
            continue;
        }

        const { description } = data.snippet;

        // Limit to 3 beatmaps to prevent spam
        let validCount = 0;

        for (const link of description.split(/\s+/g)) {
            if (!link.startsWith("https://osu.ppy.sh/")) {
                continue;
            }

            if (validCount === 3) {
                break;
            }

            const beatmapID = BeatmapManager.getBeatmapID(link)[0];
            const beatmapsetID = BeatmapManager.getBeatmapsetID(link)[0];

            // Prioritize beatmap ID over beatmapset ID
            if (beatmapID) {
                const beatmapInfo = await BeatmapManager.getBeatmap(beatmapID, {
                    checkFile: false,
                });

                if (!beatmapInfo) {
                    continue;
                }

                // Beatmap cache
                BeatmapManager.setChannelLatestBeatmap(
                    message.channel.id,
                    beatmapInfo.hash
                );

                const options = EmbedCreator.createBeatmapEmbed(
                    beatmapInfo,
                    calcParams,
                    localization.language
                );

                options.allowedMentions = { repliedUser: false };

                const containerBuilder = options
                    .components![0] as ContainerBuilder;

                containerBuilder.spliceComponents(
                    1,
                    containerBuilder.components.length
                );

                await message.reply({
                    ...options,
                    flags: MessageFlags.IsComponentsV2,
                    allowedMentions: { repliedUser: false },
                });
            } else if (beatmapsetID) {
                // Retrieve beatmap file one by one to not overcreate requests
                const beatmapInformations = await BeatmapManager.getBeatmaps(
                    beatmapsetID,
                    false
                );

                if (beatmapInformations.length === 0) {
                    return;
                }

                beatmapInformations.sort(
                    (a, b) =>
                        (b.totalDifficulty ?? 0) - (a.totalDifficulty ?? 0)
                );

                let string = "";

                if (beatmapInformations.length > 3) {
                    string = MessageCreator.createAccept(
                        localization.getTranslation("beatmapLimitation"),
                        beatmapInformations.length.toString()
                    );
                }

                const firstBeatmap = beatmapInformations[0];

                const options = EmbedCreator.createBeatmapEmbed(
                    firstBeatmap,
                    undefined,
                    localization.language
                );

                const containerBuilder = options
                    .components![0] as ContainerBuilder;

                if (string) {
                    options.components = [
                        new TextDisplayBuilder().setContent(string),
                        ...options.components!,
                    ];
                }

                options.allowedMentions = { repliedUser: false };

                // Empty files, we don't need it here.
                options.files = [];

                containerBuilder
                    .spliceComponents(0, containerBuilder.components.length)
                    .setAccentColor(
                        BeatmapManager.getStatusColor(firstBeatmap.approved)
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            heading(
                                hyperlink(
                                    `${firstBeatmap.artist} - ${firstBeatmap.title} by ${firstBeatmap.creator}`,
                                    firstBeatmap.beatmapSetLink
                                ),
                                HeadingLevel.Two
                            )
                        )
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `${BeatmapManager.showStatistics(firstBeatmap, 1)}\n` +
                                `${bold("BPM")}: ${BeatmapManager.convertBPM(
                                    firstBeatmap.bpm
                                ).toString()} - ${bold(
                                    "Length"
                                )}: ${BeatmapManager.convertTime(
                                    firstBeatmap.hitLength,
                                    firstBeatmap.totalLength
                                )}`
                        )
                    );

                for (
                    let i = 0;
                    i < Math.min(3, beatmapInformations.length);
                    i++
                ) {
                    const beatmapInfo = beatmapInformations[i];

                    const droidAttribs =
                        await PPProcessorRESTManager.getDifficultyAttributes(
                            beatmapInfo.beatmapId,
                            Modes.droid,
                            PPCalculationMethod.live
                        );

                    if (!droidAttribs) {
                        continue;
                    }

                    const osuAttribs =
                        await PPProcessorRESTManager.getDifficultyAttributes(
                            beatmapInfo.beatmapId,
                            Modes.osu,
                            PPCalculationMethod.live
                        );

                    if (!osuAttribs) {
                        continue;
                    }

                    containerBuilder
                        .addSeparatorComponents(new SeparatorBuilder())
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                heading(
                                    underline(beatmapInfo.version),
                                    HeadingLevel.Three
                                )
                            ),
                            new TextDisplayBuilder().setContent(
                                `${BeatmapManager.showStatistics(
                                    beatmapInfo,
                                    2
                                )}\n` +
                                    `${BeatmapManager.showStatistics(
                                        beatmapInfo,
                                        3
                                    )}\n` +
                                    `${BeatmapManager.showStatistics(
                                        beatmapInfo,
                                        4
                                    )}\n` +
                                    `${bold(
                                        droidAttribs.attributes.starRating.toFixed(
                                            2
                                        )
                                    )}dpp - ${osuAttribs.attributes.starRating.toFixed(2)}pp`
                            )
                        );
                }

                await message.reply({
                    ...options,
                    flags: MessageFlags.IsComponentsV2,
                    allowedMentions: { repliedUser: false },
                });
            }

            ++validCount;
        }
    }
};

export const config: EventUtil["config"] = {
    description:
        "Responsible for loading beatmaps that is linked from YouTube.",
    togglePermissions: ["ManageChannels"],
    toggleScope: ["GLOBAL", "GUILD", "CHANNEL"],
};
