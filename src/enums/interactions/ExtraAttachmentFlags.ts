/**
 * Attachment flags that are not present yet in discord.js, but are present in Discord's API.
 */
export enum ExtraAttachmentFlags {
    Explicit = 1 << 4,
    Gore = 1 << 6,
    SelfHarm = 1 << 7,
}