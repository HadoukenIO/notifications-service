import {tryServiceDispatch, eventEmitter} from './connection';
import {APITopic} from './internal';
import {NotificationOptions, Notification} from './Notification';
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

export async function create(id: string, options: NotificationOptions): Promise<Notification> {
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.CREATE_NOTIFICATION, {id, ...options});
}

export async function clear(id: string) {
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.CLEAR_NOTIFICATION, {id});
}

export async function getAll() {
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.GET_APP_NOTIFICATIONS, undefined);
}

export async function clearAll() {
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.CLEAR_APP_NOTIFICATIONS, undefined);
}

export async function toggleNotificationCenter() {
    return tryServiceDispatch(APITopic.TOGGLE_NOTIFICATION_CENTER, undefined);
}
