import {injectable, inject} from 'inversify';

import {Inject} from '../common/Injectables';
import {StoredNotification} from '../model/StoredNotification';
import {Toast, ToastEvent} from '../model/Toast';
import {Action, RootAction} from '../store/Actions';
import {Store} from '../store/Store';

import {LayoutEvent, Layouter} from './Layouter';

@injectable()
export class ToastManager {
    @inject(Inject.LAYOUTER)
    private _layouter!: Layouter;

    private _store!: Store;
    private _toasts: Map<string, Toast> = new Map();
    private _stack: Toast[] = [];

    constructor(@inject(Inject.STORE) store: Store) {
        this._store = store;
        this._store.onAction.add(this.onAction, this);
        this.subscribe();
        this.addListeners();
    }

    /**
     * Close all toasts.
     */
    public async closeAll(): Promise<void> {
        this._toasts.forEach(toast => {
            this.closeToast(toast);
            this._toasts.delete(toast.id);
        });
        this._stack = [];
    }

    /**
     * Create a new toast.
     * @param notification The notification to display in the created toast.
     */
    public async create(notification: StoredNotification): Promise<void> {
        const state = this._store.state;

        if (state.windowVisible) {
            return;
        }

        // Create new toast notifications
        const {id} = notification;
        if (this._toasts.has(notification.id)) {
            const oldToast = this._toasts.get(id)!;
            await this.deleteToast(oldToast, true);
        }

        const toast: Toast = new Toast(this._store, notification, {
            timeout: 10000
        });

        this._toasts.set(id, toast);
        this._stack.unshift(toast);
        await this._layouter.setInitialTransform(toast);
        await toast.show();
        this._layouter.layout(this._stack);
    }

    /**
     * Remove toasts.
     * @param notifications The toasts that match the given notifications.
     */
    public async removeToasts(...notifications: StoredNotification[]): Promise<void> {
        notifications.forEach(async notification => {
            const {id} = notification;
            const toast = this._toasts.get(id);
            if (toast) {
                this.deleteToast(toast);
            }
        });
    }

    private onAction(action: RootAction): void {
        if (action.type === Action.CREATE) {
            this.create(action.notification);
        }

        if (action.type === Action.REMOVE) {
            this.removeToasts(...action.notifications);
        }

        if (action.type === Action.TOGGLE_VISIBILITY) {
            this.closeAll();
        }
    }

    /**
     * Delete a toast.
     * @param toast Toast to delete.
     * @param force Force the deleted toast to close without playing animations.
     */
    private async deleteToast(toast: Toast, force: boolean = false): Promise<void> {
        this._toasts.delete(toast.id);
        const index = this._stack.indexOf(toast);
        this._stack.splice(index, 1);
        this._layouter.layout(this._stack);
        await this.closeToast(toast);
    }

    /**
     * Animate toast for removal and close.
     * @param toast {Toast} Toast to close.
     */
    private async closeToast(toast: Toast): Promise<void> {
        await this._layouter.removeItem(toast);
        toast.close();
    }

    /**
     * Subscribe to the store.
     * Perform all watching for state change in here.
     */
    private subscribe(): void {
        // Notification Center Window open
        this._store.watchForChange(
            state => state.windowVisible,
            (previous: boolean, visible: boolean) => {
                if (visible) {
                    this.closeAll();
                }
            }
        );
    }

    /**
     * Add listeners for toast events.
    */
    private addListeners() {
        Toast.eventEmitter.addListener(ToastEvent.CLOSED, async (id: string) => {
            const toast = this._toasts.get(id);
            if (toast) {
                this.deleteToast(toast);
            }
        });

        Toast.eventEmitter.addListener(ToastEvent.UNPAUSE, async () => {
            for (const toast of this._stack) {
                toast.unfreeze();
            }
        });

        Toast.eventEmitter.addListener(ToastEvent.PAUSE, async () => {
            for (const toast of this._stack) {
                toast.freeze();
            }
        });

        Layouter.eventEmitter.addListener(LayoutEvent.LAYOUT_REQUIRED, async () => {
            this._layouter.layout(this._stack);
        });
    }
}
