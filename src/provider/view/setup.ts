import {ProviderIdentity} from 'openfin/_v2/api/interappbus/channel/channel';

import {APITopicExtension, APIExtension} from '../model/APIExtension';
import {INotification, SenderInfo} from '../../client/Notification';
import {NotificationCenterEventMap, NotificationCenterAPI} from '../model/NotificationCenterAPI';
import {NotificationCenter} from '../controller/NotificationCenter';
import {SERVICE_CHANNEL, APITopic} from '../../client/internal';
import {StoredNotification} from '../model/StoredNotification';
import { Identity } from 'openfin/_v2/main';

declare const window: Window & {openfin: {notifications: NotificationCenterAPI}};

export function setup(isNotificationCenter?: boolean) {
    fin.desktop.main(async () => {
        const opts = {payload: {version: 'center'}};
        const pluginP = fin.InterApplicationBus.Channel.connect(SERVICE_CHANNEL, opts);

        async function sendCenterMessage<T extends APITopicExtension | APITopic>(action: T, payload: APIExtension[T][0]): Promise<APIExtension[T][1]> {
            const channelClient = await pluginP;
            return channelClient.dispatch(action, payload);
        }

        function notificationCreated(payload: INotification & SenderInfo, sender: ProviderIdentity) {
            // For testing/display purposes
            console.log('notificationCreated hit');
            console.log('payload', payload);
            console.log('sender', sender);
            return 'notificationCreated success';
        }

        function notificationCleared(payload: INotification & SenderInfo, sender: ProviderIdentity) {
            // For testing/display purposes
            console.log('notificationCleared hit');
            console.log('payload', payload);
            console.log('sender', sender);
            return 'notificationCleared success';
        }

        function appNotificationsCleared(payload: SenderInfo, sender: ProviderIdentity) {
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
                clickHandler: async (payload: StoredNotification): Promise<void> => {
                    // Handle a click on a notification
                    return sendCenterMessage(APITopicExtension.NOTIFICATION_CLICKED, payload);
                },
                buttonClickHandler: async (payload: StoredNotification, buttonIndex: number): Promise<void> => {
                    // Handle a click on a notification
                    return sendCenterMessage(APITopicExtension.NOTIFICATION_BUTTON_CLICKED, {...payload, buttonIndex});
                },
                closeHandler: async (payload: StoredNotification): Promise<void> => {
                    // Handle a close on a notification
                    return sendCenterMessage(APITopicExtension.NOTIFICATION_CLOSED, payload);
                },
                fetchAllNotifications: async (): Promise<StoredNotification[]> => {
                    // Fetch all notifications for the center
                    const allNotifications = await sendCenterMessage(APITopicExtension.FETCH_ALL_NOTIFICATIONS, undefined);
                    allNotifications.forEach(n => {
                        n.notification.date = new Date(n.notification.date);
                    });
                    return allNotifications;
                },
                clearAllNotifications: async (): Promise<boolean> => {
                    // Clear all notifications
                    return sendCenterMessage(APITopicExtension.CLEAR_ALL_NOTIFICATIONS, undefined);
                },
                clearAppNotifications: async (uuid: string): Promise<number> => {
                    // Clear all notifications
                    const payload = {uuid};
                    return sendCenterMessage(APITopic.CLEAR_APP_NOTIFICATIONS, payload);
                },
                addEventListener<K extends keyof NotificationCenterEventMap>(
                    event: K,
                    cb: (payload: NotificationCenterEventMap[K],
                        sender: ProviderIdentity) => void
                ) {
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
        plugin.register('notification-created', (
            payload: INotification & SenderInfo,
            sender: ProviderIdentity
        ) => callbacks.notificationCreated(payload, sender));
        plugin.register('notification-cleared', (
            payload: INotification & SenderInfo,
            sender: ProviderIdentity
        ) => callbacks.notificationCleared(payload, sender));
        plugin.register('app-notifications-cleared', (payload: Identity, sender: ProviderIdentity) => callbacks.appNotificationsCleared(payload, sender));

        if (isNotificationCenter) {
            plugin.register('all-notifications-cleared', allNotificationsCleared);
            plugin.register('toggle-notification-center', toggleNotificationCenter);
        }
    });


    function allNotificationsCleared(payload: SenderInfo, sender: ProviderIdentity) {
    // For testing/display purposes
        console.log('allNotificationsCleared hit');
        console.log('payload', payload);
        console.log('sender', sender);
        return 'allNotificationsCleared success';
    }

    function toggleNotificationCenter() {
        NotificationCenter.instance.toggleWindow();
        return 'toggleNotificationCenter success';
    }
}
