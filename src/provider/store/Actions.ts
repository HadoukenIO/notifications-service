import {Action as ReduxAction} from 'redux';

import {StoredNotification} from '../model/StoredNotification';
import {Injector} from '../common/Injector';
import {Inject} from '../common/Injectables';
import {StorageMap} from '../model/Storage';

import {RootState, Immutable, mutable} from './State';

export const enum Action {
    CREATE = '@@notifications/CREATE',
    REMOVE = '@@notifications/REMOVE',
    CLICK_NOTIFICATION = '@@notifications/CLICK_NOTIFICATION',
    CLICK_BUTTON = '@@notifications/CLICK_BUTTON',
    TOGGLE_VISIBILITY = '@@ui/TOGGLE_CENTER_WINDOW',
}

export interface CreateNotification extends ReduxAction<Action> {
    type: Action.CREATE,
    notification: StoredNotification;
}

export interface RemoveNotifications extends ReduxAction<Action> {
    type: Action.REMOVE,
    notifications: StoredNotification[];
}

export interface ClickNotification extends ReduxAction<Action> {
    type: Action.CLICK_NOTIFICATION;
    notification: StoredNotification;
}

export interface ClickButton extends ReduxAction<Action> {
    type: Action.CLICK_BUTTON;
    notification: StoredNotification;
    buttonIndex: number;
}

export interface ToggleVisibility extends ReduxAction<Action> {
    type: Action.TOGGLE_VISIBILITY;
    visible?: boolean;
}

export type RootAction = CreateNotification|RemoveNotifications|ClickNotification|ClickButton|ToggleVisibility;

export type ActionOf<A> = RootAction extends {type: A} ? RootAction : never;
export type ActionHandler<A> = (state: Immutable<RootState>, action: ActionOf<A>) => RootState;
export type ActionMap<T extends Action = Action> = {
    [K in T]?: ActionHandler<K>;
};

export const Actions: ActionMap = {
    [Action.CREATE]: (state: Immutable<RootState>, action: CreateNotification): RootState => {
        const {notification} = action;
        const storage = Injector.get<'STORAGE'>(Inject.STORAGE);
        storage.get(StorageMap.NOTIFICATIONS).setItem(notification.id, JSON.stringify(notification));

        const notifications = mutable(state.notifications.slice());
        const index: number = state.notifications.findIndex(n => n.id === notification.id);
        if (index >= 0) {
            // Replace existing notification with this ID
            notifications[index] = notification;
        } else {
            // Add new notification (ordering within array doesn't matter)
            notifications.push(notification);
        }

        return {
            ...state,
            notifications
        };
    },
    [Action.REMOVE]: (state: Immutable<RootState>, action: RemoveNotifications): RootState => {
        const {notifications} = action;
        const storage = Injector.get<'STORAGE'>(Inject.STORAGE);
        const idsToRemove = notifications.map(n => {
            storage.get(StorageMap.NOTIFICATIONS).removeItem(n.id);
            return n.id;
        });

        return {
            ...state,
            notifications: mutable(state.notifications.filter(n => idsToRemove.indexOf(n.id) === -1))
        };
    },
    [Action.TOGGLE_VISIBILITY]: (state: Immutable<RootState>, action: ToggleVisibility): RootState => {
        const storage = Injector.get<'STORAGE'>(Inject.STORAGE);
        const windowVisible = (action.visible !== undefined) ? action.visible : !state.windowVisible;
        storage.get(StorageMap.SETTINGS).setItem('windowVisible', windowVisible);

        return {
            ...mutable(state),
            windowVisible
        };
    }
};
