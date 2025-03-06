import { Config } from "@core/Config";
import { Symbols } from "@enums/utils/Symbols";
import { EventUtil } from "structures/core/EventUtil";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { BeatmapDifficultyHelper } from "@utils/helpers/BeatmapDifficultyHelper";
import { StringHelper } from "@utils/helpers/StringHelper";
import { BeatmapManager } from "@utils/managers/BeatmapManager";
import { Message, EmbedBuilder, bold, underline } from "discord.js";
import { MapInfo, Modes, ModUtil } from "@rian8337/osu-base";
import { UserBeatmapCalculationLocalization } from "@localization/events/messageCreate/userBeatmapCalculation/UserBeatmapCalculationLocalization";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { PPProcessorRESTManager } from "@utils/managers/PPProcessorRESTManager";
import { PPCalculationMethod } from "@enums/utils/PPCalculationMethod";
import { PPHelper } from "@utils/helpers/PPHelper";

export const run: EventUtil["run"] = async (_, message: Message) => {
    if (
        Config.maintenance ||
        message.author.bot ||
        !message.channel.isSendable()
    ) {
        return;
    }

    const localization = new UserBeatmapCalculationLocalization(
        message.channel.isDMBased()
            ? CommandHelper.getLocale(message.author)
            : CommandHelper.getLocale(message.channelId, message.guildId!)
    );

    const calcParams = BeatmapDifficultyHelper.getCalculationParamsFromMessage(
        message.content
    );

    for (const arg of message.content.split(/\s+/g)) {
        if (
            (!arg.startsWith("https://osu.ppy.sh/") &&
                !arg.startsWith("https://dev.ppy.sh/")) ||
            !StringHelper.isValidURL(arg)
        ) {
            continue;
        }

        const beatmapId = BeatmapManager.getBeatmapID(arg)[0];
        const beatmapsetId = BeatmapManager.getBeatmapsetID(arg)[0];

        // Prioritize beatmap ID over beatmapset ID
        if (beatmapId) {
            const beatmapInfo: MapInfo | null = await BeatmapManager.getBeatmap(
                beatmapId,
                { checkFile: false }
            );

            if (!beatmapInfo) {
                continue;
            }

            calcParams.recalculateAccuracy(beatmapInfo.objects);

            // Beatmap cache
            BeatmapManager.setChannelLatestBeatmap(
                message.channel.id,
                beatmapInfo.hash
            );

            const droidAttribs =
                await PPProcessorRESTManager.getPerformanceAttributes(
                    beatmapId,
                    Modes.droid,
                    PPCalculationMethod.live,
                    calcParams,
                    true
                );

            if (!droidAttribs) {
                continue;
            }

            const osuAttribs =
                await PPProcessorRESTManager.getPerformanceAttributes(
                    beatmapId,
                    Modes.osu,
                    PPCalculationMethod.live,
                    calcParams
                );

            if (!osuAttribs) {
                continue;
            }

            const calcEmbedOptions = EmbedCreator.createCalculationEmbed(
                beatmapInfo,
                calcParams,
                droidAttribs.attributes.difficulty,
                osuAttribs.attributes.difficulty,
                droidAttribs.attributes.performance,
                osuAttribs.attributes.performance,
                localization.language,
                Buffer.from(droidAttribs.strainChart)
            );

            calcEmbedOptions.allowedMentions = { repliedUser: false };

            let string = "";

            if (message.content.includes("-d")) {
                string += `${localization.getTranslation(
                    "droidStars"
                )}: ${PPHelper.getDroidDifficultyAttributesInfo(
                    droidAttribs.attributes.difficulty
                )}\n${localization.getTranslation(
                    "droidPP"
                )}: ${PPHelper.getDroidPerformanceAttributesInfo(
                    droidAttribs.attributes.performance
                )}\n`;
            }

            if (message.content.includes("-p")) {
                string += `${localization.getTranslation(
                    "pcStars"
                )}: ${PPHelper.getOsuDifficultyAttributesInfo(
                    osuAttribs.attributes.difficulty
                )}\n${localization.getTranslation(
                    "pcPP"
                )}: ${PPHelper.getOsuPerformanceAttributesInfo(
                    osuAttribs.attributes.performance
                )}`;
            }

            if (string) {
                calcEmbedOptions.content = string;
            }

            message.reply(calcEmbedOptions);
        } else if (beatmapsetId) {
            // Retrieve beatmap file one by one to not overcreate requests
            const beatmapInformations = await BeatmapManager.getBeatmaps(
                beatmapsetId,
                false
            );

            if (beatmapInformations.length === 0) {
                return;
            }

            beatmapInformations.sort(
                (a, b) => (b.totalDifficulty ?? 0) - (a.totalDifficulty ?? 0)
            );

            let string = "";

            if (beatmapInformations.length > 3) {
                string = MessageCreator.createAccept(
                    localization.getTranslation("beatmapLimitation"),
                    beatmapInformations.length.toString()
                );
            }

            const firstBeatmap = beatmapInformations[0];

            const embedOptions = EmbedCreator.createBeatmapEmbed(
                firstBeatmap,
                undefined,
                localization.language
            );

            if (string) {
                embedOptions.content = string;
            }

            embedOptions.allowedMentions = { repliedUser: false };

            // Empty files first, we will reenter all attachments later
            embedOptions.files = [];

            const embed = EmbedBuilder.from(embedOptions.embeds![0]);
            const { customSpeedMultiplier } = calcParams;
            const mods =
                calcParams.toDifficultyCalculationOptions().mods ??
                calcParams.mods;

            const speedMultiplier =
                ModUtil.calculateRateWithMods(mods) * customSpeedMultiplier;

            embed
                .spliceFields(0, embed.data.fields!.length)
                .setTitle(
                    `${firstBeatmap.artist} - ${firstBeatmap.title} by ${firstBeatmap.creator}`
                )
                .setColor(BeatmapManager.getStatusColor(firstBeatmap.approved))
                .setAuthor({ name: "Beatmap Information" })
                .setURL(firstBeatmap.beatmapSetLink)
                .setDescription(
                    `${BeatmapManager.showStatistics(
                        firstBeatmap,
                        1,
                        mods,
                        customSpeedMultiplier
                    )}\n` +
                        `${bold("BPM")}: ${BeatmapManager.convertBPM(
                            firstBeatmap.bpm,
                            speedMultiplier
                        )} - ${bold("Length")}: ${BeatmapManager.convertTime(
                            firstBeatmap.hitLength,
                            firstBeatmap.totalLength,
                            speedMultiplier
                        )}`
                );

            for (const beatmapInfo of beatmapInformations) {
                if (embed.data.fields!.length === 3) {
                    break;
                }

                const droidDiffAttribs =
                    await PPProcessorRESTManager.getDifficultyAttributes(
                        beatmapInfo.hash,
                        Modes.droid,
                        PPCalculationMethod.live,
                        calcParams
                    );

                const osuDiffAttribs =
                    await PPProcessorRESTManager.getDifficultyAttributes(
                        beatmapInfo.hash,
                        Modes.osu,
                        PPCalculationMethod.live,
                        calcParams
                    );

                if (!droidDiffAttribs || !osuDiffAttribs) {
                    continue;
                }

                embed.addFields({
                    name: `${underline(
                        beatmapInfo.version
                    )} (${droidDiffAttribs.attributes.starRating.toFixed(2)} ${
                        Symbols.star
                    } | ${osuDiffAttribs.attributes.starRating.toFixed(2)} ${
                        Symbols.star
                    })`,
                    value:
                        `${BeatmapManager.showStatistics(
                            beatmapInfo,
                            2,
                            mods,
                            customSpeedMultiplier
                        )}\n` +
                        `${BeatmapManager.showStatistics(
                            beatmapInfo,
                            3,
                            mods,
                            customSpeedMultiplier
                        )}\n` +
                        `${BeatmapManager.showStatistics(
                            beatmapInfo,
                            4,
                            mods,
                            customSpeedMultiplier
                        )}\n` +
                        `${bold(
                            droidDiffAttribs.attributes.starRating.toFixed(2)
                        )}dpp - ${osuDiffAttribs.attributes.starRating.toFixed(2)}pp`,
                });
            }

            message.reply(embedOptions);
        }
    }
};

export const config: EventUtil["config"] = {
    description: "Responsible for calculating beatmaps that are sent by users.",
    togglePermissions: ["ManageChannels"],
    toggleScope: ["GLOBAL", "GUILD", "CHANNEL"],
};
