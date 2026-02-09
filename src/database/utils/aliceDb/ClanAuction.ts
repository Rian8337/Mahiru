import { DatabaseManager } from "@database/DatabaseManager";
import { AuctionBid } from "structures/clan/AuctionBid";
import { DatabaseClanAuction } from "structures/database/aliceDb/DatabaseClanAuction";
import { Manager } from "@utils/base/Manager";
import { Clan } from "@database/utils/elainaDb/Clan";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { ObjectId } from "mongodb";
import { Collection } from "discord.js";
import { ArrayHelper } from "@utils/helpers/ArrayHelper";
import { Powerup } from "structures/clan/Powerup";
import { PowerupType } from "structures/clan/PowerupType";
import { OperationResult } from "structures/core/OperationResult";
import { Language } from "@localization/base/Language";
import { ClanAuctionLocalization } from "@localization/database/utils/aliceDb/ClanAuction/ClanAuctionLocalization";

/**
 * Represents a clan auction.
 */
export class ClanAuction extends Manager {
    /**
     * The BSON object ID of this document in the database.
     */
    readonly _id?: ObjectId;

    /**
     * The name of the auction.
     */
    name: string;

    /**
     * The clan that made this auction.
     */
    auctioneer: string;

    /**
     * The epoch time at which this auction was created, in seconds.
     */
    creationdate: number;

    /**
     * The epoch time at which this auction will expire, in seconds.
     */
    expirydate: number;

    /**
     * The minimum amount of Mahiru coins required to bid in this auction.
     */
    min_price: number;

    /**
     * The name of the powerup that is being auctioned.
     */
    powerup: PowerupType;

    /**
     * The amount of the powerup that is being auctioned.
     */
    amount: number;

    /**
     * The bids that have been made in this auction, sorted by highest amount, mapped by clan name.
     */
    bids: Collection<string, AuctionBid>;

    constructor(
        data: DatabaseClanAuction = DatabaseManager.aliceDb?.collections
            .clanAuction.defaultDocument ?? {},
    ) {
        super();

        this._id = data._id;
        this.name = data.name;
        this.auctioneer = data.auctioneer;
        this.creationdate = data.creationdate;
        this.expirydate = data.expirydate;
        this.min_price = data.min_price;
        this.powerup = data.powerup;
        this.amount = data.amount;
        this.bids = ArrayHelper.arrayToCollection(data.bids ?? [], "clan");
    }

    /**
     * Bids to the auction.
     *
     * @param clan The clan who bid.
     * @param amount The amount of Mahiru coins to bid.
     * @returns An object containing information about the operation.
     */
    bid(clan: Clan, amount: number): OperationResult {
        this.bids.set(clan.name, {
            clan: clan.name,
            amount: (this.bids.get(clan.name)?.amount ?? 0) + amount,
        });

        this.bids.sort((a, b) => b.amount - a.amount);

        return this.createOperationResult(true);
    }

    /**
     * Ends the auction.
     *
     * @param force Whether to forcefully end the auction.
     * @param language The locale of the user who attempted to the end the auction. Defaults to English.
     * @returns An object containing information about the operation.
     */
    async end(
        force?: boolean,
        language: Language = "en",
    ): Promise<OperationResult> {
        const localization: ClanAuctionLocalization =
            this.getLocalization(language);

        if (
            !force &&
            DateTimeFormatHelper.getTimeDifference(this.expirydate * 1000) > 0
        ) {
            return this.createOperationResult(
                false,
                localization.getTranslation("auctionHasntExpired"),
            );
        }

        return DatabaseManager.aliceDb.collections.clanAuction.deleteOne({
            name: this.name,
        });
    }

    /**
     * Gets the clan who won the auction.
     *
     * @returns The clan who won the auction, `null` if there are none (possibly for various reasons (disbanded, database error, etc)).
     */
    async getWinnerClan(): Promise<Clan | null> {
        for (const bid of this.bids.values()) {
            const clan: Clan | null =
                await DatabaseManager.elainaDb.collections.clan.getFromName(
                    bid.clan,
                );

            if (clan) {
                return clan;
            }
        }

        return null;
    }

    /**
     * Gives the auctioned item into a clan.
     *
     * @param clan The clan. If unspecified, the winning clan will be given. This can also be used to save database requests.
     * @param language The locale of the user who attempted to give the auctioned item. Defaults to English.
     * @returns An object containing information about the operation.
     */
    async giveItemTo(
        clan?: Clan,
        language: Language = "en",
    ): Promise<OperationResult> {
        const localization: ClanAuctionLocalization =
            this.getLocalization(language);

        if (!clan) {
            clan = <Clan>await this.getWinnerClan();
            if (!clan) {
                return this.createOperationResult(
                    false,
                    localization.getTranslation("noWinningClan"),
                );
            }
        }

        const powerup: Powerup = clan.powerups.get(this.powerup)!;

        powerup.amount += this.amount;

        clan.powerups.set(this.powerup, powerup);

        return clan.updateClan();
    }

    /**
     * Returns the auctioned item to the auctioneer.
     *
     * @param language The locale of the user who attempted to return the auctioned item. Defaults to English.
     */
    async returnItemToAuctioneer(
        language: Language = "en",
    ): Promise<OperationResult> {
        const localization: ClanAuctionLocalization =
            this.getLocalization(language);

        const clan: Clan | null =
            await DatabaseManager.elainaDb.collections.clan.getFromName(
                this.auctioneer,
            );

        if (!clan) {
            return this.createOperationResult(
                false,
                localization.getTranslation("auctioneerNotFound"),
            );
        }

        const powerup: Powerup = clan.powerups.get(this.powerup)!;

        powerup.amount += this.amount;

        clan.powerups.set(this.powerup, powerup);

        return clan.updateClan();
    }

    /**
     * Updates the auction in auction database.
     *
     * This should only be called after changing everything needed
     * as this will perform a database operation.
     *
     * @returns An object containing information about the operation.
     */
    async updateAuction(): Promise<OperationResult> {
        return DatabaseManager.aliceDb.collections.clanAuction.updateOne(
            { name: this.name },
            {
                $set: {
                    auctioneer: this.auctioneer,
                    creationdate: this.creationdate,
                    expirydate: this.expirydate,
                    min_price: this.min_price,
                    powerup: this.powerup,
                    amount: this.amount,
                    bids: [...this.bids.values()],
                },
            },
        );
    }

    /**
     * Gets the localization of this database utility.
     *
     * @param language The language to localize.
     */
    private getLocalization(language: Language): ClanAuctionLocalization {
        return new ClanAuctionLocalization(language);
    }
}
