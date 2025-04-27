import { Config } from "@core/Config";
import { ScoreRank } from "@rian8337/osu-base";
import { Manager } from "@utils/base/Manager";
import { formatEmoji } from "discord.js";

/**
 * Manager for emotes.
 */
export abstract class EmoteManager extends Manager {
    /**
     * The osu!droid logo as emote.
     */
    static readonly osudroidLogo = formatEmoji(
        Config.isDebug ? "1365833549403390042" : "1365832171327066196"
    );

    /**
     * The osu!lazer logo as emote.
     */
    static readonly osuLazerLogo = formatEmoji(
        Config.isDebug ? "1365833887015768094" : "1365834037641613332"
    );

    /**
     * Gets an emoji that represents a rank.
     *
     * @param rank The rank.
     * @returns The emoji representing the rank.
     */
    static getRankEmote(rank: ScoreRank) {
        let id: string;

        switch (rank) {
            case "A":
                id = Config.isDebug
                    ? "1310146519638478870"
                    : "1310145255303151636";
                break;

            case "B":
                id = Config.isDebug
                    ? "1310146527032774668"
                    : "1310145245392011265";
                break;

            case "C":
                id = Config.isDebug
                    ? "1310146539691315222"
                    : "1310145238077149215";
                break;

            case "D":
                id = Config.isDebug
                    ? "1310146547257704481"
                    : "1310145228560273438";
                break;

            case "S":
                id = Config.isDebug
                    ? "1310146559509528647"
                    : "1310145265168289814";
                break;

            case "X":
                id = Config.isDebug
                    ? "1310146578958389259"
                    : "1310145283853910046";
                break;

            case "SH":
                id = Config.isDebug
                    ? "1310146568090947595"
                    : "1310145274512932907";
                break;

            case "XH":
                id = Config.isDebug
                    ? "1310146587539935272"
                    : "1310145297921478666";
                break;
        }

        return formatEmoji(id);
    }
}
