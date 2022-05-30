import { Constants } from "@alice-core/Constants";
import { DatabaseManager } from "@alice-database/DatabaseManager";
import { NameChange } from "@alice-database/utils/aliceDb/NameChange";
import { SlashSubcommand } from "@alice-interfaces/core/SlashSubcommand";
import { OnButtonPageChange } from "@alice-interfaces/utils/OnButtonPageChange";
import { NamechangeLocalization } from "@alice-localization/commands/osu! and osu!droid/namechange/NamechangeLocalization";
import { EmbedCreator } from "@alice-utils/creators/EmbedCreator";
import { MessageButtonCreator } from "@alice-utils/creators/MessageButtonCreator";
import { MessageCreator } from "@alice-utils/creators/MessageCreator";
import { CommandHelper } from "@alice-utils/helpers/CommandHelper";
import { InteractionHelper } from "@alice-utils/helpers/InteractionHelper";
import { NumberHelper } from "@alice-utils/helpers/NumberHelper";
import { GuildMember, MessageEmbed } from "discord.js";

export const run: SlashSubcommand["run"] = async (_, interaction) => {
    const localization: NamechangeLocalization = new NamechangeLocalization(
        await CommandHelper.getLocale(interaction)
    );

    const uid: number = interaction.options.getInteger("uid", true);

    if (
        !NumberHelper.isNumberInRange(
            uid,
            Constants.uidMinLimit,
            Constants.uidMaxLimit
        )
    ) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("invalidUid")
            ),
        });
    }

    const nameChange: NameChange | null =
        await DatabaseManager.aliceDb.collections.nameChange.getFromUid(uid);

    if (!nameChange) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("userHasNoHistory")
            ),
        });
    }

    const embed: MessageEmbed = EmbedCreator.createNormalEmbed({
        author: interaction.user,
        color: (<GuildMember | null>interaction.member)?.displayColor,
    });

    embed.setTitle(localization.getTranslation("nameHistoryForUid"));

    const onPageChange: OnButtonPageChange = async (_, page) => {
        embed.addField(
            localization.getTranslation("nameHistory"),
            nameChange.previous_usernames
                .slice(10 * (page - 1), 10 + 10 * (page - 1))
                .map((v, i) => `**${10 * (page - 1) + i + 1}.** ${v}`)
                .join("\n")
        );
    };

    MessageButtonCreator.createLimitedButtonBasedPaging(
        interaction,
        { embeds: [embed] },
        [interaction.user.id],
        1,
        Math.ceil(nameChange.previous_usernames.length / 10),
        120,
        onPageChange
    );
};

export const config: SlashSubcommand["config"] = {
    permissions: [],
};
