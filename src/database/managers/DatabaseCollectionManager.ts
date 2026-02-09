import { BaseDocument } from "structures/database/BaseDocument";
import { OperationResult } from "structures/core/OperationResult";
import { Manager } from "@utils/base/Manager";
import { Collection as DiscordCollection } from "discord.js";
import {
    Collection as MongoDBCollection,
    Filter,
    FindOptions,
    OptionalUnlessRequiredId,
    UpdateFilter,
    UpdateOptions,
    Document,
} from "mongodb";

/**
 * A MongoDB collection manager.
 */
export abstract class DatabaseCollectionManager<
    T extends BaseDocument,
    C extends Manager,
> extends Manager {
    /**
     * The collection that this manager is responsible for.
     */
    protected readonly collection: MongoDBCollection<T>;

    /**
     * The constructor function of the utility of this collection.
     */
    protected abstract readonly utilityInstance: new (data: T) => C;

    /**
     * The default document of this collection.
     */
    abstract get defaultDocument(): T;

    /**
     * The default instance of this collection utility.
     */
    get defaultInstance(): C {
        return new this.utilityInstance(this.defaultDocument);
    }

    /**
     * @param collection The MongoDB collection.
     */
    constructor(collection: MongoDBCollection<T>) {
        super();

        this.collection = collection;
    }

    /**
     * Updates multiple documents in the collection.
     *
     * @param filter The filter used to select the documents to update.
     * @param query The update operations to be applied to the documents.
     * @param options Options for the update operation.
     * @returns An object containing information about the operation.
     */
    async updateMany(
        filter: Filter<T>,
        query: UpdateFilter<T> | Partial<T>,
        options: UpdateOptions = {},
    ): Promise<OperationResult> {
        const result = await this.collection.updateMany(filter, query, options);

        return this.createOperationResult(result.acknowledged);
    }

    /**
     * Updates a document in the collection.
     *
     * @param filter The filter used to select the document to update.
     * @param query The update operations to be applied to the document.
     * @param options Options for the update operation.
     * @returns An object containing information about the operation.
     */
    async updateOne(
        filter: Filter<T>,
        query: UpdateFilter<T> | Partial<T>,
        options: UpdateOptions = {},
    ): Promise<OperationResult> {
        const result = await this.collection.updateOne(filter, query, options);

        return this.createOperationResult(result.acknowledged);
    }

    /**
     * Gets multiple documents from the collection and then
     * index them based on the given key.
     *
     * @param key The key to index.
     * @param filter The document filter.
     * @param options The options for retrieving the documents.
     * @returns The indexed documents in a discord.js collection.
     */
    async get<K extends keyof T>(
        key: K,
        filter: Filter<T> = {},
        options?: FindOptions,
    ): Promise<DiscordCollection<NonNullable<T[K]>, C>> {
        if (options?.projection?.[key as keyof Document] === 0) {
            // Prevent cases where key is undefined.
            options.projection[key as keyof Document] = 1;
        }

        const res = (await this.collection
            .find(filter, this.processFindOptions(options))
            .toArray()) as T[];

        const collection = new DiscordCollection<NonNullable<T[K]>, C>();

        for (const data of res) {
            collection.set(
                data[key] as NonNullable<T[K]>,
                new this.utilityInstance(data),
            );
        }

        return collection;
    }

    /**
     * Gets a document from the collection and convert it
     * to its utility.
     *
     * @param filter The document filter.
     * @param options The options for retrieving the documents.
     * @returns The converted document.
     */
    async getOne(
        filter: Filter<T> = {},
        options?: FindOptions,
    ): Promise<C | null> {
        const res = await this.collection.findOne(
            filter,
            this.processFindOptions(options),
        );

        return res ? new this.utilityInstance(res) : null;
    }

    /**
     * Delete multiple documents from the collection.
     *
     * @param filter The filter used to select the documents to remove.
     * @returns An object containing information about the operation.
     */
    async deleteMany(filter: Filter<T>): Promise<OperationResult> {
        const result = await this.collection.deleteMany(filter);

        return this.createOperationResult(result.acknowledged);
    }

    /**
     * Delete a document from the collection.
     *
     * @param filter The filter used to select the document to remove.
     * @returns An object containing information about the operation.
     */
    async deleteOne(filter: Filter<T>): Promise<OperationResult> {
        const result = await this.collection.deleteOne(filter);

        return this.createOperationResult(result.acknowledged);
    }

    /**
     * Inserts multiple documents into the collection.
     *
     * @param docs The part of documents to insert. Each document will be assigned to the default document with `Object.assign()`.
     */
    async insert(...docs: Partial<T>[]): Promise<OperationResult> {
        const result = await this.collection.insertMany(
            docs.map(
                (v) =>
                    Object.assign(
                        this.defaultDocument,
                        v,
                    ) as OptionalUnlessRequiredId<T>,
            ),
        );

        return this.createOperationResult(result.acknowledged);
    }

    /**
     * Processes find options.
     *
     * @param options The options.
     */
    protected processFindOptions(
        options?: FindOptions,
    ): FindOptions | undefined {
        return options;
    }
}
