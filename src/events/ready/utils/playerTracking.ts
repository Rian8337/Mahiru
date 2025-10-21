import { Config } from "@core/Config";
import { DatabaseManager } from "@database/DatabaseManager";
import { EventUtil } from "structures/core/EventUtil";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandUtilManager } from "@utils/managers/CommandUtilManager";
import { hideLinkEmbed, hyperlink, TextChannel } from "discord.js";
import { Player } from "@rian8337/osu-droid-utilities";
import { ScoreHelper } from "@utils/helpers/ScoreHelper";
import { DroidHelper } from "@utils/helpers/DroidHelper";
import { ProfileManager } from "@utils/managers/ProfileManager";

export const run: EventUtil["run"] = async (client) => {
    const channel = <TextChannel>(
        await client.channels.fetch("665106609382359041")
    );

    setInterval(async () => {
        if (
            Config.maintenance ||
            CommandUtilManager.globallyDisabledEventUtils
                .get("ready")
                ?.includes("playerTracking")
        ) {
            return;
        }

        const trackedPlayers =
            await DatabaseManager.elainaDb.collections.playerTracking.get(
                "uid"
            );

        for (const trackedPlayer of trackedPlayers.values()) {
            const player = await DroidHelper.getPlayer(trackedPlayer.uid);

            if (!player) {
                continue;
            }

            const currentTime = new Date();

            const recentPlays = await ScoreHelper.getRecentScores(
                trackedPlayer.uid,
                player instanceof Player
                    ? player.recentPlays
                    : await DroidHelper.getRecentScores(trackedPlayer.uid)
            );

            for (const score of recentPlays) {
                if (currentTime.getTime() - score.date.getTime() > 600 * 1000) {
                    break;
                }

                channel.send({
                    content: MessageCreator.createAccept(
                        `Recent play for ${hyperlink(player.username, hideLinkEmbed(ProfileManager.getProfileLink(player.id)))}:`
                    ),
                    embeds: [
                        await EmbedCreator.createRecentPlayEmbed(
                            score,
                            8311585
                        ),
                    ],
                });
            }
        }
    }, 600 * 1000);
};

export const config: EventUtil["config"] = {
    description:
        "Responsible for tracking players that are tracked from the `addtrack` command.",
    togglePermissions: ["BotOwner"],
    toggleScope: ["GLOBAL"],
};
