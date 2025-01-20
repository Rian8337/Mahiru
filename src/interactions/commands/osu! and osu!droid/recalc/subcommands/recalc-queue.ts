import { RecalcLocalization } from "@localization/interactions/commands/osu!droid Elaina PP Project/recalc/RecalcLocalization";
import { SlashSubcommand } from "@structures/core/SlashSubcommand";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { PrototypeRecalculationManager } from "@utils/managers/PrototypeRecalculationManager";
import { GuildMember } from "discord.js";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization = new RecalcLocalization(
        CommandHelper.getLocale(interaction),
    );

    const queue = PrototypeRecalculationManager.recalculationQueue;

    InteractionHelper.reply(interaction, {
        embeds: [
            EmbedCreator.createNormalEmbed({
                author: interaction.user,
                color: (<GuildMember | null>interaction.member)?.displayColor,
            })
                .setTitle(localization.getTranslation("userQueueList"))
                .setDescription(
                    queue.size > 0 ? [...queue.keys()].join(", ") : "None",
                ),
        ],
    });
};
