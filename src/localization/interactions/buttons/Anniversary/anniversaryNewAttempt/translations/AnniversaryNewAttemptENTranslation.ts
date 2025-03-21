import { Translation } from "@localization/base/Translation";
import { AnniversaryNewAttemptStrings } from "../AnniversaryNewAttemptLocalization";

/**
 * The English translation for the `anniversaryNewAttempt` button command.
 */
export class AnniversaryNewAttemptENTranslation extends Translation<AnniversaryNewAttemptStrings> {
    override readonly translations: AnniversaryNewAttemptStrings = {
        existingAttemptExists:
            "I'm sorry, you already have an existing attempt. Please finish it before starting a new one.",
    };
}
