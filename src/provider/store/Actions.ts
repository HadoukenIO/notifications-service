import {Action as ReduxAction} from 'redux';

import {notificationStorage, settingsStorage} from '../model/Storage';
import {StoredNotification} from '../model/StoredNotification';

import {RootState} from './State';
import {StoreAPI} from './Store';

export const enum Action {
    CREATE = '@@notifications/CREATE',
    REMOVE = '@@notifications/REMOVE',
    CLICK_NOTIFICATION = '@@notifications/CLICK_NOTIFICATION',
    CLICK_BUTTON = '@@notifications/CLICK_BUTTON',
    TOGGLE_VISIBILITY = '@@ui/TOGGLE_CENTER_WINDOW',
}

export class BaseAction<T extends Action> implements ReduxAction<Action> {
    public readonly type: T;

    constructor(type: T) {
        this.type = type;
    }
}

export abstract class CustomAction<T extends Action> extends BaseAction<T> {
    public abstract async dispatch(store: StoreAPI): Promise<void>;
}

export class CreateNotification extends CustomAction<Action.CREATE> {
    public readonly notification: StoredNotification;

    constructor(notification: StoredNotification) {
        super(Action.CREATE);
        this.notification = notification;
    }

    public async dispatch(store: StoreAPI): Promise<void> {
        const notification = this.notification;
        const existingNotifications = store.state.notifications.filter(x => x.id === notification.id);

        if (existingNotifications.length) {
            await store.dispatch(new RemoveNotifications(existingNotifications));
        }
        await store.dispatch({...this});
    }
}

export class RemoveNotifications extends BaseAction<Action.REMOVE> {
    public readonly notifications: StoredNotification[];

    constructor(notifications: StoredNotification[]) {
        super(Action.REMOVE);

        this.notifications = notifications;
    }
}

export class ClickNotification extends BaseAction<Action.CLICK_NOTIFICATION> {
    public readonly notification: StoredNotification;

    constructor(notifications: StoredNotification) {
        super(Action.CLICK_NOTIFICATION);
        this.notification = notifications;
    }
}

export class ClickButton extends BaseAction<Action.CLICK_BUTTON> {
    public readonly notification: StoredNotification;
    public readonly buttonIndex: number;

    constructor(notification: StoredNotification, buttonIndex: number) {
        super(Action.CLICK_BUTTON);
        this.notification = notification;
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
export type ActionHandler<A> = (state: RootState, action: ActionOf<A>) => RootState;
export type ActionHandlerMap<T extends Action = Action> = {
    [K in T]?: ActionHandler<K>;
};

export const ActionHandlers: ActionHandlerMap = {
    [Action.CREATE]: (state: RootState, action: CreateNotification): RootState => {
        const {notification} = action;

        notificationStorage.setItem(notification.id, JSON.stringify(notification));

        const notifications: StoredNotification[] = state.notifications.slice();
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
    [Action.REMOVE]: (state: RootState, action: RemoveNotifications): RootState => {
        const {notifications} = action;
        const idsToRemove = notifications.map(n => {
            notificationStorage.removeItem(n.id);
            return n.id;
        });

        return {
            ...state,
            notifications: state.notifications.filter(n => idsToRemove.indexOf(n.id) === -1)
        };
    },
    [Action.TOGGLE_VISIBILITY]: (state: RootState, action: ToggleVisibility): RootState => {
        const windowVisible = (action.visible !== undefined) ? action.visible : !state.windowVisible;
        settingsStorage.setItem('windowVisible', windowVisible);

        return {
            ...state,
            windowVisible
        };
    }
};
