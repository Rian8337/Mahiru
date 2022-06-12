import { Collection, GuildEmoji, SelectMenuInteraction } from "discord.js";
import { Constants } from "@alice-core/Constants";
import { DatabaseManager } from "@alice-database/DatabaseManager";
import { SlashSubcommand } from "@alice-interfaces/core/SlashSubcommand";
import { ProfileImageConfig } from "@alice-interfaces/profile/ProfileImageConfig";
import { MessageButtonCreator } from "@alice-utils/creators/MessageButtonCreator";
import { MessageCreator } from "@alice-utils/creators/MessageCreator";
import { ProfileManager } from "@alice-utils/managers/ProfileManager";
import { StringHelper } from "@alice-utils/helpers/StringHelper";
import { PlayerInfo } from "@alice-database/utils/aliceDb/PlayerInfo";
import { UserBind } from "@alice-database/utils/elainaDb/UserBind";
import { ProfileBackground } from "@alice-database/utils/aliceDb/ProfileBackground";
import { SelectMenuCreator } from "@alice-utils/creators/SelectMenuCreator";
import { CommandHelper } from "@alice-utils/helpers/CommandHelper";
import { ProfileLocalization } from "@alice-localization/interactions/commands/osu! and osu!droid/profile/ProfileLocalization";
import { ConstantsLocalization } from "@alice-localization/core/constants/ConstantsLocalization";
import { LocaleHelper } from "@alice-utils/helpers/LocaleHelper";
import { InteractionHelper } from "@alice-utils/helpers/InteractionHelper";

export const run: SlashSubcommand["run"] = async (client, interaction) => {
    const localization: ProfileLocalization = new ProfileLocalization(
        await CommandHelper.getLocale(interaction)
    );

    const bindInfo: UserBind | null =
        await DatabaseManager.elainaDb.collections.userBind.getFromUser(
            interaction.user
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

    const backgroundList: Collection<string, ProfileBackground> =
        await DatabaseManager.aliceDb.collections.profileBackgrounds.get("id");

    const coin: GuildEmoji = client.emojis.cache.get(Constants.aliceCoinEmote)!;

    const selectMenuInteraction: SelectMenuInteraction | null =
        await SelectMenuCreator.createSelectMenu(
            interaction,
            {
                content: MessageCreator.createWarn(
                    localization.getTranslation("chooseBackground")
                ),
            },
            backgroundList.map((v) => {
                return {
                    label: v.name,
                    value: v.id,
                };
            }),
            [interaction.user.id],
            30
        );

    if (!selectMenuInteraction) {
        return;
    }

    const bgId: string = selectMenuInteraction.values[0];

    const background: ProfileBackground = backgroundList.get(bgId)!;

    const playerInfo: PlayerInfo | null =
        await DatabaseManager.aliceDb.collections.playerInfo.getFromUser(
            interaction.user
        );

    const pictureConfig: ProfileImageConfig =
        playerInfo?.picture_config ??
        DatabaseManager.aliceDb.collections.playerInfo.defaultDocument
            .picture_config;

    const isBackgroundOwned: boolean = !!pictureConfig.backgrounds.find(
        (v) => v.id === bgId
    );

    const BCP47: string = LocaleHelper.convertToBCP47(localization.language);

    if (!isBackgroundOwned) {
        if ((playerInfo?.alicecoins ?? 0) < 500) {
            return InteractionHelper.reply(interaction, {
                content: MessageCreator.createReject(
                    localization.getTranslation(
                        "coinsToBuyBackgroundNotEnough"
                    ),
                    coin.toString(),
                    coin.toString(),
                    coin.toString(),
                    (playerInfo?.alicecoins ?? 0).toLocaleString(BCP47)
                ),
            });
        }

        pictureConfig.backgrounds.push(background);
    }

    pictureConfig.activeBackground = background;

    await InteractionHelper.defer(interaction);

    const image: Buffer | null = await ProfileManager.getProfileStatistics(
        bindInfo.uid,
        undefined,
        bindInfo,
        playerInfo,
        undefined,
        true
    );

    if (!image) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("selfProfileNotFound")
            ),
        });
    }

    const confirmation: boolean = await MessageButtonCreator.createConfirmation(
        interaction,
        {
            content: MessageCreator.createWarn(
                isBackgroundOwned
                    ? StringHelper.formatString(
                          localization.getTranslation(
                              "switchBackgroundConfirmation"
                          ),
                          interaction.user.toString()
                      )
                    : StringHelper.formatString(
                          localization.getTranslation(
                              "buyBackgroundConfirmation"
                          ),
                          interaction.user.toString(),
                          coin.toString()
                      )
            ),
            files: [image],
            embeds: [],
        },
        [interaction.user.id],
        15,
        localization.language
    );

    if (!confirmation) {
        return;
    }

    // Safe to assume that the user already has an entry
    // in database as we checked if the user has 500 Alice coins earlier.
    await DatabaseManager.aliceDb.collections.playerInfo.update(
        { discordid: interaction.user.id },
        {
            $set: { picture_config: pictureConfig },
            $inc: { alicecoins: isBackgroundOwned ? 0 : -500 },
        }
    );

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("switchBackgroundSuccess") +
                (isBackgroundOwned
                    ? ""
                    : ` ${StringHelper.formatString(
                          localization.getTranslation("aliceCoinAmount"),
                          coin.toString(),
                          playerInfo!.alicecoins.toLocaleString(BCP47)
                      )}`),
            interaction.user.toString(),
            bgId
        ),
        embeds: [],
        files: [],
    });
};

export const config: SlashSubcommand["config"] = {
    permissions: [],
};