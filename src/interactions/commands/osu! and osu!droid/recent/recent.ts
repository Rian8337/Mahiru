import { Constants } from "@alice-core/Constants";
import { DatabaseManager } from "@alice-database/DatabaseManager";
import { UserBindCollectionManager } from "@alice-database/managers/elainaDb/UserBindCollectionManager";
import { UserBind } from "@alice-database/utils/elainaDb/UserBind";
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";
import { CommandCategory } from "@alice-enums/core/CommandCategory";
import { SlashCommand } from "@alice-interfaces/core/SlashCommand";
import { EmbedCreator } from "@alice-utils/creators/EmbedCreator";
import { MessageCreator } from "@alice-utils/creators/MessageCreator";
import { BeatmapManager } from "@alice-utils/managers/BeatmapManager";
import { GuildMember, MessageEmbed, Snowflake } from "discord.js";
import { Player } from "@rian8337/osu-droid-utilities";
import { CommandHelper } from "@alice-utils/helpers/CommandHelper";
import { RecentLocalization } from "@alice-localization/interactions/commands/osu! and osu!droid/recent/RecentLocalization";
import { ConstantsLocalization } from "@alice-localization/core/constants/ConstantsLocalization";
import { InteractionHelper } from "@alice-utils/helpers/InteractionHelper";

export const run: SlashCommand["run"] = async (_, interaction) => {
    const localization: RecentLocalization = new RecentLocalization(
        await CommandHelper.getLocale(interaction)
    );

    if (interaction.options.data.length > 1) {
        interaction.ephemeral = true;

        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("tooManyOptions")
            ),
        });
    }

    await InteractionHelper.defer(interaction);

    const discordid: Snowflake | undefined =
        interaction.options.getUser("user")?.id;
    let uid: number | undefined | null = interaction.options.getInteger("uid");
    const username: string | null = interaction.options.getString("username");

    const dbManager: UserBindCollectionManager =
        DatabaseManager.elainaDb.collections.userBind;

    let bindInfo: UserBind | null | undefined;

    let player: Player | undefined;

    switch (true) {
        case !!uid:
            player = await Player.getInformation({ uid: uid! });
            uid = player.uid;
            break;
        case !!username:
            player = await Player.getInformation({ username: username! });
            uid = player.uid;
            break;
        case !!discordid:
            bindInfo = await dbManager.getFromUser(discordid!, {
                retrieveAllPlays: false,
            });

            if (!bindInfo) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        new ConstantsLocalization(
                            localization.language
                        ).getTranslation(Constants.userNotBindedReject)
                    ),
                });
            }

            player = await Player.getInformation({ uid: bindInfo.uid });
            break;
        default:
            // If no arguments are specified, default to self
            bindInfo = await dbManager.getFromUser(interaction.user, {
                retrieveAllPlays: false,
            });

            if (!bindInfo) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        new ConstantsLocalization(
                            localization.language
                        ).getTranslation(Constants.selfNotBindedReject)
                    ),
                });
            }

            player = await Player.getInformation({ uid: bindInfo.uid });
    }

    if (!player.username) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("playerNotFound")
            ),
        });
    }

    if (player.recentPlays.length === 0) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("playerHasNoRecentPlays")
            ),
        });
    }

    const index: number = interaction.options.getInteger("index") ?? 1;

    if (!player.recentPlays[index - 1]) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("playIndexOutOfBounds"),
                index.toString()
            ),
        });
    }

    BeatmapManager.setChannelLatestBeatmap(
        interaction.channel!.id,
        player.recentPlays[index - 1].hash
    );

    const embed: MessageEmbed = await EmbedCreator.createRecentPlayEmbed(
        player.recentPlays[index - 1],
        player.avatarURL,
        (<GuildMember | null>interaction.member)?.displayColor,
        localization.language
    );

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("recentPlayDisplay"),
            player.username
        ),
        embeds: [embed],
    });
};

export const category: SlashCommand["category"] = CommandCategory.OSU;

export const config: SlashCommand["config"] = {
    name: "recent",
    description: "Shows the recent play of yourself or a player.",
    options: [
        {
            name: "user",
            type: ApplicationCommandOptionTypes.USER,
            description: "The Discord user to show.",
        },
        {
            name: "uid",
            type: ApplicationCommandOptionTypes.INTEGER,
            description: "The uid of the player.",
        },
        {
            name: "username",
            type: ApplicationCommandOptionTypes.STRING,
            description: "The username of the player.",
        },
        {
            name: "index",
            type: ApplicationCommandOptionTypes.INTEGER,
            description:
                "The n-th play to show, ranging from 1 to 50. Defaults to the most recent play.",
            minValue: 1,
            maxValue: 50,
        },
    ],
    example: [
        {
            command: "recent",
            description: "will show your most recent play.",
        },
        {
            command: "recent",
            arguments: [
                {
                    name: "uid",
                    value: 51076,
                },
                {
                    name: "index",
                    value: 5,
                },
            ],
            description: "will show the 5th most recent play of uid 51076.",
        },
        {
            command: "recent",
            arguments: [
                {
                    name: "username",
                    value: "NeroYuki",
                },
                {
                    name: "index",
                    value: 2,
                },
            ],
            description:
                "will show the 2nd most recent play of username NeroYuki.",
        },
        {
            command: "recent",
            arguments: [
                {
                    name: "user",
                    value: "@Rian8337#0001",
                },
            ],
            description: "will show the most recent play of Rian8337.",
        },
    ],
    permissions: [],
    scope: "ALL",
};
