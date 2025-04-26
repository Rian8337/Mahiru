import { Symbols } from "@enums/utils/Symbols";
import { TriviaLocalization } from "@localization/interactions/commands/Fun/trivia/TriviaLocalization";
import {
    MapInfo,
    OsuAPIRequestBuilder,
    OsuAPIResponse,
} from "@rian8337/osu-base";
import { MapTriviaPlayer } from "@structures/trivia/MapTriviaPlayer";
import { TriviaMapCachedAnswer } from "@structures/trivia/TriviaMapCachedAnswer";
import { InteractionCollectorCreator } from "@utils/base/InteractionCollectorCreator";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { ModalCreator } from "@utils/creators/ModalCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { NumberHelper } from "@utils/helpers/NumberHelper";
import { BeatmapManager } from "@utils/managers/BeatmapManager";
import { CacheManager } from "@utils/managers/CacheManager";
import {
    ActionRow,
    ActionRowBuilder,
    APIButtonComponentWithCustomId,
    bold,
    ButtonBuilder,
    ButtonComponent,
    ButtonStyle,
    Collection,
    EmbedBuilder,
    GuildMember,
    Snowflake,
    TextInputBuilder,
    TextInputStyle,
    userMention,
} from "discord.js";
import { SlashSubcommand } from "structures/core/SlashSubcommand";

async function getBeatmaps(fetchAttempt = 0): Promise<MapInfo[]> {
    if (fetchAttempt === 5) {
        return [];
    }

    const dateBaseLimit = 1199145600000; // January 1st, 2008 0:00 UTC

    const finalDate = new Date(
        dateBaseLimit + Math.floor(Math.random() * (Date.now() - dateBaseLimit))
    );

    const apiRequestBuilder = new OsuAPIRequestBuilder()
        .setEndpoint("get_beatmaps")
        .addParameter(
            "since",
            `${finalDate.getUTCFullYear()}-${(finalDate.getUTCMonth() + 1)
                .toString()
                .padStart(2, "0")}-${finalDate
                .getUTCDate()
                .toString()
                .padStart(2, "0")}`
        )
        .addParameter("m", 0);

    const result = await apiRequestBuilder.sendRequest();

    if (result.statusCode !== 200) {
        return getBeatmaps(++fetchAttempt);
    }

    const data: OsuAPIResponse[] = JSON.parse(result.data.toString("utf-8"));

    if (data.length === 0) {
        return getBeatmaps(++fetchAttempt);
    }

    const beatmapList: MapInfo[] = [];

    data.forEach((v) => {
        const beatmapInfo = MapInfo.from(v);

        if (
            !beatmapList.find(
                (map) => map.beatmapSetId === beatmapInfo.beatmapSetId
            )
        ) {
            beatmapList.push(beatmapInfo);
        }
    });

    return beatmapList;
}

function shuffleString(
    str: string,
    amount: number
): {
    readonly splittedString: string[];
    readonly replacedStrings: {
        readonly char: string;
        readonly indexes: number[];
    }[];
} {
    const regex = /^[a-zA-Z0-9]+$/;
    const replacementStr = " `-` ";
    const splitStr = str.split("");
    const replacedStrings: { char: string; indexes: number[] }[] = [];

    while (amount--) {
        const index = Math.floor(Math.random() * str.length);
        const char = str.charAt(index).toUpperCase();

        if (!regex.test(char) || replacedStrings.find((r) => r.char === char)) {
            ++amount;
            continue;
        }

        const replacedIndexes: number[] = [];

        for (let i = 0; i < splitStr.length; ++i) {
            if (splitStr[i].toUpperCase() === char) {
                replacedIndexes.push(i);
                splitStr[i] = replacementStr;
            }
        }

        replacedStrings.push({
            char: char,
            indexes: replacedIndexes,
        });
    }

    return {
        splittedString: splitStr,
        replacedStrings: replacedStrings,
    };
}

function createEmbed(
    level: number,
    beatmapInfo: MapInfo,
    artist: string,
    title: string,
    localization: TriviaLocalization
): EmbedBuilder {
    const embed = EmbedCreator.createNormalEmbed({
        color: "#fccf03",
    });

    embed
        .setAuthor({
            name: localization.getTranslation("beatmapHint"),
        })
        .setTitle(`${localization.getTranslation("level")} ${level}`)
        .setDescription(
            `${bold(
                localization.getTranslation("beatmapArtist")
            )}: ${artist}\n${bold(
                localization.getTranslation("beatmapTitle")
            )}: ${title}${
                beatmapInfo.source
                    ? `\n${bold(
                          localization.getTranslation("beatmapSource")
                      )}: ${beatmapInfo.source}`
                    : ""
            }`
        )
        .setThumbnail(`https://b.ppy.sh/thumb/${beatmapInfo.beatmapSetId}l.jpg`)
        .setImage(
            `https://assets.ppy.sh/beatmaps/${beatmapInfo.beatmapSetId}/covers/cover.jpg`
        );

    return embed;
}

function getMatchingCharacterCount(str1: string, str2: string): number {
    let count = 0;

    for (let i = 0; i < Math.min(str1.length, str2.length); ++i) {
        if (str1.charAt(i).toLowerCase() === str2.charAt(i).toLowerCase()) {
            ++count;
        }
    }

    return count;
}

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    if (!interaction.channel?.isSendable()) {
        return;
    }

    const localization = new TriviaLocalization(
        CommandHelper.getLocale(interaction)
    );

    if (CacheManager.mapTriviaAnswers.has(interaction.channelId)) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("channelHasMapTriviaActive")
            ),
        });
    }

    let level = 1;
    const statistics = new Collection<Snowflake, MapTriviaPlayer>();
    let beatmapCache: MapInfo[] = [];
    let hasEnded = false;

    await InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("mapTriviaStarted")
        ),
    });

    const answerCollection = new Collection<Snowflake, TriviaMapCachedAnswer>();

    CacheManager.mapTriviaAnswers.set(interaction.channelId, answerCollection);

    const answersEmbed = EmbedCreator.createNormalEmbed({
        author: interaction.user,
        color: (<GuildMember | null>interaction.member)?.displayColor,
    });

    // Run game in constant loop
    while (!hasEnded) {
        let beatmapInfoIndex = beatmapCache.findIndex(
            (v) =>
                v.plays <= 10000000 - 200 * level ||
                v.favorites <= 1000000 - 20 * level
        );

        while (beatmapInfoIndex === -1) {
            beatmapCache = await getBeatmaps();

            if (beatmapCache.length === 0) {
                break;
            }

            beatmapInfoIndex = beatmapCache.findIndex(
                (v) =>
                    v.plays <= 10000000 - 100 * level ||
                    v.favorites <= 1000000 - 10 * level
            );
        }

        if (beatmapInfoIndex === -1) {
            await interaction.channel.send({
                content: MessageCreator.createReject(
                    localization.getTranslation("couldNotRetrieveBeatmaps")
                ),
            });

            break;
        }

        const beatmapInfo = beatmapCache.splice(beatmapInfoIndex, 1)[0];

        const tempArtist = beatmapInfo.artist.replace(/\W|_/g, "");
        const tempTitle = beatmapInfo.title.replace(/\W|_/g, "");

        // Shuffling empty words
        // Shuffle between 25-75% of title and artist
        const artistBlankAmount = Math.max(
            Math.ceil(tempArtist.length / 4),
            Math.floor(
                Math.min(
                    (level * tempArtist.length) / 20,
                    (tempArtist.length * 3) / 4
                )
            )
        );
        const titleBlankAmount = Math.max(
            Math.ceil(tempTitle.length / 4),
            Math.floor(
                Math.min(
                    (level * tempTitle.length) / 20,
                    (tempTitle.length * 3) / 4
                )
            )
        );

        const artistGuessData = shuffleString(
            beatmapInfo.artist,
            artistBlankAmount
        );
        const titleGuessData = shuffleString(
            beatmapInfo.title,
            titleBlankAmount
        );

        const buttons = [
            new ButtonBuilder()
                .setCustomId("answerMapTriviaArtist")
                .setStyle(ButtonStyle.Primary)
                .setLabel(localization.getTranslation("answerArtist"))
                .setEmoji(Symbols.memo),
            new ButtonBuilder()
                .setCustomId("answerMapTriviaTitle")
                .setStyle(ButtonStyle.Primary)
                .setLabel(localization.getTranslation("answerTitle"))
                .setEmoji(Symbols.memo),
        ];

        CacheManager.exemptedButtonCustomIds.add("answerMapTriviaArtist");
        CacheManager.exemptedButtonCustomIds.add("answerMapTriviaTitle");

        const component = new ActionRowBuilder<ButtonBuilder>().addComponents(
            buttons
        );

        const message = await interaction.channel.send({
            content: MessageCreator.createWarn(
                localization.getTranslation("guessBeatmap")
            ),
            embeds: [
                createEmbed(
                    level,
                    beatmapInfo,
                    artistGuessData.splittedString.join("").trim(),
                    titleGuessData.splittedString.join("").trim(),
                    localization
                ),
            ],
            components: [component],
        });

        const totalCharCountToReplace =
            artistGuessData.replacedStrings.reduce(
                (a, v) => a + v.indexes.length,
                0
            ) +
            titleGuessData.replacedStrings.reduce(
                (a, v) => a + v.indexes.length,
                0
            );
        let replacedCharCount = 0;

        let editCount = 0;
        const maxEditCount = 5;

        const revealCharInterval = setInterval(async () => {
            if (editCount === maxEditCount - 1) {
                clearInterval(revealCharInterval);
            }

            ++editCount;

            // Obtain portion of character amount to replace.
            const charCountToReplace = Math.floor(
                Math.pow(
                    (totalCharCountToReplace * editCount) /
                        (maxEditCount * 1.5),
                    0.8
                )
            );

            while (replacedCharCount < charCountToReplace) {
                let data: {
                    readonly splittedString: string[];
                    readonly replacedStrings: {
                        readonly char: string;
                        readonly indexes: number[];
                    }[];
                };

                // Determine what to randomize.
                if (
                    artistGuessData.replacedStrings.length > 1 &&
                    titleGuessData.replacedStrings.length > 1
                ) {
                    data =
                        Math.random() > 0.5 ? artistGuessData : titleGuessData;
                } else if (artistGuessData.replacedStrings.length > 1) {
                    data = artistGuessData;
                } else if (titleGuessData.replacedStrings.length > 1) {
                    data = titleGuessData;
                } else {
                    clearInterval(revealCharInterval);

                    return;
                }

                const replacedStringIndex = Math.floor(
                    Math.random() * data.replacedStrings.length
                );

                const selectedData = data.replacedStrings[replacedStringIndex];

                const charIndex = Math.floor(
                    Math.random() * selectedData.indexes.length
                );

                data.splittedString[selectedData.indexes[charIndex]] =
                    selectedData.char;

                selectedData.indexes.splice(charIndex, 1);

                if (selectedData.indexes.length === 0) {
                    data.replacedStrings.splice(replacedStringIndex, 1);
                }

                ++replacedCharCount;
            }

            await message.edit({
                embeds: [
                    createEmbed(
                        level,
                        beatmapInfo,
                        artistGuessData.splittedString.join("").trim(),
                        titleGuessData.splittedString.join("").trim(),
                        localization
                    ),
                ],
            });
        }, 45000 / maxEditCount);

        const { collector } = InteractionCollectorCreator.createButtonCollector(
            message,
            45,
            (i) =>
                buttons.some(
                    (b) =>
                        (<APIButtonComponentWithCustomId>b.data).custom_id ===
                        i.customId
                ),
            (m) => {
                const row = m.components.find(
                    (c) =>
                        (c as ActionRow<ButtonComponent>).components.length ===
                        1
                );

                if (!row) {
                    return false;
                }

                return buttons.some(
                    (b) =>
                        (row as ActionRow<ButtonComponent>).components[0]
                            .customId ===
                        (<APIButtonComponentWithCustomId>b.data).custom_id
                );
            }
        );

        await new Promise<void>((resolve) => {
            collector.on("collect", async (i) => {
                i.ephemeral = true;

                const playerLocalization = new TriviaLocalization(
                    CommandHelper.getLocale(i)
                );

                const answer = answerCollection.get(i.user.id);
                const textInputBuilders: TextInputBuilder[] = [];

                switch (i.customId) {
                    case "answerMapTriviaArtist":
                        if (
                            answer?.answer.artist.toLowerCase() !==
                            beatmapInfo.artist.toLowerCase()
                        ) {
                            textInputBuilders.push(
                                new TextInputBuilder()
                                    .setCustomId("artist")
                                    .setRequired(true)
                                    .setStyle(TextInputStyle.Short)
                                    .setLabel(
                                        playerLocalization.getTranslation(
                                            "answerModalArtistLabel"
                                        )
                                    )
                                    .setPlaceholder(
                                        playerLocalization.getTranslation(
                                            "answerModalArtistPlaceholder"
                                        )
                                    )
                            );
                        }
                        break;
                    case "answerMapTriviaTitle":
                        if (
                            answer?.answer.title.toLowerCase() !==
                            beatmapInfo.title.toLowerCase()
                        ) {
                            textInputBuilders.push(
                                new TextInputBuilder()
                                    .setCustomId("title")
                                    .setRequired(true)
                                    .setStyle(TextInputStyle.Short)
                                    .setLabel(
                                        playerLocalization.getTranslation(
                                            "answerModalTitleLabel"
                                        )
                                    )
                                    .setPlaceholder(
                                        playerLocalization.getTranslation(
                                            "answerModalTitlePlaceholder"
                                        )
                                    )
                            );
                        }
                        break;
                }

                if (textInputBuilders.length === 0) {
                    await InteractionHelper.reply(i, {
                        content: MessageCreator.createReject(
                            playerLocalization.getTranslation(
                                "answerIsAlreadyCorrect"
                            )
                        ),
                    });

                    return;
                }

                ModalCreator.createModal(
                    i,
                    "trivia-map-answer",
                    playerLocalization.getTranslation("answerModalTitle"),
                    ...textInputBuilders
                );
            });

            collector.once("end", async () => {
                const beatmapEmbed = createEmbed(
                    level,
                    beatmapInfo,
                    beatmapInfo.artist,
                    beatmapInfo.title,
                    localization
                );

                // Remove buttons from original message
                await message.edit({
                    embeds: [beatmapEmbed],
                    components: [],
                });

                beatmapEmbed
                    .setAuthor({
                        name: localization.getTranslation("beatmapInfo"),
                    })
                    .setTitle(
                        `${beatmapInfo.artist} - ${beatmapInfo.title} by ${beatmapInfo.creator}`
                    )
                    .setURL(beatmapInfo.beatmapSetLink)
                    .setDescription(
                        `${BeatmapManager.showStatistics(
                            beatmapInfo,
                            1
                        )}\n${BeatmapManager.showStatistics(
                            beatmapInfo,
                            6
                        )}\n${BeatmapManager.showStatistics(beatmapInfo, 7)}`
                    )
                    .setColor(
                        BeatmapManager.getStatusColor(beatmapInfo.approved)
                    );

                const correctAnswers = new Collection<
                    Snowflake,
                    TriviaMapCachedAnswer
                >();

                for (const [, answer] of answerCollection) {
                    const playerStats = statistics.get(answer.user.id) ?? {
                        id: answer.user.id,
                        score: 0,
                    };

                    answer.artistMatchingCharacterCount =
                        getMatchingCharacterCount(
                            answer.answer.artist,
                            beatmapInfo.artist
                        );

                    playerStats.score +=
                        level / 10 +
                        NumberHelper.round(
                            (answer.artistMatchingCharacterCount /
                                beatmapInfo.artist.length) *
                                Math.max(
                                    0,
                                    1 -
                                        (answer.artistAnswerSubmissionTime -
                                            message.createdTimestamp) /
                                            1000 /
                                            45
                                ),
                            2
                        );

                    answer.titleMatchingCharacterCount =
                        getMatchingCharacterCount(
                            answer.answer.title,
                            beatmapInfo.title
                        );

                    playerStats.score +=
                        level / 10 +
                        NumberHelper.round(
                            (answer.titleMatchingCharacterCount /
                                beatmapInfo.title.length) *
                                Math.max(
                                    0,
                                    1 -
                                        (answer.titleAnswerSubmissionTime -
                                            message.createdTimestamp) /
                                            1000 /
                                            45
                                ),
                            2
                        );

                    statistics.set(answer.user.id, playerStats);

                    if (
                        answer.artistMatchingCharacterCount > 0 ||
                        answer.titleMatchingCharacterCount > 0
                    ) {
                        correctAnswers.set(answer.user.id, answer);
                    }
                }

                if (correctAnswers.size > 0) {
                    if (answersEmbed.data.fields?.length) {
                        answersEmbed.spliceFields(
                            0,
                            answersEmbed.data.fields.length
                        );
                    }

                    answersEmbed
                        .setDescription(
                            localization.getTranslation("correctAnswerGotten")
                        )
                        .addFields(
                            {
                                name: localization.getTranslation(
                                    "answerEmbedArtistGuessTitle"
                                ),
                                value:
                                    correctAnswers
                                        .filter(
                                            (v) =>
                                                v.artistMatchingCharacterCount >
                                                0
                                        )
                                        .sort(
                                            (a, b) =>
                                                b.artistMatchingCharacterCount -
                                                a.artistMatchingCharacterCount
                                        )
                                        .map(
                                            (v) =>
                                                `${
                                                    v.user.username
                                                } - ${NumberHelper.round(
                                                    (v.artistAnswerSubmissionTime -
                                                        message.createdTimestamp) /
                                                        1000,
                                                    3
                                                )} s (${
                                                    v.artistMatchingCharacterCount
                                                }/${beatmapInfo.artist.length})`
                                        )
                                        .join("\n") ||
                                    localization.getTranslation("none"),
                            },
                            {
                                name: localization.getTranslation(
                                    "answerEmbedTitleGuessTitle"
                                ),
                                value:
                                    correctAnswers
                                        .filter(
                                            (v) =>
                                                v.titleMatchingCharacterCount >
                                                0
                                        )
                                        .sort(
                                            (a, b) =>
                                                b.titleMatchingCharacterCount -
                                                a.titleMatchingCharacterCount
                                        )
                                        .map(
                                            (v) =>
                                                `${
                                                    v.user.username
                                                } - ${NumberHelper.round(
                                                    (v.titleAnswerSubmissionTime -
                                                        message.createdTimestamp) /
                                                        1000,
                                                    3
                                                )} s (${
                                                    v.titleMatchingCharacterCount
                                                }/${beatmapInfo.title.length})`
                                        )
                                        .join("\n") ||
                                    localization.getTranslation("none"),
                            }
                        );

                    await message.reply({
                        embeds: [answersEmbed, beatmapEmbed],
                    });

                    ++level;

                    answerCollection.clear();
                } else {
                    await message.reply({
                        content: MessageCreator.createReject(
                            localization.getTranslation(
                                "correctAnswerNotGotten"
                            )
                        ),
                        embeds: [beatmapEmbed],
                    });

                    hasEnded = true;
                }

                resolve();
            });
        });
    }

    CacheManager.mapTriviaAnswers.delete(interaction.channelId);

    statistics.sort((a, b) => b.score - a.score);

    const embed = EmbedCreator.createNormalEmbed({
        color: "#037ffc",
    });

    embed
        .setTitle(localization.getTranslation("gameInfo"))
        .setDescription(
            `${bold(localization.getTranslation("starter"))}: ${
                interaction.user
            }\n` +
                `${bold(
                    localization.getTranslation("timeStarted")
                )}: ${DateTimeFormatHelper.dateToLocaleString(
                    interaction.createdAt,
                    localization.language
                )}\n` +
                `${bold(
                    localization.getTranslation("duration")
                )}: ${DateTimeFormatHelper.secondsToDHMS(
                    Math.floor(
                        (Date.now() - interaction.createdTimestamp) / 1000
                    ),
                    localization.language
                )}\n` +
                `${bold(localization.getTranslation("level"))}: ${level}`
        )
        .addFields({
            name: localization.getTranslation("leaderboard"),
            value:
                [...statistics.values()]
                    .slice(0, 10)
                    .map(
                        (v, i) =>
                            `${bold(`#${i + 1}`)}: ${userMention(
                                v.id
                            )}: ${v.score.toFixed(2)}`
                    )
                    .join("\n") || localization.getTranslation("none"),
        });

    interaction.channel.send({
        content: MessageCreator.createAccept(
            localization.getTranslation("gameEnded")
        ),
        embeds: [embed],
    });
};
