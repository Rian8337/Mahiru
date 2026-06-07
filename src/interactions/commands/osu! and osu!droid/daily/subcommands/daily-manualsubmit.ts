import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { DailyLocalization } from "@localization/interactions/commands/osu! and osu!droid/daily/DailyLocalization";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageButtonCreator } from "@utils/creators/MessageButtonCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { LocaleHelper } from "@utils/helpers/LocaleHelper";
import { PermissionHelper } from "@utils/helpers/PermissionHelper";
import { RESTManager } from "@utils/managers/RESTManager";
import { ReplayAnalyzer } from "@rian8337/osu-droid-replay-analyzer";
import { GuildMember, bold } from "discord.js";
import { DroidHelper } from "@utils/helpers/DroidHelper";

export const run: SlashSubcommand<true>["run"] = async (
    client,
    interaction,
) => {
    const localization = new DailyLocalization(
        CommandHelper.getLocale(interaction),
    );

    const bindInfo =
        await DatabaseManager.elainaDb.collections.userBind.getFromUser(
            interaction.user,
            {
                projection: {
                    _id: 0,
                    username: 1,
                    uid: 1,
                    clan: 1,
                },
            },
        );

    if (!bindInfo) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                new ConstantsLocalization(localization.language).getTranslation(
                    Constants.selfNotBindedReject,
                ),
            ),
        });
    }

    await InteractionHelper.deferReply(interaction);

    const replay = interaction.options.getAttachment("replay", true);
    const replayData = await RESTManager.request(replay.url);

    if (replayData.statusCode !== 200) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("replayDownloadFail"),
            ),
        });
    }

    const replayAnalyzer = new ReplayAnalyzer({ scoreID: 0 });
    replayAnalyzer.originalODR = replayData.data;

    try {
        await replayAnalyzer.analyze();
    } catch {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("replayInvalid"),
            ),
        });
    }

    const { data } = replayAnalyzer;

    if (!data?.isReplayV3()) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("replayTooOld"),
            ),
        });
    }

    if (data.playerName !== bindInfo.username) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("replayDoesntHaveSameUsername"),
            ),
        });
    }

    const challenge =
        await DatabaseManager.aliceDb.collections.challenge.getFromHash(
            data.hash,
        );

    if (!challenge) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("challengeFromReplayNotFound"),
            ),
        });
    }

    if (!challenge.isOngoing) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("challengeNotOngoing"),
            ),
        });
    }

    const completionStatus = await challenge.checkReplayCompletion(
        replayAnalyzer,
        localization.language,
    );

    if (!completionStatus.success) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("challengeNotCompleted"),
                completionStatus.reason!,
            ),
        });
    }

    const bonusLevel = await challenge.calculateBonusLevel(replayAnalyzer);
    const playerInfoDbManager = DatabaseManager.aliceDb.collections.playerInfo;

    const playerInfo = await playerInfoDbManager.getFromUser(interaction.user, {
        projection: {
            _id: 0,
            challenges: 1,
            points: 1,
            coins: 1,
        },
    });

    // Ask for verification from staff
    const staffMembers =
        await PermissionHelper.getMainGuildStaffMembers(client);

    const embed = EmbedCreator.createNormalEmbed({
        author: interaction.user,
        color: (<GuildMember>interaction.member).displayColor,
    });

    embed
        .setTitle(localization.getTranslation("scoreStatistics"))
        .setDescription(
            `${bold(localization.getTranslation("totalScore"))}: ${
                data.totalScore
            }\n` +
                `${bold(localization.getTranslation("maxCombo"))}: ${
                    data.maxCombo
                }x\n` +
                `${bold(localization.getTranslation("accuracy"))}: ${(
                    data.accuracy.value() * 100
                ).toFixed(2)}%\n` +
                `${bold(localization.getTranslation("rank"))}: ${data.rank}\n` +
                `${bold(
                    localization.getTranslation("time"),
                )}: ${DateTimeFormatHelper.dateToLocaleString(
                    data.time,
                    localization.language,
                )}\n\n` +
                `${bold(localization.getTranslation("hitGreat"))}: ${
                    data.accuracy.n300
                } (${data.hit300k} ${localization.getTranslation(
                    "geki",
                )} + ${localization.getTranslation("katu")})\n` +
                `${bold(localization.getTranslation("hitGood"))}: ${
                    data.accuracy.n100
                } (${data.hit100k} ${localization.getTranslation("katu")})\n` +
                `${bold(localization.getTranslation("hitMeh"))}: ${
                    data.accuracy.n50
                }\n` +
                `${bold(localization.getTranslation("misses"))}: ${
                    data.accuracy.nmiss
                }\n\n` +
                `${bold(
                    localization.getTranslation("bonusLevelReached"),
                )}: ${bonusLevel}`,
        );

    const confirmation = await MessageButtonCreator.createConfirmation(
        interaction,
        {
            content: MessageCreator.createWarn(
                localization.getTranslation("manualSubmissionConfirmation"),
            ),
            embeds: [embed],
        },
        [...staffMembers.keys()],
        30,
        localization.language,
    );

    if (!confirmation) {
        return;
    }

    // Keep track of how many points are gained
    let pointsGained = bonusLevel * 2 + challenge.points;

    if (playerInfo) {
        const challengeData = playerInfo.challenges.get(
            challenge.challengeid,
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
                challengeData.highestLevel,
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
                },
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
                },
            );
        }
    } else {
        const player = (await DroidHelper.getPlayer(bindInfo.uid, [
            "username",
        ]))!;

        await playerInfoDbManager.insert({
            uid: bindInfo.uid,
            username: player.username,
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
                bindInfo.clan,
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
            ((playerInfo?.coins ?? 0) + pointsGained * 2).toLocaleString(BCP47),
        ),
    });
};
