import { Player } from "@rian8337/osu-droid-utilities";
import { registerFont } from "canvas";
import { DatabaseManager } from "@database/DatabaseManager";
import { Manager } from "@utils/base/Manager";
import { ProfileCardCreator } from "@utils/creators/ProfileCardCreator";
import { UserBind } from "@database/utils/elainaDb/UserBind";
import { PlayerInfo } from "@database/utils/aliceDb/PlayerInfo";
import { Language } from "@localization/base/Language";
import { OfficialDatabaseUser } from "@database/official/schema/OfficialDatabaseUser";
import { DroidHelper } from "@utils/helpers/DroidHelper";
import { join } from "path";

/**
 * A manager for osu!droid accounts' profile.
 */
export abstract class ProfileManager extends Manager {
    /**
     * Initializes the manager.
     */
    static override init(): void {
        const fontPath = join(process.cwd(), "files", "fonts");

        registerFont(join(fontPath, "Torus-Thin.otf"), {
            family: "Torus",
            weight: "100",
        });

        registerFont(join(fontPath, "Torus-Light.otf"), {
            family: "Torus",
            weight: "300",
        });

        registerFont(join(fontPath, "Torus-Regular.otf"), {
            family: "Torus",
            weight: "400",
        });

        registerFont(join(fontPath, "Torus-SemiBold.otf"), {
            family: "Torus",
            weight: "600",
        });

        registerFont(join(fontPath, "Torus-SemiBold.otf"), {
            family: "Torus",
            weight: "700",
        });

        registerFont(join(fontPath, "Torus-Bold.otf"), {
            family: "Torus",
            weight: "800",
        });

        registerFont(join(fontPath, "Torus-Heavy.otf"), {
            family: "Torus",
            weight: "900",
        });
    }

    /**
     * Gets the statistics of a player.
     *
     * @param uid The uid of the player.
     * @param player The player instance, if available (this will save an API request towards the osu!droid server).
     * @param bindInfo The bind information, if available (this will save a request towards bot database).
     * @param playerInfo The database player information, if available (this will save a request towards bot database).
     * @param detailed Whether to give a detailed statistics.
     * @param language The locale of the user who attempted to get the player's statistics. Defaults to English.
     * @returns An image containing the player's statistics, `null` if the player is not found.
     */
    static async getProfileStatistics(
        uid: number,
        player?:
            | Pick<
                  OfficialDatabaseUser,
                  | "id"
                  | "username"
                  | "score"
                  | "accuracy"
                  | "playcount"
                  | "region"
                  | "pp"
              >
            | Player,
        bindInfo?: UserBind | null,
        playerInfo?: PlayerInfo | null,
        detailed: boolean = false,
        language: Language = "en",
    ): Promise<Buffer | null> {
        if (bindInfo === undefined) {
            bindInfo =
                await DatabaseManager.elainaDb.collections.userBind.getFromUid(
                    uid,
                    { projection: { _id: 0, clan: 1 } },
                );
        }

        if (!player) {
            const newPlayer = await DroidHelper.getPlayer(uid, [
                "id",
                "username",
                "score",
                "accuracy",
                "playcount",
                "region",
                "pp",
            ]);

            if (!newPlayer) {
                return null;
            }

            player = newPlayer;
        }

        if (playerInfo === undefined && bindInfo) {
            playerInfo =
                await DatabaseManager.aliceDb.collections.playerInfo.getFromUser(
                    bindInfo.discordid,
                    {
                        projection: {
                            _id: 0,
                            picture_config: 1,
                            coins: detailed ? 1 : undefined,
                            points: detailed ? 1 : undefined,
                        },
                    },
                );
        }

        return new ProfileCardCreator(
            player,
            detailed,
            bindInfo,
            playerInfo,
            language,
        ).generateCard();
    }

    /**
     * Gets a link to a player's profile.
     *
     * @param uid The uid of the player.
     * @returns The link to the player's profile.
     */
    static getProfileLink(uid: number): URL {
        // TODO: maybe separate the host to an API request handler
        return new URL(`https://osudroid.moe/profile.php?uid=${uid}`);
    }

    /**
     * Gets profile statistics template of a player for badges.
     *
     * @param uid The uid of the player.
     * @param bindInfo The bind information of the player.
     * @param player The player instance, if available (this will save an API request towards the osu!droid server).
     * @param language The locale of the user who requested the profile template. Defaults to English.
     * @returns A profile statistics template.
     */
    static async getProfileTemplate(
        uid: number,
        bindInfo: UserBind,
        player?:
            | Pick<
                  OfficialDatabaseUser,
                  | "id"
                  | "username"
                  | "score"
                  | "accuracy"
                  | "playcount"
                  | "region"
                  | "pp"
              >
            | Player,
        language: Language = "en",
    ): Promise<Buffer | null> {
        if (!player) {
            const newPlayer = await DroidHelper.getPlayer(uid, [
                "id",
                "username",
                "score",
                "accuracy",
                "playcount",
                "region",
                "pp",
            ]);

            if (!newPlayer) {
                return null;
            }

            player = newPlayer;
        }

        return new ProfileCardCreator(
            player,
            false,
            bindInfo,
            undefined,
            language,
        ).generateTemplateCard();
    }
}
