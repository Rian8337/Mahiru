import { Translation } from "@localization/base/Translation";
import { SettingsStrings } from "../SettingsLocalization";

/**
 * The Korean translation for the `settings` command.
 */
export class SettingsKRTranslation extends Translation<SettingsStrings> {
    override readonly translations: SettingsStrings = {
        chosenChannelIsNotText: "저기, 텍스트 채널을 선택해 주세요!",
        setLogChannelSuccess:
            "성공적으로 당신 길드의 처벌 로그 채널을 %s로 설정했어요.",
        unsetLogChannelSuccess:
            "성공적으로 당신 길드의 처벌 로그 채널을 설정 해제했어요.",
        noLogChannelConfigured:
            "죄송해요, 이 서버는 정해진 처벌 로그 채널이 없어요! 먼저 처벌 로그 채널을 설정해 주세요!",
        grantTimeoutImmunitySuccess:
            "성공적으로 %s 역할을 타임아웃 면역으로 설정했어요.",
        revokeTimeoutImmunitySuccess:
            "성공적으로 %s 역할의 타임아웃 면역을 해제했어요.",
        grantTimeoutPermissionSuccess:
            "성공적으로 %s 역할에 타임아웃 권한을 부여했어요.",
        revokeTimeoutPermissionSuccess:
            "성공적으로 %s 역할의 타임아웃 권한을 제거했어요.",
        setPermanentTimeoutRoleFailed:
            "죄송해요, 이 서버에 영구 타임아웃 역할을 설정할 수 없었어요: %s.",
        setPermanentTimeoutRoleSuccess:
            "성공적으로 이 서버에 영구 타임아웃 역할을 `%s`로 설정했어요.",
        unsetPermanentTimeoutRoleFailed:
            "죄송해요, 이 서버에 영구 타임아웃 역할을 제거할 수 없었어요: %s.",
        unsetPermanentTimeoutRoleSuccess:
            "성공적으로 이 서버에 영구 타임아웃 역할을 제거했어요.",
        invalidTimeoutPermissionDuration:
            "저기, 적절한 최대 타임아웃 시간을 입력해 주세요!",
        eventNotFound: "죄송해요, 지정하신 이벤트를 찾지 못했어요!",
        eventUtilityNotFound:
            "죄송해요, 지정하신 이벤트 유틸리티를 찾지 못했어요!",
        eventUtilityEnableSuccess:
            "성공적으로 이벤트 유틸리티 %s를 %s 이벤트에 활성화했어요.",
        eventUtilityDisableSuccess:
            "성공적으로 이벤트 유틸리티 %s를 %s 이벤트에 비활성화했어요.",
        commandNotFound: "죄송해요, 지정하신 명령어를 찾지 못했어요!",
        cannotDisableCommand:
            "죄송해요, 이 명령어는 비활성화하거나 쿨타임을 부여할 수 없어요!",
        setCommandCooldownFailed:
            "죄송해요, 명령어의 쿨타임을 설정할 수 없었어요: %s.",
        setCommandCooldownSuccess: "성공적으로 %s 쿨타임을 %s초로 설정했어요.",
        disableCommandFailed: "죄송해요, 명령어를 비활성화 할 수 없었어요: %s.",
        disableCommandSuccess: "성공적으로 %s 명령어를 비활성화했어요.",
        enableCommandFailed: "죄송해요, 명령어를 활성화 할 수 없었어요: %s.",
        enableCommandSuccess: "성공적으로 %s 명령어를 활성화했어요.",
        setGlobalCommandCooldownSuccess:
            "성공적으로 명령어의 글로벌 쿨타임을 %s초로 설정했어요.",
        rolesWithTimeoutImmunity: "타임아웃에 면역인 역할",
        rolesWithTimeoutPermission: "타임아웃 권한을 가진 역할",
        eventName: "이벤트명",
        requiredPermissions: "필요 권한",
        toggleableScope: "토글 가능 범위",
        indefinite: "무기한(Indefinite)",
    };
}
