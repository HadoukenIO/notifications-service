import {injectable, inject} from 'inversify';

import {Store} from '../store/Store';
import {Inject} from '../common/Injectables';
import {StoredNotification} from '../model/StoredNotification';
import {RemoveNotifications, RootAction, CreateNotification, ExpireNotification} from '../store/Actions';
import {RootState} from '../store/State';

import {AsyncInit} from './AsyncInit';

@injectable()
export class ExpiryController extends AsyncInit {
    private readonly _store: Store<RootState, RootAction>;

    private _nextExpiry: {
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
        // Intentionally don't await, as though this may trigger expiry, we treat that as a 'background' process
        if (action instanceof CreateNotification) {
            this.addNotification(action.notification);
        } else if (action instanceof RemoveNotifications) {
            this.removeNotifications(action.notifications);
        }
    }

    private async addNotification(note: StoredNotification): Promise<void> {
        if (note.notification.expiry !== null) {
            if (this._nextExpiry === null || note.notification.expiry < this._nextExpiry.note.notification.expiry!) {
                const now = Date.now();

                if (note.notification.expiry <= now) {
                    await this.expireNotification(note, now);
                } else {
                    if (this._nextExpiry !== null) {
                        window.clearTimeout(this._nextExpiry.timerHandler);
                    }

                    await this.scheduleExpiry(note, now);
                }
            }
        }
    }

    private async removeNotifications(notes: StoredNotification[]): Promise<void> {
        if (this._nextExpiry && notes.some(note => this._nextExpiry!.note.id === note.id)) {
            window.clearTimeout(this._nextExpiry.timerHandler);
            this._nextExpiry = null;

            await this.scheduleEarliestExpiry(Date.now());
        }
    }

    private async expireNotification(storedNotificaiton: StoredNotification, now: number): Promise<void> {
        if (this._nextExpiry && this._nextExpiry.note.id === storedNotificaiton.id) {
            this._nextExpiry = null;
        }

        await this._store.dispatch(new ExpireNotification(storedNotificaiton));

        await this.scheduleEarliestExpiry(Date.now());
    }

    private async scheduleEarliestExpiry(now: number): Promise<void> {
        const earliestExpiry = this._store.state.notifications.reduce((
            earliest: StoredNotification|null,
            current: StoredNotification
        ): StoredNotification|null => {
            if (current.notification.expiry !== null) {
                if (earliest !== null) {
                    if (current.notification.expiry < earliest.notification.expiry!) {
                        return current;
                    }
                } else {
                    return current;
                }
            }

            return earliest;
        }, null);

        if (earliestExpiry !== null) {
            if (earliestExpiry.notification.expiry! <= now) {
                await this.expireNotification(earliestExpiry, now);
            } else {
                this.scheduleExpiry(earliestExpiry, now);
            }
        }
    }

    private scheduleExpiry(note: StoredNotification, now: number): void {
        this._nextExpiry = {
            note,
            timerHandler: window.setTimeout(() => {
                this.expireNotification(note, note.notification.expiry!);
            }, note.notification.expiry! - now)
        };
    }
}
