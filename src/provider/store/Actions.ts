import {Action as ReduxAction} from 'redux';

import {notificationStorage, settingsStorage} from '../model/Storage';
import {StoredNotification} from '../model/StoredNotification';

import {RootState, Immutable, mutable} from './State';
import {Store} from './Store';

export const enum Action {
    CREATE = '@@notifications/CREATE',
    REMOVE = '@@notifications/REMOVE',
    CLICK_NOTIFICATION = '@@notifications/CLICK_NOTIFICATION',
    CLICK_BUTTON = '@@notifications/CLICK_BUTTON',
    TOGGLE_VISIBILITY = '@@ui/TOGGLE_CENTER_WINDOW',
}

/**
 * Inputs to actions may be either mutable or immutable
 */
type MaybeMutable<T> = T | Immutable<T>;

export class BaseAction<T extends Action> implements ReduxAction<Action> {
    public readonly type: T;

    constructor(type: T) {
        this.type = type;
    }
}

export abstract class CustomAction<T extends Action> extends BaseAction<T> {
    public abstract async dispatch(store: Store): Promise<void>;
}

export class CreateNotification extends CustomAction<Action.CREATE> {
    public readonly notification: Immutable<StoredNotification>;

    constructor(notification: MaybeMutable<StoredNotification>) {
        super(Action.CREATE);
        this.notification = notification;
    }

    public async dispatch(store: Store): Promise<void> {
        const notification = this.notification;
        const existingNotifications = mutable(store.state.notifications.filter(x => x.id === notification.id));

        if (existingNotifications.length) {
            await store.dispatch(new RemoveNotifications(existingNotifications));
        }
        await store.dispatch({...this});
    }
}

export class RemoveNotifications extends BaseAction<Action.REMOVE> {
    public readonly notifications: Immutable<StoredNotification>[];

    constructor(notifications: MaybeMutable<StoredNotification|StoredNotification[]>) {
        super(Action.REMOVE);

        const immutable = notifications as Immutable<StoredNotification|StoredNotification[]>;
        this.notifications = (Array.isArray(immutable) ? immutable.slice() : [immutable]);
    }
}

export class ClickNotification extends BaseAction<Action.CLICK_NOTIFICATION> {
    public readonly notification: Immutable<StoredNotification>;

    constructor(notifications: MaybeMutable<StoredNotification>) {
        super(Action.CLICK_NOTIFICATION);
        this.notification = notifications;
    }
}

export class ClickButton extends BaseAction<Action.CLICK_BUTTON> {
    public readonly notification: Immutable<StoredNotification>;
    public readonly buttonIndex: number;

    constructor(notifications: MaybeMutable<StoredNotification>, buttonIndex: number) {
        super(Action.CLICK_BUTTON);
        this.notification = notifications;
        this.buttonIndex = buttonIndex;
    }
}

export class ToggleVisibility extends BaseAction<Action.TOGGLE_VISIBILITY> {
    public readonly visible?: boolean;

    constructor(visible?: boolean) {
        super(Action.TOGGLE_VISIBILITY);
        this.visible = visible;
    }
}

export type RootAction = CreateNotification|RemoveNotifications|ClickNotification|ClickButton|ToggleVisibility;

export type ActionOf<A> = RootAction extends {type: A} ? RootAction : never;
export type Middleware<A> = (state: Immutable<RootState>, action: ActionOf<A>) => RootState;
export type MiddlewareMap<T extends Action = Action> = {
    [K in T]?: Middleware<K>;
};

export const Middleware: MiddlewareMap = {
    [Action.CREATE]: (state: Immutable<RootState>, action: CreateNotification): RootState => {
        const {notification} = action;

        notificationStorage.setItem(notification.id, JSON.stringify(notification));

        const notifications = mutable(state.notifications.slice());
        const index: number = state.notifications.findIndex(n => n.id === notification.id);
        if (index >= 0) {
            // Replace existing notification with this ID
            notifications[index] = mutable(notification);
        } else {
            // Add new notification (ordering within array doesn't matter)
            notifications.push(mutable(notification));
        }

        return {
            ...state,
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
            ...state,
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
