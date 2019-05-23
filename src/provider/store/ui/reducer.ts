import {createReducer, ActionType} from 'typesafe-actions';

import {uiStorage} from '../../model/Storage';

import * as actions from './actions';
import {Constants} from './constants';

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
        Constants.TOGGLE_CENTER_WINDOW,
        (state, action) => {
            const value = (action.payload.visibility) ? action.payload.visibility : !state.windowVisible;
            uiStorage.setItem('windowVisible', value);
            return ({
                ...state,
                windowVisible: value
            });
        }
    )
    .handleAction(
        Constants.CHANGE_ACTION_DIRECTION,
        (state, action) => {
            const {direction} = action.payload;
            uiStorage.setItem('actionDirection', direction);
            return ({
                ...state,
                actionDirection: direction
            });
        }
    )
    .handleAction(
        Constants.CHANGE_BANNER_DIRECTION,
        (state, action) => {
            const {direction} = action.payload;
            uiStorage.setItem('bannerDirection', direction);
            return ({
                ...state,
                bannerDirection: direction
            });
        }
    );

