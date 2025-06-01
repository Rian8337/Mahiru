import { Config } from "@core/Config";
import { Constants } from "@core/Constants";
import { EventUtil } from "structures/core/EventUtil";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { RunCommandLocalization } from "@localization/events/interactionCreate/runCommand/RunCommandLocalization";
import {
    ChannelCooldownKey,
    GlobalCooldownKey,
} from "structures/core/CooldownKey";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { PermissionHelper } from "@utils/helpers/PermissionHelper";
import { StringHelper } from "@utils/helpers/StringHelper";
import { CommandUtilManager } from "@utils/managers/CommandUtilManager";
import {
    BaseInteraction,
    CacheType,
    CommandInteractionOption,
} from "discord.js";
import { consola } from "consola";

export const run: EventUtil["run"] = async (
    client,
    interaction: BaseInteraction
) => {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const localization = new RunCommandLocalization(
        CommandHelper.getLocale(interaction)
    );

    const botOwnerExecution = CommandHelper.isExecutedByBotOwner(interaction);

    if (Config.isDebug && !botOwnerExecution) {
        return interaction.reply({
            content: MessageCreator.createReject(
                localization.getTranslation("debugModeActive")
            ),
            ephemeral: true,
        });
    }

    const command = client.interactions.chatInput.get(interaction.commandName);

    if (!command) {
        return interaction.reply({
            content: MessageCreator.createReject(
                localization.getTranslation("commandNotFound")
            ),
            ephemeral: true,
        });
    }

    // Check for maintenance
    if (Config.maintenance && !botOwnerExecution) {
        return interaction.reply({
            content: MessageCreator.createReject(
                StringHelper.formatString(
                    localization.getTranslation("maintenanceMode"),
                    Config.maintenanceReason
                )
            ),
            ephemeral: true,
        });
    }

    // Permissions
    if (
        command.config.permissions &&
        !CommandHelper.userFulfillsCommandPermission(
            interaction,
            command.config.permissions
        )
    ) {
        return interaction.reply({
            content: MessageCreator.createReject(
                `${new ConstantsLocalization(
                    localization.language
                ).getTranslation(
                    Constants.noPermissionReject
                )} ${localization.getTranslation("requiredPermissions")}`,
                PermissionHelper.getPermissionString(command.config.permissions)
            ),
            ephemeral: true,
        });
    }

    const subcommand = CommandHelper.getSlashSubcommand(interaction);
    const subcommandGroup = CommandHelper.getSlashSubcommandGroup(interaction);

    // Command cooldown
    if (!botOwnerExecution) {
        const channelCooldownKey: ChannelCooldownKey = `${interaction.user.id}:${interaction.channelId}:${interaction.commandName}`;
        const globalCooldownKey: GlobalCooldownKey = `${interaction.user.id}:${interaction.commandName}`;

        if (
            CommandHelper.isCooldownActive(channelCooldownKey) ||
            CommandHelper.isCooldownActive(globalCooldownKey)
        ) {
            return interaction.reply({
                content: MessageCreator.createReject(
                    localization.getTranslation("commandInCooldown")
                ),
                ephemeral: true,
            });
        }

        const channelCooldown = Math.max(
            // Local command cooldown
            command.config.cooldown ?? 0,
            // Local subcommand cooldown
            subcommand?.config?.cooldown ?? 0,
            // Local subcommand group cooldown
            subcommandGroup?.config?.cooldown ?? 0,
            // Guild command cooldown
            CommandUtilManager.guildDisabledCommands
                .get(interaction.guildId!)
                ?.get(interaction.commandName)?.cooldown ?? 0,
            // Channel command cooldown
            CommandUtilManager.channelDisabledCommands
                .get(interaction.channelId)
                ?.get(interaction.commandName)?.cooldown ?? 0
        );

        const globalCooldown = Math.max(
            // Global command cooldown
            CommandUtilManager.globallyDisabledCommands.get(
                interaction.commandName
            ) ?? 0,
            // Global cooldown
            CommandUtilManager.globalCommandCooldown
        );

        CommandHelper.setCooldown(
            globalCooldown > channelCooldown ||
                (globalCooldown === channelCooldown &&
                    (CommandUtilManager.globallyDisabledCommands.get(
                        interaction.commandName
                    ) ||
                        CommandUtilManager.globalCommandCooldown))
                ? globalCooldownKey
                : channelCooldownKey,
            Math.max(channelCooldown, globalCooldown)
        );
    }

    // Log used command along with its subcommand group, subcommand, and options
    let logMessage = `Slash: ${interaction.user.tag}`;

    if (interaction.channel !== null) {
        if (interaction.channel.isDMBased()) {
            logMessage += ` (DM)`;
        } else {
            logMessage += ` (#${interaction.channel.name})`;
        }
    }

    logMessage += `: ${interaction.commandName}`;

    if (interaction.options.getSubcommandGroup(false)) {
        logMessage += ` ${interaction.options.getSubcommandGroup()}`;
    }

    if (interaction.options.getSubcommand(false)) {
        logMessage += ` ${interaction.options.getSubcommand()}`;
    }

    let usedOptions: readonly CommandInteractionOption<CacheType>[];

    if (interaction.options.getSubcommandGroup(false)) {
        usedOptions = interaction.options.data[0].options![0].options ?? [];
    } else if (interaction.options.getSubcommand(false)) {
        usedOptions = interaction.options.data[0].options ?? [];
    } else {
        usedOptions = interaction.options.data;
    }

    const optionsStr = usedOptions
        .map((v) => {
            let str = `${v.name}:`;

            switch (true) {
                case !!v.channel:
                    str += `#${v.channel?.name}`;
                    break;
                case !!v.user:
                    str += `@${v.user?.tag}`;
                    break;
                case !!v.role:
                    str += `@${v.role?.name}`;
                    break;
                case !!v.value:
                    str += v.value;
                    break;
            }

            return str;
        })
        .join(" ");

    consola.info(`${logMessage} ${optionsStr}`);

    interaction.ephemeral =
        (interaction.inGuild() &&
            (command.config.replyEphemeral ||
                Config.maintenance ||
                !CommandHelper.isCommandEnabled(interaction) ||
                subcommand?.config?.replyEphemeral ||
                subcommandGroup?.config?.replyEphemeral)) ??
        false;

    if (Config.isDebug) {
        // Attempt to instantly defer in debug mode (slower internet).
        const instantDefer =
            command.config.instantDeferInDebug !== false &&
            subcommandGroup?.config?.instantDeferInDebug !== false &&
            subcommand?.config?.instantDeferInDebug !== false;

        if (instantDefer) {
            await InteractionHelper.deferReply(interaction);
        }
    }

    // Finally, run the command
    command.run(client, interaction).catch((e: Error) => {
        InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("commandExecutionFailed")
            ),
        });

        client.emit("error", e);
    });
};

export const config: EventUtil["config"] = {
    description:
        "Responsible for handling commands received from interactions. This event utility cannot be disabled.",
    togglePermissions: [],
    toggleScope: [],
    debugEnabled: true,
};
