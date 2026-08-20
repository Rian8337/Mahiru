import { AutocompleteHandler } from "@structures/core/AutocompleteHandler";

export const run: AutocompleteHandler["run"] = async (_, interaction) => {
    if (!interaction.inCachedGuild()) {
        return;
    }

    const focused = interaction.options.getFocused(true);

    if (focused.name === "emoji") {
        interaction.respond(
            interaction.guild.emojis.cache
                .filter((emoji) =>
                    emoji.name?.toLowerCase().includes(focused.value.toLowerCase())
                )
                .map((emoji) => ({
                    name: emoji.name,
                    value: emoji.id,
                }))
                .slice(0, 25)
        );
    }
};

export const config: AutocompleteHandler["config"] = {
    name: "recalc",
};
