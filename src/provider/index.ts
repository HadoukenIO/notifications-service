import {ProviderIdentity} from 'openfin/_v2/api/interappbus/channel/channel';
import {ChannelProvider} from 'openfin/_v2/api/interappbus/channel/provider';
import {Identity} from 'openfin/_v2/main';

import {APITopic} from '../client/internal';
import {NotificationOptions, Notification, OptionButton, NotificationClickedEvent, NotificationButtonClickedEvent, NotificationClosedEvent, NotificationEvent} from '../client/Notification';

import {Entity} from './model/Entity';
import {APIExtension, APITopicExtension} from './model/APIExtension';
import {HistoryRepository} from './persistence/dataLayer/repositories/HistoryRepository';
import {Repositories} from './persistence/dataLayer/repositories/RepositoryEnum';
import {RepositoryFactory} from './persistence/dataLayer/repositories/RepositoryFactory';
import {SettingsRepository} from './persistence/dataLayer/repositories/SettingsRepository';
import {APIHandler} from './APIHandler';
import {StoredNotification} from './model/StoredNotification';

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
        }
    );
});

/**
 * @function registerService Registers the service and any functions that can be
 * consumed
 */
async function registerService() {
    // Register the service
    const apiHandler: APIHandler<APITopic | APITopicExtension> = new APIHandler();

    await apiHandler.registerListeners<APIExtension>({
        [APITopic.CREATE_NOTIFICATION]: createNotification,
        [APITopic.CLEAR_NOTIFICATION]: clearNotification,
        [APITopic.GET_APP_NOTIFICATIONS]: fetchAppNotifications,
        [APITopic.CLEAR_APP_NOTIFICATIONS]: clearAppNotifications,
        [APITopic.TOGGLE_NOTIFICATION_CENTER]: toggleNotificationCenter,
        [APITopicExtension.NOTIFICATION_CLICKED]: notificationClicked,
        [APITopicExtension.NOTIFICATION_BUTTON_CLICKED]: notificationButtonClicked,
        [APITopicExtension.NOTIFICATION_CLOSED]: notificationClosed,
        [APITopicExtension.FETCH_ALL_NOTIFICATIONS]: fetchAllNotifications,
        [APITopicExtension.CLEAR_ALL_NOTIFICATIONS]: clearAllNotifications
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
}

async function dispatchClientEvent(target: Identity, payload: NotificationEvent): Promise<void> {
    return providerChannel.dispatch(target, 'event', payload);
}

/**
 * Maps action to expected parameter type for actions registered
 * to the channel in the notification center
 */
interface NotificationCenterEventMap {
    'notification-created': StoredNotification;
    'notification-cleared': StoredNotification;
    'app-notifications-cleared': {uuid: string};
    'all-notifications-cleared': undefined;
    'toggle-notification-center': undefined;
}

/**
 * Sends a channel message to the notification center.
 * Action and payload type must match according to the NotificationCenterAPI interface mappings
 */
async function sendCenterMessage<A extends keyof NotificationCenterEventMap>(action: A, payload: NotificationCenterEventMap[A]): Promise<void> {
    await providerChannel.dispatch(centerIdentity, action, payload);
}

/**
 * Encodes the Id which currently is the uuid:id
 * @param payload The notification object
 */
function encodeID(id: string, source: Identity): string {
    return `${source.uuid}:${id}`;
}

/**
 * @function createNotification Create the notification and dispatch it to the UI
 * @param {Object} payload The contents to be dispatched to the UI
 * @param {Object} sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
 */
async function createNotification(payload: NotificationOptions, sender: ProviderIdentity): Promise<Notification> {
    // For testing/display purposes
    console.log('createNotification hit');

    console.log('payload', payload);
    console.log('sender', sender);

    // Hydrate the provided options with default values to make a valid notification object
    const notification: Notification = {
        notificationId: payload.notificationId || generateId(),
        body: payload.body,
        title: payload.title,
        subtitle: payload.subtitle || '',
        icon: payload.icon || '',
        context: payload.context,
        date: payload.date || new Date(),
        buttons: payload.buttons || [] as OptionButton[]
    };

    testDisplay('createNotification', payload, sender);

    const internalNotification: StoredNotification = {
        id: encodeID(notification.notificationId, sender),
        source: sender,
        notification
    };

    // Creating a notification with an in-use ID will clear the existing notification
    // and then create the new one
    await clearNotification({id: notification.notificationId}, sender);

    // Manipulate notification data store
    const result = await historyRepository.create(internalNotification);

    if (result.success) {
        // Inform the center that the notif has been created
        await sendCenterMessage('notification-created', internalNotification);
        // Return the full notifiation to the client
        return notification;
    } else {
        throw new Error(result.errorMsg);
    }
}

/**
 * @function toggleNotificationCenter Dispatch the notification center toggle action to the UI
 * @param {Object} sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
 */
async function toggleNotificationCenter(payload: undefined, sender: ProviderIdentity): Promise<void> {
    // For testing/display purposes
    console.log('toggleNotificationCenter hit');

    console.log('payload', payload);
    console.log('sender', sender);

    // Toggle the notification center
    return sendCenterMessage('toggle-notification-center', undefined);
}

/**
 * @function clearNotification Tell the UI to delete a specific notification
 * @param {Object} payload Should contain the id of the notification we want to delete. Maybe should just be a string
 * @param {Object} sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
 * @returns {ReturnResult} Whether or not the removal of the notifications was successful.
 */
async function clearNotification(payload: Entity, sender: ProviderIdentity): Promise<boolean> {
    // For testing/display purposes
    console.log('clearNotification hit');

    console.log('payload', payload);
    console.log('sender', sender);

    testDisplay('clearNotification', payload, sender);

    // Grab notificationID from payload. If not present, return error?
    if (!payload.id) {
        throw new Error('Must supply a notification ID to clear!');
    }

    const encodedID: string = encodeID(payload.id, sender);
    const retrievalResult = await historyRepository.getById(encodedID);
    if (retrievalResult.success) {
        const storedNotification: StoredNotification = retrievalResult.value;

        // Delete notification from indexeddb
        const result = await historyRepository.remove(encodedID);

        if (result.success) {
            // Inform the Center that the notification has been deleted
            await sendCenterMessage('notification-cleared', storedNotification);
            return true;
        } else {
            // We've already checked for the existence of the notification, so an error here would be the result
            // of some other unhandled failure, which should be reported back to the client
            // (TODO: should we return the message or just do like a "internal error" type thing?)
            throw new Error(result.errorMsg);
        }
    } else if (retrievalResult.errorMsg === `Notification with the id ${encodedID} was not found`) {
        return false;
    } else {
        throw new Error(retrievalResult.errorMsg);
    }
}

/**
 * @function notificationClicked Tell the Client that a notification was clicked
 * @param {Object} payload Should contain the id of the notification clicked. Also the uuid and name of the original Client window.
 * @param {Object} sender UI Window info. Not important.
 */
async function notificationClicked(payload: StoredNotification, sender: ProviderIdentity): Promise<void> {
    // For testing/display purposes
    console.log('notificationClicked hit');

    console.log('payload', payload);
    console.log('sender', sender);

    testDisplay('notificationClicked', payload, sender);

    const event: NotificationClickedEvent = {type: 'notification-clicked', notification: payload.notification};
    // Send notification clicked event to uuid with the context.
    dispatchClientEvent(payload.source, event);
}


async function notificationButtonClicked(payload: StoredNotification & {buttonIndex: number}, sender: ProviderIdentity): Promise<void> {
    // For testing/display purposes
    console.log('notificationButtonClicked hit');

    console.log('payload', payload);
    console.log('sender', sender);

    testDisplay('notificationButtonClicked', payload, sender);

    const target: Identity = payload.source;
    const event: NotificationButtonClickedEvent = {type: 'notification-button-clicked', notification: payload.notification, buttonIndex: payload.buttonIndex};

    dispatchClientEvent(target, event);
}

/**
 * @function notificationClosed Tell the Client that a notification was closed,
 * and delete it from indexeddb
 * @param {Object} payload Should contain the id of the notification clicked. Also the uuid and name of the original Client window.
 * @param {Object} sender UI Window info. Not important.
 */
async function notificationClosed(payload: StoredNotification, sender: ProviderIdentity): Promise<void> {
    // For testing/display purposes
    console.log('notificationClosed hit');

    console.log('payload', payload);
    console.log('sender', sender);

    testDisplay('notificationClosed', payload, sender);

    // Delete notification from indexeddb
    const result = await historyRepository.remove(payload.id);

    // Send notification closed event to uuid with the context.
    if (result.success) {
        const target: Identity = payload.source;
        const event: NotificationClosedEvent = {type: 'notification-closed', notification: payload.notification};

        sendCenterMessage('notification-cleared', payload);
        dispatchClientEvent(target, event);
    } else {
        throw new Error(result.errorMsg);
    }
}

/**
 * @function fetchAllNotifications Grab all notifications from the Service and
 * return it to the UI.
 * @param {Object} payload Not important
 * @param {Object} sender Not important.
 */
async function fetchAllNotifications(payload: undefined, sender: ProviderIdentity): Promise<StoredNotification[]> {
    // Check and only allow this method to be called from the notifications centre
    if (sender.uuid !== centerIdentity.uuid || sender.name !== centerIdentity.name) {
        return [];
    }
    // For testing/display purposes
    console.log('fetchAllNotifications hit');

    console.log('payload', payload);
    console.log('sender', sender);

    // tslint:disable-next-line:no-any
    testDisplay('fetchAllNotifications', payload as any, sender);

    // Grab all notifications from indexeddb.
    const result = await historyRepository.getAll();

    if (result.success) {
        const allNotifications = result.value;
        return allNotifications;
    }

    return [];
}

/**
 * @function fetchAppNotifications This allows you to fetch apps via your uuid
 * @param {undefined} payload The payload can contain the uuid
 * @param {SenderInfo} sender The sender info contains the uuid of the sender
 */
async function fetchAppNotifications(payload: Identity | undefined, sender: ProviderIdentity): Promise<Notification[]> {
    // For testing/display purposes
    console.log('fetchAppNotifications hit');

    console.log('payload', payload);
    console.log('sender', sender);

    // Only the notification center is allowed to get other apps' notifications
    if (payload === undefined || sender.uuid !== centerIdentity.uuid || sender.name !== centerIdentity.name) {
        payload = sender;
    }

    testDisplay('fetchAppNotifications', payload, sender);

    // Grab an app's notifications from indexeddb
    // Send those notifications to the requesting app.
    const result = await historyRepository.getByUuid(payload.uuid);

    if (result.success) {
        return result.value.map(storedNotification => storedNotification.notification);
    } else {
        throw new Error(result.errorMsg);
    }
}

/**
 * @function clearAllNotifications Clears all notifications in the database
 * @param {undefined} payload Not important
 * @param {SenderInfo} sender Not important
 */
async function clearAllNotifications(payload: undefined, sender: ProviderIdentity): Promise<boolean> {
    // Check and only allow this method to be called from the notifications centre
    if (sender.uuid !== centerIdentity.uuid || sender.name !== centerIdentity.name) {
        return false;
    }
    console.log('clearAllNotifications hit');

    console.log('payload', payload);
    console.log('sender', sender);

    testDisplay('clearAllNotifications', payload, sender);

    // Delete app notifications from indexeddb

    const result = await historyRepository.removeAll();

    if (result.success) {
        await sendCenterMessage('all-notifications-cleared', undefined);
        return true;
    } else {
        return false;
    }
}

async function clearAppNotifications(payload: Identity | undefined, sender: ProviderIdentity): Promise<number> {
    console.log('clearAppNotifications hit');

    console.log('payload', payload);
    console.log('sender', sender);

    // Only the notification center is allowed to clear other apps' notifications
    if (payload === undefined || sender.uuid !== centerIdentity.uuid || sender.name !== centerIdentity.name) {
        payload = sender;
    }

    testDisplay('clearAppNotifications', payload, sender);

    // Delete app notifications from indexeddb
    const result = await historyRepository.removeByUuid(payload.uuid);

    if (result.success) {
        // Delete the notifications/toasts in UI (TODO: NEED TO REGISTER
        // APP-NOTIFICATIONS-CLEARED IN UI)
        await sendCenterMessage('app-notifications-cleared', payload);
        return result.value;
    } else {
        throw new Error(result.errorMsg);
    }
}

/**
 * @function testDisplay Displays test html on the service
 * @param {string} action The action that was hit
 * @param {Notification} payload The notification payload
 * @param {SenderInfo} sender The sender info
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

/**
 * Generates a random string of digits to act as a notificationId
 *
 * TODO: Revisit this and decide what we want the actual generated
 * IDs to be.
 */
function generateId(): string {
    return Math.floor((Math.random()*9000000)+1).toString();
}
