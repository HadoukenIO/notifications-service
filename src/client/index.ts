console.log('Client index.js loaded');

import {Fin} from '../fin';
import {OptionButton} from '../Shared/Models/OptionButton';
import {Notification} from '../Shared/Models/Notification';
import {ISenderInfo} from '../provider/Models/ISenderInfo';
import {OptionInput} from '../Shared/Models/OptionInput';
import {NotificationEvent} from '../Shared/Models/NotificationEvent';
import {NotificationOptions} from './Models/NotificationOptions';

declare var fin: Fin;
declare var window: Window&{fin: Fin};

// For testing/display purposes
const notificationClicked = (payload: NotificationEvent, sender: ISenderInfo) => {
    console.log('notificationClicked hit');
    console.log('payload', payload);
    console.log('sender', sender);
    return 'notificationClicked success';
};

// For testing/display purposes
const notificationButtonClicked = (payload: NotificationEvent&ISenderInfo&{buttonIndex: number}, sender: ISenderInfo) => {
    console.log('notificationButtonClicked hit');
    console.log('payload', payload);
    console.log('sender', sender);
    return 'notificationClicked success';
};

// For testing/display purposes
const notificationClosed = (payload: NotificationEvent&ISenderInfo, sender: ISenderInfo) => {
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
    const client = await fin.desktop.Service.connect({uuid: 'notifications', payload: {version: '0.0.3'}});
    // tslint:disable-next-line:no-any
    client.register('WARN', (payload: any) => console.warn(payload));
    client.register('notification-clicked', (payload: NotificationEvent&ISenderInfo, sender: ISenderInfo) => {
        callbacks.notificationClicked(payload, sender);
    });
    client.register('notification-button-clicked', (payload: NotificationEvent&ISenderInfo&{buttonIndex: number}, sender: ISenderInfo) => {
        callbacks.notificationButtonClicked(payload, sender);
    });
    client.register('notification-closed', (payload: NotificationEvent&ISenderInfo, sender: ISenderInfo) => {
        callbacks.notificationClosed(payload, sender);
    });
    return client;
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
 * @param {(payload: NotificationEvent, sender: ISenderInfo) => string)} cb event handler callback
 */
export async function addEventListener(evt: string, cb: (payload: NotificationEvent, sender: ISenderInfo) => string) {
    if (evt === 'click') {
        callbacks.notificationClicked = cb;
    } else if (evt === 'close') {
        callbacks.notificationClosed = cb;
    } else if (evt === 'button-click') {
        callbacks.notificationButtonClicked = cb;
    }
}
