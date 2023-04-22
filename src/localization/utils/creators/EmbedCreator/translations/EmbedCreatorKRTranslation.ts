import { Translation } from "@alice-localization/base/Translation";
import { chatInputApplicationCommandMention } from "discord.js";
import { EmbedCreatorStrings } from "../EmbedCreatorLocalization";

/**
 * The Korean translation for the `EmbedCreator` creator utility.
 */
export class EmbedCreatorKRTranslation extends Translation<EmbedCreatorStrings> {
    override readonly translations: EmbedCreatorStrings = {
        beatmapObjects: "",
        beatmapDroidStatistics: "",
        beatmapOsuStatistics: "",
        beatmapGeneralStatistics: "",
        exitMenu: '이 메뉴를 종료하려면 "exit"을 입력하세요',
        result: "결과",
        droidPP: "Droid pp",
        pcPP: "PC pp",
        estimated: "추정됨",
        droidStars: "droid stars",
        pcStars: "PC stars",
        starRating: "스타 레이팅",
        rebalanceCalculationNote: "결과값은 변할 수 있어요.",
        oldCalculationNote: "",
        beatmapInfo: "비트맵 정보",
        dateAchieved: "%s에 달성함",
        penalties: "",
        threeFinger: "",
        sliderCheese: "",
        forFC: "for %s FC",
        sliderTicks: "슬라이더 틱",
        sliderEnds: "슬라이더 끝(ends)",
        hitErrorAvg: "평균 타격 오차(hit error avg)",
        challengeId: "챌린지 ID",
        timeLeft: "남은 시간",
        weeklyChallengeTitle: "osu!droid 위클리 챌린지",
        dailyChallengeTitle: "osu!droid 데일리 챌린지",
        featuredPerson: "%s가 제안함",
        download: "다운로드",
        points: "포인트",
        passCondition: "패스 조건",
        constrain: "제한사항",
        modOnly: "%s 모드만 사용",
        rankableMods: "EZ, NF 및 HT를 제외한 모든 랭크 가능 모드",
        challengeBonuses: `보너스를 확인하려면 ${chatInputApplicationCommandMention(
            "daily",
            "bonuses",
            "889506666498895942"
        )}를 사용하세요.`,
        auctionInfo: "경매 정보",
        auctionName: "이름",
        auctionAuctioneer: "경매인(경매 시작자)",
        creationDate: "생성 날짜",
        auctionMinimumBid: "최소 입찰 금액",
        auctionItemInfo: "아이템 정보",
        auctionPowerup: "파워업",
        auctionItemAmount: "양",
        auctionBidInfo: "입찰 정보",
        auctionBidders: "입찰한 클랜 수",
        auctionTopBidders: "최고 입찰자",
        broadcast: "안내",
        broadcast1: `유저가 규칙을 위반하거나, 적절하지 못한 행동을 하거나, 의도적으로 짜증나게 한다면, ${chatInputApplicationCommandMention(
            "report",
            "937926296560869466"
        )} 명령어를 사용해서 유저를 신고해 주세요(\`/help report\`로 더 많은 정보를 얻을 수 있어요)`,
        broadcast2:
            "오직 스태프 멤버만 신고를 볼 수 있기 때문에, 여러분의 프라이버시는 안전하다는걸 알아주세요. 더욱 깨끗한 서버 환경을 위한 여러분의 노력과 기여에는 언제나 감사드려요!",
        mapShareSubmission: "%s의 제출",
        mapShareStatusAndSummary: "상태 및 요약",
        mapShareStatus: "상태",
        mapShareSummary: "요약",
        mapShareStatusAccepted: "수락됨",
        mapShareStatusDenied: "거부됨",
        mapShareStatusPending: "처리중",
        mapShareStatusPosted: "포스트됨",
        musicYoutubeChannel: "채널",
        musicDuration: "길이",
        musicQueuer: "%s에 의해 요청됨/재생목록에 넣어짐",
        ppProfileTitle: "%s의 PP 프로필",
        totalPP: "총 PP",
        ppProfile: "PP 프로필",
        oldPpProfileTitle: "",
        warningInfo: "",
        warningId: "",
        warnedUser: "",
        warningIssuedBy: "",
        expirationDate: "만료일",
        reason: "이유",
        channel: "채널",
        recommendedStarRating: "",
        none: "",
    };
}
