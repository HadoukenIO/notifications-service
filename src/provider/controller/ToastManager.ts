import {injectable, inject} from 'inversify';
import {PointTopLeft} from 'openfin/_v2/api/system/point';
import {Rect} from 'openfin/_v2/api/system/monitor';

import {StoredNotification} from '../model/StoredNotification';
import {getNotificationCenterVisibility, getToastDirection} from '../store/ui/selectors';
import {Inject} from '../common/Injectables';
import {Toast, ToastEvent} from '../model/Toast';
import {watchForChange} from '../store/utils/watch';
import {StoreContainer} from '../store';

import {AsyncInit} from './AsyncInit';

export type WindowDimensions = {height: number, width: number};

@injectable()
export class ToastManager extends AsyncInit {
    private _store: StoreContainer;

    private _toasts: Map<string, Toast> = new Map();
    private _stack: Toast[] = [];
    private _availableRect!: Required<Rect>;

    constructor(@inject(Inject.STORE) store: StoreContainer) {
        super();
        this._store = store;
    }

    protected async init(): Promise<void> {
        setImmediate(async () => {
            const monitorInfo = await fin.System.getMonitorInfo();
            this._availableRect = monitorInfo.primaryMonitor.availableRect;
            await this._store.initialized;
            await this.subscribe();
            this.addListeners();
        });
    }

    private addListeners() {
        Toast.eventEmitter.addListener(ToastEvent.CLOSED, async (id: string) => {
            const toast = this._toasts.get(id);
            if (toast) {
                await this.deleteToast(toast);
            }
        });

        Toast.eventEmitter.addListener(ToastEvent.PAUSE, async (id: string) => {
            const toast = this._toasts.get(id);
            if (toast) {
                this.pauseToasts(toast);
            }
        });
    }

    /**
     * Close all toasts.
     */
    public async closeAll(): Promise<void> {
        this._toasts.forEach(toast => {
            toast.close(true);
            this._toasts.delete(toast.id);
        });
        this._stack = [];
    }

    public async create(notification: StoredNotification): Promise<void> {
        if (getNotificationCenterVisibility(this._store.getState())) {
            console.log('IGNORE');
            return;
        }
        console.log('MAKE TOAST');
        // Create new toast notifications
        const {id} = notification;
        if (this._toasts.has(notification.id)) {
            const oldToast = this._toasts.get(id)!;
            await this.deleteToast(oldToast, true);
        }

        const lastIndex = this._stack.length - 1;
        let previousToastBounds: Rect | undefined;
        if (lastIndex >= 0) {
            previousToastBounds = await this._stack[lastIndex].calculateBounds();
        }

        const position = this.getTargetPosition(previousToastBounds);

        const toast: Toast = new Toast(this._store, notification, {
            timeout: 10000,
            direction: getToastDirection(this._store.getState())
        }, position);


        this._toasts.set(id, toast);
        this._stack.push(toast);
        toast.show();
    }

    public async removeToasts(...notifications: StoredNotification[]): Promise<void> {
        notifications.forEach(async notification => {
            const {id} = notification;
            const toast = this._toasts.get(id);
            if (toast) {
                this.deleteToast(toast);
            }
        });
    }

    private async updateToasts(index: number = 0): Promise<void> {
        // console.log('Updating toasts');
        // Update toasts after the slice
        let previousToastRect: Rect | undefined;
        if (index > 0) {
            previousToastRect = await this._stack[index - 1].calculateBounds();
        }
        const toasts: Toast[] = this._stack.slice(index);
        for (const toast of toasts) {
            toast.position = this.getTargetPosition(previousToastRect);
            previousToastRect = await toast.calculateBounds(toast.position);
            if (toast.canFitInMonitor()) {
                if (toast.isShowing) {
                    toast.moveTo(toast.position);
                } else {
                    toast.show();
                }
            }
        }
    }

    private async pauseToasts(mousedToast: Toast): Promise<void> {
        const toastIndex = this._stack.indexOf(mousedToast);
        for (let i = 0; i < this._stack.length; i++) {
            if (i >= toastIndex) {
                this._stack[i].freeze(true);
            } else {
                this._stack[i].freeze();
            }
        }
    }

    private async deleteToast(toast: Toast, force: boolean = false): Promise<void> {
        this._toasts.delete(toast.id);
        const index = this._stack.indexOf(toast);
        this._stack.splice(index, 1);
        const toastWasShowing = toast.isShowing;
        await toast.close(force);
        if (toastWasShowing) {
            this.updateToasts(index);
        }
    }

    private getTargetPosition(previous?: Rect): PointTopLeft {
        const [vX, vY] = getToastDirection(this._store.getState());
        const {vertical, horizontal} = Toast.margin;
        const bounds = this._availableRect;

        let left = (vX > 0) ? bounds.left : bounds.right;
        let top: number;
        if (!previous) {
            top = (vY > 0) ? bounds.top : bounds.bottom;
        } else {
            top = (vY < 0) ? previous.top : previous.bottom;
        }

        // Add margins
        top += vY * vertical;
        left += vX * horizontal;

        return {top, left};
    }

    /**
     * Subscribe to the store.
     * Perform all watching for state change in here.
     */
    private subscribe(): void {
        // Notification Center Window open
        watchForChange(
            this._store,
            getNotificationCenterVisibility,
            (previous: boolean, visible: boolean) => {
                if (visible) {
                    this.closeAll();
                }
            }
        );
    }
}
