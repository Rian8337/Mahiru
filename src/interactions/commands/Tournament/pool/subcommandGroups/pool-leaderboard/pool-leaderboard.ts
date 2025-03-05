import { SlashSubcommandGroup } from "structures/core/SlashSubcommandGroup";
import { CommandHelper } from "@utils/helpers/CommandHelper";

export const run: SlashSubcommandGroup["run"] = async (_, interaction) => {
    CommandHelper.runSlashSubcommandFromInteraction(
        interaction,
        CommandHelper.getLocale(interaction)
    );
};
