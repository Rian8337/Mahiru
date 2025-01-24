import { ApplicationCommandOptionType } from "discord.js";
import { CommandCategory } from "@enums/core/CommandCategory";
import { SlashCommand } from "structures/core/SlashCommand";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { BeatmapManager } from "@utils/managers/BeatmapManager";
import { NumberHelper } from "@utils/helpers/NumberHelper";
import { PerformanceCalculationParameters } from "@utils/pp/PerformanceCalculationParameters";
import {
    Accuracy,
    MapInfo,
    Modes,
    MathUtils,
    ModUtil,
} from "@rian8337/osu-base";
import {
    DroidDifficultyAttributes,
    OsuDifficultyAttributes,
} from "@rian8337/osu-difficulty-calculator";
import {
    DroidDifficultyAttributes as RebalanceDroidDifficultyAttributes,
    OsuDifficultyAttributes as RebalanceOsuDifficultyAttributes,
} from "@rian8337/osu-rebalance-difficulty-calculator";
import { CalculateLocalization } from "@localization/interactions/commands/osu! and osu!droid/calculate/CalculateLocalization";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { PPCalculationMethod } from "@enums/utils/PPCalculationMethod";
import { CompleteCalculationAttributes } from "@structures/difficultyattributes/CompleteCalculationAttributes";
import { DroidPerformanceAttributes } from "@structures/difficultyattributes/DroidPerformanceAttributes";
import { OsuPerformanceAttributes } from "@structures/difficultyattributes/OsuPerformanceAttributes";
import { PPProcessorRESTManager } from "@utils/managers/PPProcessorRESTManager";
import { PPHelper } from "@utils/helpers/PPHelper";
import { RebalanceDroidPerformanceAttributes } from "@structures/difficultyattributes/RebalanceDroidPerformanceAttributes";
import { ResponseDifficultyAttributes } from "@structures/difficultyattributes/ResponseDifficultyAttributes";
import { PPProcessorCalculationResponse } from "@structures/utils/PPProcessorCalculationResponse";

export const run: SlashCommand["run"] = async (_, interaction) => {
    const localization = new CalculateLocalization(
        CommandHelper.getLocale(interaction),
    );

    const beatmapID = BeatmapManager.getBeatmapID(
        interaction.options.getString("beatmap") ?? "",
    )[0];

    const hash = BeatmapManager.getChannelLatestBeatmap(interaction.channelId);

    if (!beatmapID && !hash) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("noBeatmapProvided"),
            ),
        });
    }

    if (
        beatmapID &&
        (isNaN(beatmapID) || !NumberHelper.isPositive(beatmapID))
    ) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("beatmapProvidedIsInvalid"),
            ),
        });
    }

    await InteractionHelper.deferReply(interaction);

    const beatmap: MapInfo | null = await BeatmapManager.getBeatmap(
        beatmapID ?? hash,
        { checkFile: false },
    );

    if (!beatmap) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("beatmapNotFound"),
            ),
        });
    }

    // Get calculation parameters
    const calcParams = new PerformanceCalculationParameters({
        mods: ModUtil.pcStringToMods(
            interaction.options.getString("mods") ?? "",
        ),
        accuracy: new Accuracy({
            n100: Math.max(0, interaction.options.getInteger("x100") ?? 0),
            n50: Math.max(0, interaction.options.getInteger("x50") ?? 0),
            nmiss: Math.max(0, interaction.options.getInteger("misses") ?? 0),
            nobjects: beatmap.objects,
        }),
        inputAccuracy: interaction.options.getNumber("accuracy") ?? 100,
        combo:
            interaction.options.getInteger("combo") && beatmap.maxCombo !== null
                ? MathUtils.clamp(
                      0,
                      interaction.options.getInteger("combo", true),
                      beatmap.maxCombo,
                  )
                : (beatmap.maxCombo ?? undefined),
        forceCS: interaction.options.getNumber("circlesize") ?? undefined,
        forceAR: interaction.options.getNumber("approachrate") ?? undefined,
        forceOD:
            interaction.options.getNumber("overalldifficulty") ?? undefined,
        customSpeedMultiplier:
            interaction.options.getNumber("speedmultiplier") ?? 1,
    });

    calcParams.recalculateAccuracy(beatmap.objects);

    let droidCalcResult: PPProcessorCalculationResponse<
        CompleteCalculationAttributes<
            DroidDifficultyAttributes | RebalanceDroidDifficultyAttributes,
            DroidPerformanceAttributes | RebalanceDroidPerformanceAttributes
        >,
        true
    > | null;

    let osuCalcResult: CompleteCalculationAttributes<
        OsuDifficultyAttributes | RebalanceOsuDifficultyAttributes,
        OsuPerformanceAttributes
    > | null = null;

    switch (interaction.options.getInteger("calculationmethod")) {
        case PPCalculationMethod.rebalance:
            droidCalcResult =
                await PPProcessorRESTManager.getPerformanceAttributes(
                    beatmap.beatmapId,
                    Modes.droid,
                    PPCalculationMethod.rebalance,
                    calcParams,
                    true,
                );

            if (droidCalcResult) {
                osuCalcResult =
                    (
                        await PPProcessorRESTManager.getPerformanceAttributes(
                            beatmap.beatmapId,
                            Modes.osu,
                            PPCalculationMethod.rebalance,
                            calcParams,
                        )
                    )?.attributes ?? null;
            }
            break;
        default:
            droidCalcResult =
                await PPProcessorRESTManager.getPerformanceAttributes(
                    beatmap.beatmapId,
                    Modes.droid,
                    PPCalculationMethod.live,
                    calcParams,
                    true,
                );

            if (droidCalcResult) {
                osuCalcResult =
                    (
                        await PPProcessorRESTManager.getPerformanceAttributes(
                            beatmap.beatmapId,
                            Modes.osu,
                            PPCalculationMethod.live,
                            calcParams,
                        )
                    )?.attributes ?? null;
            }
    }

    if (!droidCalcResult || !osuCalcResult) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("beatmapNotFound"),
            ),
        });
    }

    const calcEmbedOptions = EmbedCreator.createCalculationEmbed(
        beatmap,
        calcParams,
        droidCalcResult.attributes.difficulty,
        osuCalcResult.difficulty,
        droidCalcResult.attributes.performance,
        osuCalcResult.performance,
        localization.language,
        Buffer.from(droidCalcResult.strainChart),
    );

    let string = "";

    if (interaction.options.getBoolean("showdroiddetail")) {
        string += `${localization.getTranslation("rawDroidSr")}: ${
            interaction.options.getInteger("calculationmethod") ===
            PPCalculationMethod.rebalance
                ? PPHelper.getRebalanceDroidDifficultyAttributesInfo(
                      <
                          ResponseDifficultyAttributes<RebalanceDroidDifficultyAttributes>
                      >droidCalcResult.attributes.difficulty,
                  )
                : PPHelper.getDroidDifficultyAttributesInfo(
                      <ResponseDifficultyAttributes<DroidDifficultyAttributes>>(
                          droidCalcResult.attributes.difficulty
                      ),
                  )
        }`;
        string += `\n${localization.getTranslation(
            "rawDroidPp",
        )}: ${PPHelper.getDroidPerformanceAttributesInfo(
            droidCalcResult.attributes.performance,
        )}\n`;
    }

    if (interaction.options.getBoolean("showosudetail")) {
        string += `${localization.getTranslation("rawPcSr")}: ${
            interaction.options.getInteger("calculationmethod") ===
            PPCalculationMethod.rebalance
                ? PPHelper.getRebalanceOsuDifficultyAttributesInfo(
                      <
                          ResponseDifficultyAttributes<RebalanceOsuDifficultyAttributes>
                      >osuCalcResult.difficulty,
                  )
                : PPHelper.getOsuDifficultyAttributesInfo(
                      osuCalcResult.difficulty,
                  )
        }\n${localization.getTranslation(
            "rawPcPp",
        )}: ${PPHelper.getOsuPerformanceAttributesInfo(
            osuCalcResult.performance,
        )}`;
    }

    if (string) {
        calcEmbedOptions.content = string;
    }

    BeatmapManager.setChannelLatestBeatmap(interaction.channelId, beatmap.hash);

    InteractionHelper.reply(interaction, calcEmbedOptions);
};

export const category: SlashCommand["category"] = CommandCategory.osu;

export const config: SlashCommand["config"] = {
    name: "calculate",
    description:
        "Calculates the difficulty and performance value of an osu!standard beatmap.",
    options: [
        {
            name: "beatmap",
            type: ApplicationCommandOptionType.String,
            description:
                "The beatmap ID or link to calculate. Defaults to the latest cached beatmap in the channel, if any.",
        },
        {
            name: "mods",
            type: ApplicationCommandOptionType.String,
            description:
                "Applied game modifications (HD, HR, etc). Defaults to No Mod.",
        },
        {
            name: "combo",
            type: ApplicationCommandOptionType.Integer,
            description:
                "Maximum combo reached, from 0 to the beatmap's maximum combo. Defaults to maximum combo.",
            minValue: 0,
        },
        {
            name: "accuracy",
            type: ApplicationCommandOptionType.Number,
            description: "The accuracy gained, from 0 to 100. Defaults to 100.",
            minValue: 0,
            maxValue: 100,
        },
        {
            name: "x100",
            type: ApplicationCommandOptionType.Integer,
            description:
                "The amount of 100s gained. If specified, overrides the accuracy option. Defaults to 0.",
            minValue: 0,
        },
        {
            name: "x50",
            type: ApplicationCommandOptionType.Integer,
            description:
                "The amount of 50s gained. If specified, overrides the accuracy option. Defaults to 0.",
            minValue: 0,
        },
        {
            name: "misses",
            type: ApplicationCommandOptionType.Integer,
            description: "The amount of misses gained. Defaults to 0.",
            minValue: 0,
        },
        {
            name: "circlesize",
            type: ApplicationCommandOptionType.Number,
            description:
                "The Circle Size (CS) to be forced in calculation, from 0 to 11. Defaults to the beatmap's CS.",
            minValue: 0,
            maxValue: 15,
        },
        {
            name: "approachrate",
            type: ApplicationCommandOptionType.Number,
            description:
                "The Approach Rate (AR) to be forced in calculation, from 0 to 12.5. Defaults to the beatmap's AR.",
            minValue: 0,
            maxValue: 12.5,
        },
        {
            name: "overalldifficulty",
            type: ApplicationCommandOptionType.Number,
            description:
                "The Overall Difficulty (OD) to be forced in calculation, from 0 to 11. Defaults to the beatmap's OD.",
            minValue: 0,
            maxValue: 11,
        },
        {
            name: "speedmultiplier",
            type: ApplicationCommandOptionType.Number,
            description:
                "The speed multiplier to calculate for, from 0.5 to 2. Stackable with modifications. Defaults to 1.",
            minValue: 0.5,
            maxValue: 2,
        },
        {
            name: "showdroiddetail",
            type: ApplicationCommandOptionType.Boolean,
            description: "Whether to show detailed response for droid pp.",
        },
        {
            name: "showosudetail",
            type: ApplicationCommandOptionType.Boolean,
            description: "Whether to show detailed response for PC pp.",
        },
        {
            name: "calculationmethod",
            type: ApplicationCommandOptionType.Integer,
            description: "The calculation method to use. Defaults to Live.",
            choices: [
                {
                    name: "Live",
                    value: PPCalculationMethod.live,
                },
                {
                    name: "Rebalance",
                    value: PPCalculationMethod.rebalance,
                },
            ],
        },
    ],
    example: [
        {
            command: "calculate",
            description:
                "will calculate the latest cached beatmap in the channel.",
        },
        {
            command: "calculate",
            arguments: [
                {
                    name: "beatmap",
                    value: 1884658,
                },
            ],
            description: "will calculate the beatmap with ID 1884658.",
        },
        {
            command: "calculate",
            arguments: [
                {
                    name: "beatmap",
                    value: "https://osu.ppy.sh/beatmapsets/902745#osu/1884658",
                },
            ],
            description: "will calculate the linked beatmap.",
        },
        {
            command: "calculate",
            arguments: [
                {
                    name: "beatmap",
                    value: 1884658,
                },
                {
                    name: "accuracy",
                    value: 99.89,
                },
            ],
            description:
                "will calculate the beatmap with ID 1884658 with 99.89% as accuracy gained.",
        },
        {
            command: "calculate",
            arguments: [
                {
                    name: "beatmap",
                    value: "https://osu.ppy.sh/beatmapsets/902745#osu/1884658",
                },
                {
                    name: "x100",
                    value: 1,
                },
                {
                    name: "x50",
                    value: 1,
                },
                {
                    name: "mods",
                    value: "HDHR",
                },
                {
                    name: "showdroiddetail",
                    value: true,
                },
                {
                    name: "showosudetail",
                    value: true,
                },
            ],
            description:
                "will calculate the linked beatmap with 1x 100 and 1x 50 gained, HDHR mod, and show detailed response for both droid and standard difficulty and performance value.",
        },
        {
            command: "calculate",
            arguments: [
                {
                    name: "beatmap",
                    value: "https://osu.ppy.sh/beatmapsets/902745#osu/1884658",
                },
                {
                    name: "x100",
                    value: 1,
                },
                {
                    name: "x50",
                    value: 1,
                },
                {
                    name: "mods",
                    value: "HDDT",
                },
                {
                    name: "speedmultiplier",
                    value: 2,
                },
                {
                    name: "combo",
                    value: 150,
                },
            ],
            description:
                "will calculate the linked beatmap with 10x 100 and 5x 50 gained, HDDT mod, 2x speed multiplier, and a maximum combo of 150.",
        },
    ],
};
