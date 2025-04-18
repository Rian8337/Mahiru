import { DatabaseManager } from "@database/DatabaseManager";
import { ClanAuction } from "@database/utils/aliceDb/ClanAuction";
import { PlayerInfo } from "@database/utils/aliceDb/PlayerInfo";
import { Clan } from "@database/utils/elainaDb/Clan";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { OperationResult } from "structures/core/OperationResult";
import { MessageButtonCreator } from "@utils/creators/MessageButtonCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { NumberHelper } from "@utils/helpers/NumberHelper";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { ClanLocalization } from "@localization/interactions/commands/osu! and osu!droid/clan/ClanLocalization";
import { LocaleHelper } from "@utils/helpers/LocaleHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization: ClanLocalization = new ClanLocalization(
        CommandHelper.getLocale(interaction),
    );

    const name: string = interaction.options.getString("name", true);

    const amount: number = interaction.options.getInteger("amount", true);

    const auction: ClanAuction | null =
        await DatabaseManager.aliceDb.collections.clanAuction.getFromName(name);

    if (!auction) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("auctionDoesntExist"),
            ),
        });
    }

    if (!NumberHelper.isPositive(amount)) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("invalidClanAuctionBidAmount"),
            ),
        });
    }

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

    if (!playerInfo || playerInfo.coins < amount) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("notEnoughCoins"),
                localization.getTranslation("bidToAuction"),
                amount.toLocaleString(
                    LocaleHelper.convertToBCP47(localization.language),
                ),
            ),
        });
    }

    const confirmation: boolean = await MessageButtonCreator.createConfirmation(
        interaction,
        {
            content: MessageCreator.createWarn(
                localization.getTranslation("clanAuctionBidConfirmation"),
            ),
        },
        [interaction.user.id],
        20,
        localization.language,
    );

    if (!confirmation) {
        return;
    }

    auction.bid(clan, amount);

    const coinDeductionResult: OperationResult =
        await playerInfo.incrementCoins(-amount, localization.language);

    if (!coinDeductionResult.success) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("clanAuctionBidFailed"),
                coinDeductionResult.reason!,
            ),
        });
    }

    const finalResult: OperationResult = await auction.updateAuction();

    if (!finalResult.success) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("clanAuctionBidFailed"),
                finalResult.reason!,
            ),
        });
    }

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("clanAuctionBidSuccessful"),
        ),
    });
};
