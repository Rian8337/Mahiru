import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { PlayerInfoCollectionManager } from "@database/managers/aliceDb/PlayerInfoCollectionManager";
import { PlayerInfo } from "@database/utils/aliceDb/PlayerInfo";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { DatabasePlayerInfo } from "structures/database/aliceDb/DatabasePlayerInfo";
import { DailyLocalization } from "@localization/interactions/commands/osu! and osu!droid/daily/DailyLocalization";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { StringHelper } from "@utils/helpers/StringHelper";
import { ProfileManager } from "@utils/managers/ProfileManager";
import {
    GuildEmoji,
    GuildMember,
    EmbedBuilder,
    Snowflake,
    bold,
} from "discord.js";
import { FindOptions } from "mongodb";

export const run: SlashSubcommand<true>["run"] = async (
    client,
    interaction,
) => {
    const localization: DailyLocalization = new DailyLocalization(
        CommandHelper.getLocale(interaction),
    );

    const discordid: Snowflake | undefined =
        interaction.options.getUser("user")?.id;
    const uid: number | null = interaction.options.getInteger("uid");
    const username: string | null = interaction.options.getString("username");

    const coin: GuildEmoji = client.emojis.resolve(Constants.mahiruCoinEmote)!;

    const dbManager: PlayerInfoCollectionManager =
        DatabaseManager.aliceDb.collections.playerInfo;

    let playerInfo: PlayerInfo | null;

    const findOptions: FindOptions = {
        projection: {
            _id: 0,
            points: 1,
            coins: 1,
            challenges: 1,
        },
    };

    switch (true) {
        case !!uid:
            playerInfo = await dbManager.getFromUid(uid!, findOptions);
            break;
        case !!username:
            playerInfo = await dbManager.getFromUsername(username, findOptions);
            break;
        default:
            // If no arguments are specified, default to self
            playerInfo = await dbManager.getFromUser(
                discordid ?? interaction.user.id,
                findOptions,
            );
    }

    if (!playerInfo) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("userHasNotPlayedAnyChallenge"),
            ),
        });
    }

    const embed: EmbedBuilder = EmbedCreator.createNormalEmbed({
        color: (<GuildMember>interaction.member).displayColor,
    });

    embed
        .setAuthor({
            name: StringHelper.formatString(
                localization.getTranslation("profile"),
                playerInfo.username,
            ),
            iconURL: "https://image.frl/p/beyefgeq5m7tobjg.jpg",
            url: ProfileManager.getProfileLink(playerInfo.uid).toString(),
        })
        .addFields({
            name: localization.getTranslation("statistics"),
            value: `${bold(localization.getTranslation("points"))}: ${
                playerInfo.points
            }\n${bold("Mahiru Coins")}: ${coin}${playerInfo.coins}\n${bold(
                localization.getTranslation("challengesCompleted"),
            )}: ${playerInfo.challenges.size}`,
        });

    InteractionHelper.reply(interaction, {
        embeds: [embed],
    });
};
