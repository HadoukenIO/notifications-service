import {injectable, inject} from 'inversify';

import {Inject} from '../common/Injectables';
import {StoredNotification} from '../model/StoredNotification';
import {Toast, ToastEvent} from '../model/Toast';
import {Action, RootAction} from '../store/Actions';
import {Store} from '../store/Store';
import {MonitorModel} from '../model/MonitorModel';
import {WebWindowFactory} from '../model/WebWindow';

import {Layouter} from './Layouter';
import {LayoutStack} from './LayoutStack';
import {AsyncInit} from './AsyncInit';

@injectable()
export class ToastManager extends AsyncInit {
    private readonly _layouter: Layouter;
    private readonly _store: Store;
    private readonly _monitorModel: MonitorModel;
    private readonly _webWindowFactory: WebWindowFactory;

    private readonly _stack: LayoutStack = new LayoutStack();

    constructor(
        @inject(Inject.STORE) store: Store,
        @inject(Inject.LAYOUTER) layouter: Layouter,
        @inject(Inject.MONITOR_MODEL) monitorModel: MonitorModel,
        @inject(Inject.WEB_WINDOW_FACTORY) webWindowFactory: WebWindowFactory
    ) {
        super();

        this._store = store;
        this._store.onAction.add(this.onAction, this);
        this.addListeners();
        this._layouter = layouter;
        this._layouter.onLayoutRequired.add(this.onLayoutRequired, this);
        this._monitorModel = monitorModel;
        this._webWindowFactory = webWindowFactory;
    }

    protected async init() {
        await this._store.initialized;
        await this._monitorModel.initialized;

        this.subscribe();
    }

    /**
     * Instantly closes all toasts (without transition animation) and resets the stack.
     */
    public async closeAll(): Promise<void> {
        const toasts = this._stack.items.slice();
        await Promise.all(toasts.map(toast => this.closeToast(toast)));

        this._stack.clear();
    }

    /**
     * Create a new toast.
     *
     * Returned promise captures the creation and initialisation of the window that will be used to display the toast,
     * but not anything to do with the presentation of the toast to the user.
     *
     * If the notification re-uses the ID of an existing notification, that window will be closed (including 'close'
     * animation) and re-created as part of the returned promise.
     *
     * @param notification The notification to display in the created toast.
     */
    public async create(notification: StoredNotification): Promise<void> {
        const state = this._store.state;

        if (state.windowVisible) {
            return;
        }

        // Check for existing toast with same ID
        // Toast may still exist even after notification is deleted, due to toast animations.
        const {id} = notification;
        const existing = this._stack.getToast(id);
        if (existing) {
            // Need to wait for the existing toast to close, so that we can re-use that window identity for a new toast
            await this.closeToast(existing);
            this._stack.remove(existing);
        }

        // Create toast and immediately add to queue
        const toast: Toast = new Toast(this._store, this._monitorModel, this._webWindowFactory, notification);
        this._stack.addToQueue(toast);

        // Move from queue to stack once window is ready
        toast.ready.then(async () => {
            if (this._stack.getToast(toast.id) === toast) {
                await this._layouter.setInitialTransform(toast);

                // Move toast to stack if it'll fit on screen. Otherwise, leave in queue.
                if ((await this._layouter.getFittingItems(this._stack, [toast])).length > 0) {
                    if (this._stack.moveToStack(toast)) {
                        await toast.show();
                        this._layouter.layout(this._stack);
                    } else {
                        // Notification was deleted whilst toast was being measured and positioned
                        console.info(`Toast created but no longer required (measure) ${toast.id} ${notification.notification.title}`);
                        toast.close();
                    }
                }
            } else {
                // Notification was deleted whilst window/toast was initialising
                console.info(`Toast created but no longer required (init) ${toast.id} ${notification.notification.title}`);
                toast.close();
            }
        });
    }

    /**
     * Remove toasts. Will play a close animation on the toast, then remove it from the stack.
     *
     * @param notifications The toasts that match the given notifications.
     */
    public async removeToasts(...notifications: StoredNotification[]): Promise<void> {
        const removePromise = Promise.all(notifications.map(async notification => {
            const toast = this._stack.getToast(notification.id);

            if (toast) {
                await this._layouter.removeItem(toast);

                // Check toast still exists before closing. May have been force-closed during animation.
                if (this._stack.getToast(toast.id)) {
                    await this.closeToast(toast);
                }
            }
        }));

        this._layouter.layout(this._stack);

        await removePromise;
    }

    /**
     * Signal callback for layout required event. This signal is emitted by Layouter in events like
     * monitor info is changed, etc.
     */
    private onLayoutRequired(): void {
        this._layouter.layout(this._stack);
    }

    private async onAction(action: RootAction): Promise<void> {
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
     * Instantly closes a toast. Will immediately destroy the toast and its window, use removeToasts to "animate out"
     * the toast.
     *
     * @param toast Toast to delete.
     */
    private async closeToast(toast: Toast): Promise<void> {
        if (this._stack.existsWithinStack(toast.id) && this._stack.remove(toast)) {
            this._layouter.layout(this._stack);

            await toast.close();

            // There is extra space now, check the queue.
            this.checkQueue();
        } else {
            console.warn('Trying to delete a toast that is not in the stack', toast && toast.id);

            // Toast is likely already closed, but should make sure
            await toast.close();
        }
    }

    /**
     * Adds a toast from awaiting toasts queue to the layout stack if it would fit.
     */
    private async checkQueue(): Promise<void> {
        const items = await this._layouter.getFittingItems(this._stack, this._stack.queue.slice());
        for (const toast of items as Toast[]) {
            this._stack.moveToStack(toast);
            await toast.show();
            this._layouter.layout(this._stack);
        }
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
                const toast = this._stack.getToast(id);
                if (toast) {
                    this.closeToast(toast);
                }
            } else if (event === ToastEvent.UNPAUSE) {
                for (const toast of this._stack.items) {
                    toast.unfreeze();
                }
            } else {
                for (const toast of this._stack.items) {
                    toast.freeze();
                }
            }
        }, this);
    }
}
