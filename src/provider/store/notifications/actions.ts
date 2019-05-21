import {action} from 'typesafe-actions';

import {StoredNotification} from '../../model/StoredNotification';

import {Constants} from './constants';

/**
 * Create & store a new notification.
 * @param notification The notification to create.
 */
export const createNotification = (notification: StoredNotification) => action(Constants.CREATE, {...notification} as StoredNotification);

/**
 * Remove notifications.
 * @param notifications List of notifications to remove.
 */
export const removeNotifications = (...notifications: StoredNotification[]) => action(Constants.REMOVE, {notifications});

/**
 * A notification was clicked.
 * @param notification The notification that was clicked.
 */
export const clickNotification = (notification: StoredNotification) => action(Constants.CLICK_NOTIFICATION, notification);

/**
 * A notification's button was clicked.
 * @param notification The notification that owns the button clicked.
 * @param buttonIndex The index of the clicked button.
 */
export const clickNotificationButton = (notification: StoredNotification, buttonIndex: number) => action(Constants.CLICK_BUTTON, {notification, buttonIndex});
