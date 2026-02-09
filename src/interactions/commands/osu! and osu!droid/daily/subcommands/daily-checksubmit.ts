import { DatabaseManager } from "@database/DatabaseManager";
import { PlayerInfo } from "@database/utils/aliceDb/PlayerInfo";
import { ChallengeCompletionData } from "structures/challenge/ChallengeCompletionData";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { DatabasePlayerInfo } from "structures/database/aliceDb/DatabasePlayerInfo";
import { DailyLocalization } from "@localization/interactions/commands/osu! and osu!droid/daily/DailyLocalization";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { Snowflake } from "discord.js";
import { Filter, FindOptions } from "mongodb";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization: DailyLocalization = new DailyLocalization(
        CommandHelper.getLocale(interaction),
    );

    const challengeId: string = interaction.options.getString(
        "challengeid",
        true,
    );

    const discordid: Snowflake | undefined =
        interaction.options.getUser("user")?.id;
    const uid: number | null = interaction.options.getInteger("uid");
    const username: string | null = interaction.options.getString("username");

    if ([discordid, uid, username].filter(Boolean).length > 1) {
        interaction.ephemeral = true;

        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("tooManyOptions"),
            ),
        });
    }

    const query: Filter<DatabasePlayerInfo> = {
        $and: [{ "challenges.id": challengeId }],
    };

    const findOptions: FindOptions = {
        projection: {
            "challenges.$": 1,
        },
    };

    switch (true) {
        case !!uid:
            query.$and!.push({ uid: uid! });
            break;
        case !!username:
            query.$and!.push({ username: username! });
            break;
        default:
            // If no arguments are specified, default to self
            query.$and!.push({ discordid: discordid ?? interaction.user.id });
    }

    const playerInfo: PlayerInfo | null =
        await DatabaseManager.aliceDb.collections.playerInfo.getOne(
            query,
            findOptions,
        );

    const completionData: ChallengeCompletionData | undefined =
        playerInfo?.challenges?.get(challengeId);

    if (completionData) {
        InteractionHelper.reply(interaction, {
            content: MessageCreator.createAccept(
                localization.getTranslation("userHasPlayedChallenge"),
                challengeId,
                completionData.highestLevel.toString(),
            ),
        });
    } else {
        InteractionHelper.reply(interaction, {
            content: MessageCreator.createAccept(
                localization.getTranslation("userHasNotPlayedChallenge"),
                challengeId,
            ),
        });
    }
};
