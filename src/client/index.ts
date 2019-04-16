import {tryServiceDispatch, eventEmitter} from './connection';
import {APITopic} from './internal';
import {NotificationOptions, Notification} from './models/NotificationOptions';
import {NotificationEvent} from './models/NotificationEvent';

export function addEventListener<E extends NotificationEvent>(eventType: E['type'], listener: (event: E) => void): void {
    if (typeof fin === 'undefined') {
        throw new Error('fin is not defined. The openfin-notifications module is only intended for use in an OpenFin application.');
    }

    eventEmitter.addListener(eventType, listener);
}

export function removeEventListener<E extends NotificationEvent>(eventType: E['type'], listener: (event: E) => void): void {
    if (typeof fin === 'undefined') {
        throw new Error('fin is not defined. The openfin-notifications module is only intended for use in an OpenFin application.');
    }

    eventEmitter.removeListener(eventType, listener);
}

export async function create(options: NotificationOptions): Promise<Notification> {
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.CREATE_NOTIFICATION, options);
}

/**
 * Returned boolean signifies what happend on the provider side
 *  - true: Notifcation was found with that ID and succesfully deleted
 *  - false: No notification was found with that ID, but otherwise things worked fine
 *  - throws Error: some other unspecified error occured when retrieving or
 *      deleting the notification
 */
export async function clear(id: string): Promise<boolean> {
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.CLEAR_NOTIFICATION, {id});
}

export async function getAll(): Promise<Notification[]>{
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.GET_APP_NOTIFICATIONS, undefined);
}

/**
 * Returned boolean signifies what happend on the provider side
 *  - >0: That number of notifications were found and succesfully deleted
 *  - =0: No notifications were found, but otherwise things worked fine
 *  - throws Error: some other unspecified error occured when retrieving or
 *      deleting the notification
 */
export async function clearAll(): Promise<number> {
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.CLEAR_APP_NOTIFICATIONS, undefined);
}

export async function toggleNotificationCenter(): Promise<void> {
    return tryServiceDispatch(APITopic.TOGGLE_NOTIFICATION_CENTER, undefined);
}
