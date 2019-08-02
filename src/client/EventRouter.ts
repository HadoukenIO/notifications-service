/**
 * @hidden
 */

import {EventEmitter} from 'events';

import {NotificationActionEventTransport} from './internal';
import {eventEmitter} from './connection';

import {NotificationActionEvent, NotificationEvent} from '.';

let eventHandler: EventRouter | null;

type EventDeserializer<E extends NotificationEvent> = (event: EventTransport<E>) => E;

type TransportMappings<T> =
    T extends NotificationActionEvent ? NotificationActionEventTransport :
    never;
type TransportMemberMappings<T> =
    T;

interface EventTarget {
    type: string;
    id: string;
}
type Targeted<T extends NotificationEvent> = T & {
    /**
     * If present, will be used to find the correct emitter.
     *
     * Allows events to be raised from client-side objects that mirror a corresponding provider-side object. If target
     * is omitted, events will be raised from a top-level/"global" event emitter.
     */
    target?: EventTarget;
}

export type Transport<T extends NotificationEvent> = T extends TransportMappings<T> ? TransportMappings<T> : {
    [K in keyof T]: TransportMemberMappings<T[K]>;
};
export type EventTransport<T extends NotificationEvent> = Targeted<Transport<T>>;

export function getEventRouter(): EventRouter {
    if (!eventHandler) {
        eventHandler = new EventRouter(eventEmitter);
    }

    return eventHandler;
}

/**
  * Class for hepling take events that have arrived at the client via the IAB channel, and dispatching them on the correct client-side object
  */
export class EventRouter {
    private readonly _emitterProviders: {[targetType: string]: (targetId: string) => EventEmitter};
    private readonly _deserializers: {[eventType: string]: EventDeserializer<NotificationEvent>};

    private _defaultEmitter: EventEmitter;

    public constructor(defaultEmitter: EventEmitter) {
        this._emitterProviders = {};
        this._deserializers = {};

        this._defaultEmitter = defaultEmitter;
    }

    public registerEmitterProvider(targetType: string, emitterProvider: (targetId: string) => EventEmitter): void {
        this._emitterProviders[targetType] = emitterProvider;
    }

    public registerDeserializer<E extends NotificationEvent>(eventType: E['type'], deserializer: EventDeserializer<E>): void {
        this._deserializers[eventType] = deserializer as unknown as EventDeserializer<NotificationEvent>;
    }

    public dispatchEvent(event: EventTransport<NotificationEvent>): void {
        const {type, target} = event;
        const deserializer = this._deserializers[type];

        const emitter = target ? this._emitterProviders[target.type](target.id) : this._defaultEmitter;
        const deserializedEvent = deserializer ? deserializer(event) : event;

        emitter.emit(type, deserializedEvent);
    }
}
