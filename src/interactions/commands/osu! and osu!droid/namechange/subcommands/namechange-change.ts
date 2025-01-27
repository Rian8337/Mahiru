import { DatabaseManager } from "@database/DatabaseManager";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { Constants } from "@core/Constants";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { StringHelper } from "@utils/helpers/StringHelper";
import { NumberHelper } from "@utils/helpers/NumberHelper";
import { NamechangeLocalization } from "@localization/interactions/commands/osu! and osu!droid/namechange/NamechangeLocalization";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { DroidHelper } from "@utils/helpers/DroidHelper";
import { DroidAPIRequestBuilder } from "@rian8337/osu-base";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { bold } from "discord.js";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization = new NamechangeLocalization(
        CommandHelper.getLocale(interaction),
    );

    await InteractionHelper.deferReply(interaction);

    const bindInfo =
        await DatabaseManager.elainaDb.collections.userBind.getFromUser(
            interaction.user,
            {
                projection: {
                    _id: 0,
                    uid: 1,
                },
            },
        );

    if (!bindInfo) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                new ConstantsLocalization(localization.language).getTranslation(
                    Constants.selfNotBindedReject,
                ),
            ),
        });
    }

    const nameChange =
        await DatabaseManager.aliceDb.collections.nameChange.getFromUid(
            bindInfo.uid,
            { projection: { _id: 0, cooldown: 1 } },
        );

    if (nameChange && nameChange.cooldown > Math.floor(Date.now() / 1000)) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("requestCooldownNotExpired"),
                DateTimeFormatHelper.dateToLocaleString(
                    new Date(nameChange.cooldown * 1000),
                    localization.language,
                ),
            ),
        });
    }

    const player = await DroidHelper.getPlayer(bindInfo.uid, [
        "id",
        "username",
    ]);

    if (!player) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("currentBindedAccountDoesntExist"),
            ),
        });
    }

    const newUsername = interaction.options.getString("username", true);

    if (
        StringHelper.hasUnicode(newUsername) ||
        !StringHelper.isUsernameValid(newUsername)
    ) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation(
                    "newUsernameContainsInvalidCharacters",
                ),
            ),
        });
    }

    if (!NumberHelper.isNumberInRange(newUsername.length, 2, 20, true)) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("newUsernameTooLong"),
            ),
        });
    }

    const newPlayer = await DroidHelper.getPlayer(newUsername, ["id"]);

    if (newPlayer) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("newNameAlreadyTaken"),
            ),
        });
    }

    // Still use API for name change to allow game server-side logging.
    const apiRequestBuilder = new DroidAPIRequestBuilder()
        .setEndpoint("user_rename.php")
        .addParameter("username", player.username)
        .addParameter("newname", newUsername);

    const apiResult = await apiRequestBuilder.sendRequest();

    if (apiResult.statusCode !== 200) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("droidServerRequestFailed"),
            ),
        });
    }

    const content = apiResult.data.toString("utf-8");
    const requestResult = content.split(" ").shift()!;

    if (requestResult === "FAILED") {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("newNameAlreadyTaken"),
            ),
        });
    }

    const newCooldown = new Date(Date.now() + 86400 * 30 * 1000);

    await DatabaseManager.aliceDb.collections.nameChange.addPreviousUsername(
        bindInfo.uid,
        newUsername,
        newCooldown.getTime(),
    );

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("changeSuccess"),
        ),
        embeds: [
            EmbedCreator.createNormalEmbed({
                color: 2483712,
                timestamp: true,
            })
                .setTitle(localization.getTranslation("requestDetails"))
                .setDescription(
                    `${bold(localization.getTranslation("currentUsername"))}: ${
                        player.username
                    }\n` +
                        `${bold(
                            localization.getTranslation("requestedUsername"),
                        )}: ${newUsername}\n` +
                        `${bold(
                            localization.getTranslation("creationDate"),
                        )}: ${DateTimeFormatHelper.dateToLocaleString(
                            newCooldown,
                            localization.language,
                        )}`,
                ),
        ],
    });
};

export const config: SlashSubcommand["config"] = {
    replyEphemeral: true,
};
