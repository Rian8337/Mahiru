import { DatabaseManager } from "@database/DatabaseManager";
import { Symbols } from "@enums/utils/Symbols";
import { MatchLocalization } from "@localization/interactions/commands/Tournament/match/MatchLocalization";
import { Player, Score } from "@rian8337/osu-droid-utilities";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { LocaleHelper } from "@utils/helpers/LocaleHelper";
import { StringHelper } from "@utils/helpers/StringHelper";
import { BeatmapManager } from "@utils/managers/BeatmapManager";
import { bold } from "discord.js";
import { SlashSubcommand } from "structures/core/SlashSubcommand";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    if (!interaction.channel?.isSendable()) {
        return;
    }

    const localization = new MatchLocalization(
        CommandHelper.getLocale(interaction)
    );

    const id = interaction.options.getString("id");

    const match = id
        ? await DatabaseManager.elainaDb.collections.tournamentMatch.getById(id)
        : await DatabaseManager.elainaDb.collections.tournamentMatch.getByChannel(
              interaction.channelId
          );

    // Need to make cross-compatibility since this command is also called from match-start
    if (!match) {
        interaction.replied
            ? interaction.channel.send({
                  content: MessageCreator.createReject(
                      localization.getTranslation("matchDoesntExist")
                  ),
              })
            : InteractionHelper.reply(interaction, {
                  content: MessageCreator.createReject(
                      localization.getTranslation("matchDoesntExist")
                  ),
              });

        return;
    }

    const poolId = match.matchid.split(".").shift()!;

    const pool =
        await DatabaseManager.elainaDb.collections.tournamentMappool.getFromId(
            poolId
        );

    if (!pool) {
        interaction.replied
            ? interaction.channel!.send({
                  content: MessageCreator.createReject(
                      localization.getTranslation("mappoolNotFound")
                  ),
              })
            : InteractionHelper.reply(interaction, {
                  content: MessageCreator.createReject(
                      localization.getTranslation("mappoolNotFound")
                  ),
              });

        return;
    }

    const playerList: Player[] = [];

    for (const p of match.player) {
        // Unused command, should probably replace this to also query the database, but low priority
        const player = await Player.getInformation(parseInt(p[1]));

        if (!player) {
            interaction.replied
                ? interaction.channel!.send({
                      content: MessageCreator.createReject(
                          localization.getTranslation("playerNotFound"),
                          p[1]
                      ),
                  })
                : InteractionHelper.reply(interaction, {
                      content: MessageCreator.createReject(
                          localization.getTranslation("playerNotFound"),
                          p[1]
                      ),
                  });

            return;
        }

        playerList.push(player);
    }

    // Find latest played beatmap if not set
    const map = match.getLastPlayedBeatmap(
        pool,
        playerList,
        interaction.options.getString("pick")?.toUpperCase()
    );

    if (!map) {
        interaction.replied
            ? interaction.channel!.send({
                  content: MessageCreator.createReject(
                      localization.getTranslation("mapNotFound")
                  ),
              })
            : InteractionHelper.reply(interaction, {
                  content: MessageCreator.createReject(
                      localization.getTranslation("mapNotFound")
                  ),
              });

        return;
    }

    const team1ScoreList: Score[] = [];
    const team2ScoreList: Score[] = [];

    for (let i = 0; i < playerList.length; ++i) {
        (i % 2 ? team2ScoreList : team1ScoreList).push(
            playerList[i].recentPlays[0]
        );
    }

    const team1ScoreStatus = match.verifyTeamScore(
        team1ScoreList,
        map,
        localization.language
    );
    const team2ScoreStatus = match.verifyTeamScore(
        team2ScoreList,
        map,
        localization.language
    );

    const scoreV2List: number[] = [];

    let team1String = "";
    let team2String = "";
    let team1OverallScore = 0;
    let team2OverallScore = 0;

    for (let i = 0; i < playerList.length; ++i) {
        const score = playerList[i].recentPlays[0];

        const teamScoreStatus = i % 2 ? team2ScoreStatus : team1ScoreStatus;

        const verificationResult = match.verifyScore(
            score,
            map,
            teamScoreStatus.success,
            localization.language
        );

        if (verificationResult.success && teamScoreStatus.success) {
            const scorev2 = pool.calculateScoreV2(
                map.pickId,
                score.score,
                score.accuracy.value(),
                score.accuracy.nmiss,
                score.mods
            );

            scoreV2List.push(scorev2);
        } else {
            scoreV2List.push(0);
        }

        const scoreString = `${match.player[i][0]} - (${
            [...score.mods.values()].map((v) => v.name).join(", ") || "NoMod"
        }): ${bold(
            scoreV2List.at(-1)!.toString()
        )} - ${BeatmapManager.getRankEmote(score.rank)} - ${(
            score.accuracy.value() * 100
        ).toFixed(2)}% - ${score.accuracy.nmiss} ${Symbols.missIcon}\n`;
        const failString = `${match.player[i][0]} - (N/A): ${bold(
            "0"
        )} - ${bold(
            !teamScoreStatus.success
                ? teamScoreStatus.reason!
                : verificationResult.reason!
        )}\n`;

        if (i % 2 === 0) {
            if (teamScoreStatus.success) {
                team1OverallScore += scoreV2List.at(-1)!;
            }

            if (teamScoreStatus.success && verificationResult.success) {
                team1String += scoreString;
            } else {
                team1String += failString;
            }
        } else {
            if (teamScoreStatus.success) {
                team2OverallScore += scoreV2List.at(-1)!;
            }

            if (teamScoreStatus.success && verificationResult.success) {
                team2String += scoreString;
            } else {
                team2String += failString;
            }
        }
    }

    team1String ||= localization.getTranslation("none");
    team2String ||= localization.getTranslation("none");

    let description = StringHelper.formatString(
        localization.getTranslation("won"),
        team1OverallScore > team2OverallScore
            ? match.team[0][0]
            : match.team[1][0],
        Math.abs(team1OverallScore - team2OverallScore).toLocaleString(
            LocaleHelper.convertToBCP47(localization.language)
        )
    );
    let embedColor = 0;

    if (team1OverallScore > team2OverallScore) {
        embedColor = 16711680;
    } else if (team1OverallScore < team2OverallScore) {
        embedColor = 262399;
    } else {
        description = localization.getTranslation("draw");
    }

    const resultEmbed = EmbedCreator.createNormalEmbed({
        timestamp: true,
        color: embedColor,
    });

    resultEmbed
        .setAuthor({ name: match.name })
        .setTitle(map.name)
        .addFields(
            {
                name: `${match.team[0][0]}: ${team1OverallScore}`,
                value: team1String,
            },
            {
                name: `${match.team[1][0]}: ${team2OverallScore}`,
                value: team2String,
            },
            {
                name: "=================================",
                value: bold(description),
            }
        );

    if (!interaction.replied) {
        await InteractionHelper.reply(interaction, {
            content: MessageCreator.createAccept(
                localization.getTranslation("matchDataInProcess")
            ),
        });
    }

    // Red team wins
    match.team[0][1] += Number(team1OverallScore > team2OverallScore);
    // Blue team wins
    match.team[1][1] += Number(team2OverallScore > team1OverallScore);

    const summaryEmbed = EmbedCreator.createMatchSummaryEmbed(match);

    for (let i = 0; i < scoreV2List.length; ++i) {
        match.result[i].push(scoreV2List[i]);
    }

    const finalResult = await match.updateMatch();

    if (!finalResult.success) {
        return interaction.channel!.send({
            content: MessageCreator.createReject(
                localization.getTranslation("submitMatchFailed"),
                finalResult.reason!
            ),
        });
    }

    interaction.channel!.send({
        content: MessageCreator.createAccept(
            localization.getTranslation("submitMatchSuccessful")
        ),
        embeds: [resultEmbed, summaryEmbed],
    });
};
