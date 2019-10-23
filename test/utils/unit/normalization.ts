import {RootState} from '../../../src/provider/store/State';
import {StoredNotification} from '../../../src/provider/model/StoredNotification';

/**
 * Functions for normalizing data, to prevent equality test failures on irrelevant features, e.g., ordering of notifications in RootState
 */

export function normalizeRootState(state: RootState): RootState {
    return {
        ...state,
        notifications: normalizeStoredNotifications(state.notifications),
        applications: new Map([...state.applications.values()].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0).map((app) => [app.id, app]))
    };
}

export function normalizeStoredNotifications(notes: StoredNotification[]): StoredNotification[] {
    return notes.slice().sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}
