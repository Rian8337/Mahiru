import { Message, bold, italic } from "discord.js";
import { Config } from "@core/Config";
import { DatabaseManager } from "@database/DatabaseManager";
import { EightBallResponseType } from "@enums/utils/EightBallResponseType";
import { EventUtil } from "structures/core/EventUtil";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { ArrayHelper } from "@utils/helpers/ArrayHelper";
import { EightBallFilter } from "@database/utils/aliceDb/EightBallFilter";

let filter: EightBallFilter | undefined;

/**
 * Gets the response type to a message.
 *
 * @param message The message to get the response type of.
 * @returns The response type.
 */
function getResponseType(message: Message): EightBallResponseType {
    if (!filter) {
        return EightBallResponseType.noAnswer;
    }

    function containsWord(words: string[]): boolean {
        return words.some(
            (w) => message.content.search(new RegExp(w, "i")) !== -1
        );
    }

    let returnValue = EightBallResponseType.undecided;

    if (Config.botOwners.includes(message.author.id)) {
        switch (true) {
            case containsWord(filter.like):
                returnValue = EightBallResponseType.like;
                break;
            case containsWord(filter.hate):
                returnValue = EightBallResponseType.hate;
                break;
            case containsWord(filter.badwords):
                returnValue = EightBallResponseType.neutral;
                break;
        }
    } else if (containsWord(filter.badwords)) {
        returnValue = EightBallResponseType.noAnswer;
    }

    return returnValue;
}

export const run: EventUtil["run"] = async (_, message: Message) => {
    if (
        !message.content.startsWith("Mahiru, ") ||
        Config.botOwners.includes(message.author.id) ||
        !message.content.endsWith("?") ||
        Config.maintenance ||
        message.author.bot ||
        !message.channel.isSendable()
    ) {
        return;
    }

    filter ??=
        (await DatabaseManager.aliceDb.collections.eightBallFilter.getOne())!;

    const embed = EmbedCreator.createNormalEmbed({
        author: message.author,
        color: message.member?.displayColor,
    });
    const responseType = getResponseType(message);

    let answer = "";
    switch (responseType) {
        case EightBallResponseType.like:
            answer = "Yes, absolutely.";
            break;

        case EightBallResponseType.hate:
            answer = "N... No! I would never think of that...";
            break;

        case EightBallResponseType.neutral:
            answer = "Um... Uh...";
            break;

        case EightBallResponseType.noAnswer:
            answer = "Uh, I don't think I want to answer that.";
            break;

        default:
            answer = ArrayHelper.getRandomArrayElement(filter.response);
    }

    if (!Config.botOwners.includes(message.author.id) && Math.random() < 0.1) {
        answer = `No... ${italic("baka")}.`;
    }

    embed.setDescription(
        `${bold("Q")}: ${message.content}\n${bold("A")}: ${answer}`
    );

    message.reply({
        embeds: [embed],
    });

    DatabaseManager.aliceDb.collections.askCount.updateOne(
        { discordid: message.author.id },
        { $inc: { count: 1 } },
        { upsert: true }
    );
};

export const config: EventUtil["config"] = {
    description:
        'Responsible for responding to questions prefixed with "Mahiru, ".',
    togglePermissions: ["ManageChannels"],
    toggleScope: ["GLOBAL", "GUILD", "CHANNEL"],
};
