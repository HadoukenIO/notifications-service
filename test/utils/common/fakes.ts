import {ApplicationOption} from 'openfin/_v2/api/application/applicationOption';

import {StoredNotification} from '../../../src/provider/model/StoredNotification';
import {RootState} from '../../../src/provider/store/State';
import {StoredApplication} from '../../../src/provider/model/Environment';

/**
 * Utility functions for creating fake data for use in tests. These make copious use of random strings, to guard against accidental false positives
 * when omparing data
 */

export function createFakeStoredNotification(): StoredNotification {
    return {
        id: randomString(),
        source: {name: `test-window-${randomString()}`, uuid: `test-app-${randomString()}`},
        notification: {
            id: randomString(),
            title: `Notification Title ${randomString()}`,
            body: 'Notification Body',
            category: 'Notification Category',
            icon: 'icon',
            date: 0,
            expires: null,
            buttons: [],
            onSelect: null,
            onClose: null,
            onExpire: null,
            customData: {}
        }
    };
}

export function createFakeRootState(): RootState {
    return {
        notifications: [],
        applications: new Map<string, StoredApplication>(),
        centerVisible: false,
        centerLocked: false
    };
}

export function createFakeStoredApplication(): StoredApplication {
    return createFakeManifestStoredApplication();
}

// Prefer `createFakeStoredApplication`, unless your test absolute depends on the type of stored application
export function createFakeManifestStoredApplication(): StoredApplication & {type: 'manifest', manifestUrl: string} {
    return {
        type: 'manifest',
        id: `test-app-${randomString()}`,
        manifestUrl: `test-manifest-${randomString()}`
    };
}

// Prefer `createFakeStoredApplication`, unless your test absolute depends on the type of stored application
export function createFakeProgrammaticApplication(): StoredApplication & {type: 'programmatic', initialOptions: ApplicationOption} {
    const uuid = randomString();

    return {
        type: 'programmatic',
        id: `test-app-${uuid}`,
        initialOptions: {uuid: `test-app-${uuid}`},
        parentUuid: `test-parent-app-${randomString()}`
    };
}

function randomString(): string {
    return Math.floor((Math.random() * 9 + 1) * 1e8).toString();
}
