import { RootState } from "../../../src/provider/store/State";

/**
 * Functions for normalizing data, to prevent test failures on irrelevant features, eg., ordering of notifications in RootState
 */

export function normalizeRootState(state: RootState): RootState {
    return {
        ...state,
        notifications: state.notifications.slice().sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
    };
}
