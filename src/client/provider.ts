/**
 * @module Provider
 */

/**
 * Need a comment block here so that the comment block above is interpreted as a file comment, and not a comment on the
 * import below.
 *
 * @hidden
 */
import semverCompare from 'semver-compare';

import {withStrictTimeout} from '../provider/common/async';

import {tryServiceDispatch} from './connection';
import {APITopic, ProviderStatus} from './internal';

/**
 * Retrieves the status of the Service Provider.
 *
 * If the Provider is connected, you will receive the Providers version number. If not, this will be null.
 *
 * ```ts
 * import {getStatus} from 'openfin-notifications';
 *
 * getStatus();
 * ```
 */
export function getStatus(): Promise<ProviderStatus> {
    // We need to race a timeout here as we never reject if the provider is not connected.
    return withStrictTimeout(500, tryServiceDispatch(APITopic.GET_PROVIDER_STATUS, undefined), '')
        .catch(() => {
            return {
                connected: false,
                version: null
            };
        });
}

/**
 * Evaluates the provided version against the Providers version.
 *
 * This will return `true` if the Provider version is greater than or equal to the provided version. If not, `false` will be returned.
 *
 * ```ts
 * import {isConnectedToAtLeast, VERSION} from 'openfin-notifications';
 *
 * isConnectedToAtLeast(VERSION);
 * ```
 *
 * @param version Version to compare against the Provider version.
 */
export async function isConnectedToAtLeast(version: string): Promise<boolean> {
    const status = await getStatus();

    if (status.connected) {
        const compare = semverCompare(status.version, version);

        if (compare === 0 || compare === 1) {
            return true;
        }
    }

    return false;
}
