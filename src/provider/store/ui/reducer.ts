import {createReducer, ActionType} from 'typesafe-actions';

import * as actions from './actions';
import Types from './types';

export interface UIState {
    readonly windowVisible?: boolean;
    readonly bannerDirection: [number, number];
    readonly actionDirection: [number, number];
}

export type UIAction = ActionType<typeof actions>;

const initialState: UIState = {
    windowVisible: false,
    bannerDirection: [-1, -1],
    actionDirection: [1, 1]
};

const reducer = createReducer<UIState, UIAction>(initialState)
    .handleAction(
        Types.TOGGLE_CENTER_WINDOW,
        (state, action) => {
            const {visibility} = action.payload;
            return ({
                ...state,
                windowVisible: (visibility) ? visibility : !state.windowVisible
            });
        }
    )
    .handleAction(
        Types.CHANGE_ACTION_DIRECTION,
        (state, action) => {
            const {direction} = action.payload;
            return ({
                ...state,
                actionDirection: direction
            });
        }
    )
    .handleAction(
        Types.CHANGE_BANNER_DIRECTION,
        (state, action) => {
            const {direction} = action.payload;
            return ({
                ...state,
                bannerDirection: direction
            });
        }
    );

export default reducer;
