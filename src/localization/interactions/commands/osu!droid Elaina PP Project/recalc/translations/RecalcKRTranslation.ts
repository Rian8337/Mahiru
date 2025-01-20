import { Translation } from "@localization/base/Translation";
import { RecalcStrings } from "../RecalcLocalization";

/**
 * The Korean translation for the `recalc` command.
 */
export class RecalcKRTranslation extends Translation<RecalcStrings> {
    override readonly translations: RecalcStrings = {
        playerNotFound: "죄송해요, 찾으시려는 플레이어를 못찾겠어요!",
        tooManyOptions:
            "죄송해요, uid, 유저, 유저네임 중 하나만 사용할 수 있어요! 이것들을 함께 쓸 수 없어요!",
        reworkNameMissing: "",
        reworkTypeNotCurrent: "",
        reworkTypeDoesntExist: "",
        userQueued: "성공적으로 %s를 재계산 대기목록에 넣었어요.",
        fullRecalcInProgress: "성공적으로 재계산을 시작했어요.",
        fullRecalcSuccess: "%s, 재계산이 완료됐어요!",
    };
}
