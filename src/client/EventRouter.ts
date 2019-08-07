/**
 * @hidden
 */

import {EventEmitter} from 'events';

import {EventSpecification} from '../provider/model/APIHandler';

import {TransportMappings, TransportMemberMappings} from './internal';

type EmitterProvider = (targetId: string) => EventEmitter;
type EventDeserializer<E extends EventSpecification, T extends E> = (event: EventTransport<E, T>) => E;

interface EventTarget {
    type: string;
    id: string;
}
export type Targeted<T extends EventSpecification> = T & {
    /**
     * If present, will be used to find the correct emitter.
     *
     * Allows events to be raised from client-side objects that mirror a corresponding provider-side object. If target
     * is omitted, events will be raised from a top-level/"global" event emitter.
     */
    target?: EventTarget;
}

export type Transport<E extends EventSpecification, T extends E> = TransportMappings<T> extends never ? {
    [K in keyof T]: TransportMemberMappings<T[K]>;
} : TransportMappings<T>;
export type EventTransport<E extends EventSpecification, T extends E> = Targeted<Transport<E, T>>;

/**
  * Class for helping take events that have arrived at the client via the IAB channel, and dispatching them on the correct client-side object
  */
export class EventRouter<E extends EventSpecification> {
    private readonly _emitterProviders: {[targetType: string]: (targetId: string) => EventEmitter};
    private readonly _deserializers: {[eventType: string]: EventDeserializer<E, E>};

    private _defaultEmitter: EventEmitter;

    public constructor(defaultEmitter: EventEmitter) {
        this._emitterProviders = {};
        this._deserializers = {};

        this._defaultEmitter = defaultEmitter;
    }

    public registerEmitterProvider(targetType: string, emitterProvider: EmitterProvider): void {
        this._emitterProviders[targetType] = emitterProvider;
    }

    public registerDeserializer<T extends E>(eventType: T['type'], deserializer: EventDeserializer<E, T>): void {
        this._deserializers[eventType] = deserializer as EventDeserializer<E, E>;
    }

    public dispatchEvent<T extends E>(event: EventTransport<E, T>): void {
        const {type, target, ...rest} = event;
        const deserializer = this._deserializers[type];

        const provider: EmitterProvider|undefined = target && this._emitterProviders[target.type];
        const emitter: EventEmitter = provider ? provider(target!.id) : this._defaultEmitter;
        const deserializedEvent: E = deserializer ? deserializer(event) : {type, ...rest} as unknown as E;

        emitter.emit(type, deserializedEvent);
    }
}
