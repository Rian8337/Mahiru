import { GuildMember, EmbedBuilder, bold } from "discord.js";
import { DroidAPIRequestBuilder, RequestResponse } from "@rian8337/osu-base";
import { CommandCategory } from "@enums/core/CommandCategory";
import { SlashCommand } from "structures/core/SlashCommand";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { GamestatsLocalization } from "@localization/interactions/commands/osu! and osu!droid/gamestats/GamestatsLocalization";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { LocaleHelper } from "@utils/helpers/LocaleHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashCommand["run"] = async (_, interaction) => {
    const localization: GamestatsLocalization = new GamestatsLocalization(
        CommandHelper.getLocale(interaction),
    );

    const apiRequestBuilder: DroidAPIRequestBuilder =
        new DroidAPIRequestBuilder().setEndpoint("usergeneral.php");

    const result: RequestResponse = await apiRequestBuilder.sendRequest();

    if (result.statusCode !== 200) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("cannotRetrieveGameStatistics"),
            ),
        });
    }

    const data: number[] = result.data
        .toString("utf-8")
        .split("<br>")
        .map((v) => parseInt(v));

    const totalUserCount: number = data[1];
    const userCountAbove5Scores: number = data[3];
    const userCountAbove20Scores: number = data[5];
    const userCountAbove100Scores: number = data[7];
    const userCountAbove200Scores: number = data[9];
    const totalScoreCount: number = data[11];

    const embed: EmbedBuilder = EmbedCreator.createNormalEmbed({
        author: interaction.user,
        color: (<GuildMember | null>interaction.member)?.displayHexColor,
    });

    const BCP47: string = LocaleHelper.convertToBCP47(localization.language);

    embed.setTitle(localization.getTranslation("overallGameStats")).addFields(
        {
            name: localization.getTranslation("registeredAccounts"),
            value:
                `${bold(
                    localization.getTranslation("totalRegisteredAccounts"),
                )}: ${totalUserCount.toLocaleString(BCP47)}\n` +
                `${bold(
                    localization.getTranslation("moreThan5ScoresAcc"),
                )}: ${userCountAbove5Scores.toLocaleString(BCP47)}\n` +
                `${bold(
                    localization.getTranslation("moreThan20ScoresAcc"),
                )}: ${userCountAbove20Scores.toLocaleString(BCP47)}\n` +
                `${bold(
                    localization.getTranslation("moreThan100ScoresAcc"),
                )}: ${userCountAbove100Scores.toLocaleString(BCP47)}\n` +
                `${bold(
                    localization.getTranslation("moreThan200ScoresAcc"),
                )}: ${userCountAbove200Scores.toLocaleString(BCP47)}`,
        },
        {
            name: localization.getTranslation("totalScores"),
            value: totalScoreCount.toLocaleString(BCP47),
        },
    );

    InteractionHelper.reply(interaction, {
        embeds: [embed],
    });
};

export const category: SlashCommand["category"] = CommandCategory.osu;

export const config: SlashCommand["config"] = {
    name: "gamestats",
    description: "See osu!droid's overall statistics.",
    options: [],
    example: [],
};
