import {ApplicationOption} from 'openfin/_v2/api/application/applicationOption';
import {MonitorInfo} from 'openfin/_v2/api/system/monitor';
import {Signal} from 'openfin-service-signal';
import {JSDOM} from 'jsdom';
import {Transition, TransitionOptions, Bounds} from 'openfin/_v2/shapes';

import {StoredNotification} from '../../../src/provider/model/StoredNotification';
import {RootState} from '../../../src/provider/store/State';
import {StoredApplication} from '../../../src/provider/model/Environment';
import {NotificationInternal} from '../../../src/client/internal';
import {WebWindow} from '../../../src/provider/model/WebWindow';

/**
 * Utility functions for creating fake data for use in unit tests. These make use of random strings to guard against
 * accidental false positives when comparing data.
 */

export function createFakeStoredNotification(): StoredNotification {
    return {
        id: randomString(),
        source: {name: `test-window-${randomString()}`, uuid: `test-app-${randomString()}`},
        notification: createFakeNotificationInternal()
    };
}

export function createFakeNotificationInternal(): NotificationInternal {
    return {
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

// Considered a 'fake' rather than a 'mock' due to state in `document` that cannot be reset by `jest.resetAllMocks`
export function createFakeWebWindow(): jest.Mocked<WebWindow> {
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

export function createFakeStoredApplication(): StoredApplication {
    return createFakeManifestStoredApplication();
}

// Prefer `createFakeStoredApplication`, unless your test absolutely depends on the type of stored application
export function createFakeManifestStoredApplication(): StoredApplication & {type: 'manifest', manifestUrl: string} {
    return {
        type: 'manifest',
        id: `test-app-${randomString()}`,
        title: `Test App ${randomString()}`,
        manifestUrl: `test-manifest-${randomString()}`
    };
}

// Prefer `createFakeStoredApplication`, unless your test absolutely depends on the type of stored application
export function createFakeProgrammaticApplication(): StoredApplication & {type: 'programmatic', initialOptions: ApplicationOption} {
    const uuid = randomString();

    return {
        type: 'programmatic',
        id: `test-app-${uuid}`,
        title: `Test App ${randomString()}`,
        initialOptions: {uuid: `test-app-${uuid}`},
        parentUuid: `test-parent-app-${randomString()}`
    };
}

export function createFakeMonitorInfo(): MonitorInfo {
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
            deviceId: randomString(),
            displayDeviceActive: true,
            deviceScaleFactor: 1,
            monitorRect: {bottom: 0, left: 0, top: 0, right: 0},
            name: randomString(),
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

function randomString(): string {
    return Math.floor((Math.random() * 9 + 1) * 1e8).toString();
}
