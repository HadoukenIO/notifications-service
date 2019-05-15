import {createSelector} from 'reselect';
import {Identity} from 'openfin/_v2/main';

import {RootState} from '../typings';
import {StoredNotification} from '../../model/StoredNotification';

import {NotificationMap} from './reducer';

export const getNotifications = (state: RootState): NotificationMap => {
    return state.notifications.notifications;
};

export const getAllNotifications = createSelector(getNotifications, (notificationMap: NotificationMap): StoredNotification[] => {
    return Object.values(notificationMap);
});

export const getNotificationsByApplication = (source: Identity, state: RootState): StoredNotification[] => {
    const all = getAllNotifications(state);
    return all.filter(n => n.source.uuid === source.uuid);
};

export const getNotificationById = (state: RootState, id: string): StoredNotification | null => {
    return getNotifications(state)[id];
};

