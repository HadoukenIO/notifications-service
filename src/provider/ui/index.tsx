import * as React from 'react';
import {render} from 'react-dom';
import {ISenderInfo} from '../models/ISenderInfo';
import {ProviderIdentity} from 'openfin/_v2/api/interappbus/channel/channel';
import {CHANNEL_NAME} from '../../shared/config';
import {Notification} from '../../shared/models/Notification';
import {WindowManager} from './openfin';
import {INotification} from './models/INotification';
import {NotificationCenterAPI, NotificationCenterEventMap} from './NotificationCenterAPI';
import {App} from './container/App';

import '../../../res/provider/ui/css/launch-bar.css';
import '../../../res/provider/ui/css/notifications.css';
import '../../../res/provider/ui/css/openfin-center.css';

declare var window: Window&{openfin: {notifications: NotificationCenterAPI}};

const IDENTITY = {
    uuid: 'notifications-service',
    name: 'Notifications-Service',
    channelName: 'notifications-service'
};


fin.desktop.main(async () => {
    const opts = {payload: {version: 'center'}};
    const pluginP = fin.InterApplicationBus.Channel.connect(CHANNEL_NAME, opts);

    function notificationCreated(payload: INotification&ISenderInfo, sender: ProviderIdentity) {
        // For testing/display purposes
        console.log('notificationCreated hit');
        console.log('payload', payload);
        console.log('sender', sender);
        return 'notificationCreated success';
    }

    function notificationCleared(payload: INotification&ISenderInfo, sender: ProviderIdentity) {
        // For testing/display purposes
        console.log('notificationCleared hit');
        console.log('payload', payload);
        console.log('sender', sender);
        return 'notificationCleared success';
    }

    function appNotificationsCleared(payload: ISenderInfo, sender: ProviderIdentity) {
        // For testing/display purposes
        console.log('appNotificationsCleared hit');
        console.log('payload', payload);
        console.log('sender', sender);
        return 'appNotificationsCleared success';
    }

    // tslint:disable-next-line:no-any
    const callbacks: any = {notificationCreated, notificationCleared, appNotificationsCleared};

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
            closeHandler: async (payload: INotification) => {
                // Handle a close on a notification
                const plugin = await pluginP;
                const success = await plugin.dispatch('notification-closed', payload);
                console.log('success', success);
            },
            fetchAppNotifications: async (uuid: string) => {
                // Fetch all notifications for the center
                const plugin = await pluginP;
                const payload = {uuid};
                const appNotifications = await plugin.dispatch('fetch-app-notifications', payload) as (Notification & ISenderInfo)[];
                appNotifications.forEach(n => {
                    n.date = new Date(n.date);
                });
                console.log('appNotifications', appNotifications);
            },
            fetchAllNotifications: async () => {
                // Fetch all notifications for the center
                const plugin = await pluginP;
                const allNotifications = await plugin.dispatch('fetch-all-notifications', {}) as (Notification & ISenderInfo)[];
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
            addEventListener<K extends keyof NotificationCenterEventMap>(
                event: K, cb: (payload: NotificationCenterEventMap[K], sender: ProviderIdentity) => void) {
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
    plugin.register('notification-created', (payload: INotification&ISenderInfo, sender: ProviderIdentity) => callbacks.notificationCreated(payload, sender));
    plugin.register('notification-cleared', (payload: INotification&ISenderInfo, sender: ProviderIdentity) => callbacks.notificationCleared(payload, sender));
    plugin.register('app-notifications-cleared', (payload: ISenderInfo, sender: ProviderIdentity) => callbacks.appNotificationsCleared(payload, sender));
    plugin.register('all-notifications-cleared', allNotificationsCleared);
    plugin.register('toggle-notification-center', toggleNotificationCenter);
});

function allNotificationsCleared(payload: ISenderInfo, sender: ProviderIdentity) {
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

render(<App />, document.getElementById('react-app'));
