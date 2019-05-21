import {Rect} from 'openfin/_v2/api/system/monitor';
import {PointTopLeft} from 'openfin/_v2/api/system/point';

import {StoredNotification} from '../model/StoredNotification';
import {getNotificationCenterVisibility, getToastDirection, getBannerDirection, getActionDirection} from '../store/ui/selectors';
import {Toast, ToastType} from '../model/Toast';
import {contains} from '../model/Geometry';
import {watchForChange} from '../store/utils/watch';
import {Store} from '../store';

export type WindowDimensions = {height: number, width: number};

export class ToastManager {
    private static _instance: ToastManager;
    private _store!: Store;
    private _toasts: Map<string, Toast> = new Map();

    /** The stack of notifications currently being shown on screen. */
    private _stack: {-readonly [K in keyof typeof ToastType]: Toast[]} = {
        [ToastType.BANNER]: [],
        [ToastType.ACTION]: []
    };

    /** Notifications that are queued up to be added to the stack. */
    private _queue: {-readonly [K in keyof typeof ToastType]: Toast[]} = {
        [ToastType.BANNER]: [],
        [ToastType.ACTION]: []
    };

    private constructor() {
    }

    public static get instance() {
        if (!ToastManager._instance) {
            ToastManager._instance = new ToastManager();
        }
        return ToastManager._instance;
    }

    public initialize(store: Store) {
        this._store = store;
        this.subscribe();
    }

    /**
     * Subscribe to the store.
     * Perform all watching for state change in here.
     */
    private async subscribe() {
        // Notification Center Window open
        watchForChange(
            this._store,
            getNotificationCenterVisibility,
            (_, visible) => {
                if (visible) {
                    this.closeAll();
                }
            }
        );

        // Banner direction change
        watchForChange(
            this._store,
            getBannerDirection,
            (_, direction) => {
                // TODO Move banners to new location
            }
        );

        // Action direction change
        watchForChange(
            this._store,
            getActionDirection,
            (_, direction) => {
                // TODO Move Action to new location
            }
        );
    }

    /**
     * Close all toasts.
     */
    public async closeAll() {
        [...this._toasts.values()].forEach(async toast => {
            toast.close();
        });
        this._toasts.clear();
    }

    public async create(...notifications: StoredNotification[]) {
        // Dont create if the notification center is open
        if (getNotificationCenterVisibility(this._store.getState())) {
            return;
        }
        // Create new toast notifications
        await notifications.forEach(async notification => {
            const toast: Toast = new Toast(this._store, notification, {
                timeout: 5000,
                onClose: () => this.removeFromStack(toast)
            });
            // Remove existing toast with matching id
            if (this._toasts.has(notification.id)) {
                await this._toasts.get(notification.id)!.close(true);
                this._toasts.delete(notification.id);
            }

            this._toasts.set(notification.id, toast);
            const nextFreePosition = await this.getFreeSpot(toast.type);

            if (await this.canFitInMonitor(toast, nextFreePosition)) {
                this._stack[toast.type].push(toast);
                const direction = getToastDirection(this._store.getState(), toast.type);
                toast.show(nextFreePosition, direction);
            } else {
                this._queue[toast.type].push(toast);
            }
        });
    }

    private async addToQueue(toast: Toast) {

    }

    public async canFitInMonitor(toast: Toast, position: {top: number, left: number}): Promise<boolean> {
        const direction = getToastDirection(this._store.getState(), toast.type);
        const toastRect = await toast.calculateBounds(direction, position) as Rect;
        const monitorInfo = await fin.System.getMonitorInfo();
        return contains(monitorInfo.primaryMonitor.availableRect, toastRect);
    }

    public async getFreeSpot(type: ToastType): Promise<PointTopLeft> {
        const stack = this._stack[type];
        const monitorInfo = await fin.System.getMonitorInfo();
        const monitorRect = monitorInfo.primaryMonitor.availableRect;
        const [vX, vY] = getToastDirection(this._store.getState(), type);
        let top = (vY > 0) ? monitorRect.top : monitorRect.bottom;
        const left = (vX > 0) ? monitorRect.left : monitorRect.right;

        // Only adjust position if banner
        if (type === ToastType.BANNER && stack.length > 0) {
            const lastToast = stack[stack.length - 1];
            const bounds = await lastToast.getBounds();
            top = (vY > 0) ? bounds.bottom! : bounds.top;
        }

        return {top, left};
    }

    public async removeFromStack(toast: Toast) {
        this._stack[ToastType.ACTION] = this._stack[ToastType.ACTION].filter(x => x !== toast);
        this._stack[ToastType.BANNER] = this._stack[ToastType.ACTION].filter(x => x !== toast);
    }

    public async removeToasts(...notifications: StoredNotification[]) {
        notifications.forEach(async notification => {
            const {id} = notification;
            const toast = this._toasts.get(id);
            if (toast) {
                toast.close(true);
                this._toasts.delete(id);
            }
        });
    }
}
