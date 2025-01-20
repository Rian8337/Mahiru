import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { Symbols } from "@enums/utils/Symbols";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { MessageInputCreator } from "@utils/creators/MessageInputCreator";
import { BeatmapManager } from "@utils/managers/BeatmapManager";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { SelectMenuCreator } from "@utils/creators/SelectMenuCreator";
import { Modes, RankedStatus } from "@rian8337/osu-base";
import { ProfileLocalization } from "@localization/interactions/commands/osu! and osu!droid/profile/ProfileLocalization";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { StringHelper } from "@utils/helpers/StringHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { PPProcessorRESTManager } from "@utils/managers/PPProcessorRESTManager";
import { PPCalculationMethod } from "@enums/utils/PPCalculationMethod";
import { DroidHelper } from "@utils/helpers/DroidHelper";

export const run: SlashSubcommand<false>["run"] = async (_, interaction) => {
    const localization = new ProfileLocalization(
        CommandHelper.getLocale(interaction),
    );

    const playerInfoDbManager = DatabaseManager.aliceDb.collections.playerInfo;

    const bindInfo =
        await DatabaseManager.elainaDb.collections.userBind.getFromUser(
            interaction.user,
            {
                projection: {
                    _id: 0,
                    uid: 1,
                },
            },
        );

    if (!bindInfo) {
        return InteractionHelper.update(interaction, {
            content: MessageCreator.createReject(
                new ConstantsLocalization(localization.language).getTranslation(
                    Constants.selfNotBindedReject,
                ),
            ),
        });
    }

    const badgeList =
        await DatabaseManager.aliceDb.collections.profileBadges.get(
            "id",
            {},
            { projection: { _id: 0 } },
        );

    const selectMenuInteraction =
        await SelectMenuCreator.createStringSelectMenu(
            interaction,
            {
                content: MessageCreator.createWarn(
                    localization.getTranslation("chooseClaimBadge"),
                ),
            },
            badgeList
                .map((v) => {
                    return {
                        label: v.name,
                        value: v.id,
                    };
                })
                .sort((a, b) => a.label.localeCompare(b.label)),
            [interaction.user.id],
            30,
        );

    if (!selectMenuInteraction) {
        return;
    }

    const badgeID = selectMenuInteraction.values[0];
    const badge = badgeList.get(badgeID)!;

    const playerInfo = await playerInfoDbManager.getFromUser(interaction.user, {
        projection: {
            _id: 0,
            picture_config: 1,
        },
    });

    const pictureConfig =
        playerInfo?.picture_config ??
        playerInfoDbManager.defaultDocument.picture_config;

    if (pictureConfig.badges.find((b) => b.id === badge.id)) {
        return InteractionHelper.update(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("badgeIsAlreadyClaimed"),
            ),
        });
    }

    const player = await DroidHelper.getPlayer(bindInfo.uid, [
        "username",
        "score",
        "pp",
    ]);

    if (!player) {
        return InteractionHelper.update(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("selfProfileNotFound"),
            ),
        });
    }

    let canUserClaimBadge = false;

    switch (badge.type) {
        case "dpp":
            canUserClaimBadge = player.pp >= badge.requirement;
            break;
        case "score_total":
            canUserClaimBadge = player.score >= badge.requirement;
            break;
        case "star_fc": {
            const beatmapIDInput =
                await MessageInputCreator.createInputDetector(
                    interaction,
                    {
                        embeds: [
                            EmbedCreator.createInputEmbed(
                                interaction,
                                localization.getTranslation("claimBadge"),
                                `${StringHelper.formatString(
                                    localization.getTranslation("enterBeatmap"),
                                    Symbols.star,
                                    badge.requirement.toString(),
                                )}\n\n${localization.getTranslation(
                                    "enterBeatmapRestriction",
                                )}`,
                                localization.language,
                            ),
                        ],
                    },
                    [],
                    [interaction.user.id],
                    20,
                );

            if (!beatmapIDInput) {
                break;
            }

            const beatmapID = BeatmapManager.getBeatmapID(beatmapIDInput)[0];

            if (isNaN(beatmapID)) {
                return InteractionHelper.update(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation(
                            "beatmapToClaimBadgeNotValid",
                        ),
                    ),
                });
            }

            const beatmapInfo = await BeatmapManager.getBeatmap(beatmapID, {
                checkFile: false,
            });

            if (!beatmapInfo) {
                return InteractionHelper.update(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation(
                            "beatmapToClaimBadgeNotFound",
                        ),
                    ),
                });
            }

            if (
                beatmapInfo.approved !== RankedStatus.ranked &&
                beatmapInfo.approved !== RankedStatus.approved
            ) {
                return InteractionHelper.update(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation(
                            "beatmapToClaimBadgeNotRankedOrApproved",
                        ),
                    ),
                });
            }

            const score = await DroidHelper.getScore(
                bindInfo.uid,
                beatmapInfo.hash,
                ["uid", "hash"],
            );

            if (!score) {
                return InteractionHelper.update(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation(
                            "userDoesntHaveScoreinBeatmap",
                        ),
                    ),
                });
            }

            const attribs =
                await PPProcessorRESTManager.getOnlineScoreAttributes(
                    score.uid,
                    score.hash,
                    Modes.osu,
                    PPCalculationMethod.live,
                );

            if (!attribs) {
                return InteractionHelper.update(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation(
                            "userDoesntHaveScoreinBeatmap",
                        ),
                    ),
                });
            }

            if (attribs.attributes.difficulty.starRating < badge.requirement) {
                return InteractionHelper.update(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation("userCannotClaimBadge"),
                    ),
                });
            }

            break;
        }
        case "unclaimable":
            return InteractionHelper.update(interaction, {
                content: MessageCreator.createReject(
                    localization.getTranslation("badgeUnclaimable"),
                ),
            });
    }

    if (!canUserClaimBadge) {
        return InteractionHelper.update(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("userCannotClaimBadge"),
            ),
        });
    }

    if (playerInfo) {
        await playerInfoDbManager.updateOne(
            { discordid: interaction.user.id },
            {
                $push: {
                    "picture_config.badges": { id: badge.id, name: badge.name },
                },
            },
        );
    } else {
        await playerInfoDbManager.insert({
            discordid: interaction.user.id,
            uid: bindInfo.uid,
            username: player.username,
            picture_config: pictureConfig,
        });
    }

    InteractionHelper.update(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("claimBadgeSuccess"),
            interaction.user.toString(),
            badge.id,
        ),
    });
};
