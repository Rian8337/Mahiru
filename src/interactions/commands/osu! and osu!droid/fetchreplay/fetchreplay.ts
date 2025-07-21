import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { CommandCategory } from "@enums/core/CommandCategory";
import { PPCalculationMethod } from "@enums/utils/PPCalculationMethod";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { FetchreplayLocalization } from "@localization/interactions/commands/osu! and osu!droid/fetchreplay/FetchreplayLocalization";
import { Accuracy, Modes } from "@rian8337/osu-base";
import { ExportedReplayJSONV3 } from "@rian8337/osu-droid-replay-analyzer";
import { Score } from "@rian8337/osu-droid-utilities";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { BeatmapDifficultyHelper } from "@utils/helpers/BeatmapDifficultyHelper";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { DroidHelper } from "@utils/helpers/DroidHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { LocaleHelper } from "@utils/helpers/LocaleHelper";
import { ReplayHelper } from "@utils/helpers/ReplayHelper";
import { BeatmapManager } from "@utils/managers/BeatmapManager";
import { PPProcessorRESTManager } from "@utils/managers/PPProcessorRESTManager";
import { ProfileManager } from "@utils/managers/ProfileManager";
import AdmZip from "adm-zip";
import {
    ApplicationCommandOptionType,
    AttachmentBuilder,
    ContainerBuilder,
    FileBuilder,
    heading,
    HeadingLevel,
    hideLinkEmbed,
    hyperlink,
    SeparatorBuilder,
    TextDisplayBuilder,
} from "discord.js";
import { SlashCommand } from "structures/core/SlashCommand";

export const run: SlashCommand["run"] = async (_, interaction) => {
    const localization = new FetchreplayLocalization(
        CommandHelper.getLocale(interaction)
    );

    const beatmapLink = interaction.options.getString("beatmap", true);
    const beatmapID = BeatmapManager.getBeatmapID(beatmapLink)[0];
    let uid = interaction.options.getInteger("uid");
    let hash = beatmapLink.startsWith("h:") ? beatmapLink.slice(2) : "";

    if (!beatmapID && !hash) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("beatmapNotProvided")
            ),
        });
    }

    if (!uid) {
        const bindInfo =
            await DatabaseManager.elainaDb.collections.userBind.getFromUser(
                interaction.user,
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
                    new ConstantsLocalization(
                        localization.language
                    ).getTranslation(Constants.selfNotBindedReject)
                ),
            });
        }

        uid = bindInfo.uid;
    }

    await InteractionHelper.deferReply(interaction);

    const beatmapInfo = await BeatmapManager.getBeatmap(
        hash ? hash : beatmapID,
        { checkFile: false }
    );

    if (beatmapInfo) {
        hash = beatmapInfo.hash;
    }

    const score = await DroidHelper.getScore(uid, hash, [
        "id",
        "uid",
        "hash",
        "score",
        "combo",
        "mark",
        "mods",
        "perfect",
        "good",
        "bad",
        "miss",
        "date",
    ]);

    if (!score) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation(
                    interaction.options.getInteger("uid")
                        ? "userScoreNotFound"
                        : "selfScoreNotFound"
                )
            ),
        });
    }

    const username =
        score instanceof Score
            ? score.username
            : (await DroidHelper.getPlayer(uid, ["username"]))?.username;

    if (!username) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation(
                    interaction.options.getInteger("uid")
                        ? "userScoreNotFound"
                        : "selfScoreNotFound"
                )
            ),
        });
    }

    const replay = await ReplayHelper.analyzeReplay(score);

    if (!replay.data) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("noReplayFound")
            ),
        });
    }

    const { data } = replay;

    const zip = new AdmZip();

    zip.addFile(`${score.id.toString()}.odr`, replay.originalODR!);

    const rank = score instanceof Score ? score.rank : score.mark;
    const accuracy =
        score instanceof Score
            ? score.accuracy
            : new Accuracy({
                  n300: score.perfect,
                  n100: score.good,
                  n50: score.bad,
                  nmiss: score.miss,
              });

    const json: ExportedReplayJSONV3 = {
        version: 3,
        replaydata: {
            filename: `${data.folderName}\\/${data.fileName}`,
            playername: data.isReplayV3() ? data.playerName : username,
            replayfile: `${score.id.toString()}.odr`,
            beatmapMD5: score.hash,
            mods:
                score instanceof Score
                    ? JSON.stringify(score.mods.serializeMods())
                    : score.mods,
            score: score.score,
            combo: score.combo,
            mark: rank,
            h300k: data.hit300k,
            h300: accuracy.n300,
            h100k: data.hit100k,
            h100: accuracy.n100,
            h50: accuracy.n50,
            misses: accuracy.nmiss,
            accuracy: accuracy.value(),
            time: score.date.getTime(),
        },
    };

    zip.addFile("entry.json", Buffer.from(JSON.stringify(json, null, 2)));

    const replayFilename = `replay-${score.id.toString()}.edr`;

    const replayAttachment = new AttachmentBuilder(zip.toBuffer(), {
        name: replayFilename,
    });

    if (!beatmapInfo) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createAccept(
                localization.getTranslation("fetchReplayNoBeatmapSuccessful"),
                rank,
                score.score.toLocaleString(
                    LocaleHelper.convertToBCP47(localization.language)
                ),
                score.combo.toString(),
                (accuracy.value() * 100).toFixed(2),
                accuracy.n300.toString(),
                accuracy.n100.toString(),
                accuracy.n50.toString(),
                accuracy.nmiss.toString()
            ),
            files: [replayAttachment],
        });
    }

    const droidAttribs = await PPProcessorRESTManager.getOnlineScoreAttributes(
        score.uid,
        score.hash,
        Modes.droid,
        PPCalculationMethod.live,
        false,
        true
    );

    if (!droidAttribs) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createAccept(
                localization.getTranslation("fetchReplayNoBeatmapSuccessful"),
                rank,
                score.score.toLocaleString(
                    LocaleHelper.convertToBCP47(localization.language)
                ),
                score.combo.toString(),
                (accuracy.value() * 100).toFixed(2),
                accuracy.n300.toString(),
                accuracy.n100.toString(),
                accuracy.n50.toString(),
                accuracy.nmiss.toString()
            ),
            files: [replayAttachment],
        });
    }

    const osuAttribs = await PPProcessorRESTManager.getOnlineScoreAttributes(
        score.uid,
        score.hash,
        Modes.osu,
        PPCalculationMethod.live
    );

    if (!osuAttribs) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createAccept(
                localization.getTranslation("fetchReplayNoBeatmapSuccessful"),
                rank,
                score.score.toLocaleString(
                    LocaleHelper.convertToBCP47(localization.language)
                ),
                score.combo.toString(),
                (accuracy.value() * 100).toFixed(2),
                accuracy.n300.toString(),
                accuracy.n100.toString(),
                accuracy.n50.toString(),
                accuracy.nmiss.toString()
            ),
            files: [replayAttachment],
        });
    }

    const options = EmbedCreator.createCalculationEmbed(
        beatmapInfo,
        BeatmapDifficultyHelper.getCalculationParamsFromScore(score),
        droidAttribs.attributes.difficulty,
        osuAttribs.attributes.difficulty,
        droidAttribs.attributes.performance,
        osuAttribs.attributes.performance,
        localization.language,
        Buffer.from(droidAttribs.strainChart)
    );

    options.components = [
        new TextDisplayBuilder().setContent(
            MessageCreator.createAccept(
                localization.getTranslation("playInfo"),
                hyperlink(
                    username,
                    hideLinkEmbed(ProfileManager.getProfileLink(uid))
                ) + ":"
            )
        ),
        ...options.components!,
    ];

    const containerBuilder = options.components[
        options.components.length - 1
    ] as ContainerBuilder;

    const hitErrorInformation = droidAttribs.attributes.replay?.hitError;

    if (hitErrorInformation) {
        containerBuilder
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    heading(
                        localization.getTranslation("hitErrorInfo"),
                        HeadingLevel.Three
                    ) +
                        "\n" +
                        `${hitErrorInformation.negativeAvg.toFixed(
                            2
                        )}ms - ${hitErrorInformation.positiveAvg.toFixed(
                            2
                        )}ms ${localization.getTranslation(
                            "hitErrorAvg"
                        )} | ${hitErrorInformation.unstableRate.toFixed(2)} UR`
                )
            );
    }

    containerBuilder.addFileComponents(
        new FileBuilder().setURL(`attachment://${replayFilename}`)
    );

    options.files ??= [];
    options.files = options.files.concat(replayAttachment);

    await InteractionHelper.reply(interaction, options, true);
};

export const category: SlashCommand["category"] = CommandCategory.osu;

export const config: SlashCommand["config"] = {
    name: "fetchreplay",
    description: "Fetches replay from a player in a beatmap.",
    options: [
        {
            name: "beatmap",
            required: true,
            type: ApplicationCommandOptionType.String,
            description: "The beatmap ID or link.",
        },
        {
            name: "uid",
            type: ApplicationCommandOptionType.Integer,
            description:
                "The uid of the player. Defaults to your current bound uid.",
            minValue: Constants.uidMinLimit,
        },
    ],
    example: [
        {
            command: "fetchreplay",
            arguments: [
                {
                    name: "beatmap",
                    value: 1884658,
                },
            ],
            description:
                "will fetch the replay from the uid you're currently bound on in the beatmap with ID 1884658.",
        },
        {
            command: "fetchreplay",
            arguments: [
                {
                    name: "beatmap",
                    value: "https://osu.ppy.sh/beatmapsets/902745#osu/1884658",
                },
            ],
            description:
                "will fetch the replay from the uid you're currently bound on in the linked beatmap.",
        },
        {
            command: "fetchreplay",
            arguments: [
                {
                    name: "beatmap",
                    value: 1884658,
                },
                {
                    name: "uid",
                    value: 51076,
                },
            ],
            description:
                "will fetch the replay from the player with uid 51076 in the beatmap with ID 1884658.",
        },
        {
            command: "fetchreplay 5455",
            arguments: [
                {
                    name: "beatmap",
                    value: "https://osu.ppy.sh/b/1884658",
                },
                {
                    name: "uid",
                    value: 5455,
                },
            ],
            description:
                "will fetch the replay from the player with uid 5455 in the linked beatmap.",
        },
    ],
    cooldown: 30,
};
