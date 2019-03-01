import {ISenderInfo} from '../provider/Models/ISenderInfo';
import {CHANNEL_NAME} from '../Shared/config';

import {WindowManager} from './js/openfin';
import {INotification} from './models/INotification';
import {NotificationCenterAPI} from './NotificationCenterAPI';

declare var window: Window&{openfin: {notifications: NotificationCenterAPI}};

const IDENTITY = {
    uuid: 'notifications-service',
    name: 'Notifications-Service',
    channelName: 'notifications-service'
};


fin.desktop.main(async () => {
    const opts = {payload: {version: 'center'}};
    const pluginP = fin.InterApplicationBus.Channel.connect(CHANNEL_NAME, opts);

    function notificationCreated(payload: INotification&ISenderInfo, sender: ISenderInfo) {
        // For testing/display purposes
        console.log('notificationCreated hit');
        console.log('payload', payload);
        console.log('sender', sender);
        return 'notificationCreated success';
    }

    function notificationCleared(payload: INotification&ISenderInfo, sender: ISenderInfo) {
        // For testing/display purposes
        console.log('notificationCleared hit');
        console.log('payload', payload);
        console.log('sender', sender);
        return 'notificationCleared success';
    }

    function appNotificationsCleared(payload: ISenderInfo, sender: ISenderInfo) {
        // For testing/display purposes
        console.log('appNotificationsCleared hit');
        console.log('payload', payload);
        console.log('sender', sender);
        return 'appNotificationsCleared success';
    }

    const callbacks = {notificationCreated, notificationCleared, appNotificationsCleared};

    window.openfin = {
        notifications: {
            clickHandler: async (payload: INotification) => {
                // Handle a click on a notification
                const plugin = await pluginP;
                const success = await plugin.dispatch('notification-clicked', payload);
                console.log('success', success);
            },
            buttonClickHandler: async (payload: INotification, buttonIndex: number) => {
                // Handle a click on a notification
                const plugin = await pluginP;
                const fullPayload = Object.assign({}, payload, {buttonIndex});
                const success = await plugin.dispatch('notification-button-clicked', fullPayload);
                console.log('success', success);
            },
            closeHandler: async (payload: INotification&ISenderInfo) => {
                // Handle a close on a notification
                const plugin = await pluginP;
                const success = await plugin.dispatch('notification-closed', payload);
                console.log('success', success);
            },
            fetchAppNotifications: async (uuid: string) => {
                // Fetch all notifications for the center
                const plugin = await pluginP;
                const payload = {uuid};
                const appNotifications = await plugin.dispatch('fetch-app-notifications', payload);
                appNotifications.forEach(n => {
                    n.date = new Date(n.date);
                });
                console.log('appNotifications', appNotifications);
            },
            fetchAllNotifications: async () => {
                // Fetch all notifications for the center
                const plugin = await pluginP;
                const allNotifications = await plugin.dispatch('fetch-all-notifications', {});
                allNotifications.forEach(n => {
                    n.date = new Date(n.date);
                });
                return allNotifications;
            },
            clearAllNotifications: async (payload: INotification[]) => {
                // Clear all notifications
                const plugin = await pluginP;
                const success = await plugin.dispatch('clear-all-notifications', payload);
                console.log('success', success);
            },
            clearAppNotifications: async (uuid: string) => {
                // Clear all notifications
                const plugin = await pluginP;
                const payload = {uuid};
                const success = await plugin.dispatch('clear-app-notifications', payload);
                console.log('success', success);
            },
            addEventListener: async (event: string, cb: (payload: INotification|ISenderInfo, sender: ISenderInfo) => string) => {
                if (event === 'notificationCreated') {
                    callbacks.notificationCreated = cb;
                } else if (event === 'notificationCleared') {
                    callbacks.notificationCleared = cb;
                } else if (event === 'appNotificationsCleared') {
                    callbacks.appNotificationsCleared = cb;
                }
            }
        }
    };

    const plugin = await pluginP;
    plugin.register('notification-created', (payload: INotification&ISenderInfo, sender: ISenderInfo) => callbacks.notificationCreated(payload, sender));
    plugin.register('notification-cleared', (payload: INotification&ISenderInfo, sender: ISenderInfo) => callbacks.notificationCleared(payload, sender));
    plugin.register('app-notifications-cleared', (payload: ISenderInfo, sender: ISenderInfo) => callbacks.appNotificationsCleared(payload, sender));
    plugin.register('all-notifications-cleared', allNotificationsCleared);
    plugin.register('toggle-notification-center', toggleNotificationCenter);
});

function allNotificationsCleared(payload: ISenderInfo, sender: ISenderInfo) {
    // For testing/display purposes
    console.log('allNotificationsCleared hit');
    console.log('payload', payload);
    console.log('sender', sender);
    return 'allNotificationsCleared success';
}

function toggleNotificationCenter() {
    WindowManager.instance.toggleWindow();
    return 'toggleNotificationCenter success';
}