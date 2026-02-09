import { DatabaseAccountTransfer } from "@structures/database/aliceDb/DatabaseAccountTransfer";
import { DatabaseCollectionManager } from "../DatabaseCollectionManager";
import { AccountTransfer } from "@database/utils/aliceDb/AccountTransfer";
import { FindOptions } from "mongodb";
import { Snowflake } from "discord.js";

/**
 * A manager for the `accounttransfer` collection.
 */
export class AccountTransferCollectionManager extends DatabaseCollectionManager<
    DatabaseAccountTransfer,
    AccountTransfer
> {
    protected override readonly utilityInstance: new (
        data: DatabaseAccountTransfer,
    ) => AccountTransfer = AccountTransfer;

    override get defaultDocument(): DatabaseAccountTransfer {
        return {
            discordId: "",
            transferUid: 0,
            transferList: [],
        };
    }

    /**
     * Gets account transfer data from an osu!droid account's uid.
     *
     * @param uid The uid to search for.
     * @param options The options for the find operation.
     * @returns The account transfer data, `null` if not found.
     */
    getFromUid(
        uid: number,
        options?: FindOptions,
    ): Promise<AccountTransfer | null> {
        return this.getOne({ transferList: uid }, options);
    }

    /**
     * Gets account transfer data from a Discord ID.
     *
     * @param id The Discord ID to search for.
     * @param options The options for the find operation.
     * @returns The account transfer data, `null` if not found.
     */
    getFromDiscordId(
        id: Snowflake,
        options?: FindOptions,
    ): Promise<AccountTransfer | null> {
        return this.getOne({ discordId: id }, options);
    }
}
