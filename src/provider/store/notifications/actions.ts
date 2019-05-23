import {createCustomAction} from 'typesafe-actions';

import {StoredNotification} from '../../model/StoredNotification';

/**
 * Create & store a new notification.
 * @param notification The notification to create.
 */
export const createNotification = createCustomAction(
    '@@notifications/CREATE',
    type => {
        return (notification: StoredNotification) => ({
            type,
            payload: {
                ...notification
            }
        });
    }
);

/**
 * Remove notifications.
 * @param notifications List of notifications to remove.
 */
export const removeNotifications = createCustomAction(
    '@@notifications/REMOVE',
    type => {
        return (...notifications: StoredNotification[]) => ({
            type,
            payload: notifications
        });
    }
);

/**
 * A notification was clicked.
 * @param notification The notification that was clicked.
 */
export const clickNotification = createCustomAction(
    '@@notifications/CLICK_NOTIFICATION',
    type => {
        return (notification: StoredNotification) => ({
            type,
            payload: {
                ...notification
            }
        });
    }
);

/**
 * A notification's button was clicked.
 * @param notification The notification that owns the button clicked.
 * @param buttonIndex The index of the clicked button.
 */
export const clickNotificationButton = createCustomAction(
    '@@notifications/CLICK_BUTTON',
    type => {
        return (notification: StoredNotification, buttonIndex: number) => ({
            type,
            payload: {
                notification,
                buttonIndex
            }
        });
    }
);
