import { DatabaseManager } from "@database/DatabaseManager";
import { IllegalMap } from "@database/utils/aliceDb/IllegalMap";
import { EventUtil } from "structures/core/EventUtil";
import { Collection } from "discord.js";

export const run: EventUtil["run"] = async () => {
    setInterval(async () => {
        let illegalMaps: Collection<string, IllegalMap>;

        while (
            (illegalMaps =
                await DatabaseManager.aliceDb.collections.illegalMap.getUnscannedBeatmaps(
                    100,
                )).size > 0
        ) {
            for (const illegalMap of illegalMaps.values()) {
                await illegalMap.scanAndDelete();
            }
        }

        await DatabaseManager.aliceDb.collections.illegalMap.updateMany(
            {},
            {
                $unset: {
                    deleteDone: "",
                },
            },
        );
    }, 1800 * 1000);
};

export const config: EventUtil["config"] = {
    description: "Responsible for wiping abused osu!droid scores periodically.",
    togglePermissions: ["BotOwner"],
    toggleScope: ["GLOBAL"],
};
