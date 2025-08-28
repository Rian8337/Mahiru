import { DatabaseManager } from "@database/DatabaseManager";
import { ModUtil } from "@rian8337/osu-base";
import { OperationResult } from "@structures/core/OperationResult";
import { DanCoursePassRequirement } from "@structures/dancourse/DanCoursePassRequirement";
import { DatabaseDanCourse } from "@structures/database/aliceDb/DatabaseDanCourse";
import { Manager } from "@utils/base/Manager";
import { Snowflake } from "discord.js";
import { ObjectId } from "mongodb";
import { DanCourseScore } from "./DanCourseScore";

/**
 * Represents a dan course.
 */
export class DanCourse extends Manager implements DatabaseDanCourse {
    readonly courseName: string;
    readonly hash: string;
    readonly requirement: DanCoursePassRequirement;
    readonly fileName: string;
    readonly roleId: Snowflake;
    readonly _id?: ObjectId;

    constructor(
        data: DatabaseDanCourse = DatabaseManager.aliceDb?.collections
            .danCourses.defaultDocument ?? {}
    ) {
        super();

        this._id = data._id;
        this.courseName = data.courseName;
        this.hash = data.hash;
        this.requirement = data.requirement;
        this.fileName = data.fileName;
        this.roleId = data.roleId;
    }

    /**
     * Checks whether a score passes this course.
     *
     * @param score The score to check.
     * @returns Whether the score passed the course.
     */
    isScorePassed(score: DanCourseScore): OperationResult {
        const scoreMods = ModUtil.deserializeMods(score.mods);
        const requiredMods = ModUtil.deserializeMods(
            this.requirement.requiredMods ?? []
        );

        if (!scoreMods.equals(requiredMods)) {
            return this.createOperationResult(false, "Invalid mods were used");
        }

        if (score.isSliderLock && !this.requirement.allowSliderLock) {
            return this.createOperationResult(
                false,
                "Slider lock was activated"
            );
        }

        switch (this.requirement.id) {
            case "score":
            case "combo":
            case "m300":
            case "rank":
                return this.createOperationResult(
                    score.grade >= this.requirement.value,
                    "Pass requirement was not met"
                );
            case "acc":
                return this.createOperationResult(
                    score.grade * 100 >= this.requirement.value,
                    "Pass requirement was not met"
                );
            default:
                return this.createOperationResult(
                    score.grade <= this.requirement.value,
                    "Pass requirement was not met"
                );
        }
    }
}
