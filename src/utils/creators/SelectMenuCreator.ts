import { Language } from "@localization/base/Language";
import { SelectMenuCreatorLocalization } from "@localization/utils/creators/SelectMenuCreator/SelectMenuCreatorLocalization";
import { OnButtonPageChange } from "@structures/utils/OnButtonPageChange";
import { InteractionCollectorCreator } from "@utils/base/InteractionCollectorCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import {
    ActionRow,
    ActionRowBuilder,
    APIActionRowComponent,
    APIChannelSelectComponent,
    APIStringSelectComponent,
    ChannelSelectMenuBuilder,
    ChannelSelectMenuComponent,
    ChannelSelectMenuInteraction,
    ChannelType,
    ComponentType,
    InteractionReplyOptions,
    RepliableInteraction,
    SelectMenuComponentOptionData,
    Snowflake,
    StringSelectMenuBuilder,
    StringSelectMenuComponent,
    StringSelectMenuInteraction,
} from "discord.js";
import { MessageButtonCreator } from "./MessageButtonCreator";
import { MessageCreator } from "./MessageCreator";

/**
 * A utility to create message select menus.
 */
export abstract class SelectMenuCreator extends InteractionCollectorCreator {
    /**
     * Creates a string select menu.
     *
     * @param interaction The interaction that triggered the select menu.
     * @param options Message options to ask the user to choose.
     * @param choices The choices that the user can choose.
     * @param users The users who can interact with the select menu.
     * @param duration The duration the select menu will be active for.
     * @returns The interaction with the user.
     */
    static async createStringSelectMenu(
        interaction: RepliableInteraction,
        options: InteractionReplyOptions,
        choices: SelectMenuComponentOptionData[],
        users: readonly Snowflake[],
        duration: number
    ): Promise<StringSelectMenuInteraction | null> {
        const localization = this.getLocalization(
            CommandHelper.getLocale(interaction)
        );

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(interaction.user.id + "stringSelectMenu")
            .addOptions(choices.slice(0, 25));

        const component =
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                selectMenu
            );

        const onPageChange: OnButtonPageChange = async (_, page) => {
            selectMenu.setOptions(
                choices.slice(25 * (page - 1), 25 + 25 * (page - 1))
            );

            component.setComponents(selectMenu);
        };

        options.components ??= [];

        // Necessary workaround as options.components is readonly
        const components = options.components.slice();
        components.push(component);

        options.components = components;

        const message =
            await MessageButtonCreator.createLimitedButtonBasedPaging(
                interaction,
                options,
                [interaction.user.id],
                1,
                Math.ceil(choices.length / 25),
                duration,
                onPageChange
            );

        const collectorOptions =
            this.createSelectMenuCollector<ComponentType.StringSelect>(
                message,
                duration,
                (i) =>
                    i.isStringSelectMenu() &&
                    selectMenu.data.custom_id === i.customId &&
                    users.includes(i.user.id),
                (m) => {
                    const row = m.components.find(
                        (c) =>
                            (c as ActionRow<StringSelectMenuComponent>)
                                .components.length === 1
                    ) as ActionRow<StringSelectMenuComponent>;

                    if (!row) {
                        return false;
                    }

                    return (
                        row.components[0] instanceof
                            StringSelectMenuComponent &&
                        row.components[0].customId === selectMenu.data.custom_id
                    );
                }
            );

        const { collector } = collectorOptions;

        collector.once("collect", () => {
            collector.stop();
        });

        return new Promise((resolve) => {
            collector.once("end", async (collected) => {
                const i = collected.first();

                if (i) {
                    const index = (<
                        APIActionRowComponent<APIStringSelectComponent>[]
                    >options.components).findIndex((v) => {
                        return (
                            v.components.length === 1 &&
                            v.components[0] instanceof
                                StringSelectMenuComponent &&
                            v.components[0].customId ===
                                selectMenu.data.custom_id
                        );
                    });

                    if (index !== -1) {
                        options.components = options.components
                            ?.slice()
                            .splice(index, 1);
                    }
                } else {
                    interaction.isMessageComponent()
                        ? await InteractionHelper.update(interaction, {
                              content: MessageCreator.createReject(
                                  localization.getTranslation("timedOut")
                              ),
                          })
                        : await InteractionHelper.reply(interaction, {
                              content: MessageCreator.createReject(
                                  localization.getTranslation("timedOut")
                              ),
                          });

                    if (!interaction.ephemeral) {
                        setTimeout(() => {
                            interaction.deleteReply();
                        }, 5 * 1000);
                    }
                }

                resolve(i ?? null);
            });
        });
    }

    /**
     * Creates a channel select menu that prompts the user to select a channel.
     *
     * @param interaction The interaction that triggered the select menu.
     * @param options Message options to ask the user to choose.
     * @param channelTypes The types of channels to be included in the select menu.
     * @param users The users who can interact with the select menu.
     * @param duration The duration the select menu will be active for.
     * @returns
     */
    static async createChannelSelectMenu(
        interaction: RepliableInteraction,
        options: InteractionReplyOptions,
        channelTypes: ChannelType[],
        users: readonly Snowflake[],
        duration: number
    ): Promise<ChannelSelectMenuInteraction | null> {
        const localization = this.getLocalization(
            CommandHelper.getLocale(interaction)
        );

        const selectMenu = new ChannelSelectMenuBuilder()
            .setCustomId(interaction.user.id + "channelSelectMenu")
            .setChannelTypes(channelTypes);

        const component =
            new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                selectMenu
            );

        options.components ??= [];

        // Necessary workaround as options.components is readonly
        const components = options.components.slice();
        components.push(component);

        options.components = components;

        const message = interaction.isMessageComponent()
            ? await InteractionHelper.update(interaction, options)
            : await InteractionHelper.reply(interaction, options);

        const collectorOptions =
            this.createSelectMenuCollector<ComponentType.ChannelSelect>(
                message,
                duration,
                (i) =>
                    i.isChannelSelectMenu() &&
                    selectMenu.data.custom_id === i.customId &&
                    users.includes(i.user.id),
                (m) => {
                    const row = m.components.find(
                        (c) =>
                            (c as ActionRow<StringSelectMenuComponent>)
                                .components.length === 1
                    ) as ActionRow<StringSelectMenuComponent>;

                    if (!row) {
                        return false;
                    }

                    return (
                        row.components[0] instanceof
                            StringSelectMenuComponent &&
                        row.components[0].customId === selectMenu.data.custom_id
                    );
                }
            );

        const { collector } = collectorOptions;

        collector.once("collect", () => {
            collector.stop();
        });

        return new Promise((resolve) => {
            collector.once("end", async (collected) => {
                const i = collected.first();

                if (i) {
                    const index = (<
                        APIActionRowComponent<APIChannelSelectComponent>[]
                    >options.components).findIndex((v) => {
                        return (
                            v.components.length === 1 &&
                            v.components[0] instanceof
                                ChannelSelectMenuComponent &&
                            v.components[0].customId ===
                                selectMenu.data.custom_id
                        );
                    });

                    if (index !== -1) {
                        options.components = options.components
                            ?.slice()
                            .splice(index, 1);
                    }
                } else {
                    interaction.isMessageComponent()
                        ? await InteractionHelper.update(interaction, {
                              content: MessageCreator.createReject(
                                  localization.getTranslation("timedOut")
                              ),
                          })
                        : await InteractionHelper.reply(interaction, {
                              content: MessageCreator.createReject(
                                  localization.getTranslation("timedOut")
                              ),
                          });

                    if (!interaction.ephemeral) {
                        setTimeout(() => {
                            interaction.deleteReply();
                        }, 5 * 1000);
                    }
                }

                resolve(i ?? null);
            });
        });
    }

    /**
     * Gets the localization of this creator utility.
     *
     * @param language The language to localize.
     */
    private static getLocalization(
        language: Language
    ): SelectMenuCreatorLocalization {
        return new SelectMenuCreatorLocalization(language);
    }
}
