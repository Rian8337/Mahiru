import { Translation } from "@localization/base/Translation";
import { NamechangeStrings } from "../NamechangeLocalization";

/**
 * The Korean translation for the `namechange` command.
 */
export class NamechangeKRTranslation extends Translation<NamechangeStrings> {
    override readonly translations: NamechangeStrings = {
        userNotBindedToUid: "",
        invalidUid: "저기, 유효한 uid를 입력해 주세요!",
        newNameAlreadyTaken:
            "죄송해요, 요청하신 유저네임은 이미 다른 누군가가 가져갔어요!",
        droidServerRequestFailed: "",
        requestCooldownNotExpired:
            "죄송해요, 아직 쿨다운 상태에요! 다음 날짜에 유저네임 변경을 요청 할 수 있어요: %s.",
        currentBindedAccountDoesntExist:
            "죄송해요, 당신이 osu!droid 서버에 바인딩된 계정을 찾을 수 없어요!",
        newUsernameContainsInvalidCharacters:
            "죄송해요, 유저네임은 문자, 숫자, 언더바(_)만 포함할 수 있어요!",
        newUsernameTooLong:
            "죄송해요, 유저네임은 최소 2글자에서 최대 20글자까지만 가능해요!",
        changeSuccess: "",
        userHasNoHistory:
            "다이렉트 메시지(DM)을 비활성화하지 마세요! 요청 상태에 관한 알림을 드려야 해요!",
        nameHistoryForUid: "Uid %s의 유저네임 기록",
        requestDetails: "요청 상세사항",
        currentUsername: "현재 유저네임",
        requestedUsername: "요청한 유저네임",
        creationDate: "생성 날짜",
    };
}
