import { Translation } from "@localization/base/Translation";
import { NamechangeStrings } from "../NamechangeLocalization";

/**
 * The English translation for the `namechange` command.
 */
export class NamechangeENTranslation extends Translation<NamechangeStrings> {
    override readonly translations: NamechangeStrings = {
        userNotBindedToUid: "I'm sorry, you are not bound to that uid!",
        invalidUid: "Hey, please enter a valid uid!",
        newNameAlreadyTaken:
            "I'm sorry, the requested username has been taken!",
        droidServerRequestFailed:
            "I'm sorry, I couldn't reach the osu!droid server!",
        requestCooldownNotExpired:
            "I'm sorry, you're still in cooldown! You will be able to send a name change request in `%s`.",
        currentBindedAccountDoesntExist:
            "I'm sorry, I cannot find your currently bound account in osu!droid server!",
        newUsernameContainsInvalidCharacters:
            "I'm sorry, usernames can only contain letters, numbers, and underscores!",
        newUsernameTooLong:
            "I'm sorry, a username must be at least 2 characters and doesn't exceed 20 characters!",
        changeSuccess:
            "Successfully changed your username. You will be able to change again in %s.",
        userHasNoHistory:
            "I'm sorry, this player doesn't have any name change history!",
        nameHistoryForUid: "Name History for Uid %s",
        requestDetails: "Request Details",
        currentUsername: "Current Username",
        requestedUsername: "Requested Username",
        creationDate: "Creation Date",
    };
}
