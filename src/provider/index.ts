import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {ProviderIdentity} from 'openfin/_v2/api/interappbus/channel/channel';
import {Identity} from 'openfin/_v2/main';

import {APITopic, API, ClearPayload} from '../client/internal';
import {OptionButton, NotificationOptions, Notification} from '../client';

import {Injector} from './common/Injector';
import {Inject} from './common/Injectables';
import {APIHandler} from './model/APIHandler';
import {toggleCenterWindowVisibility} from './store/ui/actions';
import {getNotificationById, getNotificationsByApplication} from './store/notifications/selectors';
import {removeNotifications, createNotification as createNotificationAction} from './store/notifications/actions';
import {StoredNotification} from './model/StoredNotification';
import {StoreContainer} from './store';
import {NotificationCenter} from './controller/NotificationCenter';
import {ToastManager} from './controller/ToastManager';

@injectable()
export class Main {
    private _config = null;

    @inject(Inject.API_HANDLER)
    private _apiHandler!: APIHandler<APITopic>;

    @inject(Inject.STORE)
    private _store!: StoreContainer;

    @inject(Inject.NOTIFICATION_CENTER)
    private _notificationCenter!: NotificationCenter;

    @inject(Inject.TOAST_MANAGER)
    private _toastManager!: ToastManager;

    public async register(): Promise<void> {
        Object.assign(window, {
            main: this,
            config: this._config
        });

        // Wait for creation of any injected components that require async initialization
        await Injector.initialized;

        // Current API
        this._apiHandler.registerListeners<API>({
            [APITopic.CREATE_NOTIFICATION]: this.createNotification.bind(this),
            [APITopic.CLEAR_NOTIFICATION]: this.clearNotification.bind(this),
            [APITopic.GET_APP_NOTIFICATIONS]: this.fetchAppNotifications.bind(this),
            [APITopic.CLEAR_APP_NOTIFICATIONS]: this.clearAppNotifications.bind(this),
            [APITopic.TOGGLE_NOTIFICATION_CENTER]: this.toggleNotificationCenter.bind(this)
        });

        console.log('Service Initialised');
    }

    /**
     * createNotification Create the notification and dispatch it to the UI
     * @param payload The contents to be dispatched to the UI
     * @param sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
     */
    private async createNotification(payload: NotificationOptions, sender: ProviderIdentity): Promise<Notification> {
        const storedNotification = this.hydrateNotification(payload, sender);
        this._store.store.dispatch(createNotificationAction(storedNotification));
        return storedNotification.notification;
    }

    /**
     * Dispatch the notification center toggle action to the UI
     * @param payload Not used.
     * @param sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
     */
    private async toggleNotificationCenter(payload: undefined, sender: ProviderIdentity): Promise<void> {
        this._store.dispatch(toggleCenterWindowVisibility());
    }

    /**
     * Tell the UI to delete a specific notification
     * @param payload Should contain the id of the notification we want to delete. Maybe should just be a string
     * @param sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
     * @returns Whether or not the removal of the notifications was successful.
     */
    private async clearNotification(payload: ClearPayload, sender: ProviderIdentity): Promise<boolean> {
        const id = this.encodeID(payload.id, sender);
        const notification = getNotificationById(this._store.store.getState(), id);
        if (notification) {
            this._store.dispatch(removeNotifications(notification));
            return true;
        }
        return false;
    }

    /**
     * This allows you to fetch apps via your uuid
     * @param payload The payload can contain the uuid
     * @param sender The sender info contains the uuid of the sender
     */
    private async fetchAppNotifications(payload: Identity | undefined, sender: ProviderIdentity): Promise<Notification[]> {
        const storedNotifications = getNotificationsByApplication(payload || sender, this._store.store.getState());

        return storedNotifications.map(notification => notification.notification);
    }

    private async clearAppNotifications(payload: Identity | undefined, sender: ProviderIdentity): Promise<number> {
        const storedNotifications = getNotificationsByApplication(sender, this._store.getState());
        removeNotifications(...storedNotifications);

        return storedNotifications.length;
    }

    /**
     * Encodes the Id which currently is the uuid:id
     * @param id Id of the notification..
     * @param source The sender of the notification.
     */
    private encodeID(id: string, source: Identity): string {
        return `${source.uuid}:${id}`;
    }

    /**
     * Hydrate notification options to create a StoredNotificaiton.
     *
     * @param payload Notification options to hydrate.
     * @param sender The source of the notification.
     */
    private hydrateNotification(payload: NotificationOptions, sender: Identity): StoredNotification {
        const notification: Notification = {
            id: payload.id || this.generateId(),
            body: payload.body,
            title: payload.title,
            subtitle: payload.subtitle || '',
            icon: payload.icon || '',
            customData: payload.customData,
            date: payload.date || new Date(),
            buttons: payload.buttons || [] as OptionButton[]
        };

        const storedNotification: StoredNotification = {
            id: this.encodeID(notification.id, sender),
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
    private generateId(): string {
        return Math.floor((Math.random() * 9 + 1) * 1e8).toString();
    }
}

// Start service provider
Injector.getClass(Main).register();

