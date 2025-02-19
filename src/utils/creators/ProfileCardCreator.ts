import {
    Canvas,
    createCanvas,
    loadImage,
    CanvasRenderingContext2D,
} from "canvas";
import { Player } from "@rian8337/osu-droid-utilities";
import { promises } from "fs";
import { UserBind } from "@database/utils/elainaDb/UserBind";
import { PlayerInfo } from "@database/utils/aliceDb/PlayerInfo";
import { Language } from "@localization/base/Language";
import { ProfileCardCreatorLocalization } from "@localization/utils/creators/ProfileCardCreator/ProfileCardCreatorLocalization";
import { LocaleHelper } from "@utils/helpers/LocaleHelper";
import { ScoreHelper } from "@utils/helpers/ScoreHelper";
import { OfficialDatabaseUser } from "@database/official/schema/OfficialDatabaseUser";
import { DroidHelper } from "@utils/helpers/DroidHelper";

/**
 * A utility to create profile cards.
 */
export class ProfileCardCreator {
    /**
     * The player.
     */
    private readonly player:
        | Pick<
              OfficialDatabaseUser,
              | "id"
              | "username"
              | "score"
              | "accuracy"
              | "playcount"
              | "region"
              | "pp"
          >
        | Player;

    /**
     * Whether to show detailed statistics in the profile card.
     */
    private readonly detailed: boolean;

    /**
     * The bind information of the player.
     */
    private readonly bindInfo?: UserBind | null;

    /**
     * Information about the bound Discord account of the player.
     */
    private readonly playerInfo?: PlayerInfo | null;

    /**
     * The canvas that will be used to draw.
     */
    private canvas: Canvas;

    /**
     * The canvas context that will be used to draw.
     */
    private get context(): CanvasRenderingContext2D {
        return this.canvas.getContext("2d");
    }

    /**
     * Whether to draw for template badges.
     */
    private template = false;

    private readonly localization: ProfileCardCreatorLocalization;
    private readonly BCP47: string;

    /**
     * @param player The player to draw.
     * @param detailed Whether to show detailed statistics in the profile card.
     * @param bindInfo The bind information of the player.
     * @param rankedScoreInfo The ranked score information of the player.
     * @param playerInfo Information about the bound Discord account of the player.
     */
    constructor(
        player:
            | Pick<
                  OfficialDatabaseUser,
                  | "id"
                  | "username"
                  | "score"
                  | "accuracy"
                  | "playcount"
                  | "region"
                  | "pp"
              >
            | Player,
        detailed: boolean,
        bindInfo?: UserBind | null,
        playerInfo?: PlayerInfo | null,
        // Disable temporarily while finding a solution for unicode characters
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        language: Language = "en",
    ) {
        this.player = player;
        this.detailed = detailed;
        this.bindInfo = bindInfo;
        this.playerInfo = playerInfo;
        this.localization = new ProfileCardCreatorLocalization("en");
        this.BCP47 = LocaleHelper.convertToBCP47(this.localization.language);

        this.canvas = createCanvas(500, this.detailed ? 500 : 200);
    }

    /**
     * Generates the template card of the player.
     */
    async generateTemplateCard(): Promise<Buffer> {
        this.template = true;

        const card = await this.generateCard();

        this.template = false;

        return card;
    }

    /**
     * Generates the profile card of the player.
     */
    async generateCard(): Promise<Buffer> {
        this.resetCanvas();

        await this.drawBackground();
        await this.drawUserProfile();
        await this.drawDescriptionBox();

        return this.canvas.toBuffer();
    }

    /**
     * Resets the current canvas by creating a new one.
     */
    private resetCanvas(): void {
        this.canvas = createCanvas(
            500,
            this.detailed || this.template ? 500 : 200,
        );
    }

    /**
     * Draws profile background to the current canvas context.
     */
    private async drawBackground(): Promise<void> {
        this.context.save();

        const backgroundImageID =
            this.playerInfo?.picture_config.activeBackground.id ?? "default";
        const bg = await loadImage(
            `${process.cwd()}/files/images/backgrounds/${backgroundImageID}.png`,
        );
        this.context.drawImage(bg, 0, 0);

        this.context.restore();
    }

    /**
     * Draws the user profile area of the profile card.
     */
    private async drawUserProfile(): Promise<void> {
        this.initUserProfile();
        await this.drawPlayerAvatar();
        await this.drawFlag();
        await this.drawPlayerRank();

        if (!this.detailed && !this.template) {
            // Draw player level for detailed or template profile card in description
            // box so that description box's initialization doesn't overlap the drawing.
            this.drawPlayerLevel();
        }

        this.writePlayerProfile();
    }

    /**
     * Draws the description box area of the profile card.
     */
    private async drawDescriptionBox(): Promise<void> {
        if (!this.detailed && !this.template) {
            return;
        }

        this.initDescriptionBox();
        this.drawPlayerLevel();
        await this.drawMahiruCoinsInformation();

        if (this.template) {
            this.drawTemplateBadges();
        } else {
            await this.drawBadges();
        }
    }

    /**
     * Initializes the area where user profile will be drawn.
     */
    private initUserProfile(): void {
        this.context.save();

        this.context.globalAlpha = 0.9;
        this.context.fillStyle = "#bbbbbb";
        this.context.fillRect(164, 9, 327, 185);

        this.context.restore();
    }

    /**
     * Draws the player's avatar to the current canvas context.
     */
    private async drawPlayerAvatar(): Promise<void> {
        this.context.save();

        const avatar = await DroidHelper.getAvatar(this.player.id);

        if (!avatar) {
            return;
        }

        this.context.drawImage(await loadImage(avatar), 9, 9, 150, 150);

        this.context.restore();
    }

    /**
     * Draws the player's flag to the current canvas context.
     */
    private async drawFlag(): Promise<void> {
        this.context.save();

        try {
            const location =
                this.player instanceof Player
                    ? this.player.location
                    : this.player.region.toUpperCase();

            const flagPath = `${process.cwd()}/files/flags/${location}.png`;
            const flagStats = await promises.stat(flagPath);

            if (flagStats.isFile()) {
                const flagImage = await loadImage(flagPath);
                this.context.drawImage(
                    flagImage,
                    440,
                    15,
                    flagImage.width / 1.5,
                    flagImage.height / 1.5,
                );

                this.context.textAlign = "center";
                this.context.textBaseline = "middle";
                this.context.font =
                    this.detailed || this.template
                        ? "18px Torus"
                        : "16px Torus";

                this.context.fillText(
                    location,
                    440 + flagImage.width / 3,
                    flagImage.height + 15,
                );
            }
            // eslint-disable-next-line no-empty
        } catch {}

        this.context.restore();
    }

    /**
     * Draws the player's rank.
     */
    private async drawPlayerRank(): Promise<void> {
        const rank =
            this.player instanceof Player
                ? this.player.rank
                : ((await DroidHelper.getPlayerPPRank(this.player.id)) ?? 0);

        this.context.save();

        this.context.globalAlpha = 0.95;
        this.context.fillStyle = "#cccccc";
        this.context.fillRect(9, 164, 150, 30);

        this.context.globalAlpha = 1;
        this.context.font = "bold 24px Torus";
        switch (true) {
            case rank === 1:
                this.context.fillStyle = "#0009cd";
                break;
            case rank <= 10:
                this.context.fillStyle = "#e1b000";
                break;
            case rank <= 100:
                this.context.fillStyle = "rgba(180, 44, 44, 0.81)";
                break;
            case rank <= 1000:
                this.context.fillStyle = "#008708";
                break;
            default:
                this.context.fillStyle = "#787878";
        }
        this.context.fillText(`#${rank.toLocaleString(this.BCP47)}`, 12, 187);

        this.context.restore();
    }

    /**
     * Draws the player's ranked score level.
     */
    private drawPlayerLevel(): void {
        this.context.save();

        // Outer box
        this.context.globalAlpha = 0.9;
        this.context.fillStyle = "#cccccc";
        if (this.detailed || this.template) {
            this.context.fillRect(77, 206, 405, 30);
        } else {
            this.context.fillRect(215, 152, 267, 30);
        }

        // Inner box
        this.context.fillStyle = "#979797";
        if (this.detailed || this.template) {
            this.context.fillRect(79, 208, 401, 26);
        } else {
            this.context.fillRect(217, 154, 263, 26);
        }

        this.context.globalAlpha = 1;

        // Level progress
        const level = ScoreHelper.calculateProfileLevel(this.player.score);
        const progress = level - Math.floor(level);
        if (progress > 0) {
            this.context.fillStyle = "#e1c800";
            if (this.detailed || this.template) {
                this.context.fillRect(79, 208, progress * 401, 26);
            } else {
                this.context.fillRect(217, 154, progress * 263, 26);
            }
        }

        // Level text
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";
        this.context.fillStyle =
            this.playerInfo?.picture_config.textColor ?? "#000000";
        if (this.detailed || this.template) {
            this.context.font = "19px Torus";
            this.context.fillText(
                `${(progress * 100).toFixed(2)}%`,
                279.5,
                221,
            );
            this.context.fillText(`Lv${Math.floor(level)}`, 43, 221);
        } else {
            this.context.font = "16px Torus";
            this.context.fillText(
                `${(progress * 100).toFixed(2)}%`,
                348.5,
                167,
            );
            this.context.fillText(`Lv${Math.floor(level)}`, 189.5, 167);
        }

        this.context.restore();
    }

    /**
     * Writes the details of the player's profile.
     */
    private writePlayerProfile(): void {
        this.context.save();

        const x = 169;
        const y = this.detailed || this.template ? 84 : 50;

        this.context.fillStyle = "#000000";
        this.context.font =
            this.detailed || this.template
                ? "bold 25px Torus, sans-serif"
                : "bold 20px Torus, sans-serif";
        this.context.fillText(
            this.player.username,
            x,
            this.detailed || this.template ? 45 : 30,
            243,
        );

        let yOffset = 0;

        const increaseYOffset = (): void => {
            yOffset += this.detailed || this.template ? 20 : 18;
        };

        this.context.font =
            this.detailed || this.template ? "18px Torus" : "16px Torus";
        this.context.fillText(
            `${this.localization.getTranslation(
                "totalScore",
            )}: ${this.player.score.toLocaleString(this.BCP47)}`,
            x,
            y + yOffset,
        );

        increaseYOffset();

        this.context.fillText(
            `${this.localization.getTranslation("accuracy")}: ${(
                this.player.accuracy * (this.player instanceof Player ? 1 : 100)
            ).toFixed(2)}%`,
            x,
            y + yOffset,
        );

        increaseYOffset();

        this.context.fillText(
            `${this.localization.getTranslation(
                "playCount",
            )}: ${(this.player instanceof Player ? this.player.playCount : this.player.playcount).toLocaleString(this.BCP47)}`,
            x,
            y + yOffset,
        );

        increaseYOffset();

        this.context.fillText(
            `${this.localization.getTranslation(
                "performancePoints",
            )}: ${this.player.pp.toFixed(2)}pp`,
            x,
            y + yOffset,
        );

        increaseYOffset();

        if (this.bindInfo?.clan) {
            this.context.fillText(
                `${this.localization.getTranslation("clan")}: ${
                    this.bindInfo.clan
                }`,
                x,
                y + yOffset,
            );

            increaseYOffset();
        }

        this.context.restore();
    }

    /**
     * Initializes the area where description box will be drawn.
     */
    private initDescriptionBox(): void {
        this.context.save();

        this.context.globalAlpha = 0.85;
        this.context.fillStyle =
            this.playerInfo?.picture_config.bgColor ?? "rgb(0, 139, 255)";
        this.context.fillRect(9, 197, 482, 294);

        this.context.restore();
    }

    /**
     * Draws the badges that the player owns.
     */
    private async drawBadges(): Promise<void> {
        this.context.save();

        this.context.globalAlpha = 0.6;
        this.context.fillStyle = "#b9a29b";
        this.context.fillRect(15, 312, 470, 170);
        this.context.globalAlpha = 1;

        const badges = this.playerInfo?.picture_config.activeBadges ?? [];

        for (let i = 0; i < badges.length; ++i) {
            const profileBadge = badges[i];

            if (!profileBadge) {
                continue;
            }

            const badgeImage = await loadImage(
                `${process.cwd()}/files/images/badges/${profileBadge.id}.png`,
            );
            if (i / 5 < 1) {
                this.context.drawImage(badgeImage, i * 94 + 19.5, 312, 85, 85);
            } else {
                this.context.drawImage(
                    badgeImage,
                    (i - 5) * 94 + 19.5,
                    397,
                    85,
                    85,
                );
            }
        }

        this.context.restore();
    }

    /**
     * Draws the template for badges.
     */
    private drawTemplateBadges(): void {
        this.context.save();

        this.context.globalAlpha = 0.6;
        this.context.fillStyle = "#b9a29b";
        this.context.fillRect(15, 312, 470, 170);

        this.context.textAlign = "center";
        this.context.globalAlpha = 1;
        this.context.fillStyle = "#000000";
        this.context.beginPath();
        this.context.moveTo(15, 397);
        this.context.lineTo(485, 397);

        for (let i = 15 + 94; i < 15 + 94 * 6; i += 94) {
            this.context.moveTo(i, 312);
            this.context.lineTo(i, 482);
        }

        this.context.stroke();

        this.context.font = "bold 12px Torus";
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";

        for (let i = 0; i < 10; ++i) {
            if (i / 5 < 1) {
                this.context.fillText((i + 1).toString(), 54.5 + i * 94, 353.5);
            } else {
                this.context.fillText(
                    (i + 1).toString(),
                    54.5 + (i - 5) * 94,
                    439.5,
                );
            }
        }

        this.context.restore();
    }

    /**
     * Draws the Mahiru coins information of the player.
     */
    private async drawMahiruCoinsInformation(): Promise<void> {
        this.context.save();

        const coinImage = await loadImage(
            `${process.cwd()}/files/images/MahiruBeat.png`,
        );

        this.context.drawImage(coinImage, 15, 255, 50, 50);

        this.context.font = "18px Torus";
        this.context.textBaseline = "middle";

        this.context.fillText(
            `${(this.playerInfo?.coins ?? 0).toLocaleString(
                this.BCP47,
            )} Mahiru Coins | ${(this.playerInfo?.points ?? 0).toLocaleString(
                this.BCP47,
            )} ${this.localization.getTranslation("challengePoints")}`,
            75,
            280,
        );

        this.context.restore();
    }
}
