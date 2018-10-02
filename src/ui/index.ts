import {ISenderInfo} from '../provider/Models/ISenderInfo';
import {Notification} from '../Shared/Models/Notification';
import {INotification} from './models/INotification';
import {NotificationCenterAPI} from './NotificationCenterAPI';
declare var window: Window&{notifications: NotificationCenterAPI};

const IDENTITY = {
    uuid: 'notifications-service',
    name: 'Notifications-Service',
    channelName: 'notifications-service'
};


fin.desktop.main(async () => {
    const opts = {...IDENTITY, payload: {version:'center'}};
    const pluginP = fin.InterApplicationBus.Channel.connect(opts);

    function notificationCreated(payload: Notification&ISenderInfo, sender: ISenderInfo) {
        // For testing/display purposes
        console.log('notificationCreated hit');
        console.log('payload', payload);
        console.log('sender', sender);
        return 'notificationCreated success';
    }

    function notificationCleared(payload: {id: string}&ISenderInfo, sender: ISenderInfo) {
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

    window.notifications = {
        clickHandler: async (payload: Notification) => {
            // Handle a click on a notification
            const plugin = await pluginP;
            const success = await plugin.dispatch('notification-clicked', payload);
            console.log('success', success);
        },
        buttonClickHandler: async (payload: Notification, buttonIndex: number) => {
            // Handle a click on a notification
            const plugin = await pluginP;
            const fullPayload = Object.assign({}, payload, {buttonIndex});
            const success = await plugin.dispatch('notification-button-clicked', fullPayload);
            console.log('success', success);
        },
        closeHandler: async (payload: Notification&ISenderInfo) => {
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
        fetchAllNotifications: async() => {
            // Fetch all notifications for the center
            const plugin = await pluginP;
            const allNotifications = await plugin.dispatch('fetch-all-notifications', {});
            allNotifications.forEach(n => {
                n.date = new Date(n.date);
            });
            return allNotifications;
        },
        clearAllNotifications: async (payload: Notification[]) => {
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
        addEventListener: async (event: string, cb: (payload: any, sender: ISenderInfo) => string) => {
            if (event === 'notificationCreated') {
                callbacks.notificationCreated = cb;
            } else if (event === 'notificationCleared') {
                callbacks.notificationCleared = cb;
            } else if (event === 'appNotificationsCleared') {
                callbacks.appNotificationsCleared = cb;
            }
        }
    };

    const plugin = await pluginP;
    plugin.register('notification-created', (payload: Notification&ISenderInfo, sender: ISenderInfo) => callbacks.notificationCreated(payload, sender));
    plugin.register('notification-cleared', (payload: {id: string}&ISenderInfo, sender: ISenderInfo) => callbacks.notificationCleared(payload, sender));
    plugin.register('app-notifications-cleared', (payload: ISenderInfo, sender: ISenderInfo) => callbacks.appNotificationsCleared(payload, sender));
    plugin.register('all-notifications-cleared', allNotificationsCleared);
});

function allNotificationsCleared(payload: {id: string}&ISenderInfo, sender: ISenderInfo) {
    // Should remove the notification from the store/from the DOM
    fin.InterApplicationBus.publish('ui-all-notifications-clear', payload);

    // For testing/display purposes
    console.log('allNotificationsCleared hit');
    console.log('payload', payload);
    console.log('sender', sender);
    return 'allNotificationsCleared success';
}