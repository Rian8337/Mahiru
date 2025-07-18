import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { UserBind } from "@database/utils/elainaDb/UserBind";
import { ApplicationCommandOptionType } from "discord.js";
import { CommandCategory } from "@enums/core/CommandCategory";
import { SlashCommand } from "structures/core/SlashCommand";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { ScoreDisplayHelper } from "@utils/helpers/ScoreDisplayHelper";
import { Player, Score } from "@rian8337/osu-droid-utilities";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { Recent5Localization } from "@localization/interactions/commands/osu! and osu!droid/recent5/Recent5Localization";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { RecentPlay } from "@database/utils/aliceDb/RecentPlay";
import { ScoreHelper } from "@utils/helpers/ScoreHelper";
import { StringHelper } from "@utils/helpers/StringHelper";
import { OfficialDatabaseUser } from "@database/official/schema/OfficialDatabaseUser";
import { DroidHelper } from "@utils/helpers/DroidHelper";
import { OfficialDatabaseScore } from "@database/official/schema/OfficialDatabaseScore";

export const run: SlashCommand["run"] = async (_, interaction) => {
    const localization = new Recent5Localization(
        CommandHelper.getLocale(interaction)
    );

    const discordid = interaction.options.getUser("user")?.id;
    let uid = interaction.options.getInteger("uid");
    const username = interaction.options.getString("username");
    const considerNonOverwrite =
        interaction.options.getBoolean("considernonoverwrite") ?? true;

    if ([discordid, uid, username].filter(Boolean).length > 1) {
        interaction.ephemeral = true;

        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("tooManyOptions")
            ),
        });
    }

    await InteractionHelper.deferReply(interaction);

    const dbManager = DatabaseManager.elainaDb.collections.userBind;
    let bindInfo: UserBind | null = null;
    let player: Pick<OfficialDatabaseUser, "id" | "username"> | Player | null =
        null;

    switch (true) {
        case !!uid:
            player = await DroidHelper.getPlayer(uid);

            uid ??= player?.id ?? null;

            break;
        case !!username:
            if (!StringHelper.isUsernameValid(username)) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation("playerNotFound")
                    ),
                });
            }

            player = await DroidHelper.getPlayer(username);

            uid ??= player?.id ?? null;

            break;
        default:
            // If no arguments are specified, default to self
            bindInfo = await dbManager.getFromUser(
                discordid ?? interaction.user.id,
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
                        ).getTranslation(
                            discordid
                                ? Constants.userNotBindedReject
                                : Constants.selfNotBindedReject
                        )
                    ),
                });
            }

            player = await DroidHelper.getPlayer(bindInfo.uid);
    }

    if (!player) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("playerNotFound")
            ),
        });
    }

    let recentPlays: (
        | Pick<
              OfficialDatabaseScore,
              | "id"
              | "filename"
              | "mark"
              | "mods"
              | "score"
              | "combo"
              | "date"
              | "perfect"
              | "good"
              | "bad"
              | "miss"
          >
        | Score
        | RecentPlay
    )[];

    if (player instanceof Player) {
        recentPlays = player.recentPlays;
    } else {
        recentPlays = await DroidHelper.getRecentScores(
            player.id,
            undefined,
            undefined,
            [
                "id",
                "filename",
                "mark",
                "mods",
                "score",
                "combo",
                "date",
                "perfect",
                "good",
                "bad",
                "miss",
            ]
        );
    }

    if (considerNonOverwrite) {
        recentPlays = await ScoreHelper.getRecentScores(player.id, recentPlays);
    }

    if (recentPlays.length === 0) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("playerHasNoRecentPlays")
            ),
        });
    }

    ScoreDisplayHelper.showRecentPlays(
        interaction,
        player.username,
        recentPlays,
        interaction.options.getInteger("page") ?? undefined
    );
};

export const category: SlashCommand["category"] = CommandCategory.osu;

export const config: SlashCommand["config"] = {
    name: "recent5",
    description: "Displays the 50 most recent plays of yourself or a player.",
    options: [
        {
            name: "page",
            type: ApplicationCommandOptionType.Integer,
            description:
                "The page to display, ranging from 1 to 10. Defaults to 1.",
            minValue: 1,
            maxValue: 10,
        },
        {
            name: "user",
            type: ApplicationCommandOptionType.User,
            description: "The Discord user to show.",
        },
        {
            name: "uid",
            type: ApplicationCommandOptionType.Integer,
            description: "The uid of the player.",
            minValue: Constants.uidMinLimit,
        },
        {
            name: "username",
            type: ApplicationCommandOptionType.String,
            description: "The username of the player.",
            minLength: 2,
            maxLength: 20,
            autocomplete: true,
        },
        {
            name: "considernonoverwrite",
            type: ApplicationCommandOptionType.Boolean,
            description:
                "Whether to take non-overwritten plays into consideration. Defaults to true.",
        },
    ],
    example: [
        {
            command: "recent5",
            description: "will display your 50 most recent plays.",
        },
        {
            command: "recent5",
            arguments: [
                {
                    name: "uid",
                    value: 51076,
                },
            ],
            description:
                "will display the 50 most recent plays of an osu!droid account with uid 51076.",
        },
        {
            command: "recent5",
            arguments: [
                {
                    name: "username",
                    value: "NeroYuki",
                },
            ],
            description:
                "will display the 50 most recent plays of an osu!droid account with username NeroYuki.",
        },
        {
            command: "recent5",
            arguments: [
                {
                    name: "user",
                    value: "@Rian8337#0001",
                },
            ],
            description: "will display the 50 most recent plays of Rian8337.",
        },
    ],
};
