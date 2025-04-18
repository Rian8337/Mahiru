import { Config } from "@core/Config";
import { DatabaseManager } from "@database/DatabaseManager";
import { EventUtil } from "structures/core/EventUtil";
import { Player } from "@rian8337/osu-droid-utilities";
import { CommandUtilManager } from "@utils/managers/CommandUtilManager";
import { DroidHelper } from "@utils/helpers/DroidHelper";

export const run: EventUtil["run"] = async () => {
    setInterval(
        async () => {
            if (
                Config.maintenance ||
                CommandUtilManager.globallyDisabledEventUtils
                    .get("ready")
                    ?.includes("clanRankUpdating")
            ) {
                return;
            }

            const executionTime = Math.floor(Date.now() / 1000);

            const clans =
                await DatabaseManager.elainaDb.collections.clan.get("name");

            for (const clan of clans.values()) {
                // Do not update rank if weekly upkeep is near
                if (clan.weeklyfee - executionTime <= 60 * 10) {
                    continue;
                }

                for (const member of clan.member_list.values()) {
                    const bindInfo =
                        await DatabaseManager.elainaDb.collections.userBind.getFromUser(
                            member.id,
                            {
                                projection: {
                                    _id: 0,
                                },
                            },
                        );

                    if (!bindInfo) {
                        continue;
                    }

                    const player = await DroidHelper.getPlayer(member.id, [
                        "id",
                    ]);

                    if (!player) {
                        continue;
                    }

                    member.rank =
                        player instanceof Player
                            ? player.rank
                            : ((await DroidHelper.getPlayerPPRank(player.id)) ??
                              0);
                }

                await clan.updateClan();
            }
        },
        60 * 20 * 1000,
    );
};

export const config: EventUtil["config"] = {
    description: "Responsible for occasionally updating ranks of clan members.",
    togglePermissions: ["BotOwner"],
    toggleScope: ["GLOBAL"],
};
