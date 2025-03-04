import { Translation } from "@localization/base/Translation";
import { TimeoutManagerStrings } from "../TimeoutManagerLocalization";

/**
 * The Korean translation for the `TimeoutManager` manager utility.
 */
export class TimeoutManagerKRTranslation extends Translation<TimeoutManagerStrings> {
    override readonly translations: TimeoutManagerStrings = {
        userAlreadyTimeouted: "유저가 이미 타임아웃 당함",
        userImmuneToTimeout: "유저가 타임아웃에 면역임",
        invalidTimeoutDuration: "유효하지 않은 타임아웃 지속시간",
        timeoutDurationOutOfRange:
            "타임아웃 지속시간은 최소 30초에서 28일(4주)까지만 가능",
        notEnoughPermissionToTimeout:
            "%s 동안 타임아웃을 적용시킬 권한이 부족함",
        permanentTimeoutRoleNotFound:
            "영구 타임아웃 역할을 찾을 수 없음 또는 설정되지 않음",
        timeoutReasonTooLong: "타임아웃 이유가 너무 김 - 최대 1500자",
        timeoutExecuted: "타임아웃 실행됨",
        untimeoutExecuted: "타임아웃 해제 실행됨",
        inChannel: "%s에서",
        reason: "이유",
        userId: "유저 ID",
        channelId: "채널 ID",
        timeoutUserNotification:
            "저기, 당신은 %s 동안 다음 이유로 타임아웃 당했어요: %s. 죄송해요!",
        userNotTimeouted: "해당 유저는 타임아웃되지 않음",
        untimeoutReasonTooLong: "타임아웃 이유가 너무 김 - 최대 1500자",
        untimeoutUserNotification:
            "저기, 당신은 다음 이유로 타임아웃이 해제되었어요: %s.",
    };
}
