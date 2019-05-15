import {Middleware, MiddlewareAPI, Dispatch} from 'redux';
import {Identity} from 'openfin/_v2/main';

import {RootAction, RootState} from '../typings';
import RootTypes from '../root-types';
import {ToastManager} from '../../controller/ToastManager';
import {dispatchClientEvent} from '../../controller/IABService';
import {NotificationClickedEvent, NotificationButtonClickedEvent, NotificationClosedEvent} from '../../../client';
import {StoredNotification} from '../../model/StoredNotification';

export const ProviderMiddleware: Middleware<Dispatch<RootAction>, RootState> = (api: MiddlewareAPI) => (next: Dispatch<RootAction>) => (action: RootAction) => {
    if (action.type === RootTypes.notifications.CREATE) {
        ToastManager.instance.create(action.payload);
    }

    if (action.type === RootTypes.notifications.REMOVE) {
        const {notifications} = action.payload;
        notifications.forEach(notification => {
            notificationClosed(notification);
        });
        ToastManager.instance.removeToasts(...notifications);
    }

    if (action.type === RootTypes.notifications.CLICK_BUTTON) {
        const {buttonIndex} = action.payload;
        const notification = action.payload.notification.notification;
        const target: Identity = action.payload.notification.source;
        const event: NotificationButtonClickedEvent = {type: 'notification-button-clicked', notification, buttonIndex};
        dispatchClientEvent(target, event);
    }

    if (action.type === RootTypes.notifications.CLICK_NOTIFICATION) {
        const {notification, source} = action.payload;
        const event: NotificationClickedEvent = {type: 'notification-clicked', notification};
        // Send notification clicked event to uuid with the context.
        dispatchClientEvent(source, event);
    }

    if (action.type === RootTypes.ui.TOGGLE_CENTER_WINDOW) {
        ToastManager.instance.closeAll();
    }

    return next(action);
};



/**
 * @function notificationClosed Tell the Client that a notification was closed,
 * and delete it from indexeddb
 * @param storedNotification Should contain the id of the notification clicked. Also the uuid and name of the original Client window.
 */
export async function notificationClosed(storedNotification: StoredNotification): Promise<void> {
    // Send notification closed event to uuid with the context.
    const target: Identity = storedNotification.source;
    const event: NotificationClosedEvent = {type: 'notification-closed', notification: storedNotification.notification};

    dispatchClientEvent(target, event);
}
