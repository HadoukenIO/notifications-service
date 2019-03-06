/**
 * @hidden
 */

/**
 * File contains types used to communicate between client and provider.
 *
 * These types are a part of the client, but are not required by applications wishing to interact with the service.
 * This file is excluded from the public-facing TypeScript documentation.
 */
import {NotificationOptions} from './index';

/**
 * The identity of the main application window of the service provider
 */
export const SERVICE_IDENTITY = {
    uuid: 'notifications-service',
    name: 'notifications-service'
};

/**
 * Name of the IAB channel use to communicate between client and provider
 */
export const SERVICE_CHANNEL = 'of-notifications-service-v1';

export const enum APITopic {
    CREATE = 'create-notification',
    CLEAR = 'clear-notification',
    GET_ALL = 'fetch-app-notifications',
    CLEAR_ALL = 'clear-app-notifications'
}

export type CreatePayload = {id: string;} & NotificationOptions;


export interface ClearPayload {
    id: string;
}

export interface TopicPayloadMap {
    [APITopic.CREATE]: CreatePayload;
    [APITopic.CLEAR]: ClearPayload;
    [APITopic.CLEAR_ALL]: undefined;
    [APITopic.GET_ALL]: undefined;
}

export interface TopicResponseMap {
    [APITopic.CREATE]: void;
    [APITopic.CLEAR]: void;
    [APITopic.CLEAR_ALL]: void;
    [APITopic.GET_ALL]: NotificationOptions[];
}
