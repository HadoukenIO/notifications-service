"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../shared/config");
const NotificationTypes_1 = require("../shared/Models/NotificationTypes");
const RepositoryEnum_1 = require("./Persistence/DataLayer/Repositories/RepositoryEnum");
const RepositoryFactory_1 = require("./Persistence/DataLayer/Repositories/RepositoryFactory");
const repositoryFactory = RepositoryFactory_1.RepositoryFactory.Instance;
const historyRepository = repositoryFactory.getRepository(RepositoryEnum_1.Repositories.history);
const settingsRepository = repositoryFactory.getRepository(RepositoryEnum_1.Repositories.settings);
let providerChannel;
let serviceUUID;
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
    const notificationCenter = new fin.desktop.Window(winConfig, () => {
        console.log('Notification Center created');
    }, (error) => {
        console.log('Error creating Notification Center:', error);
    });
});
/**
 * @method registerService Registers the service and any functions that can be
 * consumed
 */
async function registerService() {
    // Register the service
    const serviceId = fin.desktop.Application.getCurrent().uuid;
    providerChannel = await fin.InterApplicationBus.Channel.create(config_1.CHANNEL_NAME);
    centerIdentity.uuid = serviceUUID = serviceId;
    // handle client connections
    providerChannel.onConnection((app, payload) => {
        if (payload && payload.version && payload.version.length > 0) {
            console.log(`connection from client: ${app.name}, version: ${payload.version}`);
        }
        else {
            console.log(`connection from client: ${app.name}, unable to determine version`);
        }
    });
    // Functions called by the client
    providerChannel.register('create-notification', createNotification);
    providerChannel.register('toggle-notification-center', toggleNotificationCenter);
    // Functions called either by the client or the Notification Center
    providerChannel.register('clear-notification', clearNotification);
    providerChannel.register('fetch-app-notifications', fetchAppNotifications);
    providerChannel.register('clear-app-notifications', clearAppNotifications);
    // Functions called by the Notification Center
    providerChannel.register('notification-clicked', notificationClicked);
    providerChannel.register('notification-button-clicked', notificationButtonClicked);
    providerChannel.register('notification-closed', notificationClosed);
    providerChannel.register('fetch-all-notifications', fetchAllNotifications);
    providerChannel.register('clear-all-notifications', clearAllNotifications);
}
// Send notification created to the UI
const dispatchNotificationCreated = async (payload) => {
    const providerChannelPlugin = await providerChannel;
    const success = await providerChannelPlugin.dispatch(centerIdentity, 'notification-created', payload);
    console.log('success', success);
};
// Send notification cleared to the UI
const dispatchNotificationCleared = async (payload) => {
    const providerChannelPlugin = await providerChannel;
    const success = await providerChannelPlugin.dispatch(centerIdentity, 'notification-cleared', payload);
    console.log('success', success);
};
// Send app notifications cleared to the UI
const dispatchAppNotificationsCleared = async (payload) => {
    const providerChannelPlugin = await providerChannel;
    const success = await providerChannelPlugin.dispatch(centerIdentity, 'app-notifications-cleared', payload);
    console.log('success', success);
};
// Send notification clicked to the Client
const dispatchNotificationClicked = async (payload) => {
    const providerChannelPlugin = await providerChannel;
    const clientIdentity = { name: payload.name, uuid: payload.uuid, channelId: '', channelName: '' };
    const success = await providerChannelPlugin.dispatch(clientIdentity, 'notification-clicked', payload);
    console.log('success', success);
};
// Send notification clicked to the Client
const dispatchNotificationButtonClicked = async (payload) => {
    const providerChannelPlugin = await providerChannel;
    const clientIdentity = { name: payload.name, uuid: payload.uuid, channelId: '', channelName: '' };
    const success = await providerChannelPlugin.dispatch(clientIdentity, 'notification-button-clicked', payload);
    console.log('success', success);
};
// Send notification closed to the Client
const dispatchNotificationClosed = async (payload) => {
    const providerChannelPlugin = await providerChannel;
    const clientIdentity = { name: payload.name, uuid: payload.uuid, channelId: '', channelName: '' };
    const success = await providerChannelPlugin.dispatch(clientIdentity, 'notification-closed', payload);
    console.log('success', success);
};
const dispatchAllNotificationsCleared = async (payload) => {
    const providerChannelPlugin = await providerChannel;
    const success = await providerChannelPlugin.dispatch(centerIdentity, 'all-notifications-cleared', payload);
    console.log('success', success);
};
const dispatchToggleNotificationCenter = async (payload) => {
    const providerChannelPlugin = await providerChannel;
    const success = await providerChannelPlugin.dispatch(centerIdentity, 'toggle-notification-center', payload);
    console.log('success', success);
};
/**
 * Encodes the Id which currently is the uuid:id
 * @param payload The notification object
 */
function encodeID(payload) {
    return `${payload.uuid}:${payload.id}`;
}
/**
 * @method decodeID This function retrieves the notification Id
 * @param payload The notification object
 */
function decodeID(payload) {
    return payload.id.slice(payload.uuid.length + 1);
}
/**
 * @method createNotification Create the notification and dispatch it to the UI
 * @param {object} payload The contents to be dispatched to the UI
 * @param {object} sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
 */
async function createNotification(payload, sender) {
    // For testing/display purposes
    console.log('createNotification hit');
    console.log('payload', payload);
    console.log('sender', sender);
    testDisplay('createNotification', payload, sender);
    const noteType = NotificationTypes_1.TypeResolver(payload);
    const fullPayload = Object.assign({}, payload, sender, { type: noteType });
    const encodedID = encodeID(fullPayload);
    const fullPayloadEncoded = Object.assign({}, fullPayload, { id: encodedID });
    // Manipulate notification data store
    const result = await historyRepository.create(fullPayloadEncoded);
    // Create the notification/toast in the UI
    if (result.success) {
        dispatchNotificationCreated(fullPayload);
    }
    // Return a notification event with the notification context/id to the client
    // that created the notification Or return the payload?
    return result;
}
/**
 * @method toggleNotificationCenter Dispatch the notification center toggle action to the UI
 * @param {object} sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
 */
async function toggleNotificationCenter(payload, sender) {
    // For testing/display purposes
    console.log('toggleNotificationCenter hit');
    console.log('payload', payload);
    console.log('sender', sender);
    // Toggle the notification center
    dispatchToggleNotificationCenter(undefined);
    return '';
}
/**
 * @method clearNotification Tell the UI to delete a specific notification
 * @param {object} payload Should contain the id of the notification we want to delete. Maybe should just be a string
 * @param {object} sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
 * @returns {ReturnResult} Whether or not the removal of the notifications was successful.
 */
async function clearNotification(payload, sender) {
    // For testing/display purposes
    console.log('clearNotification hit');
    console.log('payload', payload);
    console.log('sender', sender);
    testDisplay('clearNotification', payload, sender);
    // Grab notificationID from payload. If not present, return error?
    if (!payload.id) {
        return 'ERROR: Must supply a notification ID to clear!';
    }
    const fullPayload = Object.assign({}, payload, sender);
    const encodedID = encodeID(fullPayload);
    // Delete notification from indexeddb
    const result = await historyRepository.remove(encodedID);
    // Delete the notification/toast in UI
    if (result.success) {
        dispatchNotificationCleared(fullPayload);
    }
    return result;
}
/**
 * @method notificationClicked Tell the Client that a notification was clicked
 * @param {object} payload Should contain the id of the notification clicked. Also the uuid and name of the original Client window.
 * @param {object} sender UI Window info. Not important.
 */
function notificationClicked(payload, sender) {
    // For testing/display purposes
    console.log('notificationClicked hit');
    console.log('payload', payload);
    console.log('sender', sender);
    testDisplay('notificationClicked', payload, sender);
    // Send notification clicked event to uuid with the context.
    dispatchNotificationClicked(payload);
    // TODO: What should we return?
    return 'notificationClicked returned';
}
function notificationButtonClicked(payload, sender) {
    // For testing/display purposes
    console.log('notificationButtonClicked hit');
    console.log('payload', payload);
    console.log('sender', sender);
    testDisplay('notificationButtonClicked', payload, sender);
    // Send notification clicked event to uuid with the context.
    dispatchNotificationButtonClicked(payload);
    // TODO: What should we return?
    return 'notificationButtonClicked returned';
}
/**
 * @method notificationClosed Tell the Client that a notification was closed,
 * and delete it from indexeddb
 * @param {object} payload Should contain the id of the notification clicked. Also the uuid and name of the original Client window.
 * @param {object} sender UI Window info. Not important.
 */
async function notificationClosed(payload, sender) {
    // For testing/display purposes
    console.log('notificationClosed hit');
    console.log('payload', payload);
    console.log('sender', sender);
    testDisplay('notificationClosed', payload, sender);
    const encodedID = encodeID(payload);
    // Delete notification from indexeddb
    const result = await historyRepository.remove(encodedID);
    // Send notification closed event to uuid with the context.
    if (result.success) {
        dispatchNotificationCleared(payload);
        dispatchNotificationClosed(payload);
    }
    // TODO: What should we return?
    return result;
}
/**
 * @method fetchAllNotifications Grab all notifications from the Service and
 * return it to the UI.
 * @param {object} payload Not important
 * @param {object} sender Not important.
 */
async function fetchAllNotifications(payload, sender) {
    // For testing/display purposes
    console.log('fetchAllNotifications hit');
    console.log('payload', payload);
    console.log('sender', sender);
    testDisplay('fetchAllNotifications', payload, sender);
    // Grab all notifications from indexeddb.
    const result = await historyRepository.getAll();
    if (result.success) {
        const allNotifications = result.value;
        allNotifications.forEach((notification) => {
            notification.id = decodeID(notification);
        });
        return allNotifications;
    }
    return [];
}
/**
 * @method fetchAppNotifications This allows you to fetch apps via your uuid
 * @param {undefined} payload The payload can contain the uuid
 * @param {ISenderInfo} sender The sender info contains the uuid of the sender
 */
async function fetchAppNotifications(payload, sender) {
    // For testing/display purposes
    console.log('fetchAppNotifications hit');
    console.log('payload', payload);
    console.log('sender', sender);
    testDisplay('fetchAppNotifications', payload, sender);
    // If no uuid supplied in the payload, set to the sender's uuid. This is so
    // you can request another app's notification (such as for the Notification
    // Center)
    if (!payload.uuid) {
        payload.uuid = sender.uuid;
    }
    // Grab an app's notifications from indexeddb
    // Send those notifications to the requesting app.
    const result = await historyRepository.getByUuid(payload.uuid);
    if (result.success) {
        const appNotifications = result.value;
        appNotifications.forEach((notification) => {
            console.log('notification', notification);
            notification.id = decodeID(notification);
        });
        result.value = appNotifications;
    }
    return result;
}
/**
 * @method clearAllNotifications Clears all notifications in the database
 * @param {undefined} payload Not important
 * @param {ISenderInfo} sender Not important
 */
async function clearAllNotifications(payload, sender) {
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
function clearAppNotifications(payload, sender) {
    console.log('clearAppNotifications hit');
    console.log('payload', payload);
    console.log('sender', sender);
    testDisplay('clearAppNotifications', payload, sender);
    // Delete app notifications from indexeddb
    historyRepository.removeByUuid(payload.uuid);
    // Delete the notifications/toasts in UI (TODO: NEED TO REGISTER
    // APP-NOTIFICATIONS-CLEARED IN UI)
    dispatchAppNotificationsCleared(payload);
    // TODO: What should we return?
    return 'clearAppNotifications returned';
}
/**
 * @method testDisplay Displays test html on the service
 * @param {string} action The action that was hit
 * @param {Notification} payload The notification payload
 * @param {ISenderInfo} sender The sender info
 */
function testDisplay(action, payload, sender) {
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
//# sourceMappingURL=index.js.map