import {injectable, inject} from 'inversify';

import {Inject} from '../common/Injectables';
import {StoredNotification} from '../model/StoredNotification';
import {Toast, ToastEvent} from '../model/Toast';
import {Action, RootAction} from '../store/Actions';
import {Store} from '../store/Store';

import {LayoutStack, Layouter} from './Layouter';

@injectable()
export class ToastManager {
    private _layouter!: Layouter;
    private _store!: Store;
    private _toasts: Map<string, Toast> = new Map();
    private _stack: LayoutStack = {items: [], layoutHeight: 0};
    private _queue: Toast[] = [];

    constructor(@inject(Inject.STORE) store: Store, @inject(Inject.LAYOUTER) layouter: Layouter) {
        this._store = store;
        this._store.onAction.add(this.onAction, this);
        this.subscribe();
        this.addListeners();
        this._layouter = layouter;
        this._layouter.onLayoutRequired.add(this.onLayoutRequired, this);
    }

    /**
     * Close all toasts.
     */
    public async closeAll(): Promise<void> {
        this._toasts.forEach(toast => {
            this.closeToast(toast);
            this._toasts.delete(toast.id);
        });
        this._stack = {items: [], layoutHeight: 0};
        this._queue = [];
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
        await this._layouter.setInitialTransform(toast);
        if ((await this._layouter.getFittingItems(this._stack, [toast])).length > 0) {
            this._stack.items.unshift(toast);
            await toast.show();
            this._layouter.layout(this._stack);
        } else {
            this._queue.push(toast);
        }
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

    /**
     * Signal callback for layout required event. This signal is emitted by Layouter in events like
     * monitor info is changed, etc.
     */
    private onLayoutRequired(): void {
        this._layouter.layout(this._stack);
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
        const index = this._stack.items.indexOf(toast);
        this._stack.items.splice(index, 1);
        this._layouter.layout(this._stack);
        await this.closeToast(toast);
        // There is extra space now, check the queue.
        this.checkQueue();
    }

    /**
     * Adds a toast from awaiting toasts queue to the layout stack if it would fit.
     */
    private async checkQueue(): Promise<void> {
        const items = await this._layouter.getFittingItems(this._stack, this._queue);
        for (const toast of items as Toast[]) {
            this._stack.items.unshift(toast);
            await toast.show();
            await this._layouter.layout(this._stack);
        }
    }

    /**
     * Animate toast for removal and close.
     * @param toast Toast to close.
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
        Toast.onToastEvent.add((event: ToastEvent, id: string) => {
            if (event === ToastEvent.CLOSED) {
                const toast = this._toasts.get(id);
                if (toast) {
                    this.deleteToast(toast);
                }
            } else if (event === ToastEvent.UNPAUSE) {
                for (const toast of this._stack.items as Toast[]) {
                    toast.unfreeze();
                }
            } else {
                for (const toast of this._stack.items as Toast[]) {
                    toast.freeze();
                }
            }
        }, this);
    }
}
