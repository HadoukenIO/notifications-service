import {injectable, inject} from 'inversify';

import {Inject} from '../common/Injectables';
import {StoredNotification} from '../model/StoredNotification';
import {RemoveNotifications, RootAction, CreateNotification, ExpireNotification} from '../store/Actions';
import {Injector} from '../common/Injector';
import {ServiceStore} from '../store/ServiceStore';

type ExpiringNotification = {
    notification: {
        expires: number;
    }
} & StoredNotification;

interface ScheduledExpiry {
    note: ExpiringNotification;
    timerHandle: number;
}

/**
 * Handles the expiry of notifications that have specified an `expires` time. Fires an `ExpireNotification` action when
 * a notification has expired.
 */
@injectable()
export class ExpiryController {
    private readonly _store: ServiceStore;

    private _nextExpiry: ScheduledExpiry | null = null;

    public constructor(@inject(Inject.STORE) store: ServiceStore) {
        this._store = store;

        this._store.onAction.add(this.onAction, this);

        Injector.initialized.then(() => {
            // As soon as, but not before, the service is initialized, handle any notifications that expired while the service wasn't running
            this.scheduleEarliestExpiry(Date.now());
        });
    }

    private async onAction(action: RootAction): Promise<void> {
        if (action instanceof CreateNotification) {
            this.addNotification(action.notification);
        } else if (action instanceof RemoveNotifications) {
            this.removeNotifications(action.notifications);
        }
    }

    private addNotification(note: StoredNotification): void {
        if (doesExpire(note)) {
            if (!this._nextExpiry || note.notification.expires < this._nextExpiry.note.notification.expires) {
                this.scheduleExpiry(note, Date.now());
            }
        }
    }

    private removeNotifications(notes: StoredNotification[]): void {
        const expiringNotificationsToRemove = notes.filter(doesExpire);

        if (this._nextExpiry && expiringNotificationsToRemove.some(note => note.id === this._nextExpiry!.note.id)) {
            window.clearTimeout(this._nextExpiry.timerHandle);
            this._nextExpiry = null;

            this.scheduleEarliestExpiry(Date.now());
        }
    }

    private scheduleExpiry(note: ExpiringNotification, now: number): void {
        if (note.notification.expires <= now) {
            this.expireNotification(note, now);
        } else {
            if (this._nextExpiry) {
                window.clearTimeout(this._nextExpiry.timerHandle);
            }

            this._nextExpiry = {
                note,
                timerHandle: window.setTimeout(() => {
                    this.expireNotification(note, note.notification.expires);
                }, note.notification.expires - now)
            };
        }
    }

    private expireNotification(storedNotificaiton: ExpiringNotification, now: number): void {
        if (this._nextExpiry && this._nextExpiry.note.id === storedNotificaiton.id) {
            this._nextExpiry = null;
        }

        // TODO: Have RemoveNotifications dispatched from inside ExpireNotification [SERVICE-623]
        this._store.dispatch(new ExpireNotification(storedNotificaiton));
        this._store.dispatch(new RemoveNotifications([storedNotificaiton]));
        this.scheduleEarliestExpiry(now);
    }

    private scheduleEarliestExpiry(now: number): void {
        const earliestExpiry = this._store.state.notifications.reduce(earliestReducer, null);

        if (earliestExpiry !== null) {
            this.scheduleExpiry(earliestExpiry, now);
        }
    }
}

function doesExpire(note: StoredNotification): note is ExpiringNotification {
    return note.notification.expires !== null;
}

function earliestReducer(earliest: ExpiringNotification | null, current: StoredNotification): ExpiringNotification | null {
    if (current.notification.expires !== null && (!earliest || current.notification.expires < earliest.notification.expires)) {
        return current as ExpiringNotification;
    } else {
        return earliest;
    }
}
