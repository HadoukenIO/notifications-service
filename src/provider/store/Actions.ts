import {StoredNotification} from '../model/StoredNotification';
import {StoredApplication} from '../model/Environment';
import {ToggleFilter} from '../utils/ToggleFilter';

import {RootState} from './State';
import {Action, StoreAPI} from './Store';

export const enum ToggleCenterVisibilitySource {
    API,
    TRAY,
    BUTTON
}

export class CreateNotification extends Action<RootState> {
    public readonly type: string = '@@NOTIFICATION/CREATE_NOTIFICATION';
    public readonly notification: StoredNotification;

    constructor(notification: StoredNotification) {
        super();
        this.notification = notification;
    }

    public reduce(state: RootState): RootState {
        const {notification} = this;

        const notifications: StoredNotification[] = state.notifications.slice();

        // All notification IDs must be unique. The custom dispatch logic of the `CreateNotification` event should
        // Ensure this, but to avoid significant side-effects, also adding a sanity check here.
        const index: number = state.notifications.findIndex((n) => n.id === notification.id);
        if (index >= 0) {
            // Replace existing notification with this ID
            console.warn(`Attempted to add a notitification with duplicate id '${notification.id}'. Will replace existing notification.`);
            notifications[index] = notification;
        } else {
            // Add new notification (ordering within array doesn't matter)
            notifications.push(notification);
        }

        return {
            ...state,
            notifications
        };
    }

    public async dispatch(store: StoreAPI<RootState>): Promise<void> {
        const notification = this.notification;
        const promises = [];
        // First remove any existing notifications with this ID, to ensure ID uniqueness
        // Should only ever be at-most one notification with this ID, using filter over find as an additional sanity check
        const existingNotifications = store.state.notifications.filter((x) => x.id === notification.id);
        if (existingNotifications.length) {
            promises.push(new RemoveNotifications(existingNotifications).dispatch(store));
        }
        promises.push(super.dispatch(store));
        await Promise.all(promises);
    }
}

export class RemoveNotifications extends Action<RootState> {
    public readonly type: string = '@@NOTIFICATION/REMOVE_NOTIFICATIONS';
    public readonly notifications: StoredNotification[];

    constructor(notifications: StoredNotification[]) {
        super();
        this.notifications = notifications;
    }

    public reduce(state: RootState): RootState {
        const {notifications} = this;
        const idsToRemove = notifications.map((n) => {
            return n.id;
        });

        return {
            ...state,
            notifications: state.notifications.filter((n) => idsToRemove.indexOf(n.id) === -1)
        };
    }
}

export class ClickNotification extends Action<RootState> {
    public readonly type: string = '@@NOTIFICATION/CLICK_NOTIFICATION';
    public readonly notification: StoredNotification;

    constructor(notification: StoredNotification) {
        super();
        this.notification = notification;
    }

    public async dispatch(store: StoreAPI<RootState>): Promise<void> {
        await Promise.all([super.dispatch(store), new RemoveNotifications([this.notification]).dispatch(store)]);
    }
}

export class ClickButton extends Action<RootState> {
    public readonly type = '@@NOTIFICATION/CREATE_NOTIFICATION';
    public readonly notification: StoredNotification;
    public readonly buttonIndex: number;

    constructor(notification: StoredNotification, buttonIndex: number) {
        super();
        this.notification = notification;
        this.buttonIndex = buttonIndex;
    }

    public async dispatch(store: StoreAPI<RootState>): Promise<void> {
        await Promise.all([super.dispatch(store), new RemoveNotifications([this.notification]).dispatch(store)]);
    }
}

export class ToggleCenterVisibility extends Action<RootState> {
    public readonly type = '@@CENTER/TOGGLE_CENTER_VISIBILITY';
    public readonly source: ToggleCenterVisibilitySource;
    public readonly visible?: boolean;

    constructor(source: ToggleCenterVisibilitySource, visible?: boolean) {
        super();
        this.source = source;
        this.visible = visible;
    }

    public async dispatch(store: StoreAPI<RootState>): Promise<void> {
        if (toggleFilter.recordToggle(this.source)) {
            await super.dispatch(store);
        }
    }

    public reduce(state: RootState): RootState {
        const centerVisible = (this.visible !== undefined) ? this.visible : !state.centerVisible;

        return {
            ...state,
            centerVisible
        };
    }
}

export class BlurCenter extends Action<RootState> {
    public readonly type = '@@CENTER/BLUR_CENTER';

    public async dispatch(store: StoreAPI<RootState>): Promise<void> {
        // TODO: We only need to check `recordBlur` here due to spurious blur events generated from windows in a different runtime. Investigate
        // Properly [SERVICE-614]
        if (toggleFilter.recordBlur()) {
            await super.dispatch(store);
        }
    }

    public reduce(state: RootState): RootState {
        return {
            ...state,
            centerVisible: false
        };
    }
}

export class ToggleCenterLocked extends Action<RootState> {
    public readonly type = '@@CENTER/TOGGLE_CENTER_LOCKED';
    public reduce(state: RootState): RootState {
        return {
            ...state,
            centerLocked: !state.centerLocked
        };
    }
}

export class TogglNotificationsMuted extends Action<RootState> {
    public readonly type = '@@CENTER/TOGGLE_NOTIFICATIONS_MUTED';
    public reduce(state: RootState): RootState {
        return {
            ...state,
            notificationsMuted: !state.notificationsMuted
        };
    }
}

export class RegisterApplication extends Action<RootState> {
    public readonly type = '@@APPLICATIONS/REGISTER_APPLICATION';
    public readonly application: StoredApplication;

    constructor(info: StoredApplication) {
        super();
        this.application = info;
    }

    public reduce(state: RootState): RootState {
        const info = this.application;
        const map = new Map(state.applications);
        map.set(info.id, info);
        return {
            ...state,
            applications: map
        };
    }
}

export class ExpireNotification extends Action<RootState> {
    public readonly type = '@@NOTIFICATION/EXPIRE_NOTIFICATION';
    public readonly notification: StoredNotification;

    constructor(notification: StoredNotification) {
        super();
        this.notification = notification;
    }

    public async dispatch(store: StoreAPI<RootState>): Promise<void> {
        await Promise.all([super.dispatch(store), new RemoveNotifications([this.notification]).dispatch(store)]);
    }
}

export class MinimizeToast extends Action<RootState> {
    public readonly type = '@@NOTIFICATION/MINIMIZE_NOTIFICATION';
    public readonly notification: StoredNotification;

    constructor(notification: StoredNotification) {
        super();
        this.notification = notification;
    }
}

const toggleFilter = new ToggleFilter();
