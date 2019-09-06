import {injectable, inject} from 'inversify';

import {Store} from '../store/Store';
import {Inject} from '../common/Injectables';
import {StoredNotification} from '../model/StoredNotification';
import {RemoveNotifications, RootAction, CreateNotification, ExpireNotification} from '../store/Actions';
import {RootState} from '../store/State';

import {AsyncInit} from './AsyncInit';

@injectable()
export class ExpirationController extends AsyncInit {
    private readonly _store: Store<RootState, RootAction>;

    private _nextExpiration: {
        note: StoredNotification,
        timerHandler: number} | null = null;

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
        // Intentionally don't await, as though this may trigger expiration, we treat that as a 'background' process
        if (action instanceof CreateNotification) {
            this.addNotification(action.notification);
        } else if (action instanceof RemoveNotifications) {
            this.removeNotifications(action.notifications);
        }
    }

    private async addNotification(note: StoredNotification): Promise<void> {
        if (note.notification.expiration !== null) {
            if (this._nextExpiration === null || note.notification.expiration < this._nextExpiration.note.notification.expiration!) {
                const now = Date.now();

                if (note.notification.expiration <= now) {
                    await this.expireNotification(note, now);
                } else {
                    if (this._nextExpiration !== null) {
                        window.clearTimeout(this._nextExpiration.timerHandler);
                    }

                    await this.scheduleExpiry(note, now);
                }
            }
        }
    }

    private async removeNotifications(notes: StoredNotification[]): Promise<void> {
        if (this._nextExpiration && notes.some(note => this._nextExpiration!.note.id === note.id)) {
            window.clearTimeout(this._nextExpiration.timerHandler);
            this._nextExpiration = null;

            await this.scheduleEarliestExpiry(Date.now());
        }
    }

    private async expireNotification(storedNotificaiton: StoredNotification, now: number): Promise<void> {
        if (this._nextExpiration && this._nextExpiration.note.id === storedNotificaiton.id) {
            this._nextExpiration = null;
        }

        await this._store.dispatch(new ExpireNotification(storedNotificaiton));

        await this.scheduleEarliestExpiry(Date.now());
    }

    private async scheduleEarliestExpiry(now: number): Promise<void> {
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
                await this.expireNotification(earliestExpiry, now);
            } else {
                this.scheduleExpiry(earliestExpiry, now);
            }
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
