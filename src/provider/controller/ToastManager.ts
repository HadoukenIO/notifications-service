import {injectable, inject} from 'inversify';

import {Inject} from '../common/Injectables';
import {StoredNotification} from '../model/StoredNotification';
import {Toast, ToastState} from '../model/Toast';
import {CreateNotification, RemoveNotifications, ToggleCenterVisibility, MinimizeToast, ToggleCenterMuted} from '../store/Actions';
import {ServiceStore} from '../store/ServiceStore';
import {Action} from '../store/Store';
import {RootState} from '../store/State';
import {MonitorModel} from '../model/MonitorModel';
import {WebWindowFactory} from '../model/WebWindow';

import {Layouter} from './Layouter';
import {LayoutStack} from './LayoutStack';
import {AsyncInit} from './AsyncInit';

@injectable()
export class ToastManager extends AsyncInit {
    private readonly _layouter: Layouter;
    private readonly _store: ServiceStore;
    private readonly _monitorModel: MonitorModel;
    private readonly _webWindowFactory: WebWindowFactory;

    private readonly _stack: LayoutStack = new LayoutStack();

    constructor(
    @inject(Inject.STORE) store: ServiceStore,
        @inject(Inject.LAYOUTER) layouter: Layouter,
        @inject(Inject.MONITOR_MODEL) monitorModel: MonitorModel,
        @inject(Inject.WEB_WINDOW_FACTORY) webWindowFactory: WebWindowFactory
    ) {
        super();

        this._store = store;
        this._store.onAction.add(this.onAction, this);
        this._layouter = layouter;
        this._layouter.onLayoutRequired.add(this.onLayoutRequired, this);
        this._monitorModel = monitorModel;
        this._webWindowFactory = webWindowFactory;
    }

    protected async init() {
        await this._store.initialized;
        await this._monitorModel.initialized;
    }

    /**
     * Signal callback for layout required event. This signal is emitted by Layouter in events like
     * monitor info is changed, etc.
     */
    private onLayoutRequired(): void {
        this._layouter.layout(this._stack);
    }

    private async onAction(action: Action<RootState>): Promise<void> {
        const retireToast = (toast: Toast) => toast.setState(toast.state >= ToastState.ACTIVE ? ToastState.TRANSITION_OUT : ToastState.CLOSED);

        if (action instanceof CreateNotification) {
            if (!this._store.state.centerMuted) {
                this.create(action.notification);
            }
        } else if (action instanceof RemoveNotifications) {
            action.notifications.forEach((notification: StoredNotification) => {
                const toast: Toast | null = this._stack.getToast(notification.id);

                if (toast) {
                    retireToast(toast);
                }
            });
        } else if (action instanceof ToggleCenterMuted) {
            if (this._store.state.centerMuted) {
                this._stack.items.forEach((toast: Toast) => retireToast(toast));
            }
        } else if (action instanceof ToggleCenterVisibility) {
            this.closeAll();
        } else if (action instanceof MinimizeToast) {
            const toast: Toast | null = this._stack.getToast(action.notification.id);

            if (toast) {
                retireToast(toast);
            }
        }
    }

    /**
     * Instantly closes all toasts (without transition animation) and resets the stack.
     */
    private async closeAll(): Promise<void> {
        const toasts = this._stack.items.slice();
        await Promise.all(toasts.map((toast) => this.closeToast(toast)));

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
    private async create(notification: StoredNotification): Promise<void> {
        const state = this._store.state;

        if (state.centerVisible) {
            return;
        }

        // Check for existing toast with same ID
        // Toast may still exist even after notification is deleted, due to toast animations.
        const {id} = notification;
        const existing = this._stack.getToast(id);
        if (existing) {
            // Need to wait for the existing toast to close, so that we can re-use that window identity for a new toast
            await existing.setState(existing.state >= ToastState.ACTIVE ? ToastState.TRANSITION_OUT : ToastState.CLOSED);
            if (this._stack.items.includes(existing) || this._stack.queue.includes(existing)) {
                console.warn('Toast should have been removed from queue by now');
            }
            await existing.close();
        }

        // Create toast and immediately add to queue
        const toast: Toast = new Toast(this._store, this._monitorModel, this._webWindowFactory, notification);
        this._stack.addToQueue(toast);

        // Handle state changes
        toast.onStateChange.add(this.handleToastStateChange, this);
    }

    private async handleToastStateChange(toast: Toast, state: ToastState): Promise<void> {
        // Handle state-specific toast updates
        if (state === ToastState.QUEUED) {
            if (this._stack.getToast(toast.id) === toast) {
                toast.setState(ToastState.QUEUED);

                // Move toast to stack if it'll fit on screen. Otherwise, leave in queue.
                this.checkQueue();
            } else {
                // Notification was deleted whilst window/toast was initialising
                console.info(`Toast created but no longer required (init) ${toast.id}`);
                toast.close();
            }
        } else if (state === ToastState.ACTIVE) {
            await toast.show();
        } else if (state === ToastState.TRANSITION_OUT) {
            // Queue-up a CLOSED transition once animation completes
            toast.currentTransition!.then(() => {
                toast.setState(ToastState.CLOSED);
            });
        } else if (state === ToastState.CLOSED) {
            // Keep toast in stack until window has fully closed
            // This ensures we won't attempt to create a new window with the same identity
            await toast.close();
            this._stack.remove(toast);

            // There is extra space now, check the queue.
            this.checkQueue();
        }

        // Refresh toast positions
        if (state >= ToastState.ACTIVE) {
            this._layouter.layout(this._stack);
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
            if (toast.state < ToastState.CLOSED) {
                toast.setState(ToastState.CLOSED);
            } else {
                console.warn('Stack contained a toast that was in CLOSED state', toast.id);

                // Sanity check, to ensure toast window is removed
                toast.close();
            }
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
        const items = this._layouter.getFittingItems(this._stack, this._stack.queue) as Toast[];

        await Promise.all(items.map(async (toast: Toast) => {
            if (this._stack.moveToStack(toast)) {
                // Snap toast into starting position, and start transition-in animation
                await this._layouter.setInitialTransform(toast);
                toast.setState(ToastState.ACTIVE);
            } else {
                // Notification was deleted whilst toast was being measured and positioned
                console.info(`Toast created but no longer required (measure) ${toast.id}`);
                toast.close();
            }
        }));
    }
}
