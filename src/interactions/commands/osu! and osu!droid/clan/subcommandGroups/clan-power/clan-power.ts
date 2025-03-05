import { Constants } from "@core/Constants";
import { SlashSubcommandGroup } from "structures/core/SlashSubcommandGroup";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { PermissionHelper } from "@utils/helpers/PermissionHelper";
import { GuildMember } from "discord.js";

export const run: SlashSubcommandGroup["run"] = async (client, interaction) => {
    const staffMembers =
        await PermissionHelper.getMainGuildStaffMembers(client);

    if (
        !(<GuildMember>interaction.member).roles.cache.find(
            (r) => r.name === "Referee"
        ) &&
        !staffMembers.has(interaction.user.id)
    ) {
        interaction.ephemeral = true;

        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                new ConstantsLocalization(
                    CommandHelper.getLocale(interaction)
                ).getTranslation(Constants.noPermissionReject)
            ),
        });
    }

    CommandHelper.runSlashSubcommandFromInteraction(interaction);
};

export const config: SlashSubcommandGroup["config"] = {
    permissions: ["Special"],
};
