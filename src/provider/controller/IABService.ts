import {ProviderIdentity} from 'openfin/_v2/api/interappbus/channel/channel';
import {ChannelProvider} from 'openfin/_v2/api/interappbus/channel/provider';
import {Identity} from 'openfin/_v2/main';
import {Store} from 'redux';

import {NotificationOptions, Notification, OptionButton, NotificationClickedEvent, NotificationButtonClickedEvent, NotificationClosedEvent, NotificationEvent} from '../../client';
import {APITopic, ClearPayload} from '../../client/internal';
import {APIExtension, APITopicExtension} from '../model/APIExtension';
import {APIHandler} from '../model/APIHandler';
import {StoredNotification} from '../model/StoredNotification';
import rootAction from '../store/root-action';
import {toggleCenterWindowVisibility} from '../store/ui/actions';
import {removeNotifications} from '../store/notifications/actions';
import {getNotificationsByApplication, getNotificationById} from '../store/notifications/selectors';

let providerStore: Store;
let providerChannel: ChannelProvider;

/**
 * @function registerService Registers the service and any functions that can be
 * consumed
 * @param store Store dispatch function.
 */
export async function registerService(store: Store) {
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
        [APITopicExtension.NOTIFICATION_CLOSED]: notificationClosed
    });

    providerChannel = apiHandler.channel; // Temporary while I clean out all of the other references to this
    providerStore = store; // Temporary, should be handled like the providerChannel

    // handle client connections
    providerChannel.onConnection((app, payload) => {
        if (payload && payload.version && payload.version.length > 0) {
            console.log(`connection from client: ${app.name}, version: ${payload.version}`);
        } else {
            console.log(`connection from client: ${app.name}, unable to determine version`);
        }
    });
}

export async function dispatchClientEvent(target: Identity, payload: NotificationEvent): Promise<void> {
    return providerChannel.dispatch(target, 'event', payload);
}

/**
 * @function createNotification Create the notification and dispatch it to the UI
 * @param payload The contents to be dispatched to the UI
 * @param sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
 */
async function createNotification(payload: NotificationOptions, sender: ProviderIdentity): Promise<Notification> {
    const storedNotification = hydrateNotification(payload, sender);
    providerStore.dispatch(rootAction.notificationsActions.createNotification(storedNotification));

    return storedNotification.notification;
}

/**
 * @function toggleNotificationCenter Dispatch the notification center toggle action to the UI
 * @param payload Not used.
 * @param sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
 */
async function toggleNotificationCenter(payload: undefined, sender: ProviderIdentity): Promise<void> {
    providerStore.dispatch(toggleCenterWindowVisibility());
}

/**
 * @function clearNotification Tell the UI to delete a specific notification
 * @param payload Should contain the id of the notification we want to delete. Maybe should just be a string
 * @param sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
 * @returns Whether or not the removal of the notifications was successful.
 */
async function clearNotification(payload: ClearPayload, sender: ProviderIdentity): Promise<boolean> {
    const id = encodeID(payload.id, sender);
    const notification = getNotificationById(providerStore.getState(), id);
    if (notification) {
        providerStore.dispatch(removeNotifications(notification));
        return true;
    }
    return false;
}

/**
 * @function fetchAppNotifications This allows you to fetch apps via your uuid
 * @param payload The payload can contain the uuid
 * @param sender The sender info contains the uuid of the sender
 */
async function fetchAppNotifications(payload: Identity | undefined, sender: ProviderIdentity): Promise<Notification[]> {
    const storedNotifications = getNotificationsByApplication(payload || sender, providerStore.getState());

    return storedNotifications.map(x => x.notification);
}

async function clearAppNotifications(payload: Identity | undefined, sender: ProviderIdentity): Promise<number> {
    const storedNotifications = getNotificationsByApplication(sender, providerStore.getState());
    removeNotifications(...storedNotifications);

    return storedNotifications.length;
}

/**
 * @function notificationClicked Tell the Client that a notification was clicked
 * @param storedNotification Should contain the id of the notification clicked. Also the uuid and name of the original Client window.
 */
export async function notificationClicked(storedNotification: StoredNotification): Promise<void> {
    // For testing/display purposes
    console.groupCollapsed('notificationClicked hit');
    console.log('payload', storedNotification);
    console.groupEnd();

    const event: NotificationClickedEvent = {type: 'notification-clicked', notification: storedNotification.notification};
    // Send notification clicked event to uuid with the context.
    dispatchClientEvent(storedNotification.source, event);
}

export async function notificationButtonClicked(payload: StoredNotification & {buttonIndex: number}): Promise<void> {
    const target: Identity = payload.source;
    const event: NotificationButtonClickedEvent = {type: 'notification-button-clicked', notification: payload.notification, buttonIndex: payload.buttonIndex};

    dispatchClientEvent(target, event);
}

/**
 * @function notificationClosed Tell the Client that a notification was closed,
 * and delete it from indexeddb
 * @param storedNotification Should contain the id of the notification clicked. Also the uuid and name of the original Client window.
 */
export async function notificationClosed(storedNotification: StoredNotification): Promise<void> {
    // Send notification closed event to uuid with the context.
    const target: Identity = storedNotification.source;
    const event: NotificationClosedEvent = {type: 'notification-closed', notification: storedNotification.notification};

    dispatchClientEvent(target, event);
}

/**
 * Encodes the Id which currently is the uuid:id
 * @param id Id of the notification..
 * @param source The sender of the notification.
 */
function encodeID(id: string, source: Identity): string {
    return `${source.uuid}:${id}`;
}

/**
 * Hydrate notification options to create a StoredNotificaiton.
 *
 * @param payload Notification options to hydrate.
 * @param sender The source of the notification.
 */
function hydrateNotification(payload: NotificationOptions, sender: Identity): StoredNotification {
    const notification: Notification = {
        id: payload.id || generateId(),
        body: payload.body,
        title: payload.title,
        subtitle: payload.subtitle || '',
        icon: payload.icon || '',
        customData: payload.customData,
        date: payload.date || new Date(),
        buttons: payload.buttons || [] as OptionButton[]
    };

    const storedNotification: StoredNotification = {
        id: encodeID(notification.id, sender),
        notification,
        source: sender
    };

    return storedNotification;
}

/**
 * Generates a random string of digits to act as a notificationId
 *
 * TODO: Revisit this and decide what we want the actual generated
 * IDs to be.
 */
export function generateId(): string {
    return Math.floor((Math.random() * 9000000) + 1).toString();
}
