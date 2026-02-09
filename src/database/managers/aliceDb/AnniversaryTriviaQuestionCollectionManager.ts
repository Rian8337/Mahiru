import { DatabaseAnniversaryTriviaQuestion } from "@structures/database/aliceDb/DatabaseAnniversaryTriviaQuestion";
import { DatabaseCollectionManager } from "../DatabaseCollectionManager";
import { AnniversaryTriviaQuestion } from "@database/utils/aliceDb/AnniversaryTriviaQuestion";
import { FindOptions } from "mongodb";

/**
 * A manager for the `anniversarytriviaquestion` collection.
 */
export class AnniversaryTriviaQuestionCollectionManager extends DatabaseCollectionManager<
    DatabaseAnniversaryTriviaQuestion,
    AnniversaryTriviaQuestion
> {
    protected override utilityInstance: new (
        data: DatabaseAnniversaryTriviaQuestion,
    ) => AnniversaryTriviaQuestion = AnniversaryTriviaQuestion;

    override get defaultDocument(): DatabaseAnniversaryTriviaQuestion {
        return {
            id: 0,
            question: "",
            answers: [],
            correctAnswer: "",
            marks: 0,
        };
    }

    /**
     * Gets a question from its ID.
     *
     * @param id The ID of the question.
     * @param options The options for the find operation.
     * @returns The question, `null` if not found.
     */
    getFromId(
        id: number,
        options?: FindOptions,
    ): Promise<AnniversaryTriviaQuestion | null> {
        return this.getOne({ id }, options);
    }
}
