import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { OnButtonPageChange } from "@structures/utils/OnButtonPageChange";
import { NamechangeLocalization } from "@localization/interactions/commands/osu! and osu!droid/namechange/NamechangeLocalization";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageButtonCreator } from "@utils/creators/MessageButtonCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { NumberHelper } from "@utils/helpers/NumberHelper";
import { GuildMember, bold } from "discord.js";
import { StringHelper } from "@utils/helpers/StringHelper";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization = new NamechangeLocalization(
        CommandHelper.getLocale(interaction),
    );

    const uid = interaction.options.getInteger("uid", true);

    if (
        !NumberHelper.isNumberInRange(
            uid,
            Constants.uidMinLimit,
            Constants.uidMaxLimit,
        )
    ) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("invalidUid"),
            ),
        });
    }

    const nameChange =
        await DatabaseManager.aliceDb.collections.nameChange.getFromUid(uid);

    if (!nameChange) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("userHasNoHistory"),
            ),
        });
    }

    const embed = EmbedCreator.createNormalEmbed({
        author: interaction.user,
        color: (<GuildMember | null>interaction.member)?.displayColor,
    });

    embed.setTitle(
        StringHelper.formatString(
            localization.getTranslation("nameHistoryForUid"),
            uid.toString(),
        ),
    );

    const onPageChange: OnButtonPageChange = async (_, page) => {
        embed.addFields({
            name: StringHelper.formatString(
                localization.getTranslation("nameHistoryForUid"),
                uid.toString(),
            ),
            value: nameChange.previous_usernames
                .slice(10 * (page - 1), 10 + 10 * (page - 1))
                .map(
                    (v, i) =>
                        `${bold((10 * (page - 1) + i + 1).toString())}. ${v}`,
                )
                .join("\n"),
        });
    };

    MessageButtonCreator.createLimitedButtonBasedPaging(
        interaction,
        { embeds: [embed] },
        [interaction.user.id],
        1,
        Math.ceil(nameChange.previous_usernames.length / 10),
        120,
        onPageChange,
    );
};
