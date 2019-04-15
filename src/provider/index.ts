import {ProviderIdentity} from 'openfin/_v2/api/interappbus/channel/channel';
import {ChannelProvider} from 'openfin/_v2/api/interappbus/channel/provider';

import {CHANNEL_NAME} from '../shared/config';
import {Notification} from '../shared/models/Notification';
import {NotificationEvent, NotificationClickedEvent, NotificationButtonClickedEvent, NotificationClosedEvent} from '../client/models/NotificationEvent';
import {NotificationType, resolveType} from '../shared/models/NotificationTypes';

import {ISenderInfo} from './models/ISenderInfo';
import {HistoryRepository} from './persistence/dataLayer/repositories/HistoryRepository';
import {Repositories} from './persistence/dataLayer/repositories/RepositoryEnum';
import {RepositoryFactory} from './persistence/dataLayer/repositories/RepositoryFactory';
import {SettingsRepository} from './persistence/dataLayer/repositories/SettingsRepository';
import { APIHandler } from './APIHandler';
import { APITopic, API, CreatePayload, ClearPayload } from '../client/internal';
import { OptionButton, OptionInput } from '../client/models/NotificationOptions';
import { Identity } from 'openfin/_v2/main';

const repositoryFactory = RepositoryFactory.Instance;
const historyRepository = repositoryFactory.getRepository(Repositories.history) as HistoryRepository;
const settingsRepository = repositoryFactory.getRepository(Repositories.settings) as SettingsRepository;

let providerChannel: ChannelProvider;
const centerIdentity = {
    name: 'Notification-Center',
    uuid: '',
    channelId: '',
    channelName: ''
};

/**
 * @description Main entry point to the service
 */
fin.desktop.main(() => {
    registerService();

    const winConfig = {
        name: 'Notification-Center',
        url: 'ui/index.html',
        autoShow: false,
        defaultHeight: 400,
        defaultWidth: 500,
        resizable: false,
        saveWindowState: false,
        defaultTop: 0,
        frame: false,
        icon: 'ui/favicon.ico',
        'showTaskbarIcon': false
    };

    const notificationCenter = new fin.desktop.Window(
        winConfig,
        () => {
            console.log('Notification Center created');
        },
        (error: string) => {
            console.log('Error creating Notification Center:', error);
        });
});

/**
 * @method registerService Registers the service and any functions that can be
 * consumed
 */
async function registerService() {
    // Register the service
    const apiHandler: APIHandler<APITopic> = new APIHandler();

    await apiHandler.registerListeners<API>({
        [APITopic.CREATE_NOTIFICATION]: createNotification,
        [APITopic.CLEAR_NOTIFICATION]: clearNotification,
        [APITopic.GET_APP_NOTIFICATIONS]: fetchAppNotifications,
        [APITopic.CLEAR_APP_NOTIFICATIONS]: clearAppNotifications,
        [APITopic.TOGGLE_NOTIFICATION_CENTER]: toggleNotificationCenter
    });

    const serviceId = fin.desktop.Application.getCurrent().uuid;
    providerChannel = apiHandler.channel; // Temporary while I clean out all of the other references to this
    centerIdentity.uuid = serviceId;

    // handle client connections
    providerChannel.onConnection((app, payload) => {
        if (payload && payload.version && payload.version.length > 0) {
            console.log(`connection from client: ${app.name}, version: ${payload.version}`);
        } else {
            console.log(`connection from client: ${app.name}, unable to determine version`);
        }
    });

    // Functions called by the Notification Center
    apiHandler.channel.register('notification-clicked', notificationClicked);
    apiHandler.channel.register('notification-button-clicked', notificationButtonClicked);
    apiHandler.channel.register('notification-closed', notificationClosed);
    apiHandler.channel.register('fetch-all-notifications', fetchAllNotifications);
    apiHandler.channel.register('clear-all-notifications', clearAllNotifications);
}

async function dispatchClientEvent(target: Identity, payload: NotificationEvent): Promise<void> {
    return providerChannel.dispatch(target, 'event', payload);
}

// Send notification created to the UI
const dispatchNotificationCreated = async (payload: Notification&ISenderInfo) => {
    const providerChannelPlugin = await providerChannel;
    const success = await providerChannelPlugin.dispatch(centerIdentity, 'notification-created', payload);
    console.log('success', success);
};

// Send notification cleared to the UI
const dispatchNotificationCleared = async (payload: Notification&ISenderInfo) => {
    const providerChannelPlugin = await providerChannel;
    const success = await providerChannelPlugin.dispatch(centerIdentity, 'notification-cleared', payload);
    console.log('success', success);
};

// Send app notifications cleared to the UI
const dispatchAppNotificationsCleared = async (payload: {uuid: string}) => {
    const providerChannelPlugin = await providerChannel;
    const success = await providerChannelPlugin.dispatch(centerIdentity, 'app-notifications-cleared', payload);
    console.log('success', success);
};

const dispatchAllNotificationsCleared = async (payload: Notification) => {
    const providerChannelPlugin = await providerChannel;
    const success = await providerChannelPlugin.dispatch(centerIdentity, 'all-notifications-cleared', payload);
    console.log('success', success);
};

const dispatchToggleNotificationCenter = async (payload: undefined) => {
    const providerChannelPlugin = await providerChannel;
    const success = await providerChannelPlugin.dispatch(centerIdentity, 'toggle-notification-center', payload);
    console.log('success', success);
};

/**
 * Encodes the Id which currently is the uuid:id
 * @param payload The notification object
 */
function encodeID(payload: Notification&ISenderInfo|{id: string}&ISenderInfo): string {
    return `${payload.uuid}:${payload.id}`;
}

/**
 * @method decodeID This function retrieves the notification Id
 * @param payload The notification object
 */
function decodeID(payload: Notification&ISenderInfo|{id: string}&ISenderInfo): string {
    return payload.id.slice(payload.uuid.length + 1);
}

/**
 * @method createNotification Create the notification and dispatch it to the UI
 * @param {object} payload The contents to be dispatched to the UI
 * @param {object} sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
 */
async function createNotification(payload: CreatePayload, sender: ProviderIdentity): Promise<Notification> {
    // For testing/display purposes
    console.log('createNotification hit');

    console.log('payload', payload);
    console.log('sender', sender);

    const notification: Notification = {
        id: payload.id,
        body: payload.body,
        title: payload.title,
        subtitle: payload.subtitle || '',
        icon: payload.icon || '',
        context: payload.context,
        date: payload.date || new Date(),
        buttons: payload.buttons || [] as OptionButton[],
        inputs: payload.inputs || [] as OptionInput[],
        type: resolveType(payload)
    };

    testDisplay('createNotification', payload, sender);
    const fullPayload: Notification&ISenderInfo = Object.assign({}, notification, sender as ISenderInfo);
    const encodedID: string = `${sender.uuid}:${payload.id}`;

    const fullPayloadEncoded: Notification&ISenderInfo = Object.assign({}, fullPayload, {id: encodedID});

    // Manipulate notification data store
    const result = await historyRepository.create(fullPayloadEncoded);

    // Create the notification/toast in the UI
    if (result.success) {
        await dispatchNotificationCreated(fullPayloadEncoded);
        // Return the full notifiation to the client
        return notification;
    } else {
        throw new Error(result.errorMsg);
    }

}

/**
 * @method toggleNotificationCenter Dispatch the notification center toggle action to the UI
 * @param {object} sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
 */
async function toggleNotificationCenter(payload: undefined, sender: ProviderIdentity): Promise<void> {
    // For testing/display purposes
    console.log('toggleNotificationCenter hit');

    console.log('payload', payload);
    console.log('sender', sender);

    // Toggle the notification center
    return dispatchToggleNotificationCenter(undefined);
}

/**
 * @method clearNotification Tell the UI to delete a specific notification
 * @param {object} payload Should contain the id of the notification we want to delete. Maybe should just be a string
 * @param {object} sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
 * @returns {ReturnResult} Whether or not the removal of the notifications was successful.
 */
async function clearNotification(payload: ClearPayload, sender: ProviderIdentity): Promise<void> {
    // For testing/display purposes
    console.log('clearNotification hit');

    console.log('payload', payload);
    console.log('sender', sender);

    testDisplay('clearNotification', payload, sender);

    // Grab notificationID from payload. If not present, return error?
    if (!payload.id) {
        throw new Error('Must supply a notification ID to clear!');
    }

    const encodedID: string = `${sender.uuid}:${payload.id}`;
    const retrievalResult = await historyRepository.getById(encodedID);
    if (!retrievalResult.success) {
        throw new Error(retrievalResult.errorMsg);
    }
    const fullPayload: Notification&ISenderInfo = Object.assign({}, retrievalResult.value, sender as ISenderInfo);

    // Delete notification from indexeddb
    const result = await historyRepository.remove(encodedID);

    // Delete the notification/toast in UI
    if (result.success) {
        await dispatchNotificationCleared(fullPayload);
    } else {
        throw new Error(result.errorMsg);
    }
}

/**
 * @method notificationClicked Tell the Client that a notification was clicked
 * @param {object} payload Should contain the id of the notification clicked. Also the uuid and name of the original Client window.
 * @param {object} sender UI Window info. Not important.
 */
async function notificationClicked(payload: NotificationEvent&ISenderInfo, sender: ProviderIdentity): Promise<void> {
    // For testing/display purposes
    console.log('notificationClicked hit');

    console.log('payload', payload);
    console.log('sender', sender);

    testDisplay('notificationClicked', payload, sender);

    const target: Identity = {uuid: payload.uuid, name: payload.name};
    const event: NotificationClickedEvent = {type: 'notification-clicked', id: payload.id};
    
    // Send notification clicked event to uuid with the context.
    dispatchClientEvent(target, event);
}


async function notificationButtonClicked(payload: Notification&ISenderInfo&{buttonIndex: number}, sender: ProviderIdentity): Promise<void> {
    // For testing/display purposes
    console.log('notificationButtonClicked hit');

    console.log('payload', payload);
    console.log('sender', sender);

    testDisplay('notificationButtonClicked', payload, sender);

    const target: Identity = {uuid: payload.uuid, name: payload.name};
    const event: NotificationButtonClickedEvent = {type: 'notification-button-clicked', id: payload.id, button: payload.buttonIndex};

    dispatchClientEvent(target, event);
}

/**
 * @method notificationClosed Tell the Client that a notification was closed,
 * and delete it from indexeddb
 * @param {object} payload Should contain the id of the notification clicked. Also the uuid and name of the original Client window.
 * @param {object} sender UI Window info. Not important.
 */
async function notificationClosed(payload: Notification&ISenderInfo&{buttonIndex: number}, sender: ProviderIdentity): Promise<void> {
    // For testing/display purposes
    console.log('notificationClosed hit');

    console.log('payload', payload);
    console.log('sender', sender);

    testDisplay('notificationClosed', payload, sender);

    const encodedID: string = encodeID(payload);

    // Delete notification from indexeddb
    const result = await historyRepository.remove(encodedID);

    // Send notification closed event to uuid with the context.
    if (result.success) {
        const target: Identity = {uuid: payload.uuid, name: payload.name};
        const event: NotificationClosedEvent = {type: 'notification-closed', id: payload.id};

        dispatchNotificationCleared(payload);
        dispatchClientEvent(target, event);
    } else {
        throw new Error(result.errorMsg);
    }
}

/**
 * @method fetchAllNotifications Grab all notifications from the Service and
 * return it to the UI.
 * @param {object} payload Not important
 * @param {object} sender Not important.
 */
async function fetchAllNotifications(payload: undefined, sender: ProviderIdentity) {
    // For testing/display purposes
    console.log('fetchAllNotifications hit');

    console.log('payload', payload);
    console.log('sender', sender);

    // tslint:disable-next-line:no-any
    testDisplay('fetchAllNotifications', payload as any, sender);

    // Grab all notifications from indexeddb.
    const result = await historyRepository.getAll();

    if (result.success) {
        const allNotifications = result.value as (Notification & ISenderInfo)[];
        return allNotifications;
    }

    return [];
}

/**
 * @method fetchAppNotifications This allows you to fetch apps via your uuid
 * @param {undefined} payload The payload can contain the uuid
 * @param {ISenderInfo} sender The sender info contains the uuid of the sender
 */
async function fetchAppNotifications(payload: undefined , sender: ProviderIdentity): Promise<Notification[]> {
    // For testing/display purposes
    console.log('fetchAppNotifications hit');

    console.log('payload', payload);
    console.log('sender', sender);

    testDisplay('fetchAppNotifications', payload, sender);

    // Grab an app's notifications from indexeddb
    // Send those notifications to the requesting app.
    const result = await historyRepository.getByUuid(sender.uuid);

    if (result.success) {
        const appNotifications = result.value as (Notification & ISenderInfo)[];

        appNotifications.forEach((notification) => {
            console.log('notification', notification);
            notification.id = decodeID(notification);
        });

        return appNotifications;
    } else {
        throw new Error(result.errorMsg);
    }
}

/**
 * @method clearAllNotifications Clears all notifications in the database
 * @param {undefined} payload Not important
 * @param {ISenderInfo} sender Not important
 */
async function clearAllNotifications(payload: Notification, sender: ProviderIdentity) {
    console.log('clearAllNotifications hit');

    console.log('payload', payload);
    console.log('sender', sender);

    testDisplay('clearAllNotifications', payload, sender);

    // Delete app notifications from indexeddb

    const result = await historyRepository.removeAll();

    if (result.success) {
        dispatchAllNotificationsCleared(payload);
    }

    // TODO: What should we return?
    return 'clearAllNotifications returned';
}

async function clearAppNotifications(payload: undefined, sender: ProviderIdentity): Promise<void> {
    console.log('clearAppNotifications hit');

    console.log('payload', payload);
    console.log('sender', sender);

    testDisplay('clearAppNotifications', payload, sender);

    // Delete app notifications from indexeddb
    const result = await historyRepository.removeByUuid(sender.uuid);

    if (result.success) {
        // Delete the notifications/toasts in UI (TODO: NEED TO REGISTER
        // APP-NOTIFICATIONS-CLEARED IN UI)
        await dispatchAppNotificationsCleared(sender);
    } else {
        throw new Error(result.errorMsg);
    }

}

/**
 * @method testDisplay Displays test html on the service
 * @param {string} action The action that was hit
 * @param {Notification} payload The notification payload
 * @param {ISenderInfo} sender The sender info
 */
function testDisplay(action: string, payload: any, sender: ProviderIdentity) {
    document.body.innerHTML = '';
    document.body.innerHTML += `${action} hit <br></br>`;
    document.body.innerHTML += 'PAYLOAD <br></br>';
    const preTagPayload = document.createElement('PRE');
    preTagPayload.textContent = JSON.stringify(payload, null, 4);
    document.body.appendChild(preTagPayload);
    document.body.innerHTML += 'SENDER <br></br>';
    const preTagSender = document.createElement('PRE');
    preTagSender.textContent = JSON.stringify(sender, null, 4);
    document.body.appendChild(preTagSender);
}