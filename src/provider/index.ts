import {ChannelProvider} from 'openfin/_v2/api/interappbus/channel/provider';
import {ProviderIdentity} from 'openfin/_v2/api/interappbus/channel/channel';
import {Identity} from 'openfin/_v2/main';

import {APITopic, API, ClearPayload} from '../client/internal';
import {OptionButton, NotificationEvent, NotificationOptions, Notification} from '../client';

import {RootState, configureStore, Store} from './store';
import {NotificationCenter} from './controller/NotificationCenter';
import {ToastManager} from './controller/ToastManager';
import {APIHandler} from './model/APIHandler';
import {toggleCenterWindowVisibility} from './store/ui/actions';
import {getNotificationById, getNotificationsByApplication} from './store/notifications/selectors';
import {removeNotifications, createNotification as createNotificationAction} from './store/notifications/actions';
import {StoredNotification} from './model/StoredNotification';

// Initial state is overwritten by the persisted data
const initialState: RootState = {
    notifications: {
        notifications: {}
    },
    ui: {
        windowVisible: false,
        toastDirection: [1, 1]
    }
};

const store = configureStore(initialState);
// Change to singleton?
const notificationCenter = new NotificationCenter(store, {hideOnBlur: false});
ToastManager.instance.initialize(store);

let providerChannel: ChannelProvider;

registerService();

/**
 * Registers the service and any functions that can be
 * consumed
 */
export async function registerService(): Promise<void> {
    // Register the service
    const apiHandler: APIHandler<APITopic> = new APIHandler();

    await apiHandler.registerListeners<API>({
        [APITopic.CREATE_NOTIFICATION]: createNotification,
        [APITopic.CLEAR_NOTIFICATION]: clearNotification,
        [APITopic.GET_APP_NOTIFICATIONS]: fetchAppNotifications,
        [APITopic.CLEAR_APP_NOTIFICATIONS]: clearAppNotifications,
        [APITopic.TOGGLE_NOTIFICATION_CENTER]: toggleNotificationCenter
    });

    providerChannel = apiHandler.channel; // Temporary while I clean out all of the other references to this

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
    store.dispatch(createNotificationAction(storedNotification));

    return storedNotification.notification;
}

/**
 * Dispatch the notification center toggle action to the UI
 * @param payload Not used.
 * @param sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
 */
async function toggleNotificationCenter(payload: undefined, sender: ProviderIdentity): Promise<void> {
    store.dispatch(toggleCenterWindowVisibility());
}

/**
 * Tell the UI to delete a specific notification
 * @param payload Should contain the id of the notification we want to delete. Maybe should just be a string
 * @param sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
 * @returns Whether or not the removal of the notifications was successful.
 */
async function clearNotification(payload: ClearPayload, sender: ProviderIdentity): Promise<boolean> {
    const id = encodeID(payload.id, sender);
    const notification = getNotificationById(store.getState(), id);
    if (notification) {
        store.dispatch(removeNotifications(notification));
        return true;
    }
    return false;
}

/**
 * This allows you to fetch apps via your uuid
 * @param payload The payload can contain the uuid
 * @param sender The sender info contains the uuid of the sender
 */
async function fetchAppNotifications(payload: Identity | undefined, sender: ProviderIdentity): Promise<Notification[]> {
    const storedNotifications = getNotificationsByApplication(payload || sender, store.getState());

    return storedNotifications.map(notification => notification.notification);
}

async function clearAppNotifications(payload: Identity | undefined, sender: ProviderIdentity): Promise<number> {
    const storedNotifications = getNotificationsByApplication(sender, store.getState());
    removeNotifications(...storedNotifications);

    return storedNotifications.length;
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
    return Math.floor((Math.random() * 9 + 1) * 1e8).toString();
}
