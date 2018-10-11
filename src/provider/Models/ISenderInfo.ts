/**
 * @description This gets sent on every request the client makes to the service.
 */
export interface ISenderInfo {
    entityType: string;
    name: string;
    parentFrame: string;
    uuid: string;
    channelId: string;
    channelName: string;
}