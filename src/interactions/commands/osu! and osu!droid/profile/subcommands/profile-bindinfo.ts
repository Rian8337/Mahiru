import { bold, GuildMember } from "discord.js";
import { DatabaseManager } from "@database/DatabaseManager";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { UserBind } from "@database/utils/elainaDb/UserBind";
import { Player } from "@rian8337/osu-droid-utilities";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { ProfileLocalization } from "@localization/interactions/commands/osu! and osu!droid/profile/ProfileLocalization";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { StringHelper } from "@utils/helpers/StringHelper";
import { LocaleHelper } from "@utils/helpers/LocaleHelper";
import { ProfileManager } from "@utils/managers/ProfileManager";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { FindOptions } from "mongodb";
import { DatabaseUserBind } from "structures/database/elainaDb/DatabaseUserBind";
import { DroidHelper } from "@utils/helpers/DroidHelper";
import { OfficialDatabaseUser } from "@database/official/schema/OfficialDatabaseUser";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization = new ProfileLocalization(
        CommandHelper.getLocale(interaction),
    );

    if (interaction.options.data.length > 1) {
        interaction.ephemeral = true;

        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("tooManyOptions"),
            ),
        });
    }

    await InteractionHelper.deferReply(interaction);

    const discordid = interaction.options.getUser("user")?.id;
    const uid = interaction.options.getInteger("uid");
    const username = interaction.options.getString("username");

    const dbManager = DatabaseManager.elainaDb.collections.userBind;

    let bindInfo: UserBind | null | undefined;
    let player:
        | Pick<OfficialDatabaseUser, "id" | "username" | "region" | "playcount">
        | Player
        | null = null;

    const findOptions: FindOptions = {
        projection: {
            _id: 0,
            uid: 1,
        },
    };

    switch (true) {
        case !!uid: {
            player = await DroidHelper.getPlayer(uid!, [
                "id",
                "username",
                "region",
                "playcount",
            ]);

            const localUid = player?.id;

            if (localUid !== undefined) {
                bindInfo = await dbManager.getFromUid(localUid, findOptions);
            }

            break;
        }
        case !!username: {
            if (!StringHelper.isUsernameValid(username!)) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation("userProfileNotFound"),
                    ),
                });
            }

            player = await DroidHelper.getPlayer(username, [
                "id",
                "username",
                "region",
                "playcount",
            ]);

            const localUid = player?.id;

            if (localUid !== undefined) {
                bindInfo = await dbManager.getFromUid(localUid, findOptions);
            }

            break;
        }
        default:
            // If no arguments are specified, default to self
            bindInfo = await dbManager.getFromUser(
                discordid ?? interaction.user.id,
                findOptions,
            );

            if (bindInfo?.uid) {
                player = await DroidHelper.getPlayer(bindInfo.uid, [
                    "id",
                    "username",
                    "region",
                    "playcount",
                ]);
            }

            break;
    }

    if (!player) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("userProfileNotFound"),
            ),
        });
    }

    const embed = EmbedCreator.createNormalEmbed({
        color: (<GuildMember | null>interaction.member)?.displayColor,
    });

    const BCP47 = LocaleHelper.convertToBCP47(localization.language);

    const rank =
        player instanceof Player
            ? player.rank
            : ((await DroidHelper.getPlayerPPRank(player.id)) ?? 0);

    embed
        .setAuthor({
            name: StringHelper.formatString(
                localization.getTranslation("playerBindInfo"),
                player.username,
            ),
            iconURL: interaction.user.avatarURL()!,
            url: ProfileManager.getProfileLink(player.id).toString(),
        })
        .setThumbnail(DroidHelper.getAvatarURL(player.id))
        .setDescription(
            `[${localization.getTranslation("avatarLink")}](${DroidHelper.getAvatarURL(
                player.id,
            )})\n\n` +
                `${bold(localization.getTranslation("uid"))}: ${player.id}\n` +
                `${bold(
                    localization.getTranslation("rank"),
                )}: ${rank.toLocaleString(BCP47)}\n` +
                `${bold(
                    localization.getTranslation("playCount"),
                )}: ${(player instanceof Player ? player.playCount : player.playcount).toLocaleString(BCP47)}\n` +
                `${bold(localization.getTranslation("country"))}: ${
                    player instanceof Player
                        ? player.location
                        : player.region.toUpperCase()
                }\n\n` +
                `${bold(localization.getTranslation("bindInformation"))}: ${
                    bindInfo
                        ? StringHelper.formatString(
                              localization.getTranslation("bound"),
                              bindInfo.discordid,
                              bindInfo.discordid,
                          )
                        : localization.getTranslation("notBinded")
                }`,
        );

    InteractionHelper.reply(interaction, {
        embeds: [embed],
    });
};
