import {Store} from 'redux';

/**
 * Adds ability to watch for specific changes in the state with selectors.
 */

export type StoreChangeObserver<T> = (oldValue: T, newValue: T) => void;

export const watchForChange = <S, T>(store: Store<S>, getObject: (state: S) => T, observer: StoreChangeObserver<T>) => {
    const watcher = watch<S, T>(store.getState, getObject);
    return store.subscribe(watcher(observer));
};

const watch = <S, T>(getState: () => any, getObject: (state: S) => T) => {
    let currentValue = getObject(getState());
    return function w(observer: StoreChangeObserver<T>) {
        return function () {
            const newValue: T = getObject(getState());
            if (currentValue !== newValue) {
                const oldValue = currentValue;
                currentValue = newValue;
                observer(oldValue, newValue);
            }
        };
    };
};
