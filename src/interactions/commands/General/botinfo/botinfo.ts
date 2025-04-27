import { CommandCategory } from "@enums/core/CommandCategory";
import { SlashCommand } from "structures/core/SlashCommand";
import { BotinfoLocalization } from "@localization/interactions/commands/General/botinfo/BotinfoLocalization";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { GuildMember, EmbedBuilder, hyperlink } from "discord.js";
//@ts-expect-error: package.json will be included in distribution folder otherwise
import { version } from "../../../../../package.json";
//@ts-expect-error: package-lock.json will be included in distribution folder otherwise
import { packages } from "../../../../../package-lock.json";
import { StringHelper } from "@utils/helpers/StringHelper";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashCommand["run"] = async (client, interaction) => {
    const localization: BotinfoLocalization = new BotinfoLocalization(
        CommandHelper.getLocale(interaction)
    );

    const embed: EmbedBuilder = EmbedCreator.createNormalEmbed({
        author: interaction.user,
        color: (<GuildMember | null>interaction.member)?.displayColor,
    });

    const getOsuModuleVersionAndSource = (
        moduleName:
            | "osu-base"
            | "osu-difficulty-calculator"
            | "osu-rebalance-difficulty-calculator"
            | "osu-droid-replay-analyzer"
            | "osu-droid-utilities"
    ): string => {
        let version: string = (
            packages[`node_modules/@rian8337/${moduleName}`] ??
            packages[`../osu-droid-module/packages/${moduleName}`]
        ).version;
        const source: string = `https://github.com/Rian8337/osu-droid-module/tree/master/packages/${moduleName}`;

        // Local version.
        if (packages[`../osu-droid-module/packages/${moduleName}`]) {
            version = "Local version";
        }

        return hyperlink(version, source);
    };

    embed
        .setThumbnail(client.user.avatarURL()!)
        .setDescription(
            StringHelper.formatString(
                localization.getTranslation("aboutBot"),
                "https://github.com/Rian8337/Mahiru",
                "https://github.com/Rian8337",
                "https://github.com/NeroYuki",
                "https://osudroid.moe",
                "https://discord.gg/nyD92cE",
                "https://ko-fi.com/rian8337"
            )
        )
        .addFields(
            {
                name: localization.getTranslation("botInfo"),
                value:
                    `${localization.getTranslation(
                        "botVersion"
                    )}: ${version}\n` +
                    `${localization.getTranslation(
                        "botUptime"
                    )}: ${DateTimeFormatHelper.secondsToDHMS(
                        client.uptime / 1000
                    )}`,
            },
            {
                name: localization.getTranslation("nodeVersion"),
                value: hyperlink(process.versions.node, "https://nodejs.org"),
            },
            {
                name: localization.getTranslation("coreLibraries"),
                value:
                    `${localization.getTranslation("discordJs")}: ${hyperlink(
                        packages["node_modules/discord.js"].version,
                        "https://discord.js.org"
                    )}\n` +
                    `${localization.getTranslation("typescript")}: ${hyperlink(
                        packages["node_modules/typescript"].version,
                        "https://typescriptlang.org"
                    )}`,
            },
            {
                name: localization.getTranslation("osuLibraries"),
                value:
                    `${localization.getTranslation(
                        "osuBase"
                    )}: ${getOsuModuleVersionAndSource("osu-base")}\n` +
                    `${localization.getTranslation(
                        "osuDiffCalc"
                    )}: ${getOsuModuleVersionAndSource(
                        "osu-difficulty-calculator"
                    )}\n` +
                    `${localization.getTranslation(
                        "osuRebalDiffCalc"
                    )}: ${getOsuModuleVersionAndSource(
                        "osu-rebalance-difficulty-calculator"
                    )}\n` +
                    `${localization.getTranslation(
                        "osuDroidReplayAnalyzer"
                    )}: ${getOsuModuleVersionAndSource(
                        "osu-droid-replay-analyzer"
                    )}\n` +
                    `${localization.getTranslation(
                        "osuDroidUtilities"
                    )}: ${getOsuModuleVersionAndSource("osu-droid-utilities")}`,
            }
        );

    InteractionHelper.reply(interaction, {
        embeds: [embed],
    });
};

export const category: SlashCommand["category"] = CommandCategory.general;

export const config: SlashCommand["config"] = {
    name: "botinfo",
    description: "Displays technical information about the bot.",
    options: [],
    example: [],
};
