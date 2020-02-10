/**
 * @hidden
 */

/**
 * Need a comment block here so that the comment block above is interpreted as a file comment, and not a comment on the
 * import below.
 *
 * @hidden
 */
import {Events} from './internal';

/**
 * Validates and returns the provided function
 */
export function sanitizeFunction<T, U extends any[]>(value: (...args: U) => T): (...args: U) => T {
    if (typeof value !== 'function') {
        throw new Error(`Invalid argument passed: ${safeStringify(value, 'The provided value')} is not a valid function`);
    }

    return value;
}

/**
 * Validates the provided event type
 */
export function sanitizeEventType<E extends Events>(eventType: E['type']): E['type'] {
    if (eventType === 'notification-action' || eventType === 'notification-created' || eventType === 'notification-closed') {
        return eventType;
    }

    throw new Error(`Invalid argument passed: ${safeStringify(eventType, 'The provided event type')} is not a valid Notifications event type`);
}

/**
 * Validates we're running inside an OpenFin environment
 */
export function validateEnvironment(): void {
    if (typeof fin === 'undefined') {
        throw new Error('fin is not defined. The openfin-fdc3 module is only intended for use in an OpenFin application.');
    }
}

export function safeStringify(value: {}, fallback: string): string {
    // Provided object may not be stringify-able (e.g., due to circular references), so we need to try-catch
    let result: string;
    try {
        result = JSON.stringify(value);
    } catch (e) {
        result = fallback;
    }

    return result;
}
