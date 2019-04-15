console.log('Client index.js loaded');

import {CHANNEL_NAME} from './config';

import {Notification, NotificationEvent, NotificationOptions, SenderInfo} from './Notification';
import {ProviderIdentity} from 'openfin/_v2/api/interappbus/channel/channel';

/**
 * The version of the NPM package.
 *
 * Webpack replaces any instances of this constant with a hard-coded string at build time.
 */
declare const PACKAGE_VERSION: string;

const IDENTITY = {
    uuid: 'notifications-service',
    name: 'Notifications-Service',
    channelName: 'notifications-service'
};

// For testing/display purposes
const notificationClicked = (payload: NotificationEvent, sender: ProviderIdentity) => {
    console.log('notificationClicked hit');
    console.log('payload', payload);
    console.log('sender', sender);
    return 'notificationClicked success';
};

// For testing/display purposes
const notificationButtonClicked = (payload: NotificationEvent & SenderInfo & {buttonIndex: number}, sender: ProviderIdentity) => {
    console.log('notificationButtonClicked hit');
    console.log('payload', payload);
    console.log('sender', sender);
    return 'notificationClicked success';
};

// For testing/display purposes
const notificationClosed = (payload: NotificationEvent & SenderInfo, sender: ProviderIdentity) => {
    console.log('notificationClosed hit');
    console.log('payload', payload);
    console.log('sender', sender);
    return 'notificationClosed success';
};

const callbacks = {
    notificationClicked,
    notificationButtonClicked,
    notificationClosed
};

async function createClientPromise() {
    await new Promise((resolve, reject) => {
        if (!fin) {
            reject('fin is not defined, This module is only intended for use in an OpenFin application.');
        }
        fin.desktop.main(() => resolve());
    });

    try {
        const opts = {payload: {version: PACKAGE_VERSION}};
        const clientP = fin.InterApplicationBus.Channel.connect(CHANNEL_NAME, opts).then((client) => {
            // tslint:disable-next-line:no-any
            client.register('WARN', (payload: any) => console.warn(payload));
            client.register('notification-clicked', (payload: NotificationEvent & SenderInfo, sender: ProviderIdentity) => {
                callbacks.notificationClicked(payload, sender);
            });
            client.register('notification-button-clicked', (payload: NotificationEvent & SenderInfo & {buttonIndex: number}, sender: ProviderIdentity) => {
                callbacks.notificationButtonClicked(payload, sender);
            });
            client.register('notification-closed', (payload: NotificationEvent & SenderInfo, sender: ProviderIdentity) => {
                callbacks.notificationClosed(payload, sender);
            });
            return client;
        });
        return clientP;
    } catch (e) {
        console.error(e);
        throw e;
    }
}

const clientP = createClientPromise();

/**
 * @method create Creates a new notification
 * @param {string} id The id of the notification
 * @param {NotificationOptions} options notification options
 */
export async function create(id: string, options: NotificationOptions) {
    const plugin = await clientP;
    const payload: Notification = Object.assign({}, {id}, options);
    const notification = await plugin.dispatch('create-notification', payload);
    return notification;
}

/**
 * @method getAll get all notifications for this app
 */
export async function getAll() {
    const plugin = await clientP;
    const appNotifications = await plugin.dispatch('fetch-app-notifications', {});
    return appNotifications;
}

/**
 * @method clear clears a notification by it's ID
 * @param {string} id The id of the notification
 */
export async function clear(id: string) {
    const plugin = await clientP;
    const payload = {id};
    const result = await plugin.dispatch('clear-notification', payload);
    return result;
}

/**
 * @method clearAll clears all notifications for an app
 */
export async function clearAll() {
    const plugin = await clientP;
    const result = await plugin.dispatch('clear-app-notifications');
    return result;
}

/**
 * @method clearAll clears all notifications for an app
 * @param {string} evt the event name
 * @param {(payload: NotificationEvent, sender: SenderInfo) => string)} cb event handler callback
 */
export async function addEventListener(evt: string, cb: (payload: NotificationEvent, sender: ProviderIdentity) => string) {
    if (evt === 'click') {
        callbacks.notificationClicked = cb;
    } else if (evt === 'close') {
        callbacks.notificationClosed = cb;
    } else if (evt === 'button-click') {
        callbacks.notificationButtonClicked = cb;
    }
}
