import {injectable, inject} from 'inversify';

import {Store} from '../store/Store';
import {Inject} from '../common/Injectables';
import {StoredNotification} from '../model/StoredNotification';
import {RemoveNotifications, RootAction, CreateNotification, ExpireNotification} from '../store/Actions';
import {RootState} from '../store/State';

import {AsyncInit} from './AsyncInit';

type ScheduledExpiry = {
    note: StoredNotification;
    timerHandle: number;
}

@injectable()
export class ExpiryController extends AsyncInit {
    private readonly _store: Store<RootState, RootAction>;

    private _nextExpiry: ScheduledExpiry | null = null;

    public constructor(@inject(Inject.STORE) store: Store<RootState, RootAction>) {
        super();

        this._store = store;
        this._store.onAction.add(this.onAction, this);
    }

    protected async init(): Promise<void> {
        await this._store.initialized;

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
        if (note.notification.expiry !== null && (!this._nextExpiry || this.expiresBefore(note, this._nextExpiry.note))) {
            const now = Date.now();

            if (note.notification.expiry! <= now) {
                this.expireNotification(note, now);
            } else {
                this.clearExpiry();
                this.scheduleExpiry(note, now);
            }
        }
    }

    private removeNotifications(notes: StoredNotification[]): void {
        if (this._nextExpiry && notes.some(note => this._nextExpiry!.note.id === note.id)) {
            this.clearExpiry();
            this.scheduleEarliestExpiry(Date.now());
        }
    }

    private expireNotification(storedNotificaiton: StoredNotification, now: number): void {
        if (this._nextExpiry && this._nextExpiry.note.id === storedNotificaiton.id) {
            this._nextExpiry = null;
        }

        this._store.dispatch(new ExpireNotification(storedNotificaiton));

        this.scheduleEarliestExpiry(now);
    }

    private scheduleEarliestExpiry(now: number): void {
        const earliestExpiry = this._store.state.notifications.reduce((earliest: StoredNotification | null, current: StoredNotification) => {
            return this.expiresBefore(current, earliest) ? current : earliest;
        }, null);

        if (earliestExpiry !== null) {
            if (earliestExpiry.notification.expiry! <= now) {
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

    private scheduleExpiry(note: StoredNotification, now: number): void {
        this._nextExpiry = {
            note,
            timerHandle: window.setTimeout(() => {
                this.expireNotification(note, note.notification.expiry!);
            }, note.notification.expiry! - now)
        };
    }

    private expiresBefore(testNote: StoredNotification, referenceNote: StoredNotification | null) {
        if (testNote.notification.expiry === null) {
            return false;
        }

        if (referenceNote === null) {
            return true;
        }

        return testNote.notification.expiry < referenceNote.notification.expiry!;
    }
}
