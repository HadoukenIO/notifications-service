import {StoredNotification} from '../../../src/provider/model/StoredNotification';
import {RootState} from '../../../src/provider/store/State';
import {StoredApplication} from '../../../src/provider/model/Environment';

export function createFakeStoredNotification(): StoredNotification {
    return {
        id: Math.floor((Math.random() * 9 + 1) * 1e8).toString(),
        source: {name: 'test-app', uuid: 'test-app'},
        notification: {
            id: Math.floor((Math.random() * 9 + 1) * 1e8).toString(),
            title: 'Notification Title',
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
    return {
        type: 'manifest',
        id: 'test-app',
        manifestUrl: 'test-manifest'
    };
}
