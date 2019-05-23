import {createReducer, ActionType} from 'typesafe-actions';

import {StoredNotification} from '../../model/StoredNotification';
import {notificationStorage} from '../../model/Storage';

import * as actions from './actions';

export type NotificationMap = {
    readonly [key: string]: Readonly<StoredNotification>
};

export interface NotificationsState {
    readonly notifications: NotificationMap;
}

export type NotificationsAction = ActionType<typeof actions>;

const initialState: NotificationsState = {
    notifications: {}
};

export const reducer = createReducer<NotificationsState, NotificationsAction>(initialState)
    // Add a new notification to the store.
    .handleAction(
        actions.createNotification,
        (state, action): NotificationsState => {
            const {id} = action.payload;
            const newState: NotificationsState = {
                ...state,
                notifications: {
                    ...state.notifications,
                    [id]: action.payload
                }
            };
            notificationStorage.setItem(id, JSON.stringify(action.payload));
            return newState;
        }
    )
    // Remove notifications from the store
    .handleAction(
        actions.removeNotifications,
        (state, action) => {
            const removeNotifications = action.payload;
            const notifications = {...state.notifications};
            removeNotifications.forEach(notification => {
                delete notifications[notification.id];
                notificationStorage.removeItem(notification.id);
            });

            return ({
                ...state,
                notifications
            });
        }
    );
