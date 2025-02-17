import {
    ApplicationCommandOptionData,
    ApplicationCommandSubCommandData,
    ApplicationCommandSubGroupData,
    Collection,
    GuildMember,
    EmbedBuilder,
    bold,
} from "discord.js";
import { Bot } from "@core/Bot";
import { CommandCategory } from "@enums/core/CommandCategory";
import { SlashCommand } from "structures/core/SlashCommand";
import { OnButtonPageChange } from "@structures/utils/OnButtonPageChange";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { PermissionHelper } from "@utils/helpers/PermissionHelper";
import { MessageButtonCreator } from "@utils/creators/MessageButtonCreator";
import { ApplicationCommandOptionType } from "discord.js";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { HelpLocalization } from "@localization/interactions/commands/General/help/HelpLocalization";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

/**
 * Gets the list of commands that the bot has.
 *
 * @param client The instance of the bot.
 * @returns The list of commands, mapped by their category.
 */
function getCommandList(client: Bot): Collection<string, string[]> {
    const output: Collection<string, string[]> = new Collection();

    for (const cmd of client.interactions.chatInput.values()) {
        const category: string[] = output.get(cmd.category) ?? [];

        category.push(cmd.config.name);

        output.set(cmd.category, category);
    }

    return output;
}

export const run: SlashCommand["run"] = async (client, interaction) => {
    const localization: HelpLocalization = new HelpLocalization(
        CommandHelper.getLocale(interaction),
    );

    const commandName: string | null =
        interaction.options.getString("commandname");

    const embed: EmbedBuilder = EmbedCreator.createNormalEmbed({
        author: interaction.user,
        color: (<GuildMember | null>interaction.member)?.displayColor,
    });

    if (commandName) {
        const cmd: SlashCommand | undefined =
            client.interactions.chatInput.get(commandName);

        if (!cmd) {
            return InteractionHelper.reply(interaction, {
                content: MessageCreator.createReject(
                    localization.getTranslation("noCommandFound"),
                ),
            });
        }

        let argsString: string = "";

        if (cmd.config.options.length > 0) {
            const finalMappedArgs: string[] = [];

            for (const arg of cmd.config.options) {
                const mappedArgs: string[] = [];
                const precedingKeywords: string[] = [];
                let isOptional: boolean = false;

                switch (arg.type) {
                    case ApplicationCommandOptionType.SubcommandGroup:
                        precedingKeywords.push(arg.name);
                        for (const localArg of arg.options ?? []) {
                            precedingKeywords.push(localArg.name);
                            for (const localLocalArg of localArg.options ??
                                []) {
                                isOptional ||= !localLocalArg.required;

                                if (isOptional) {
                                    mappedArgs.push(`[${localLocalArg.name}]`);
                                } else {
                                    mappedArgs.push(`<${localLocalArg.name}>`);
                                }
                            }
                        }
                        break;
                    case ApplicationCommandOptionType.Subcommand:
                        precedingKeywords.push(arg.name);
                        for (const localArg of arg.options ?? []) {
                            isOptional ||= !localArg.required;

                            if (isOptional) {
                                mappedArgs.push(`[${localArg.name}]`);
                            } else {
                                mappedArgs.push(`<${localArg.name}>`);
                            }
                        }
                        break;
                    default:
                        isOptional ||= !(<
                            Exclude<
                                ApplicationCommandOptionData,
                                | ApplicationCommandSubGroupData
                                | ApplicationCommandSubCommandData
                            >
                        >arg).required;

                        if (isOptional) {
                            mappedArgs.push(`[${arg.name}]`);
                        } else {
                            mappedArgs.push(`<${arg.name}>`);
                        }
                }

                finalMappedArgs.push(
                    `[ ${precedingKeywords.join(" ")} ${mappedArgs.join(" ")} ]`,
                );
            }

            argsString += finalMappedArgs.map((v) => v.trim()).join(" | ");
        }

        embed
            .setTitle(cmd.config.name)
            .setDescription(
                "```md\n" +
                    `${cmd.config.description}` +
                    "```\n" +
                    `${localization.getTranslation("category")}: ` +
                    "`" +
                    cmd.category +
                    "`\n" +
                    `${localization.getTranslation(
                        "requiredPermissions",
                    )}: \`` +
                    (cmd.config.permissions
                        ? PermissionHelper.getPermissionString(
                              cmd.config.permissions,
                          )
                        : "None") +
                    "`",
            )
            .addFields(
                {
                    name: localization.getTranslation("examples"),
                    value:
                        cmd.config.example
                            .map(
                                (v) =>
                                    `\`/${v.command}\`${
                                        v.arguments
                                            ? ` ${v.arguments
                                                  .map(
                                                      (a) =>
                                                          `\`${a.name}:${a.value}\``,
                                                  )
                                                  .join(" ")}`
                                            : ""
                                    }\n` + v.description,
                            )
                            .join("\n\n") ||
                        localization.getTranslation("none"),
                    inline: true,
                },
                {
                    name:
                        `${localization.getTranslation("usage")}\n` +
                        `\`<...>\`: ${localization.getTranslation(
                            "required",
                        )}\n` +
                        `\`[...]\`: ${localization.getTranslation(
                            "optional",
                        )}\n\n` +
                        `\`${cmd.config.name}${
                            argsString ? ` ${argsString}` : ""
                        }\``,
                    value:
                        `${bold(localization.getTranslation("details"))}\n` +
                            cmd.config.options
                                .map(
                                    (v) =>
                                        "`" +
                                        v.name +
                                        "`: *" +
                                        CommandHelper.optionTypeToString(
                                            v.type,
                                        ) +
                                        "*\n" +
                                        v.description,
                                )
                                .join("\n\n") ||
                        localization.getTranslation("none"),
                    inline: true,
                },
            );

        InteractionHelper.reply(interaction, { embeds: [embed] });
    } else {
        const commandList: Collection<string, string[]> =
            getCommandList(client);

        embed
            .setTitle(localization.getTranslation("mahiruHelp"))
            .setDescription(
                `${localization.getTranslation("creator")}\n\n` +
                    `${localization.getTranslation("useHelpCommand")}\n` +
                    localization.getTranslation("issuesContact"),
            )
            .setThumbnail(client.user.avatarURL()!);

        const onPageChange: OnButtonPageChange = async (_, page) => {
            embed.addFields({
                name: `${bold(
                    localization.getTranslation("category"),
                )}: ${commandList.keyAt(page - 1)}`,
                value: commandList
                    .at(page - 1)!
                    .map((v) => `\`${v}\``)
                    .join(" • "),
            });
        };

        MessageButtonCreator.createLimitedButtonBasedPaging(
            interaction,
            { embeds: [embed] },
            [interaction.user.id],
            1,
            commandList.size,
            120,
            onPageChange,
        );
    }
};

export const category: SlashCommand["category"] = CommandCategory.general;

export const config: SlashCommand["config"] = {
    name: "help",
    description: "General help command.",
    options: [
        {
            name: "commandname",
            type: ApplicationCommandOptionType.String,
            description:
                "The command to see the help section from. If unspecified, lists all available commands.",
            maxLength: 32,
            autocomplete: true,
        },
    ],
    example: [
        {
            command: "help",
            arguments: [],
            description: "will output all commands that I have.",
        },
        {
            command: "help",
            arguments: [
                {
                    name: "commandname",
                    value: "ping",
                },
            ],
            description: "will output the help section of `ping` command.",
        },
    ],
    replyEphemeral: true,
};
