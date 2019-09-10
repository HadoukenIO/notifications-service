import {StoredNotification} from '../model/StoredNotification';
import {StoredApplication} from '../model/Environment';

import {RootState} from './State';
import {StoreAPI, AsyncAction, Action} from './Store';

export class CreateNotification extends AsyncAction<RootState> {
    public readonly notification: StoredNotification;

    constructor(notification: StoredNotification) {
        super();
        this.notification = notification;
    }

    public reduce(state: RootState): RootState {
        const {notification} = this;

        const notifications: StoredNotification[] = state.notifications.slice();

        // All notification ID's must be unique. The custom dispatch logic of the `CreateNotification` event should
        // enusure this, but to avoid significant side-effects, also adding a sanity check here.
        const index: number = state.notifications.findIndex(n => n.id === notification.id);
        if (index >= 0) {
            // Replace existing notification with this ID
            console.warn(`Attempted to add a notitification with duplicate id '${notification.id}'. Will replace existing notification.`);
            notifications[index] = notification;
        }

        // Add new notification (ordering within array doesn't matter)
        notifications.push(notification);

        return {
            ...state,
            notifications
        };
    }

    public async dispatch(store: StoreAPI<RootState, RootAction>): Promise<void> {
        const notification = this.notification;

        // First remove any existing notifications with this ID, to ensure ID uniqueness
        // Should only ever be at-most one notification with this ID, using filter over find as an additional sanity check
        const existingNotifications = store.state.notifications.filter(x => x.id === notification.id);
        if (existingNotifications.length) {
            await store.dispatch(new RemoveNotifications(existingNotifications));
        }
    }
}

export class RemoveNotifications extends Action<RootState> {
    public readonly notifications: StoredNotification[];

    constructor(notifications: StoredNotification[]) {
        super();
        this.notifications = notifications;
    }

    public reduce(state: RootState): RootState {
        const {notifications} = this;
        const idsToRemove = notifications.map(n => {
            return n.id;
        });

        return {
            ...state,
            notifications: state.notifications.filter(n => idsToRemove.indexOf(n.id) === -1)
        };
    }
}

export class ClickNotification extends Action<RootState> {
    public readonly notification: StoredNotification;

    constructor(notifications: StoredNotification) {
        super();
        this.notification = notifications;
    }
}

export class ClickButton extends Action<RootState> {
    public readonly notification: StoredNotification;
    public readonly buttonIndex: number;

    constructor(notification: StoredNotification, buttonIndex: number) {
        super();
        this.notification = notification;
        this.buttonIndex = buttonIndex;
    }
}

export class ToggleVisibility extends Action<RootState> {
    public readonly visible?: boolean;

    constructor(visible?: boolean) {
        super();
        this.visible = visible;
    }

    public reduce(state: RootState): RootState {
        const windowVisible = (this.visible !== undefined) ? this.visible : !state.windowVisible;

        return {
            ...state,
            windowVisible
        };
    }
}

export class RegisterClient extends Action<RootState> {
    public readonly clientInfo: StoredApplication;

    constructor(info: StoredApplication) {
        super();
        this.clientInfo = info;
    }

    public reduce(state: RootState): RootState {
        const info = this.clientInfo;
        const map = new Map(state.registry);
        map.set(info.id, info);
        return {
            ...state,
            registry: map
        };
    }
}

export type RootAction = CreateNotification | RemoveNotifications | ClickNotification | ClickButton | ToggleVisibility | RegisterClient;
