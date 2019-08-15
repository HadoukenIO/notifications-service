/**
 * Creates a deferred promise and returns it along with handlers to resolve/reject it imperatively
 * @returns a tuple with the promise and its resolve/reject handlers
 */
export function deferredPromise<T = void>(): DeferredPromise<T> {
    let resolve: (value?: T) => void;
    let reject: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return [promise, resolve!, reject!];
}

export type DeferredPromise<T = void> = readonly [Promise<T>, (value?: T) => void, (reason?: any) => void];
