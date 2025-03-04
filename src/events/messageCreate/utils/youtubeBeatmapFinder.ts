import { Message, EmbedBuilder, bold, underscore } from "discord.js";
import { EventUtil } from "structures/core/EventUtil";
import { BeatmapManager } from "@utils/managers/BeatmapManager";
import { Symbols } from "@enums/utils/Symbols";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { BeatmapDifficultyHelper } from "@utils/helpers/BeatmapDifficultyHelper";
import { YouTubeRESTManager } from "@utils/managers/YouTubeRESTManager";
import { Modes } from "@rian8337/osu-base";
import { YoutubeBeatmapFinderLocalization } from "@localization/events/messageCreate/youtubeBeatmapFinder/YoutubeBeatmapFinderLocalization";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { PPProcessorRESTManager } from "@utils/managers/PPProcessorRESTManager";
import { PPCalculationMethod } from "@enums/utils/PPCalculationMethod";

export const run: EventUtil["run"] = async (_, message: Message) => {
    if (message.author.bot || !message.channel.isSendable()) {
        return;
    }

    const localization = new YoutubeBeatmapFinderLocalization(
        message.channel.isDMBased()
            ? CommandHelper.getLocale(message.author)
            : CommandHelper.getLocale(message.channelId, message.guildId!),
    );

    const ytRegex =
        /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]+).*/;

    const calcParams = BeatmapDifficultyHelper.getCalculationParamsFromMessage(
        message.content,
    );

    for (const arg of message.content.split(/\s+/g)) {
        const match = arg.match(ytRegex);

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
                    beatmapInfo.hash,
                );

                const embedOptions = EmbedCreator.createBeatmapEmbed(
                    beatmapInfo,
                    calcParams,
                    localization.language,
                );

                const embed = <EmbedBuilder>embedOptions.embeds![0];

                embed.spliceFields(0, embed.data.fields!.length);

                message.reply(embedOptions);
            } else if (beatmapsetID) {
                // Retrieve beatmap file one by one to not overcreate requests
                const beatmapInformations = await BeatmapManager.getBeatmaps(
                    beatmapsetID,
                    false,
                );

                if (beatmapInformations.length === 0) {
                    return;
                }

                beatmapInformations.sort(
                    (a, b) =>
                        (b.totalDifficulty ?? 0) - (a.totalDifficulty ?? 0),
                );

                let string = "";

                if (beatmapInformations.length > 3) {
                    string = MessageCreator.createAccept(
                        localization.getTranslation("beatmapLimitation"),
                        beatmapInformations.length.toString(),
                    );
                }

                const firstBeatmap = beatmapInformations[0];

                const embedOptions = EmbedCreator.createBeatmapEmbed(
                    firstBeatmap,
                    undefined,
                    localization.language,
                );

                if (string) {
                    embedOptions.content = string;
                }

                // Empty files, we don't need it here.
                embedOptions.files = [];

                const embed = <EmbedBuilder>embedOptions.embeds![0];

                embed
                    .spliceFields(0, embed.data.fields!.length)
                    .setTitle(
                        `${firstBeatmap.artist} - ${firstBeatmap.title} by ${firstBeatmap.creator}`,
                    )
                    .setColor(
                        BeatmapManager.getStatusColor(firstBeatmap.approved),
                    )
                    .setAuthor({ name: "Beatmap Information" })
                    .setURL(firstBeatmap.beatmapSetLink)
                    .setDescription(
                        `${BeatmapManager.showStatistics(firstBeatmap, 1)}\n` +
                            `${bold("BPM")}: ${BeatmapManager.convertBPM(
                                firstBeatmap.bpm,
                            )} - ${bold(
                                "Length",
                            )}: ${BeatmapManager.convertTime(
                                firstBeatmap.hitLength,
                                firstBeatmap.totalLength,
                            )}`,
                    );

                for (const beatmapInfo of beatmapInformations) {
                    if (embed.data.fields!.length === 3) {
                        break;
                    }

                    const droidAttribs =
                        await PPProcessorRESTManager.getDifficultyAttributes(
                            beatmapInfo.beatmapId,
                            Modes.droid,
                            PPCalculationMethod.live,
                        );

                    if (!droidAttribs) {
                        continue;
                    }

                    const osuAttribs =
                        await PPProcessorRESTManager.getDifficultyAttributes(
                            beatmapInfo.beatmapId,
                            Modes.osu,
                            PPCalculationMethod.live,
                        );

                    if (!osuAttribs) {
                        continue;
                    }

                    embed.addFields({
                        name: `${underscore(
                            beatmapInfo.version,
                        )} (${droidAttribs.attributes.starRating.toFixed(2)} ${
                            Symbols.star
                        } | ${osuAttribs.attributes.starRating.toFixed(2)} ${
                            Symbols.star
                        })`,
                        value:
                            `${BeatmapManager.showStatistics(
                                beatmapInfo,
                                2,
                            )}\n` +
                            `${BeatmapManager.showStatistics(
                                beatmapInfo,
                                3,
                            )}\n` +
                            `${BeatmapManager.showStatistics(
                                beatmapInfo,
                                4,
                            )}\n` +
                            `${bold(
                                droidAttribs.attributes.starRating.toFixed(2),
                            )}dpp - ${osuAttribs.attributes.starRating.toFixed(2)}pp`,
                    });
                }

                message.reply(embedOptions);
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
