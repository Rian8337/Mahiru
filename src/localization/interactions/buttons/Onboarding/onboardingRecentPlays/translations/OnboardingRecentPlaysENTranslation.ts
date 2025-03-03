import { Translation } from "@localization/base/Translation";
import {
    channelMention,
    chatInputApplicationCommandMention,
    hyperlink,
} from "discord.js";
import { OnboardingRecentPlaysStrings } from "../OnboardingRecentPlaysLocalization";

/**
 * The English translation for the `onboardingRecentPlays` button command.
 */
export class OnboardingRecentPlaysENTranslation extends Translation<OnboardingRecentPlaysStrings> {
    override readonly translations: OnboardingRecentPlaysStrings = {
        embedTitle: "Display Recent Plays",
        recentPlaysIntroduction: `One of the most commonly used feature of mine is showing a player's recent plays. This is accessible via the ${chatInputApplicationCommandMention(
            "recent",
            "881019169603223584",
        )} and ${chatInputApplicationCommandMention(
            "recent5",
            "881019186137169970",
        )} commands as well as the "View Recent Plays" button accessible in the apps menu. These commands can only display plays that were submitted to the server, which requires you to have an osu!droid account.`,
        accountRegistrationQuote: `Don't have a registered osu!droid account yet? Register one ${hyperlink(
            "here",
            "https://osudroid.moe/user/?action=register",
        )}.`,
        recentCommandExplanation: `The ${chatInputApplicationCommandMention(
            "recent",
            "881019169603223584",
        )} command will show your most recent play with additional information if available, such as pp obtained, hit error, and unstable rate (UR). Options can be used to customize the response of the command, such as viewing the n-th most recent play of a player.`,
        recent5CommandExplanation: `The ${chatInputApplicationCommandMention(
            "recent5",
            "881019186137169970",
        )} command will show your 50 most recent plays in a paginated way, each page containing 5 plays. Unlike the previous command, this command displays less information to keep the response short and concise.`,
        commandInBotGroundQuote: `Be sure to do these commands in the bot channel (${channelMention(
            "325827427446161413",
        )})!`,
        accountBindConvenienceQuote:
            'These features are more convenient to use if you bind your osu!droid account to Discord account. For more information, please refer to the "Bind osu!droid account" button in the first introduction menu.',
        tryCommandsForBindedAccount:
            "If you have bound your osu!droid account, feel free to try both commands with the buttons below!",
        showMostRecentPlay: "Show most recent play",
        showRecentPlays: "Show recent plays",
    };
}
