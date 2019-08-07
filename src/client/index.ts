/**
 * @module Index
 */

import {tryServiceDispatch, eventEmitter} from './connection';
import {APITopic} from './internal';

import {NotificationOptions, Notification, NotificationClickedEvent, NotificationClosedEvent, NotificationButtonClickedEvent} from './index';
import {NotificationEvent} from './index';

/**
 * Configuration options for constructing a Notifications object.
 */
export interface NotificationOptions {
    /**
     * A unique identifier for the Notification.
     *
     * If not provided at time of creation, one will be generated for you and returned as part of the {@link create} method.
     */
    id?: string;
    /**
     * Main Notification content.
     */
    body: string;
    /**
     * Title of the Notification (e.g. sender name for email).
     */
    title: string;
    /**
     * Subtitle of the Notification.
     */
    subtitle?: string;
    /**
     * URL of the icon to be displayed in the Notification.
     */
    icon?: string;
    /**
     * Any custom context data associated with the Notification.
     */
    customData?: CustomData;
    /**
     * The timestamp shown on the Notification.  This is presentational only - a future date will not incur a scheduling action.
     */
    date?: Date;
    /**
     * Text and icons for up to two Notification action buttons.
     */
    buttons?: OptionButton[];
}

/**
 * Configuration options for constructing a Button within a Notification.
 */
export interface OptionButton {
    title: string;
    iconUrl?: string;
}

/**
 * User-defined context data that can be attached to Notifications.
 */
export type CustomData = any;

/**
 * A fully hydrated form of the {@link NotificationOptions}.
 */
export type Notification = Required<NotificationOptions>;

/**
 * Event fired whenever the Notification has been clicked on.
 *
 * This will not fire in cases of Notification Buttons being clicked.  See {@link NotificationButtonClickedEvent}.
 *
 * @event
 */
export interface NotificationClickedEvent {
    type: 'notification-clicked';
    notification: Notification;
}

/**
 * Event fired whenever the Notification has been closed.
 *
 * @event
 */
export interface NotificationClosedEvent {
    type: 'notification-closed';
    notification: Notification;
}

/**
 * Event fired whenever the Notification has been clicked.
 *
 * This will not fire in cases of non-buttons being clicked.  See {@link NotificationClickedEvent}.
 *
 * @event
 */
export interface NotificationButtonClickedEvent {
    type: 'notification-button-clicked';
    notification: Notification;
    buttonIndex: number;
}

/**
 * @hidden
 */
export type NotificationEvent = NotificationClickedEvent | NotificationClosedEvent | NotificationButtonClickedEvent;

export function addEventListener(eventType: 'notification-clicked', listener: (event: NotificationClickedEvent) => void): void;
export function addEventListener(eventType: 'notification-closed', listener: (event: NotificationClosedEvent) => void): void;
export function addEventListener(eventType: 'notification-button-clicked', listener: (event: NotificationButtonClickedEvent) => void): void;
export function addEventListener<E extends NotificationEvent>(eventType: E['type'], listener: (event: E) => void): void;
export function addEventListener<E extends NotificationEvent>(eventType: E['type'], listener: (event: E) => void): void {
    if (typeof fin === 'undefined') {
        throw new Error('fin is not defined. The openfin-notifications module is only intended for use in an OpenFin application.');
    }

    eventEmitter.addListener(eventType, listener);
    if (eventEmitter.listenerCount(eventType) === 1) {
        tryServiceDispatch(APITopic.ADD_EVENT_LISTENER, eventType);
    }
}

export function removeEventListener(eventType: 'notification-clicked', listener: (event: NotificationClickedEvent) => void): void;
export function removeEventListener(eventType: 'notification-closed', listener: (event: NotificationClosedEvent) => void): void;
export function removeEventListener(eventType: 'notification-button-clicked', listener: (event: NotificationButtonClickedEvent) => void): void;
export function removeEventListener<E extends NotificationEvent>(eventType: E['type'], listener: (event: E) => void): void;
export function removeEventListener<E extends NotificationEvent>(eventType: E['type'], listener: (event: E) => void): void {
    if (typeof fin === 'undefined') {
        throw new Error('fin is not defined. The openfin-notifications module is only intended for use in an OpenFin application.');
    }

    if (eventEmitter.listenerCount(eventType) === 1) {
        tryServiceDispatch(APITopic.REMOVE_EVENT_LISTENER, eventType);
    }
    eventEmitter.removeListener(eventType, listener);
}

/**
 * Creates a new Notification.
 *
 * The Notification will appear in the Notification Center and as a toast if the Center is not visible.
 *
 * If a Notification is created with an `id` of an already existing Notification, the existing Notification will be recreated with the new content.
 *
 * ```ts
 * import {create} from 'openfin-notifications';
 *
 * create({
 *      id: "uniqueNotificationId",
 *      body: "I'm the Notification body text",
 *      icon: "https://openfin.co/favicon.ico"
 * });
 * ```
 *
 * @param options Notification configuration options.
 */
export async function create(options: NotificationOptions): Promise<Notification> {
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.CREATE_NOTIFICATION, options);
}

/**
 * Clears a specific Notification from the Notification Center.
 *
 * Returns true if the Notification was successfully cleared.  Returns false if the Notification was not cleared, without errors.
 *
 * ```ts
 * import {clear} from 'openfin-notifications';
 *
 * clear("uniqueNotificationId");
 * ```
 *
 * @param id ID of the Notification to clear.
 */
export async function clear(id: string): Promise<boolean> {
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.CLEAR_NOTIFICATION, {id});
}

/**
 * Retrieves all Notifications which were created by the calling application, including child windows.
 *
 * ```ts
 * import {getAll} from 'openfin-notifications'
 *
 * getAll()
 *  .then(console.log);
 * ```
 */
export async function getAll(): Promise<Notification[]> {
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.GET_APP_NOTIFICATIONS, undefined);
}

/**
 * Clears all Notifications which were created by the calling application, including child windows.
 *
 * Returns the number of successfully cleared Notifications.
 *
 * ```ts
 * import {clearAll} from 'openfin-notifications';
 *
 * clearAll();
 * ```
 */
export async function clearAll(): Promise<number> {
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.CLEAR_APP_NOTIFICATIONS, undefined);
}

/**
 * Toggles the visibility of the Notification Center.
 *
 * ```ts
 * import {toggleNotificationCenter} from 'openfin-notifications';
 *
 * toggleNotificationCenter();
 * ```
 */
export async function toggleNotificationCenter(): Promise<void> {
    return tryServiceDispatch(APITopic.TOGGLE_NOTIFICATION_CENTER, undefined);
}
