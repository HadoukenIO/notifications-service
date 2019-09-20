import {ApplicationOption} from 'openfin/_v2/api/application/applicationOption';
import {MonitorInfo} from 'openfin/_v2/api/system/monitor';
import {Signal} from 'openfin-service-signal';
import {JSDOM} from 'jsdom';
import {Transition, TransitionOptions, Bounds} from 'openfin/_v2/shapes';
import {Identity} from 'openfin/_v2/main';

import {StoredNotification} from '../../../src/provider/model/StoredNotification';
import {RootState} from '../../../src/provider/store/State';
import {StoredApplication} from '../../../src/provider/model/Environment';
import {NotificationInternal} from '../../../src/client/internal';
import {WebWindow} from '../../../src/provider/model/WebWindow';

/**
 * Utility functions for creating fake data for use in unit tests. Except functions named 'Empty, repeated calls to
 * each function will give unique results, to guard against false positives in tests.
 */

let fakeCount = 0;

export function createFakeStoredNotification(): StoredNotification {
    return {
        id: idString(),
        source: createFakeIdentity(),
        notification: createFakeNotificationInternal()
    };
}

export function createFakeNotificationInternal(): NotificationInternal {
    return {
        id: idString(),
        title: `Notification Title ${idString()}`,
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
    };
}

export function createFakeUuid(): string {
    return `test-app-${idString()}`;
}

export function createFakeIdentity(): Identity {
    return {name: `test-window-${idString()}`, uuid: createFakeUuid()};
}

export function createFakeStoredApplication(): StoredApplication {
    return createFakeManifestStoredApplication();
}

// Prefer `createFakeStoredApplication`, unless your test absolutely depends on the type of stored application
export function createFakeManifestStoredApplication(): StoredApplication & {type: 'manifest', manifestUrl: string} {
    return {
        type: 'manifest',
        id: `test-app-${idString()}`,
        title: `Test App ${idString()}`,
        manifestUrl: `test-manifest-${idString()}`
    };
}

// Prefer `createFakeStoredApplication`, unless your test absolutely depends on the type of stored application
export function createFakeProgrammaticApplication(): StoredApplication & {type: 'programmatic', initialOptions: ApplicationOption} {
    const uuid = idString();

    return {
        type: 'programmatic',
        id: `test-app-${uuid}`,
        title: `Test App ${idString()}`,
        initialOptions: {uuid: `test-app-${uuid}`},
        parentUuid: `test-parent-app-${idString()}`
    };
}

export function createFakeEmptyRootState(): RootState {
    return {
        notifications: [],
        applications: new Map<string, StoredApplication>(),
        centerVisible: false,
        centerLocked: false
    };
}

// Considered a 'fake' rather than a 'mock' due to state in `document` that cannot be reset by `jest.resetAllMocks`
export function createFakeEmptyWebWindow(): jest.Mocked<WebWindow> {
    return {
        onMouseEnter: new Signal<[]>(),
        onMouseLeave: new Signal<[]>(),
        onBlurred: new Signal<[]>(),
        document: new JSDOM().window.document,
        show: jest.fn<Promise<void>, []>(),
        showAt: jest.fn<Promise<void>, [number, number]>(),
        hide: jest.fn<Promise<void>, []>(),
        setAsForeground: jest.fn<Promise<void>, []>(),
        animate: jest.fn<Promise<void>, [Transition, TransitionOptions]>(),
        setBounds: jest.fn<Promise<void>, [Bounds]>(),
        close: jest.fn<Promise<void>, []>()
    };
}

export function createFakeEmptyMonitorInfo(): MonitorInfo {
    return {
        deviceScaleFactor: 1,
        dpi: {x: 1, y: 1},
        nonPrimaryMonitors: [],
        primaryMonitor: {
            available: {
                dipRect: {bottom: 0, left: 0, top: 0, right: 0},
                scaledRect: {bottom: 0, left: 0, top: 0, right: 0}
            },
            availableRect: {bottom: 0, left: 0, top: 0, right: 0},
            deviceId: idString(),
            displayDeviceActive: true,
            deviceScaleFactor: 1,
            monitorRect: {bottom: 0, left: 0, top: 0, right: 0},
            name: idString(),
            dpi: {x: 1, y: 1},
            monitor: {
                dipRect: {bottom: 0, left: 0, top: 0, right: 0},
                scaledRect: {bottom: 0, left: 0, top: 0, right: 0}
            }
        },
        reason: '',
        taskBar: {
            edge: '',
            rect: {bottom: 0, left: 0, top: 0, right: 0},
            dipRect: {bottom: 0, left: 0, top: 0, right: 0},
            scaledRect: {bottom: 0, left: 0, top: 0, right: 0}
        },
        virtualScreen: {
            bottom: 0,
            left: 0,
            top: 0,
            right: 0,
            dipRect: {bottom: 0, left: 0, top: 0, right: 0},
            scaledRect: {bottom: 0, left: 0, top: 0, right: 0}
        }
    };
}

function idString(): string {
    return `[${(fakeCount++).toString(16)}]`;
}
