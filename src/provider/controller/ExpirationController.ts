import {injectable, inject} from 'inversify';

import {Store} from '../store/Store';
import {Inject} from '../common/Injectables';
import {StoredNotification} from '../model/StoredNotification';
import {RemoveNotifications} from '../store/Actions';

import {AsyncInit} from './AsyncInit';

@injectable()
export class ExpirationController extends AsyncInit {
    private readonly _store: Store;

    private _nextExpiration: {
        note: StoredNotification,
        timerHandler: number} | null = null;

    public constructor(@inject(Inject.STORE) store: Store) {
        super();

        this._store = store;
    }

    public addNotification(note: StoredNotification): void {
        if (note.notification.expiration !== null) {
            if (this._nextExpiration === null || note.notification.expiration < this._nextExpiration.note.notification.expiration!) {
                const now = Date.now();

                if (note.notification.expiration <= now) {
                    this.expireNotification(note, now);
                } else {
                    if (this._nextExpiration !== null) {
                        window.clearTimeout(this._nextExpiration.timerHandler);
                    }

                    this.scheduleExpiry(note, now);
                }
            }
        }
    }

    public removeNotifications(notes: StoredNotification[]): void {
        if (this._nextExpiration && notes.some(note => this._nextExpiration!.note.id === note.id)) {
            window.clearTimeout(this._nextExpiration.timerHandler);

            this.scheduleEarliestExpiry(Date.now());
        }
    }

    protected async init(): Promise<void> {
        await this._store.initialized;

        this.scheduleEarliestExpiry(Date.now());
    }

    private expireNotification(storedNotificaiton: StoredNotification, now: number): void {
        this._nextExpiration = null;
        this._store.dispatch(new RemoveNotifications([storedNotificaiton]));

        this.scheduleEarliestExpiry(now);
    }

    private scheduleEarliestExpiry(now: number) {
        const earliestExpiry = this._store.state.notifications.reduce((
            earliest: StoredNotification|null,
            current: StoredNotification
        ): StoredNotification|null => {
            if (current.notification.expiration !== null) {
                if (earliest !== null) {
                    if (current.notification.expiration < earliest.notification.expiration!) {
                        return current;
                    }
                } else {
                    return current;
                }
            }

            return earliest;
        }, null);

        if (earliestExpiry !== null) {
            if (earliestExpiry.notification.expiration! <= now) {
                this.expireNotification(earliestExpiry, now);
            } else {
                this.scheduleExpiry(earliestExpiry, now);
            }
        } else {
            this._nextExpiration = null;
        }
    }

    private scheduleExpiry(note: StoredNotification, now: number): void {
        this._nextExpiration = {
            note,
            timerHandler: window.setTimeout(() => {
                this.expireNotification(note, note.notification.expiration!);
            }, note.notification.expiration! - now)
        };
    }
}
