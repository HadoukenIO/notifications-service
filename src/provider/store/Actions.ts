import {Action as ReduxAction} from 'redux';

import {notificationStorage, settingsStorage} from '../model/Storage';
import {StoredNotification} from '../model/StoredNotification';
import {DeferredEvent} from '../model/DeferredEvent';

import {RootState, Immutable, mutable} from './State';
import { Identity } from 'openfin/_v2/main';
import { NotificationEvent } from '../../client';

export const enum Action {
    CREATE = '@@notifications/CREATE',
    REMOVE = '@@notifications/REMOVE',
    CLICK_NOTIFICATION = '@@notifications/CLICK_NOTIFICATION',
    CLICK_BUTTON = '@@notifications/CLICK_BUTTON',
    TOGGLE_VISIBILITY = '@@ui/TOGGLE_CENTER_WINDOW',
    DEFER_EVENT_DISPATCH = '@@client/DEFER_EVENT_DISPATCH',
    DISPATCH_DEFERRED_EVENTS = '@@client/DISPATCH_DEFERRED_EVENTS'
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

export interface DeferEventDispatch extends ReduxAction<Action> {
    type: Action.DEFER_EVENT_DISPATCH;
    target: Identity;
    event: NotificationEvent;
}

export interface DispatchDeferredEvents extends ReduxAction<Action> {
    type: Action.DISPATCH_DEFERRED_EVENTS;
    target: Identity;
    eventType: string;
    events: DeferredEvent[];
}

export type RootAction = CreateNotification|RemoveNotifications|ClickNotification|ClickButton|ToggleVisibility|DeferEventDispatch|DispatchDeferredEvents;

export type ActionOf<A> = RootAction extends {type: A} ? RootAction : never;
export type ActionHandler<A> = (state: Immutable<RootState>, action: ActionOf<A>) => RootState;
export type ActionMap<T extends Action = Action> = {
    [K in T]?: ActionHandler<K>;
};

export const Actions: ActionMap = {
    [Action.DEFER_EVENT_DISPATCH]: (state: Immutable<RootState>, action: DeferEventDispatch): RootState => {
        return {
            ...mutable(state),
            deferredEvents: mutable([...state.deferredEvents, {target: action.target, event: action.event}])
        };
    },
    [Action.DISPATCH_DEFERRED_EVENTS]: (state: Immutable<RootState>, action: DispatchDeferredEvents): RootState => {
        return {
            ...mutable(state),
            deferredEvents: mutable(state.deferredEvents.filter(a => a.target.uuid !== action.target.uuid || a.event.type !== action.eventType))
        };
    },
    [Action.CREATE]: (state: Immutable<RootState>, action: CreateNotification): RootState => {
        const {notification} = action;

        notificationStorage.setItem(notification.id, JSON.stringify(notification));

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
            ...mutable(state),
            notifications
        };
    },
    [Action.REMOVE]: (state: Immutable<RootState>, action: RemoveNotifications): RootState => {
        const {notifications} = action;
        const idsToRemove = notifications.map(n => {
            notificationStorage.removeItem(n.id);
            return n.id;
        });

        return {
            ...mutable(state),
            notifications: mutable(state.notifications.filter(n => idsToRemove.indexOf(n.id) === -1))
        };
    },
    [Action.TOGGLE_VISIBILITY]: (state: Immutable<RootState>, action: ToggleVisibility): RootState => {
        const windowVisible = (action.visible !== undefined) ? action.visible : !state.windowVisible;
        settingsStorage.setItem('windowVisible', windowVisible);

        return {
            ...mutable(state),
            windowVisible
        };
    }
};
