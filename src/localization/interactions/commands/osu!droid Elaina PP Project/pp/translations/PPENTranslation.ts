import { Translation } from "@localization/base/Translation";
import { PPStrings } from "../PPLocalization";

/**
 * The English translation for the `ppcheck` command.
 */
export class PPENTranslation extends Translation<PPStrings> {
    override readonly translations: PPStrings = {
        tooManyOptions:
            "I'm sorry, you can only either specify a uid, user, or username! You cannot mix them!",
        cannotCompareSamePlayers:
            "Hey, you cannot compare two of the same players!",
        playerNotBinded: 'I\'m sorry, the %s "%s" is not bound!',
        uid: "uid",
        username: "username",
        user: "user",
        noSimilarPlayFound:
            "I'm sorry, both players do not have any intersecting top plays!",
        topPlaysComparison: "Top PP Plays Comparison",
        player: "Player",
        totalPP: "Total PP",
        selfInfoNotAvailable:
            "I'm sorry, your prototype dpp information is not available!",
        userInfoNotAvailable:
            "I'm sorry, the user's prototype dpp information is not available!",
        ppProfileTitle: "PP Profile for %s",
        prevTotalPP: "Previous Total PP",
        reworkTypeEmbedDescription: "Rework Type",
        diff: "Difference",
        ppProfile: "PP Profile",
        lastUpdate: "Last Update",
        commandNotAllowed:
            "I'm sorry, this command is not available in this channel.",
        reworkTypeDoesntExist: "I'm sorry, this rework type does not exist!",
        uidIsBanned:
            "I'm sorry, your currently bound osu!droid account has been disallowed from submitting dpp.",
        beatmapNotFound: "Hey, please give me a valid beatmap to submit!",
        beatmapIsBlacklisted: "I'm sorry, this beatmap has been blacklisted.",
        beatmapNotWhitelisted:
            "I'm sorry, the PP system only accepts ranked, approved, whitelisted, or loved beatmaps right now!",
        beatmapTooShort:
            "I'm sorry, this beatmap is either too short (less than 30 seconds) or doesn't have at least 60% of its music length mapped.",
        noScoreSubmitted:
            "I'm sorry, you don't have a score submitted in this beatmap!",
        noScoresInSubmittedList:
            "I'm sorry, you don't have any scores to submit within that range and offset!",
        submitFailed: "Submission failed.",
        partialSubmitSuccessful: "Successfully submitted some of your play(s).",
        fullSubmitSuccessful: "Successfully submitted your play(s).",
        ppGained: "PP gained",
        profileNotFound: "I'm sorry, I cannot find your profile!",
        ppSubmissionInfo: "PP submission info",
        whatIfScoreNotEntered:
            "A score of `%spp` for `%s` would not affect their total pp.",
        whatIfScoreEntered:
            "A score of `%spp` (`%spp` weighted) for `%s` would be their `#%s` top play and increase their total pp to `%spp` (`+%spp`).",
        ppSystemOutdated:
            "This pp system is outdated and will be removed in the future.",
    };
}
