import {StoredNotification} from '../model/StoredNotification';

export interface RootState {
    notifications: StoredNotification[];
    windowVisible: boolean;
}

export type Immutable<T> = {
    readonly [K in keyof T]:
        T[K] extends Date ? T[K] :
        T[K] extends [infer U, infer V] ? Readonly<[Immutable<U>, Immutable<V>]> :
        T[K] extends Array<infer U> ? (U extends Object ? Immutable<T[K]> : U) :
        T[K] extends Object ? Immutable<T[K]> :
        Readonly<T[K]>;
}

export function mutable<T>(value: Immutable<T[]>): T[]
export function mutable<T>(value: Immutable<T>): T
export function mutable<T>(value: Immutable<T>): T {
    return value as T;
}
