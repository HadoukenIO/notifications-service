/**
 * @hidden
 */

import {EventEmitter} from 'events';

import {EventSpecification} from '../provider/model/APIHandler';

import {TransportMappings, TransportMemberMappings} from './internal';

type EmitterProvider = (targetId: string) => EventEmitter;
type EventDeserializer<E extends EventSpecification, T extends E> = (event: Transport<T>) => T;

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
    target: EventTarget | 'default';
}
export type Transport<T extends EventSpecification> = TransportMappings<T> extends never ? {
    [K in keyof T]: TransportMemberMappings<T[K]>;
} : TransportMappings<T>;

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
        this._deserializers[eventType] = deserializer as unknown as EventDeserializer<E, E>;
    }

    public dispatchEvent<T extends E>(event: Targeted<Transport<T>>): void {
        const {type, target, ...rest} = event;

        let emitter: EventEmitter;
        if (target === 'default') {
            emitter = this._defaultEmitter;
        } else if (this._emitterProviders.hasOwnProperty(target && target.type)) {
            emitter = this._emitterProviders[target.type](target.id);
        } else if (target) {
            throw new Error(`Invalid target, no provider registered for '${target.type}'`);
        } else {
            throw new Error('Invalid event, no target specified');
        }

        // Need to remove 'target' from event before emitting event
        const inputEvent: Transport<T> = {type, ...rest} as Transport<T>;

        // Also run through any custom deserializer
        const deserializer = this._deserializers[type];
        if (deserializer) {
            emitter.emit(type, deserializer(inputEvent));
        } else {
            emitter.emit(type, inputEvent);
        }
    }
}
