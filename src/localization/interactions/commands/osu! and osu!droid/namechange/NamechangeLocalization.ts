import { Localization } from "@localization/base/Localization";
import { Translations } from "@localization/base/Translations";
import { NamechangeENTranslation } from "./translations/NamechangeENTranslation";
import { NamechangeESTranslation } from "./translations/NamechangeESTranslation";
import { NamechangeKRTranslation } from "./translations/NamechangeKRTranslation";

export interface NamechangeStrings {
    readonly userNotBindedToUid: string;
    readonly invalidUid: string;
    readonly newNameAlreadyTaken: string;
    readonly droidServerRequestFailed: string;
    readonly requestCooldownNotExpired: string;
    readonly currentBindedAccountDoesntExist: string;
    readonly newUsernameContainsInvalidCharacters: string;
    readonly newUsernameTooLong: string;
    readonly changeSuccess: string;
    readonly userHasNoHistory: string;
    readonly nameHistoryForUid: string;
    readonly requestDetails: string;
    readonly currentUsername: string;
    readonly requestedUsername: string;
    readonly creationDate: string;
}

/**
 * Localizations for the `namechange` command.
 */
export class NamechangeLocalization extends Localization<NamechangeStrings> {
    protected override readonly localizations: Readonly<
        Translations<NamechangeStrings>
    > = {
        en: new NamechangeENTranslation(),
        kr: new NamechangeKRTranslation(),
        es: new NamechangeESTranslation(),
    };
}
