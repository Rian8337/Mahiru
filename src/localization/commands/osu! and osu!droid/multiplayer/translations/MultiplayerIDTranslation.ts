import { Translation } from "@alice-localization/base/Translation";
import { MultiplayerStrings } from "../MultiplayerLocalization";

/**
 * The Indonesian translation for the `multiplayer` command.
 */
export class MultiplayerIDTranslation extends Translation<MultiplayerStrings> {
    override readonly translations: MultiplayerStrings = {
        about: "",
        roomWithIdDoesntExist: "",
        roomDoesntExistInChannel: "",
        selfNotInRoom: "",
        selfInRoom: "",
        userNotInRoom: "",
        roomInHeadToHeadMode: "",
        roomInTeamVSMode: "",
        roomHostChangeNotification: "",
        cannotKickSelf: "",
        cannotTransferHostToSelf: "",
        idTooLong: "",
        nameTooLong: "",
        wrongPassword: "",
        timerIsSet: "",
        noTimerSet: "",
        unrankedModsIncluded: "",
        speedChangingModsIncluded: "",
        speedMultiplierNotDivisible: "",
        none: "",
        allowed: "",
        disallowed: "",
        beatmapProvidedIsInvalid: "",
        beatmapNotFound: "",
        tooFewPlayers: "",
        playerNotReady: "",
        noBeatmapPicked: "",
        noBeatmapPickedInRoom: "",
        roundInfo: "",
        roundStarted: "",
        roundCountdownStatus: "",
        roundCountdownFinished: "",
        roomIsInPlayingStatus: "",
        roomIsNotInPlayingStatus: "",
        playerIsInReadyState: "",
        beatmapNotFinished: "",
        scorePortionOutOfRange: "",
        scorev1Value: "",
        scorev2Value: "",
        roomIsFull: "",
        roomTeamMemberList: "",
        redTeam: "",
        blueTeam: "",
        joinRoomNotification: "",
        slotHasBeenFilled: "",
        noModsDetected: "",
        pickWinCondition: "",
        pickTeamMode: "",
        updateReadyStateFailed: "",
        updateReadyStateSuccess: "",
        updateSpectatingStateFailed: "",
        updateSpectatingStateSuccess: "",
        updateTeamStateFailed: "",
        updateTeamStateSuccess: "",
        playerLeaveFailed: "",
        playerLeaveSuccess: "",
        playerKickFailed: "",
        playerKickSuccess: "",
        createRoomFailed: "",
        createRoomSuccess: "",
        joinRoomFailed: "",
        joinRoomSuccess: "",
        timerStopFailed: "",
        timerStopSuccess: "",
        setModsFailed: "",
        setModsSuccess: "",
        setRoomNameFailed: "",
        setRoomNameSuccess: "",
        setRoomPasswordFailed: "",
        setRoomPasswordSuccess: "",
        setRoomTeamModeFailed: "",
        setRoomTeamModeSuccess: "",
        setRoomWinConditionFailed: "",
        setRoomWinConditionSuccess: "",
        transferHostFailed: "",
        transferHostSuccess: "",
        setForceARFailed: "",
        setForceARSuccess: "",
        setSpeedMultiplierFailed: "",
        setSpeedMultiplierSuccess: "",
        setScorePortionFailed: "",
        setScorePortionSuccess: "",
        setBeatmapFailed: "",
        setBeatmapSuccess: "",
        roundStartFailed: "",
        roundStartSuccess: "",
        matchStatusUpdateFailed: "",
        matchStatusUpdateSuccess: "",
        setMaxPlayerSlotFailed: "",
        setMaxPlayerSlotSuccess: "",
        setAllowSliderLockFailed: "",
        setAllowSliderLockSuccess: "",
        teamSelectFailed: "",
        teamSelectSuccess: "",
        multiplayerRoomPrefix: "",
        roomHost: "",
        playerDiscordAccount: "",
        playerState: "",
        ready: "",
        notReady: "",
        spectating: "",
        setModMultiplierFailed: "",
        setModMultiplierSuccess: "",
        default: "",
        winConditionScoreV1: "",
        winConditionAccuracy: "",
        winConditionMaxCombo: "",
        winConditionScoreV2: "",
        winConditionMost300s: "",
        winConditionLeast100s: "",
        winConditionLeast50s: "",
        winConditionLeastMisses: "",
        winConditionLeastUnstableRate: "",
        winConditionMostDroidPp: "",
        winConditionMostPcPp: "",
        teamModeHeadToHead: "",
        teamModeTeamVS: "",
    };
}
