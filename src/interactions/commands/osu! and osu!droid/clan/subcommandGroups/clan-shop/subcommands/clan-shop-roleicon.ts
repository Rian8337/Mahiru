import { DatabaseManager } from "@database/DatabaseManager";
import { PlayerInfo } from "@database/utils/aliceDb/PlayerInfo";
import { Clan } from "@database/utils/elainaDb/Clan";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { OperationResult } from "structures/core/OperationResult";
import { MessageButtonCreator } from "@utils/creators/MessageButtonCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { Role } from "discord.js";
import { ClanLocalization } from "@localization/interactions/commands/osu! and osu!droid/clan/ClanLocalization";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { StringHelper } from "@utils/helpers/StringHelper";
import { LocaleHelper } from "@utils/helpers/LocaleHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization: ClanLocalization = new ClanLocalization(
        CommandHelper.getLocale(interaction),
    );

    const clan: Clan | null =
        await DatabaseManager.elainaDb.collections.clan.getFromUser(
            interaction.user,
        );

    if (!clan) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("selfIsNotInClan"),
            ),
        });
    }

    if (clan.roleIconUnlocked) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("shopItemIsUnlocked"),
            ),
        });
    }

    if (!clan.isLeader(interaction.user)) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation(
                    "selfHasNoAdministrativePermission",
                ),
            ),
        });
    }

    const powerReq: number = 3500;

    const BCP47: string = LocaleHelper.convertToBCP47(localization.language);

    if (clan.power < powerReq) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("clanPowerNotEnoughToBuyItem"),
                powerReq.toLocaleString(BCP47),
            ),
        });
    }

    const clanRole: Role | undefined = await clan.getClanRole();

    if (!clanRole) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("clanDoesntHaveClanRole"),
            ),
        });
    }

    const playerInfo: PlayerInfo | null =
        await DatabaseManager.aliceDb.collections.playerInfo.getFromUser(
            interaction.user,
            {
                projection: {
                    _id: 0,
                    coins: 1,
                },
            },
        );

    const cost: number = 25000;

    if (!playerInfo || playerInfo.coins < cost) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("notEnoughCoins"),
                StringHelper.formatString(
                    localization.getTranslation("buyShopItem"),
                    localization.getTranslation("clanRoleIconUnlock"),
                ),
                cost.toLocaleString(BCP47),
            ),
        });
    }

    const confirmation: boolean = await MessageButtonCreator.createConfirmation(
        interaction,
        {
            content: MessageCreator.createWarn(
                localization.getTranslation("buyShopItemConfirmation"),
                localization.getTranslation("clanRoleIconUnlock"),
                cost.toLocaleString(BCP47),
            ),
        },
        [interaction.user.id],
        20,
        localization.language,
    );

    if (!confirmation) {
        return;
    }

    const firstResult: OperationResult = await playerInfo.incrementCoins(
        -cost,
        localization.language,
    );

    if (!firstResult.success) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("buyShopItemFailed"),
                firstResult.reason!,
            ),
        });
    }

    clan.roleIconUnlocked = true;

    const finalResult: OperationResult = await clan.updateClan();

    if (!finalResult.success) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("buyShopItemFailed"),
                finalResult.reason!,
            ),
        });
    }

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("buyShopItemSuccessful"),
            cost.toLocaleString(BCP47),
        ),
    });
};
