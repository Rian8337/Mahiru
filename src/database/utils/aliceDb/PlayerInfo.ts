import { DatabaseManager } from "@database/DatabaseManager";
import { ChallengeCompletionData } from "structures/challenge/ChallengeCompletionData";
import { DatabasePlayerInfo } from "structures/database/aliceDb/DatabasePlayerInfo";
import { OperationResult } from "structures/core/OperationResult";
import { ProfileImageConfig } from "@structures/profile/ProfileImageConfig";
import { Manager } from "@utils/base/Manager";
import { ArrayHelper } from "@utils/helpers/ArrayHelper";
import { NumberHelper } from "@utils/helpers/NumberHelper";
import { ObjectId } from "mongodb";
import { Collection, Snowflake } from "discord.js";
import { Player } from "@rian8337/osu-droid-utilities";
import { PlayerInfoLocalization } from "@localization/database/utils/aliceDb/PlayerInfo/PlayerInfoLocalization";
import { Language } from "@localization/base/Language";
import { StringHelper } from "@utils/helpers/StringHelper";
import { LocaleHelper } from "@utils/helpers/LocaleHelper";
import { OfficialDatabaseUser } from "@database/official/schema/OfficialDatabaseUser";
import { DroidHelper } from "@utils/helpers/DroidHelper";

/**
 * Represents an information about a Discord user regarding the bot (amount of Mahiru coins and its streak, daily/weekly challenges status, profile picture format, etc).
 */
export class PlayerInfo extends Manager {
    /**
     * The username of the osu!droid account bound to the user.
     */
    username: string;

    /**
     * The UID of the osu!droid account bound to the user.
     */
    uid: number;

    /**
     * The Discord ID of the user.
     */
    discordid: Snowflake;

    /**
     * Information about daily/weekly challenge completions, mapped by challenge ID.
     */
    challenges: Collection<string, ChallengeCompletionData>;

    /**
     * The amount of points the user has from playing daily/weekly challenges.
     */
    points: number;

    /**
     * The amount of Mahiru coins the user has.
     */
    coins: number;

    /**
     * The amount of daily coins claim streak the user has.
     */
    streak: number;

    /**
     * Configuration for profile image.
     */
    picture_config: ProfileImageConfig;

    /**
     * The epoch time at which daily coins claim will be reset,
     * in seconds.
     *
     * This is only available under user ID `386742340968120321`.
     */
    dailyreset?: number;

    /**
     * Whether the user has submitted a beatmap to share.
     */
    hasSubmittedMapShare: boolean;

    /**
     * Whether the user has claimed daily coins.
     */
    hasClaimedDaily: boolean;

    /**
     * Whether the user is banned from sharing beatmaps in map share.
     */
    isBannedFromMapShare: boolean;

    /**
     * The amount of Mahiru coins the user has transferred to other user.
     */
    transferred: number;

    /**
     * The BSON object ID of this document in the database.
     */
    readonly _id?: ObjectId;

    constructor(
        data: DatabasePlayerInfo = DatabaseManager.aliceDb?.collections
            .playerInfo.defaultDocument ?? {},
    ) {
        super();

        this._id = data._id;
        this.discordid = data.discordid;
        this.username = data.username;
        this.uid = data.uid;
        this.challenges = ArrayHelper.arrayToCollection(
            data.challenges ?? [],
            "id",
        );
        this.points = data.points;
        this.coins = data.coins;
        this.streak = data.streak;
        this.picture_config = data.picture_config;
        this.dailyreset = data.dailyreset;
        this.hasSubmittedMapShare = data.hasSubmittedMapShare;
        this.hasClaimedDaily = data.hasClaimedDaily;
        this.isBannedFromMapShare = data.isBannedFromMapShare;
        this.transferred = data.transferred;
    }

    /**
     * Increments the user's coins.
     *
     * @param amount The amount to increment.
     * @param language The locale of the user who attempted to increment this user's coins. Defaults to English.
     * @returns An object containing information about the operation.
     */
    async incrementCoins(
        amount: number,
        language: Language = "en",
    ): Promise<OperationResult> {
        const localization = this.getLocalization(language);

        if (this.coins + amount < 0) {
            // This would only happen if the amount incremented is negative
            return this.createOperationResult(
                false,
                StringHelper.formatString(
                    localization.getTranslation("tooMuchCoinDeduction"),
                    this.coins.toLocaleString(
                        LocaleHelper.convertToBCP47(language),
                    ),
                ),
            );
        }

        this.coins = Math.max(0, this.coins + amount);

        return DatabaseManager.aliceDb.collections.playerInfo.updateOne(
            { discordid: this.discordid },
            { $set: { coins: this.coins } },
        );
    }

    /**
     * Claims daily coins.
     *
     * @param coinAmount The amount of coins the user has gained.
     * @param language The locale of the user who attempted to claim. Defaults to English.
     */
    async claimDailyCoins(
        coinAmount: number,
        language: Language = "en",
    ): Promise<OperationResult> {
        const localization = this.getLocalization(language);

        if (this.hasClaimedDaily) {
            return this.createOperationResult(
                false,
                localization.getTranslation("dailyClaimUsed"),
            );
        }

        this.hasClaimedDaily = true;

        this.coins += coinAmount;

        ++this.streak;

        if (this.streak === 5) {
            this.streak = 1;
        }

        return DatabaseManager.aliceDb.collections.playerInfo.updateOne(
            { discordid: this.discordid },
            {
                $inc: {
                    coins: coinAmount,
                },
                $set: {
                    hasClaimedDaily: this.hasClaimedDaily,
                    streak: this.streak,
                },
            },
        );
    }

    /**
     * Transfers this user's coins to another user.
     *
     * @param amount The amount of coins to transfer.
     * @param thisPlayer The `Player` instance of this user.
     * @param to The player to transfer the Mahiru coins to.
     * @param limit The limit of coins that can be transferred, if available.
     * @param language The locale of the user who attempted the transfer. Defaults to English.
     * @returns An object containing information about the operation.
     */
    async transferCoins(
        amount: number,
        thisPlayer: Pick<OfficialDatabaseUser, "id"> | Player,
        to: PlayerInfo,
        limit?: number,
        language: Language = "en",
    ): Promise<OperationResult> {
        const localization = this.getLocalization(language);

        if (limit === undefined) {
            const rank =
                thisPlayer instanceof Player
                    ? thisPlayer.rank
                    : ((await DroidHelper.getPlayerPPRank(thisPlayer.id)) ?? 0);

            switch (true) {
                case rank < 10:
                    limit = 2500;
                    break;
                case rank < 50:
                    limit = 1750;
                    break;
                case rank < 100:
                    limit = 1250;
                    break;
                case rank < 500:
                    limit = 500;
                    break;
                default:
                    limit = 250;
            }
        }

        if (
            !NumberHelper.isNumberInRange(
                amount + this.transferred,
                0,
                limit,
                true,
            )
        ) {
            return this.createOperationResult(
                false,
                StringHelper.formatString(
                    localization.getTranslation("dailyLimitReached"),
                    (limit - this.transferred).toLocaleString(
                        LocaleHelper.convertToBCP47(language),
                    ),
                ),
            );
        }

        await DatabaseManager.aliceDb.collections.playerInfo.updateOne(
            { discordid: this.discordid },
            { $inc: { transferred: amount, coins: -amount } },
        );

        return to.incrementCoins(amount);
    }

    /**
     * Gets the localization of this database utility.
     *
     * @param language The language to localize.
     */
    private getLocalization(language: Language): PlayerInfoLocalization {
        return new PlayerInfoLocalization(language);
    }
}
