import {tryServiceDispatch, eventEmitter} from './connection';
import {APITopic} from './internal';
import {NotificationOptions, Notification} from './Notification';
import {NotificationEvent} from './Notification';

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

export async function clear(id: string): Promise<boolean> {
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.CLEAR_NOTIFICATION, {id});
}

export async function getAll(): Promise<Notification[]>{
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.GET_APP_NOTIFICATIONS, undefined);
}

export async function clearAll(): Promise<number> {
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.CLEAR_APP_NOTIFICATIONS, undefined);
}

export async function toggleNotificationCenter(): Promise<void> {
    return tryServiceDispatch(APITopic.TOGGLE_NOTIFICATION_CENTER, undefined);
}
