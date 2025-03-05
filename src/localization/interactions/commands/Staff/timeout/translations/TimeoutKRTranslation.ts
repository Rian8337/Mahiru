import { Translation } from "@localization/base/Translation";
import { TimeoutStrings } from "../TimeoutLocalization";

/**
 * The Korean translation for the `timeout` command.
 */
export class TimeoutKRTranslation extends Translation<TimeoutStrings> {
    override readonly translations: TimeoutStrings = {
        userToTimeoutNotFound:
            "저기, 타임아웃시킬 유효한 유저를 입력해 주세요!",
        indefiniteTimeout: "무기한",
        timeoutFailed: "죄송해요, 그 유저를 타임아웃 시킬 수 없어요: %s.",
        timeoutSuccess:
            "성공적으로 그 유저를 다음 시간만큼 타임아웃 시켰어요: %s.",
    };
}
