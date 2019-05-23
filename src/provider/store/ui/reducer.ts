import {createReducer, ActionType} from 'typesafe-actions';

import {uiStorage} from '../../model/Storage';

import * as actions from './actions';

export interface UIState {
    readonly windowVisible: boolean;
    readonly bannerDirection: [number, number];
    readonly actionDirection: [number, number];
}

export type UIAction = ActionType<typeof actions>;

const initialState: UIState = {
    windowVisible: false,
    bannerDirection: [-1, -1],
    actionDirection: [1, 1]
};

export const reducer = createReducer<UIState, UIAction>(initialState)
    .handleAction(
        actions.toggleCenterWindowVisibility,
        (state, action) => {
            const value = (action.payload.visible) ? action.payload.visible : !state.windowVisible;
            uiStorage.setItem('windowVisible', value);
            return ({
                ...state,
                windowVisible: value
            });
        }
    )
    .handleAction(
        actions.changeBannerDirection,
        (state, action) => {
            const {direction} = action.payload;
            uiStorage.setItem('bannerDirection', direction);
            return ({
                ...state,
                bannerDirection: direction
            });
        }
    )
    .handleAction(
        actions.changeActionDirection,
        (state, action) => {
            const {direction} = action.payload;
            uiStorage.setItem('actionDirection', direction);
            return ({
                ...state,
                actionDirection: direction
            });
        }
    );
