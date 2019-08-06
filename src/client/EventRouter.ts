/**
 * @hidden
 */

import {EventEmitter} from 'events';

import {EventSpecification} from '../provider/model/APIHandler';

import {TransportMappings, TransportMemberMappings} from './internal';
import {eventEmitter} from './connection';


let eventHandler: EventRouter | null;

type EventDeserializer<E extends EventSpecification> = (event: EventTransport<E>) => E;

interface EventTarget {
    type: string;
    id: string;
}
type Targeted<T extends EventSpecification> = T & {
    /**
     * If present, will be used to find the correct emitter.
     *
     * Allows events to be raised from client-side objects that mirror a corresponding provider-side object. If target
     * is omitted, events will be raised from a top-level/"global" event emitter.
     */
    target?: EventTarget;
}

export type Transport<E extends EventSpecification> = E extends TransportMappings<E> ? TransportMappings<E> : {
    [K in keyof E]: TransportMemberMappings<E[K]>;
};
export type EventTransport<E extends EventSpecification> = Targeted<Transport<E>>;

export function getEventRouter(): EventRouter {
    if (!eventHandler) {
        eventHandler = new EventRouter(eventEmitter);
    }

    return eventHandler;
}

/**
  * Class for helping take events that have arrived at the client via the IAB channel, and dispatching them on the correct client-side object
  */
export class EventRouter {
    private readonly _emitterProviders: {[targetType: string]: (targetId: string) => EventEmitter};
    private readonly _deserializers: {[eventType: string]: EventDeserializer<EventSpecification>};

    private _defaultEmitter: EventEmitter;

    public constructor(defaultEmitter: EventEmitter) {
        this._emitterProviders = {};
        this._deserializers = {};

        this._defaultEmitter = defaultEmitter;
    }

    public registerEmitterProvider(targetType: string, emitterProvider: (targetId: string) => EventEmitter): void {
        this._emitterProviders[targetType] = emitterProvider;
    }

    public registerDeserializer<E extends EventSpecification>(eventType: E['type'], deserializer: EventDeserializer<E>): void {
        this._deserializers[eventType] = deserializer as unknown as EventDeserializer<EventSpecification>;
    }

    public dispatchEvent(event: EventTransport<EventSpecification>): void {
        const {type, target} = event;
        const deserializer = this._deserializers[type];

        const emitter = target ? this._emitterProviders[target.type](target.id) : this._defaultEmitter;
        const deserializedEvent = deserializer ? deserializer(event) : event;

        emitter.emit(type, deserializedEvent);
    }
}
