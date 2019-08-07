import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {ProviderIdentity} from 'openfin/_v2/api/interappbus/channel/channel';
import {Identity} from 'openfin/_v2/main';
import moment from 'moment';

import {APITopic, API, ClearPayload, CreatePayload, NotificationInternal} from '../client/internal';
import {NotificationClosedEvent, NotificationButtonClickedEvent, NotificationClickedEvent} from '../client';
import {EventPayload} from '../client/connection';

import {Injector} from './common/Injector';
import {Inject} from './common/Injectables';
import {NotificationCenter} from './controller/NotificationCenter';
import {ToastManager} from './controller/ToastManager';
import {APIHandler} from './model/APIHandler';
import {StoredNotification} from './model/StoredNotification';
import {Action, RootAction} from './store/Actions';
import {mutable, Immutable} from './store/State';
import {Store} from './store/Store';
import {notificationStorage, settingsStorage} from './model/Storage';

@injectable()
export class Main {
    private _config = null;

    @inject(Inject.API_HANDLER)
    private _apiHandler!: APIHandler<APITopic>;

    @inject(Inject.STORE)
    private _store!: Store;

    @inject(Inject.NOTIFICATION_CENTER)
    private _notificationCenter!: NotificationCenter;

    @inject(Inject.TOAST_MANAGER)
    private _toastManager!: ToastManager;

    public async register(): Promise<void> {
        Object.assign(window, {
            main: this,
            config: this._config,
            store: this._store,
            center: this._notificationCenter,
            toast: this._toastManager,
            // Include the two localforage instances for debugging/integration testing
            notificationStorage,
            settingsStorage
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

        this._store.onAction.add((action: RootAction) => {
            if (action.type === Action.REMOVE) {
                // Send notification closed event to uuid with the context.
                action.notifications.forEach((notification: StoredNotification) => {
                    const target: Identity = notification.source;
                    const event: EventPayload<NotificationClosedEvent> = {type: 'notification-closed', notification: notification.notification};

                    this._apiHandler.dispatchClientEvent(target, event);
                });
            } else if (action.type === Action.CLICK_BUTTON) {
                const {notification, buttonIndex} = action;
                const target: Identity = notification.source;
                const event: EventPayload<NotificationButtonClickedEvent> = {
                    type: 'notification-button-clicked',
                    notification: notification.notification,
                    buttonIndex
                };
                this._apiHandler.dispatchClientEvent(target, event);
            } else if (action.type === Action.CLICK_NOTIFICATION) {
                const {notification, source} = action.notification;
                const event: EventPayload<NotificationClickedEvent> = {type: 'notification-clicked', notification};

                // Send notification clicked event to uuid with the context.
                this._apiHandler.dispatchClientEvent(source, event);
            }
        });

        console.log('Service Initialised');
    }

    /**
     * createNotification Create the notification and dispatch it to the UI
     * @param payload The contents to be dispatched to the UI
     * @param sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
     */
    private async createNotification(payload: CreatePayload, sender: ProviderIdentity): Promise<NotificationInternal> {
        // Explicity create the identity object to avoid storing other unneeded info from ProviderIdentity
        const notification = this.hydrateNotification(payload, {uuid: sender.uuid, name: sender.name});
        this._store.dispatch({type: Action.CREATE, notification});
        return notification.notification;
    }

    /**
     * Dispatch the notification center toggle action to the UI
     * @param payload Not used.
     * @param sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
     */
    private async toggleNotificationCenter(payload: undefined, sender: ProviderIdentity): Promise<void> {
        this._store.dispatch({type: Action.TOGGLE_VISIBILITY});
    }

    /**
     * Tell the UI to delete a specific notification
     * @param payload Should contain the id of the notification we want to delete. Maybe should just be a string
     * @param sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
     * @returns Whether or not the removal of the notifications was successful.
     */
    private async clearNotification(payload: ClearPayload, sender: ProviderIdentity): Promise<boolean> {
        const id = this.encodeID(payload.id, sender);
        const notification = this._store.state.notifications.find(n => n.id === id);
        if (notification) {
            this._store.dispatch({type: Action.REMOVE, notifications: [mutable(notification)]});
            return true;
        }
        return false;
    }

    /**
     * This allows you to fetch apps via your uuid
     * @param payload The payload can contain the uuid
     * @param sender The sender info contains the uuid of the sender
     */
    private fetchAppNotifications(payload: undefined, sender: ProviderIdentity): NotificationInternal[] {
        const notifications = this.getAppNotifications(sender.uuid);

        return notifications.map(notification => mutable(notification.notification));
    }

    private clearAppNotifications(payload: undefined, sender: ProviderIdentity): number {
        const notifications = mutable(this.getAppNotifications(sender.uuid));
        this._store.dispatch({type: Action.REMOVE, notifications});

        return notifications.length;
    }

    private getAppNotifications(uuid: string): Immutable<StoredNotification>[] {
        const notifications = this._store.state.notifications;
        return notifications.filter(n => n.source.uuid === uuid);
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
     * Hydrate notification options to create a StoredNotification.
     *
     * @param payload Notification options to hydrate.
     * @param sender The source of the notification.
     */
    private hydrateNotification(payload: CreatePayload, sender: Identity): StoredNotification {
        const problems: string[] = [];

        if (payload.id !== undefined && typeof payload.id !== 'string') {
            problems.push('"id" must be a string or undefined');
        }

        if (typeof payload.body === 'undefined') {
            problems.push('"body" must have a value');
        } else if (typeof payload.body !== 'string') {
            problems.push('"body" must be a string');
        }

        if (typeof payload.title === 'undefined') {
            problems.push('"title" must have a value');
        } else if (typeof payload.title !== 'string') {
            problems.push('"title" must be a string');
        }

        if (payload.subtitle !== undefined && typeof payload.subtitle !== 'string') {
            problems.push('"subtitle" must be a string or undefined');
        }

        if (payload.icon !== undefined && typeof payload.icon !== 'string') {
            problems.push('"icon" must be a string or undefined');
        }

        const parsedDate = moment(payload.date);
        if (payload.date !== undefined && !parsedDate.isValid()) {
            problems.push('"date" must be a valid Date object');
        }

        if (payload.buttons !== undefined && !Array.isArray(payload.buttons)) {
            problems.push('"buttons" must be an array or undefined');
        }

        if (problems.length === 1) {
            throw new Error(`Invalid arguments passed to create: ${problems[0]}`);
        } else if (problems.length > 1) {
            throw new Error(`Invalid arguments passed to create:\n - ${problems.join('\n - ')}`);
        }

        const notification: NotificationInternal = {
            id: payload.id || this.generateId(),
            body: payload.body,
            title: payload.title,
            subtitle: payload.subtitle || '',
            icon: payload.icon || '',
            customData: payload.customData,
            date: payload.date || Date.now(),
            buttons: payload.buttons ? payload.buttons.map(btn => ({...btn, iconUrl: btn.iconUrl || ''})) : []
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

// Register the offline-mode service worker.
navigator.serviceWorker.register('./sw.js', {scope: './'});
