import { DatabaseManager } from "@alice-database/DatabaseManager";
import { PlayerInfo } from "@alice-database/utils/aliceDb/PlayerInfo";
import { Clan } from "@alice-database/utils/elainaDb/Clan";
import { Subcommand } from "@alice-interfaces/core/Subcommand";
import { OperationResult } from "@alice-interfaces/core/OperationResult";
import { PowerupType } from "@alice-types/clan/PowerupType";
import { MessageButtonCreator } from "@alice-utils/creators/MessageButtonCreator";
import { MessageCreator } from "@alice-utils/creators/MessageCreator";
import { ClanLocalization } from "@alice-localization/commands/osu! and osu!droid/clan/ClanLocalization";
import { CommandHelper } from "@alice-utils/helpers/CommandHelper";
import { StringHelper } from "@alice-utils/helpers/StringHelper";
import { LocaleHelper } from "@alice-utils/helpers/LocaleHelper";
import { InteractionHelper } from "@alice-utils/helpers/InteractionHelper";

export const run: Subcommand["run"] = async (_, interaction) => {
    const localization: ClanLocalization = new ClanLocalization(
        await CommandHelper.getLocale(interaction)
    );

    const clan: Clan | null =
        await DatabaseManager.elainaDb.collections.clan.getFromUser(
            interaction.user
        );

    if (!clan) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("selfIsNotInClan")
            ),
        });
    }

    const playerInfo: PlayerInfo | null =
        await DatabaseManager.aliceDb.collections.playerInfo.getFromUser(
            interaction.user
        );

    const cost: number = 100;

    const BCP47: string = LocaleHelper.convertToBCP47(localization.language);

    if (!playerInfo || playerInfo.alicecoins < cost) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("notEnoughCoins"),
                StringHelper.formatString(
                    localization.getTranslation("buyShopItem"),
                    localization.getTranslation("clanPowerup")
                ),
                cost.toLocaleString(BCP47)
            ),
        });
    }

    const confirmation: boolean = await MessageButtonCreator.createConfirmation(
        interaction,
        {
            content: MessageCreator.createWarn(
                localization.getTranslation("buyShopItemConfirmation"),
                localization.getTranslation("clanPowerup"),
                cost.toLocaleString(BCP47)
            ),
        },
        [interaction.user.id],
        20,
        localization.language
    );

    if (!confirmation) {
        return;
    }

    const coinDeductionResult: OperationResult =
        await playerInfo.incrementCoins(-cost, localization.language);

    if (!coinDeductionResult.success) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("buyShopItemFailed"),
                coinDeductionResult.reason!
            ),
        });
    }

    // Gacha style
    const gachaNum: number = Math.random() * 100;

    let powerup: PowerupType | undefined;

    switch (true) {
        case gachaNum <= 20: // 20% chance of not getting anything
            break;
        case gachaNum <= 50:
            powerup = "bomb"; // 30% chance
            break;
        case gachaNum <= 75:
            powerup = "challenge"; // 25% chance
            break;
        case gachaNum <= 82.5:
            powerup = "debuff"; // 7.5% chance
            break;
        case gachaNum <= 90:
            powerup = "buff"; // 7.5% chance
            break;
        case gachaNum <= 94:
            powerup = "superbomb"; // 4% chance
            break;
        case gachaNum <= 98:
            powerup = "superchallenge"; // 4% chance
            break;
        case gachaNum <= 99:
            powerup = "superdebuff"; // 1% chance
            break;
        case gachaNum <= 100:
            powerup = "superbuff"; // 1% chance
            break;
    }

    if (!powerup) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("powerupGachaNoResult")
            ),
        });
    }

    ++clan.powerups.get(powerup)!.amount;

    const result: OperationResult = await clan.updateClan();

    if (!result.success) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("buyShopItemFailed"),
                result.reason!
            ),
        });
    }

    InteractionHelper.reply(interaction, {
        content: [
            MessageCreator.createAccept(
                localization.getTranslation("powerupGachaWin"),
                powerup
            ),
            MessageCreator.createAccept(
                localization.getTranslation("buyShopItemSuccessful"),
                cost.toLocaleString(BCP47)
            ),
        ].join("\n"),
    });
};

export const config: Subcommand["config"] = {
    permissions: [],
};
