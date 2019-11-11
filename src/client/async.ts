/**
 * @hidden
 */

/**
 * Races a given promise against a timeout, and either resolves to the value the the promise resolved it, if it resolved before the
 * timeout, or rejects
 * @param timeoutMs Timeout period in ms
 * @param promise Promise to race against the timeout
 */
export function withStrictTimeout<T>(timeoutMs: number, promise: Promise<T>, rejectMessage: string): Promise<T> {
    const timeout = new Promise<T>((res, rej) => setTimeout(() => rej(new Error(rejectMessage)), timeoutMs));
    return allowReject(Promise.race([timeout, promise]));
}

/**
 * Attaches an empty `catch` block to a promise, then returns the original promise. This prevents rejection of the promise being logged as
 * a warning during tests, but does not otherwise change behaviour should the promise reject. This should be called for promises we expect
 * to reject under normal circumstances, but would not otherwise have a `catch` block attached
 *
 * @param promise The promise to attach the catch block to
 */
export function allowReject<T>(promise: Promise<T>): Promise<T> {
    promise.catch(() => {});
    return promise;
}
