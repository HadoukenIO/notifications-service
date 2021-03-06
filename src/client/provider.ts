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
import {withStrictTimeout} from 'openfin-service-async';

import {tryServiceDispatch} from './connection';
import {APITopic} from './internal';

/**
 * Status object returned by the Provider.
 */
export interface ProviderStatus {
    /**
     * The current connection status from the Client to the Provider.
     */
    connected: boolean;

    /**
     * The version number of the Provider. If the Provider is not connected, this will be `null`.
     */
    version: string | null;
}

/**
 * Retrieves the connection status and version semver of the Service Provider in the shape of a {@link ProviderStatus} object.
 *
 * If the Provider is connected, its' version number will be supplied in the returned object. If not, `version` will be `null`.
 *
 * ```ts
 * import {provider} from 'openfin-notifications';
 *
 * const status: ProviderStatus = provider.getStatus();
 * console.log(status.connected ? `Conencted to provider (version ${status.version})` : 'Not connected to provider');
 * ```
 *
 * Note: Connection status is only available when the connected provider is verison 0.11.2 or later. For earlier
 * versions, this API will indicate that the provider is disconnected.
 *
 * @since 0.11.2
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
 * If the Provider is not connected, `false` will be returned.
 *
 * ```ts
 * import {provider, VERSION} from 'openfin-notifications';
 *
 * const hasMatchingProvider: boolean = provider.isConnectedToAtLeast(VERSION);
 * if (!hasMatchingProvider) {
 *     console.warn('Connected to an older provider version. Some functionality may not be available.');
 * }
 * ```
 *
 * Note: Version information is only available when the connected provider is verison 0.11.2 or later. For earlier
 * versions, this API will indicate that the provider is disconnected.
 *
 * @param version Version to compare against the Provider version. This should be in semvar format.
 * @since 0.11.2
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
