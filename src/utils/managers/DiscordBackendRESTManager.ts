import { Config } from "@core/Config";
import { RequestResponse } from "@rian8337/osu-base";
import { RESTManager } from "./RESTManager";

/**
 * A REST manager for the dedicated Discord backend.
 */
export abstract class DiscordBackendRESTManager extends RESTManager {
    private static readonly endpoint = Config.isDebug
        ? "https://droidpp.osudroid.moe/api/discord/"
        : "http://localhost:3004/api/discord/";

    /**
     * Updates the role connection metadata of a Discord user.
     *
     * @param userId The ID of the user.
     */
    static updateMetadata(userId: string): Promise<RequestResponse> {
        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("key", process.env.DISCORD_OAUTH_BACKEND_INTERNAL_KEY!);

        return this.request(`${this.endpoint}update-metadata`, {
            method: "POST",
            body: formData,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
}
