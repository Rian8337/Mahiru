import { DatabaseManager } from "@database/DatabaseManager";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { OnButtonPageChange } from "@structures/utils/OnButtonPageChange";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { MessageButtonCreator } from "@utils/creators/MessageButtonCreator";
import { StringHelper } from "@utils/helpers/StringHelper";
import { NumberHelper } from "@utils/helpers/NumberHelper";
import { LeaderboardLocalization } from "@localization/interactions/commands/osu! and osu!droid/leaderboard/LeaderboardLocalization";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization = new LeaderboardLocalization(
        CommandHelper.getLocale(interaction),
    );

    const reworkType = interaction.options.getString("rework") ?? "overall";

    const res =
        await DatabaseManager.aliceDb.collections.prototypePP.getLeaderboard(
            reworkType,
        );

    if (res.size === 0) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("noPrototypeEntriesFound"),
            ),
        });
    }

    const page = NumberHelper.clamp(
        interaction.options.getInteger("page") ?? 1,
        1,
        Math.ceil(res.size / 20),
    );

    const entries = [...res.values()];

    const onPageChange: OnButtonPageChange = async (options, page) => {
        const usernameLengths: number[] = [];

        for (
            let i = 20 * (page - 1);
            i < Math.min(res.size, 20 + 20 * (page - 1));
            ++i
        ) {
            usernameLengths.push(
                StringHelper.getUnicodeStringLength(entries[i].username.trim()),
            );
        }

        const longestUsernameLength = Math.max(...usernameLengths, 16);

        let output = `${"#".padEnd(4)} | ${localization
            .getTranslation("username")
            .padEnd(longestUsernameLength)} | ${localization
            .getTranslation("uid")
            .padEnd(6)} | ${localization.getTranslation("pp")}\n`;

        for (let i = 20 * (page - 1); i < 20 + 20 * (page - 1); ++i) {
            const player = entries.at(i);

            if (player) {
                output += `${(i + 1).toString().padEnd(4)} | ${player.username
                    .trim()
                    .padEnd(longestUsernameLength)} | ${player.uid
                    .toString()
                    .padEnd(6)} | ${player.localPPTotal.toFixed(2)}`;
            } else {
                output += `${"-".padEnd(4)} | ${"-".padEnd(
                    longestUsernameLength,
                )} | ${"-".padEnd(6)} | -`;
            }

            output += "\n";
        }

        options.content = "```c\n" + output + "```";
    };

    MessageButtonCreator.createLimitedButtonBasedPaging(
        interaction,
        {},
        [interaction.user.id],
        page,
        Math.ceil(res.size / 20),
        120,
        onPageChange,
    );
};
