import {createReducer, ActionType} from 'typesafe-actions';

import {settingsStorage} from '../../model/Storage';

import * as actions from './actions';

export interface UIState {
    readonly windowVisible: boolean;
    readonly toastDirection: readonly [number, number];
}

export type UIAction = ActionType<typeof actions>;

const initialState: UIState = {
    windowVisible: false,
    toastDirection: [-1, -1]
};

export const reducer = createReducer<UIState, UIAction>(initialState)
    .handleAction(
        actions.toggleCenterWindowVisibility,
        (state, action): UIState => {
            const value = (action.payload.visible) ? action.payload.visible : !state.windowVisible;
            settingsStorage.setItem('windowVisible', value);
            return ({
                ...state,
                windowVisible: value
            });
        }
    )
    .handleAction(
        actions.changeToastDirection,
        (state, action): UIState => {
            const {direction} = action.payload;
            settingsStorage.setItem('bannerDirection', direction);
            return ({
                ...state,
                toastDirection: direction
            });
        }
    );
