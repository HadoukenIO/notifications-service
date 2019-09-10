import {injectable, inject} from 'inversify';

import {Store} from '../store/Store';
import {Inject} from '../common/Injectables';
import {StoredNotification} from '../model/StoredNotification';
import {RemoveNotifications, RootAction, CreateNotification, ExpireNotification} from '../store/Actions';
import {RootState} from '../store/State';
import {OrderedList} from '../utils/OrderedList';

import {AsyncInit} from './AsyncInit';

type ExpiringNotification = {
    notification: {
        expires: number;
    }
} & StoredNotification;

type ScheduledExpiry = {
    note: ExpiringNotification;
    timerHandle: number;
}

@injectable()
export class ExpiryController extends AsyncInit {
    private readonly _store: Store<RootState, RootAction>;

    private _unscheduledNotifications!: OrderedList<ExpiringNotification>;
    private _nextExpiry: ScheduledExpiry | null = null;

    public constructor(@inject(Inject.STORE) store: Store<RootState, RootAction>) {
        super();

        this._store = store;
        this._store.onAction.add(this.onAction, this);
    }

    protected async init(): Promise<void> {
        await this._store.initialized;

        this._unscheduledNotifications = new OrderedList(this._store.state.notifications.filter(doesExpire), compareNotifications);

        this.scheduleEarliestExpiry(Date.now());
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
            if (this._nextExpiry && note.notification.expires >= this._nextExpiry.note.notification.expires) {
                this._unscheduledNotifications.insert(note);
            } else {
                const now = Date.now();

                if (note.notification.expires <= now) {
                    this.expireNotification(note, now);
                } else {
                    if (this._nextExpiry) {
                        this._unscheduledNotifications.insert(this._nextExpiry.note);
                    }

                    this.clearExpiry();
                    this.scheduleExpiry(note, now);
                }
            }
        }
    }

    private removeNotifications(notes: StoredNotification[]): void {
        const expiringNotificationsToRemove = notes.filter(doesExpire);
        expiringNotificationsToRemove.forEach((note) => this._unscheduledNotifications.remove(note));

        if (this._nextExpiry && expiringNotificationsToRemove.some(note => note.id === this._nextExpiry!.note.id)) {
            this.clearExpiry();
            this.scheduleEarliestExpiry(Date.now());
        }
    }

    private expireNotification(storedNotificaiton: ExpiringNotification, now: number): void {
        if (this._nextExpiry && this._nextExpiry.note.id === storedNotificaiton.id) {
            this._nextExpiry = null;
        }

        this._store.dispatch(new ExpireNotification(storedNotificaiton));

        this.scheduleEarliestExpiry(now);
    }

    private scheduleEarliestExpiry(now: number): void {
        const earliestExpiry = this._unscheduledNotifications.empty() ? null : this._unscheduledNotifications.pop();

        if (earliestExpiry !== null) {
            if (earliestExpiry.notification.expires <= now) {
                this.expireNotification(earliestExpiry, now);
            } else {
                this.scheduleExpiry(earliestExpiry, now);
            }
        }
    }

    private clearExpiry(): void {
        if (this._nextExpiry) {
            window.clearTimeout(this._nextExpiry.timerHandle);
            this._nextExpiry = null;
        }
    }

    private scheduleExpiry(note: ExpiringNotification, now: number): void {
        this._nextExpiry = {
            note,
            timerHandle: window.setTimeout(() => {
                this.expireNotification(note, note.notification.expires!);
            }, note.notification.expires! - now)
        };
    }
}

function doesExpire(note: StoredNotification): note is ExpiringNotification {
    return note.notification.expires !== null;
}

function compareNotifications(note1: ExpiringNotification, note2: ExpiringNotification): number {
    const expiryDifference = note1.notification.expires - note2.notification.expires;

    if (expiryDifference === 0) {
        return note1.id < note2.id ? -1 : note1.id > note2.id ? 1 : 0;
    } else {
        return expiryDifference;
    }
}
