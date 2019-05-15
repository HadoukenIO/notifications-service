import {StateType, ActionType, Action} from 'typesafe-actions';
import {ThunkAction, ThunkDispatch} from 'redux-thunk';
import {Store, AnyAction} from 'redux';

import {NotificationsState} from './notifications/reducer';
import {UIState} from './ui/reducer';

// TODO Remove this file
export type RootAction = ActionType<typeof import('./root-action').default>
export interface RootState {
    notifications: NotificationsState;
    ui: UIState;
}
export type Dispatch = ThunkDispatch<RootState, undefined, RootAction>;
