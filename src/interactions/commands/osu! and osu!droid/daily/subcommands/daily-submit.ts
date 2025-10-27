import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { DailyLocalization } from "@localization/interactions/commands/osu! and osu!droid/daily/DailyLocalization";
import { ChallengeType } from "structures/challenge/ChallengeType";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { LocaleHelper } from "@utils/helpers/LocaleHelper";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { DroidHelper } from "@utils/helpers/DroidHelper";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization = new DailyLocalization(
        CommandHelper.getLocale(interaction)
    );

    const type =
        <ChallengeType>interaction.options.getString("type") ?? "daily";

    const challenge =
        await DatabaseManager.aliceDb.collections.challenge.getOngoingChallenge(
            type
        );

    if (!challenge) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("noOngoingChallenge")
            ),
        });
    }

    const bindInfo =
        await DatabaseManager.elainaDb.collections.userBind.getFromUser(
            interaction.user,
            {
                projection: {
                    _id: 0,
                    uid: 1,
                    username: 1,
                    clan: 1,
                },
            }
        );

    if (!bindInfo) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                new ConstantsLocalization(localization.language).getTranslation(
                    Constants.selfNotBindedReject
                )
            ),
        });
    }

    const score = await DroidHelper.getScore(
        bindInfo.uid,
        challenge.hash,
        false,
        [
            "id",
            "mods",
            "score",
            "combo",
            "mark",
            "perfect",
            "good",
            "bad",
            "miss",
        ]
    );

    if (!score) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("scoreNotFound")
            ),
        });
    }

    await InteractionHelper.deferReply(interaction);

    const completionStatus = await challenge.checkScoreCompletion(
        score,
        undefined,
        localization.language
    );

    if (!completionStatus.success) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("challengeNotCompleted"),
                completionStatus.reason!
            ),
        });
    }

    const bonusLevel = await challenge.calculateBonusLevel(score);

    const playerInfoDbManager = DatabaseManager.aliceDb.collections.playerInfo;

    const playerInfo = await playerInfoDbManager.getFromUser(interaction.user, {
        projection: {
            _id: 0,
            coins: 1,
            points: 1,
            challenges: 1,
        },
    });

    // Keep track of how many points are gained
    let pointsGained: number = bonusLevel * 2 + challenge.points;

    if (playerInfo) {
        const challengeData = playerInfo.challenges.get(
            challenge.challengeid
        ) ?? {
            id: challenge.challengeid,
            highestLevel: bonusLevel,
        };

        if (playerInfo.challenges.has(challenge.challengeid)) {
            // Player has completed challenge. Subtract the challenge's original points
            // and difference from highest challenge level
            pointsGained -=
                challenge.points +
                (challengeData.highestLevel -
                    Math.max(0, bonusLevel - challengeData.highestLevel)) *
                    2;

            challengeData.highestLevel = Math.max(
                bonusLevel,
                challengeData.highestLevel
            );

            await playerInfoDbManager.updateOne(
                { discordid: interaction.user.id },
                {
                    $set: {
                        "challenges.$[challengeFilter].highestLevel":
                            challengeData.highestLevel,
                    },
                    $inc: {
                        coins: pointsGained * 2,
                        points: pointsGained,
                    },
                },
                {
                    arrayFilters: [
                        { "challengeFilter.id": challenge.challengeid },
                    ],
                }
            );
        } else {
            playerInfo.challenges.set(challenge.challengeid, challengeData);

            await playerInfoDbManager.updateOne(
                { discordid: interaction.user.id },
                {
                    $push: {
                        challenges: challengeData,
                    },
                    $inc: {
                        coins: pointsGained * 2,
                        points: pointsGained,
                    },
                }
            );
        }
    } else {
        await playerInfoDbManager.insert({
            uid: bindInfo.uid,
            username: bindInfo.username,
            discordid: interaction.user.id,
            points: pointsGained,
            coins: pointsGained * 2,
            challenges: [
                {
                    id: challenge.challengeid,
                    highestLevel: bonusLevel,
                },
            ],
        });
    }

    if (bindInfo.clan) {
        const clan =
            (await DatabaseManager.elainaDb.collections.clan.getFromName(
                bindInfo.clan
            ))!;

        clan.incrementPower(pointsGained);

        await clan.updateClan();
    }

    const BCP47 = LocaleHelper.convertToBCP47(localization.language);

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("challengeCompleted"),
            challenge.challengeid,
            bonusLevel.toLocaleString(BCP47),
            pointsGained.toLocaleString(BCP47),
            (pointsGained * 2).toLocaleString(BCP47),
            ((playerInfo?.points ?? 0) + pointsGained).toLocaleString(BCP47),
            ((playerInfo?.coins ?? 0) + pointsGained * 2).toLocaleString(BCP47)
        ),
    });
};
