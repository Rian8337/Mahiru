import { Localization } from "@alice-localization/base/Localization";
import { Translation } from "@alice-localization/base/Translation";

export interface MapshareStrings {
    readonly noSubmissionWithStatus: string;
    readonly noBeatmapFound: string;
    readonly noSubmissionWithBeatmap: string;
    readonly submissionIsNotPending: string;
    readonly userIsAlreadyBanned: string;
    readonly userIsNotBanned: string;
    readonly beatmapIsOutdated: string;
    readonly beatmapIsTooEasy: string;
    readonly beatmapHasLessThan50Objects: string;
    readonly beatmapHasNoCirclesOrSliders: string;
    readonly beatmapDurationIsLessThan30Secs: string;
    readonly beatmapIsWIPOrQualified: string;
    readonly beatmapWasJustSubmitted: string;
    readonly beatmapWasJustUpdated: string;
    readonly beatmapHasBeenUsed: string;
    readonly summaryWordCountNotValid: string;
    readonly summaryCharacterCountNotValid: string;
    readonly denyFailed: string;
    readonly denySuccess: string;
    readonly acceptFailed: string;
    readonly acceptSuccess: string;
    readonly banFailed: string;
    readonly banSuccess: string;
    readonly unbanFailed: string;
    readonly unbanSuccess: string;
    readonly postFailed: string;
    readonly postSuccess: string;
    readonly submitFailed: string;
    readonly submitSuccess: string;
    readonly statusAccepted: string;
    readonly statusDenied: string;
    readonly statusPending: string;
    readonly statusPosted: string;
    readonly submissionStatusList: string;
    readonly submissionFromUser: string;
    readonly userId: string;
    readonly beatmapId: string;
    readonly beatmapLink: string;
    readonly creationDate: string;
}

/**
 * Localizations for the `mapshare` command.
 */
export class MapshareLocalization extends Localization<MapshareStrings> {
    protected override readonly translations: Readonly<
        Translation<MapshareStrings>
    > = {
        en: {
            noSubmissionWithStatus:
                "I'm sorry, there is no submission with %s status now!",
            noBeatmapFound: "Hey, please enter a valid beatmap link or ID!",
            noSubmissionWithBeatmap:
                "I'm sorry, there is no submission with that beatmap!",
            submissionIsNotPending:
                "I'm sorry, this submission is not in pending status!",
            userIsAlreadyBanned:
                "I'm sorry, this user is already banned from submitting a map share submission!",
            userIsNotBanned:
                "I'm sorry, this user is not banned from submitting a map share submission!",
            beatmapIsOutdated:
                "I'm sorry, the beatmap was updated after submission! Submission has been automatically deleted.",
            beatmapIsTooEasy:
                "I'm sorry, you can only submit beatmaps that are 3* or higher!",
            beatmapHasLessThan50Objects:
                "I'm sorry, it seems like the beatmap has less than 50 objects!",
            beatmapHasNoCirclesOrSliders:
                "I'm sorry, the beatmap has no circles and sliders!",
            beatmapDurationIsLessThan30Secs:
                "I'm sorry, the beatmap's duration is too short! It must be at least 30 seconds.",
            beatmapIsWIPOrQualified:
                "I'm sorry, you cannot submit a WIP (Work In Progress) and qualified beatmaps!",
            beatmapWasJustSubmitted:
                "I'm sorry, this beatmap was submitted in less than a week ago!",
            beatmapWasJustUpdated:
                "I'm sorry, this beatmap was just updated in less than 3 days ago!",
            beatmapHasBeenUsed:
                "I'm sorry, this beatmap has been submitted as a submission before!",
            summaryWordCountNotValid:
                "I'm sorry, your summary's length is currently %s word(s) long! It must be between 50 and 120 words!",
            summaryCharacterCountNotValid:
                "I'm sorry, your summary's length is currently %s character(s) long! It must be between 100 and 900 words!",
            denyFailed: "I'm sorry, I couldn't deny the submission: %s.",
            denySuccess: "Successfully denied the submission.",
            acceptFailed: "I'm sorry, I couldn't accept the submission: %s.",
            acceptSuccess: "Successfully accepted the submission.",
            banFailed:
                "I'm sorry, I couldn't ban the user from map share submission: %s.",
            banSuccess:
                "Successfully banned the user from map share submission.",
            unbanFailed:
                "I'm sorry, I couldn't unban the user from map share submission: %s.",
            unbanSuccess:
                "Successfully unbanned the user from map share submission.",
            postFailed: "I'm sorry, I couldn't post the submission: %s.",
            postSuccess: "Successfully posted the submission.",
            submitFailed: "I'm sorry, I couldn't submit your submission: %s.",
            submitSuccess: "Successfully submitted your submission.",
            statusAccepted: "accepted",
            statusDenied: "denied",
            statusPending: "pending",
            statusPosted: "posted",
            submissionStatusList: "Submissions with %s status",
            submissionFromUser: "Submission from %s",
            userId: "User ID",
            beatmapId: "Beatmap ID",
            beatmapLink: "Beatmap Link",
            creationDate: "Creation Date",
        },
        kr: {
            noSubmissionWithStatus: "죄송해요, 현재 %s 상태의 제출이 없어요!",
            noBeatmapFound: "저기, 유효한 비트맵 ID나 링크를 입력해 주세요!",
            noSubmissionWithBeatmap:
                "죄송해요, 이 비트맵은 제출 기록이 없어요!",
            submissionIsNotPending: "죄송해요, 이 제출은 %s 상태가 아니에요!",
            userIsAlreadyBanned:
                "죄송해요, 이 유저는 이미 맵 공유 제출을 금지당했어요!",
            userIsNotBanned:
                "죄송해요, 이 유저는 맵 공유 제출을 금지당하지 않았어요!",
            beatmapIsOutdated:
                "죄송해요, 비트맵이 제출 이후에 업데이트 되었어요! 제출이 자동으로 삭제됐어요.",
            beatmapIsTooEasy: "죄송해요, 3성 이상의 비트맵만 제출할 수 있어요!",
            beatmapHasLessThan50Objects:
                "죄송해요, 비트맵의 오브젝트가 50개보다 적은 것 같네요!",
            beatmapHasNoCirclesOrSliders:
                "죄송해요, 이 비트맵은 서클과 슬라이더가 하나도 없네요!",
            beatmapDurationIsLessThan30Secs:
                "죄송해요, 비트맵 길이가 너무 짧아요! 최소한 30초는 되어야해요.",
            beatmapIsWIPOrQualified:
                "죄송해요, WIP(Work In Progress)또는 qualified상태의 비트맵을 제출할 수 없어요!",
            beatmapWasJustSubmitted:
                "죄송해요, 이 비트맵은 제출된지 일주일이 안됐어요!",
            beatmapWasJustUpdated:
                "죄송해요, 이 비트맵은 업데이트 된지 3일이 안됐어요!",
            beatmapHasBeenUsed:
                "죄송해요, 이 비트맵은 이전에 맵 공유로 제출된 적이 있어요!",
            summaryWordCountNotValid:
                "죄송해요, 지금 설명에 %s개의 단어가 있어요! 최소 50단어에서 120단어까지만 가능해요!",
            summaryCharacterCountNotValid:
                "죄송해요, 지금 설명이 %s자에요! 최소 100자에서 900자까지만 가능해요!",
            denyFailed: "죄송해요, 제출을 거부할 수 없었어요: %s.",
            denySuccess: "성공적으로 제출을 거부했어요.",
            acceptFailed: "죄송해요, 제출을 수락할 수 없었어요: %s.",
            acceptSuccess: "성공적으로 제출을 수락했어요.",
            banFailed:
                "죄송해요, 이 유저의 맵 공유 제출을 금지할 수 없었어요: %s.",
            banSuccess: "성공적으로 이 유저의 맵 공유 제출을 금지했어요.",
            unbanFailed:
                "죄송해요, 이 유저의 맵 공유 제출 금지를 해제할 수 없었어요: %s.",
            unbanSuccess:
                "성공적으로 이 유저의 맵 공유 제출 금지를 해제했어요.",
            postFailed: "죄송해요, 제출을 포스팅 할 수 없었어요: %s.",
            postSuccess: "성공적으로 제출을 포스팅했어요.",
            submitFailed: "죄송해요, 제출할 수 없었어요: %s.",
            submitSuccess: "성공적으로 제출했어요.",
            statusAccepted: "수락됨",
            statusDenied: "거부됨",
            statusPending: "처리중",
            statusPosted: "포스트됨",
            submissionStatusList: "%s 상태인 제출",
            submissionFromUser: "%s의 제출",
            userId: "유저 ID",
            beatmapId: "비트맵 ID",
            beatmapLink: "비트맵 링크",
            creationDate: "만들어진 날짜",
        },
        id: {
            noSubmissionWithStatus: "",
            noBeatmapFound: "",
            noSubmissionWithBeatmap: "",
            submissionIsNotPending: "",
            userIsAlreadyBanned: "",
            userIsNotBanned: "",
            beatmapIsOutdated: "",
            beatmapIsTooEasy: "",
            beatmapHasLessThan50Objects: "",
            beatmapHasNoCirclesOrSliders: "",
            beatmapDurationIsLessThan30Secs: "",
            beatmapIsWIPOrQualified: "",
            beatmapWasJustSubmitted: "",
            beatmapWasJustUpdated: "",
            beatmapHasBeenUsed: "",
            summaryWordCountNotValid: "",
            summaryCharacterCountNotValid: "",
            denyFailed: "",
            denySuccess: "",
            acceptFailed: "",
            acceptSuccess: "",
            banFailed: "",
            banSuccess: "",
            unbanFailed: "",
            unbanSuccess: "",
            postFailed: "",
            postSuccess: "",
            submitFailed: "",
            submitSuccess: "",
            statusAccepted: "",
            statusDenied: "",
            statusPending: "",
            statusPosted: "",
            submissionStatusList: "",
            submissionFromUser: "",
            userId: "",
            beatmapId: "",
            beatmapLink: "",
            creationDate: "",
        },
    };
}