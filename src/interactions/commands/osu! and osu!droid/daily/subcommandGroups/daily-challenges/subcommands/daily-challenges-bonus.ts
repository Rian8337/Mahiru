import { DatabaseManager } from "@database/DatabaseManager";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { DailyLocalization } from "@localization/interactions/commands/osu! and osu!droid/daily/DailyLocalization";
import { BonusID } from "structures/challenge/BonusID";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { LocaleHelper } from "@utils/helpers/LocaleHelper";
import { NumberHelper } from "@utils/helpers/NumberHelper";
import { BeatmapManager } from "@utils/managers/BeatmapManager";
import { MapInfo, ModUtil } from "@rian8337/osu-base";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization = new DailyLocalization(
        CommandHelper.getLocale(interaction)
    );

    const dbManager = DatabaseManager.aliceDb.collections.challenge;

    const challenge = await dbManager.getById(
        interaction.options.getString("id", true)
    );

    if (!challenge) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("challengeNotFound")
            ),
        });
    }

    if (!challenge.isScheduled) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("challengeIsOngoing")
            ),
        });
    }

    const type = <BonusID>interaction.options.getString("type", true);
    const level = interaction.options.getInteger("level", true);
    let value: string | number | null = interaction.options.getString("value");
    const BCP47 = LocaleHelper.convertToBCP47(localization.language);

    if (!value) {
        // Value omitted, means the user wants to delete.
        const bonus = challenge.bonus.get(type);

        if (bonus) {
            const index = bonus.list.findIndex((v) => v.level === level);

            if (index !== -1) {
                bonus.list.splice(index, 1);

                if (bonus.list.length === 0) {
                    challenge.bonus.delete(type);
                }

                const result = await dbManager.updateOne(
                    { challengeid: challenge.challengeid },
                    {
                        $set: {
                            bonus: [...challenge.bonus.values()],
                        },
                    }
                );

                if (!result.success) {
                    return InteractionHelper.reply(interaction, {
                        content: MessageCreator.createReject(
                            localization.getTranslation("modifyBonusFailed"),
                            result.reason!
                        ),
                    });
                }
            }
        }

        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createAccept(
                localization.getTranslation("modifyBonusSuccess"),
                challenge.challengeid,
                type,
                level.toLocaleString(BCP47),
                localization.getTranslation("none")
            ),
        });
    }

    await InteractionHelper.deferReply(interaction);

    const beatmap: MapInfo | null = await BeatmapManager.getBeatmap(
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

    switch (type) {
        case "score": {
            value = parseInt(value);

            await BeatmapManager.downloadBeatmap(beatmap);

            if (!beatmap.hasDownloadedBeatmap()) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation("beatmapNotFound")
                    ),
                });
            }

            const maxScore = beatmap.beatmap!.maxDroidScore(
                ModUtil.pcStringToMods(challenge.constrain)
            );

            if (!NumberHelper.isNumberInRange(value, 0, maxScore, true)) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation("bonusValueOutOfRange"),
                        "0",
                        maxScore.toLocaleString(BCP47)
                    ),
                });
            }

            break;
        }
        case "acc":
            value = parseFloat(value);

            if (!NumberHelper.isNumberInRange(value, 0, 100, true)) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation("bonusValueOutOfRange"),
                        "0",
                        "100"
                    ),
                });
            }

            break;
        case "scorev2":
            value = parseInt(value);

            if (!NumberHelper.isNumberInRange(value, 0, 1e6, true)) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation("bonusValueOutOfRange"),
                        "0",
                        (1e6).toLocaleString(BCP47)
                    ),
                });
            }

            break;
        case "combo":
            if (beatmap.maxCombo === null) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation("beatmapMaxComboNotFound")
                    ),
                });
            }

            value = parseInt(value);

            if (
                !NumberHelper.isNumberInRange(value, 0, beatmap.maxCombo, true)
            ) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation("bonusValueOutOfRange"),
                        "0",
                        beatmap.maxCombo.toLocaleString(BCP47)
                    ),
                });
            }

            break;
        case "mod": {
            const mods = ModUtil.pcStringToMods(value);
            const modArray = [...mods.values()];

            if (
                modArray.some((m) => !m.isApplicableToDroid() || !m.droidRanked)
            ) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation("unrankedModsIncluded")
                    ),
                });
            }

            value = ModUtil.modsToOsuString(modArray);

            break;
        }
        case "rank":
            value = value.toUpperCase();

            if (!["SSH", "SS", "SH", "S", "A", "B", "C", "D"].includes(value)) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation("bonusValueOutOfRange"),
                        "SSH",
                        "D"
                    ),
                });
            }

            break;
        case "dpp":
        case "pp":
        case "ur":
            value = parseFloat(value);

            if (
                !NumberHelper.isNumberInRange(
                    value,
                    0,
                    Number.POSITIVE_INFINITY,
                    true
                )
            ) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation("bonusValueOutOfRange"),
                        "0",
                        Number.POSITIVE_INFINITY.toLocaleString(BCP47)
                    ),
                });
            }

            break;
        case "m300":
        case "m100":
        case "m50":
        case "miss":
            value = parseInt(value);

            if (
                !NumberHelper.isNumberInRange(value, 0, beatmap.objects, true)
            ) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation("bonusValueOutOfRange"),
                        "0",
                        beatmap.objects.toLocaleString(BCP47)
                    ),
                });
            }

            break;
    }

    const bonus = challenge.bonus.get(type) ?? { id: type, list: [] };
    const index = bonus.list.findIndex((v) => v.level === level);

    if (index !== -1) {
        bonus.list[index].value = value;
    } else {
        bonus.list.push({
            level: level,
            value: value,
        });

        bonus.list.sort((a, b) => a.level - b.level);
    }

    challenge.bonus.set(type, bonus);

    const result = await dbManager.updateOne(
        { challengeid: challenge.challengeid },
        {
            $set: {
                bonus: [...challenge.bonus.values()],
            },
        }
    );

    if (result.failed()) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("modifyBonusFailed"),
                result.reason
            ),
        });
    }

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("modifyBonusSuccess"),
            challenge.challengeid,
            type,
            level.toLocaleString(BCP47),
            value.toLocaleString(BCP47)
        ),
    });
};
