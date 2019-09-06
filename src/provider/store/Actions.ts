import {StoredNotification} from '../model/StoredNotification';
import {Injector} from '../common/Injector';
import {Inject} from '../common/Injectables';
import {CollectionMap} from '../model/database/Database';
import {ToggleFilter} from '../utils/ToggleFilter';

import {RootState} from './State';
import {StoreAPI, AsyncAction, Action} from './Store';

export const enum ToggleCenterVisibilitySource {
    API,
    TRAY,
    BUTTON
}

export class CreateNotification extends AsyncAction<RootState> {
    public readonly notification: StoredNotification;

    constructor(notification: StoredNotification) {
        super();
        this.notification = notification;
    }

    public reduce(state: RootState): RootState {
        const {notification} = this;

        const database = Injector.get<'DATABASE'>(Inject.DATABASE);
        database.get(CollectionMap.NOTIFICATIONS).upsert(notification);

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
        const database = Injector.get<'DATABASE'>(Inject.DATABASE);
        const idsToRemove = notifications.map(n => {
            return n.id;
        });

        database.get(CollectionMap.NOTIFICATIONS).delete(idsToRemove);

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

export class ToggleCenterVisibility extends Action<RootState> {
    public readonly source: ToggleCenterVisibilitySource;
    public readonly visible?: boolean;

    constructor(source: ToggleCenterVisibilitySource, visible?: boolean) {
        super();
        this.source = source;
        this.visible = visible;
    }

    public reduce(state: RootState): RootState {
        if (toggleFilter.recordToggle(this.source)) {
            const centerVisible = (this.visible !== undefined) ? this.visible : !state.centerVisible;

            return {
                ...state,
                centerVisible
            };
        } else {
            return state;
        }
    }
}

export class BlurCenter extends Action<RootState> {
    public reduce(state: RootState): RootState {
        // TODO: We only need to check `recordBlur` here due to spurious blur events generated from windows in a different runtime. Investigate
        // properly [SERVICE-614]
        if (toggleFilter.recordBlur() && !state.centerLocked) {
            return {
                ...state,
                centerVisible: false
            };
        } else {
            return state;
        }
    }
}

export class ToggleLockCenter extends Action<RootState> {
    public reduce(state: RootState): RootState {
        return {
            ...state,
            centerLocked: !state.centerLocked
        };
    }
}

const toggleFilter = new ToggleFilter();

export type RootAction = CreateNotification | RemoveNotifications | ClickNotification | ClickButton | ToggleCenterVisibility | BlurCenter | ToggleLockCenter;
