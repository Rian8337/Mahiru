import { CommandCategory } from "@enums/core/CommandCategory";
import { BotinfoLocalization } from "@localization/interactions/commands/General/botinfo/BotinfoLocalization";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { GuildMember, hyperlink } from "discord.js";
import { SlashCommand } from "structures/core/SlashCommand";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { StringHelper } from "@utils/helpers/StringHelper";
//@ts-expect-error: package.json will be included in distribution folder otherwise
import packageJson from "../../../../../package.json" assert { type: "json" };

export const run: SlashCommand["run"] = async (client, interaction) => {
    const localization = new BotinfoLocalization(
        CommandHelper.getLocale(interaction),
    );

    const embed = EmbedCreator.createNormalEmbed({
        author: interaction.user,
        color: (<GuildMember | null>interaction.member)?.displayColor,
    });

    const getOsuModuleVersionAndSource = (
        moduleName:
            | "osu-base"
            | "osu-difficulty-calculator"
            | "osu-rebalance-difficulty-calculator"
            | "osu-droid-replay-analyzer"
            | "osu-droid-utilities",
    ): string => {
        let version: string =
            packageJson.dependencies[`@rian8337/${moduleName}`];
        const source = `https://github.com/Rian8337/osu-droid-module/tree/master/packages/${moduleName}`;

        // Local version.
        if (version.includes("../")) {
            version = "Local version";
        }

        return hyperlink(formatVersion(version), source);
    };

    const formatVersion = (version: string) => version.replace("^", "");

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
                "https://ko-fi.com/rian8337",
            ),
        )
        .addFields(
            {
                name: localization.getTranslation("botInfo"),
                value:
                    `${localization.getTranslation(
                        "botVersion",
                    )}: ${packageJson.version}\n` +
                    `${localization.getTranslation(
                        "botUptime",
                    )}: ${DateTimeFormatHelper.secondsToDHMS(
                        client.uptime / 1000,
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
                        formatVersion(packageJson.dependencies["discord.js"]),
                        "https://discord.js.org",
                    )}\n` +
                    `${localization.getTranslation("typescript")}: ${hyperlink(
                        formatVersion(
                            packageJson.devDependencies["typescript"],
                        ),
                        "https://typescriptlang.org",
                    )}`,
            },
            {
                name: localization.getTranslation("osuLibraries"),
                value:
                    `${localization.getTranslation(
                        "osuBase",
                    )}: ${getOsuModuleVersionAndSource("osu-base")}\n` +
                    `${localization.getTranslation(
                        "osuDiffCalc",
                    )}: ${getOsuModuleVersionAndSource(
                        "osu-difficulty-calculator",
                    )}\n` +
                    `${localization.getTranslation(
                        "osuRebalDiffCalc",
                    )}: ${getOsuModuleVersionAndSource(
                        "osu-rebalance-difficulty-calculator",
                    )}\n` +
                    `${localization.getTranslation(
                        "osuDroidReplayAnalyzer",
                    )}: ${getOsuModuleVersionAndSource(
                        "osu-droid-replay-analyzer",
                    )}\n` +
                    `${localization.getTranslation(
                        "osuDroidUtilities",
                    )}: ${getOsuModuleVersionAndSource("osu-droid-utilities")}`,
            },
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
