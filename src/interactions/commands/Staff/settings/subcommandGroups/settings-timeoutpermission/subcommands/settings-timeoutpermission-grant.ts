import { DatabaseManager } from "@database/DatabaseManager";
import { GuildPunishmentConfig } from "@database/utils/aliceDb/GuildPunishmentConfig";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { SettingsLocalization } from "@localization/interactions/commands/Staff/settings/SettingsLocalization";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { NumberHelper } from "@utils/helpers/NumberHelper";
import { Role } from "discord.js";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    if (!interaction.inGuild()) {
        return;
    }

    const localization: SettingsLocalization = new SettingsLocalization(
        CommandHelper.getLocale(interaction),
    );

    const role: Role = <Role>interaction.options.getRole("role", true);

    const durationInput: string = interaction.options.getString(
        "duration",
        true,
    );

    const duration: number =
        parseFloat(durationInput) ||
        DateTimeFormatHelper.DHMStoSeconds(durationInput);

    const guildConfig: GuildPunishmentConfig | null =
        await DatabaseManager.aliceDb.collections.guildPunishmentConfig.getGuildConfig(
            interaction.guildId,
        );

    if (!guildConfig?.getGuildLogChannel(interaction.guild!)) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("noLogChannelConfigured"),
            ),
        });
    }

    if (
        duration !== -1 &&
        !NumberHelper.isNumberInRange(
            duration,
            30,
            Number.POSITIVE_INFINITY,
            true,
        )
    ) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("invalidTimeoutPermissionDuration"),
            ),
        });
    }

    await guildConfig.grantTimeoutPermission(role.id, duration);

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("grantTimeoutPermissionSuccess"),
            role.name,
        ),
    });
};

export const config: SlashSubcommand["config"] = {
    permissions: ["Administrator"],
};
