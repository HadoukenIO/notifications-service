import {Middleware, MiddlewareAPI, Dispatch} from 'redux';
import {Identity} from 'openfin/_v2/main';
import {isActionOf} from 'typesafe-actions';

import {ToastManager} from '../controller/ToastManager';
import {Injector} from '../common/Injector';
import {StoredNotification} from '../model/StoredNotification';
import {Inject} from '../common/Injectables';
import {NotificationClickedEvent, NotificationButtonClickedEvent, NotificationClosedEvent} from '../../client';
import {APIHandler} from '../model/APIHandler';
import {APITopic} from '../../client/internal';

import {createNotification, removeNotifications, clickNotificationButton, clickNotification} from './notifications/actions';
import {toggleCenterWindowVisibility} from './ui/actions';

import {RootState, RootAction} from '.';

// TODO: Rename file
export class StoreMiddleware {
    private _toastManager!: ToastManager;
    private _apiHandler!: APIHandler<APITopic>;

    public middleware: Middleware<Dispatch<RootAction>, RootState> = (api: MiddlewareAPI) => (next: Dispatch<RootAction>) => async (action: RootAction) => {
        if (!this._toastManager) {
            this._toastManager = Injector.get(Inject.TOAST_MANAGER) as ToastManager;
        }
        if (!this._apiHandler) {
            this._apiHandler = Injector.get(Inject.API_HANDLER) as APIHandler<APITopic>;
        }

        if (isActionOf(createNotification, action)) {
            this._toastManager.create(action.payload);
        }

        if (isActionOf(removeNotifications, action)) {
            action.payload.forEach(notification => {
                this.notificationClosed(notification);
            });
            this._toastManager.removeToasts(...action.payload);
        }

        if (isActionOf(clickNotificationButton, action)) {
            const {buttonIndex} = action.payload;
            const target: Identity = action.payload.notification.source;
            const event: NotificationButtonClickedEvent = {
                type: 'notification-button-clicked',
                notification: action.payload.notification.notification,
                buttonIndex
            };
            this._apiHandler.dispatchClientEvent(target, event);
        }

        if (isActionOf(clickNotification, action)) {
            const {notification, source} = action.payload;
            const event: NotificationClickedEvent = {type: 'notification-clicked', notification};
            // Send notification clicked event to uuid with the context.
            this._apiHandler.dispatchClientEvent(source, event);
        }

        if (isActionOf(toggleCenterWindowVisibility, action)) {
            this._toastManager.closeAll();
        }

        return next(action);
    };

    /**
     * notificationClosed Tell the Client that a notification was closed,
     * and delete it from indexeddb
     * @param storedNotification Should contain the id of the notification clicked. Also the uuid and name of the original Client window.
     */
    private async notificationClosed(storedNotification: StoredNotification): Promise<void> {
        // Send notification closed event to uuid with the context.
        const target: Identity = storedNotification.source;
        const event: NotificationClosedEvent = {type: 'notification-closed', notification: storedNotification.notification};

        this._apiHandler.dispatchClientEvent(target, event);
    }
}
