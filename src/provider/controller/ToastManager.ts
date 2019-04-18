import {StoredNotification} from '../model/StoredNotification';

import {WindowInfo} from './WindowInfo';

interface Toast {
    note: fin.OpenFinNotification;
    meta: StoredNotification
}


/**
 * @class ToastManager Handles all toasts
 */
export class ToastManager {
    private static singleton: ToastManager;

    private toasts: Toast[] = [];

    constructor() {
        if (ToastManager.singleton) {
            return ToastManager.singleton;
        }

        window.addEventListener('WindowShowingUpdate', this.windowShowingEventHandler.bind(this) as (evt: Event) => void);
        ToastManager.singleton = this;
    }

    /**
     * @function create Creates a Fin Notification
     * @param {INotification} meta Notification Information
     * @param {boolean} force Force show a notification, regardless of window showing or not
     */
    public create(meta: StoredNotification, force: boolean = false) {
        if (!force) {
            if (WindowInfo.instance.getShowingStatus()) {
                return;
            }
        }

        const note: fin.OpenFinNotification = new fin.desktop.Notification({url: 'Toast.html', message: meta});

        const toast: Toast = {note, meta};
        this.toasts.push(toast);
    }

    /**
     * @function closeAll Closes all Toasts
     * @returns void
     */
    public closeAll(): void {
        this.toasts.forEach((toast) => {
            toast.note.close();
        });
    }

    /**
     * @function windowShowingEventHandler Handler for the WindowShowingUpdate Event
     * @param {CustomEvent} e
     */
    private windowShowingEventHandler(e: CustomEvent<{showing: boolean}>): void {
        if (e.detail.showing) {
            this.closeAll();
        }
    }

    /**
     * @function instance Returns the Toast Manager Instance
     * @returns {ToastManager}
     * @static
     */
    public static get instance(): ToastManager {
        if (ToastManager.singleton) {
            return ToastManager.singleton;
        } else {
            return new ToastManager();
        }
    }
}
