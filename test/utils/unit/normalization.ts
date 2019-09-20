import {RootState} from '../../../src/provider/store/State';

/**
 * Functions for normalizing data, to prevent equality test failures on irrelevant features, e.g., ordering of notifications in RootState
 */

export function normalizeRootState(state: RootState): RootState {
    return {
        ...state,
        notifications: state.notifications.slice().sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
        applications: new Map([...state.applications.values()].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0).map(app => [app.id, app]))
    };
}