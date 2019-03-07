import { tryServiceDispatch, eventEmitter } from "./connection";
import { APITopic } from "./internal";
import { Notification } from '../shared/models/Notification';


export interface NotificationClickedEvent {
    type: 'notification-clicked';
    id: string;
}
export interface NotificationClosedEvent {
    type: 'notification-closed';
    id: string;
}
export interface NotificationButtonClickedEvent {
    type: 'notification-button-clicked';
    id: string;
    // tslint:disable-next-line:no-any TODO: work out exactly what the shape of the returned data will be in this case
    button: any;
}

export type NotificationEvent = NotificationClickedEvent | NotificationClosedEvent | NotificationButtonClickedEvent;

// TODO: This should be revisited when the provider-side types have been made more sensible
export type NotificationOptions = Partial<Notification>;

export function addEventListener<K extends NotificationEvent>(eventType: K['type'], listener: (event: K) => void): void {
    if (typeof fin === 'undefined') {
        throw new Error('fin is not defined. The openfin-layouts module is only intended for use in an OpenFin application.');
    }

    eventEmitter.addListener(eventType, listener);
}

export function removeEventListener<K extends NotificationEvent>(eventType: K['type'], listener: (event: K) => void): void {
    if (typeof fin === 'undefined') {
        throw new Error('fin is not defined. The openfin-layouts module is only intended for use in an OpenFin application.');
    }

    eventEmitter.removeListener(eventType, listener);
}

export async function create(id: string, options: NotificationOptions) {
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.CREATE, {id, ...options});
}

export async function clear(id: string) {
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.CLEAR, {id});
}

export async function getAll() {
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.GET_ALL, undefined);
}

export async function clearAll() {
    // Should have some sort of input validation here...
    return tryServiceDispatch(APITopic.CLEAR_ALL, undefined);
}
