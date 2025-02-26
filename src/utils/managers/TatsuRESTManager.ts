import { TatsuAPIGuildMemberRanking } from "@structures/utils/TatsuAPIGuildMemberRanking";
import { Snowflake } from "discord.js";
import { RESTManager } from "./RESTManager";

/**
 * A REST manager for the Tatsu API.
 */
export abstract class TatsuRESTManager extends RESTManager {
    /**
     * Gets a user's Tatsu XP in a guild.
     *
     * @param guildId The ID of the guild.
     * @param userId The ID of the user.
     * @returns The user's Tatsu XP, `null` if the request fails (non-`2xx` status code).
     */
    static async getUserTatsuXP(
        guildId: Snowflake,
        userId: Snowflake,
    ): Promise<number | null> {
        const result = await this.request(
            `https://api.tatsu.gg/v1/guilds/${guildId}/rankings/members/${userId}/all`,
            {
                headers: {
                    Authorization: process.env.TATSU_API_KEY!,
                },
            },
        );

        if (result.statusCode !== 200) {
            return null;
        }

        const data: TatsuAPIGuildMemberRanking = JSON.parse(
            result.data.toString("utf-8"),
        );

        return data.score;
    }
}
