import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {ProviderIdentity} from 'openfin/_v2/api/interappbus/channel/channel';
import {Identity} from 'openfin/_v2/main';

import {APITopic, API, ClearPayload} from '../client/internal';
import {NotificationOptions, Notification, NotificationClosedEvent, NotificationButtonClickedEvent, NotificationClickedEvent, NotificationEvent} from '../client';

import {Injector} from './common/Injector';
import {Inject} from './common/Injectables';
import {NotificationCenter} from './controller/NotificationCenter';
import {ToastManager} from './controller/ToastManager';
import {APIHandler} from './model/APIHandler';
import {StoredNotification} from './model/StoredNotification';
import {EventInterestMap} from './model/EventInterestMap';
import {Action, RootAction} from './store/Actions';
import {mutable, Immutable} from './store/State';
import {Store} from './store/Store';
import {notificationStorage, settingsStorage, clientInfoStorage} from './model/Storage';
import { DeferredEvent } from './model/DeferredEvent';
import { ApplicationOption } from 'openfin/_v2/api/application/applicationOption';

interface AppInitData {
    type: 'programmatic' | 'manifest';
    data: ApplicationOption | string;
}

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

    private interestMap: EventInterestMap = new EventInterestMap;

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
            [APITopic.TOGGLE_NOTIFICATION_CENTER]: this.toggleNotificationCenter.bind(this),
            [APITopic.REGISTER_CLIENT]: this.registerClient.bind(this),
            [APITopic.UNREGISTER_CLIENT]: this.unregisterClient.bind(this)
        });

        this._store.onAction.add((action: RootAction) => {
            let client: Identity | undefined;

            if (action.type === Action.CLICK_BUTTON || action.type === Action.CLICK_NOTIFICATION) {
                client = action.notification.source;
            } else if (action.type === Action.REMOVE && action.notifications.length > 0) {
                client = action.notifications[0].source;
            } else if (action.type === Action.DISPATCH_DEFERRED_EVENTS) {
                client = action.target;
            }

            if (client !== undefined) {
                const connected: boolean = this._apiHandler.isAppConnected(client!.uuid);
                const deferDispatchOrIgnore = (target: Identity, event: NotificationEvent): void => {
                    if (this.interestMap.has(event.type, target)) {
                        if (connected) {
                            this._apiHandler.dispatchAppEvent(target.uuid, event)
                        } else {
                            this._store.dispatch({type: Action.DEFER_EVENT_DISPATCH, target, event});
                            clientInfoStorage.getItem(target.uuid).then(item => {
                                if (item) {
                                    const data = item as AppInitData;
                                    data.type === 'programmatic' ? fin.Application.start(data.data as ApplicationOption) : fin.Application.startFromManifest(data.data as string);
                                }
                            });
                        }
                    }
                }
                if (action.type === Action.REMOVE) {
                    action.notifications.forEach((notification: StoredNotification) => {
                        const target: Identity = notification.source;
                        const event: NotificationClosedEvent = {type: 'notification-closed', notification: notification.notification};
                        deferDispatchOrIgnore(target, event);
                    });
                } else if (action.type === Action.CLICK_BUTTON) {
                    const {notification, buttonIndex} = action;
                    const target: Identity = notification.source;
                    const event: NotificationButtonClickedEvent = {
                        type: 'notification-button-clicked',
                        notification: notification.notification,
                        buttonIndex
                    };
                    deferDispatchOrIgnore(target, event);
                } else if (action.type === Action.CLICK_NOTIFICATION) {
                    const {notification, source} = action.notification;
                    const event: NotificationClickedEvent = {type: 'notification-clicked', notification};
                    // Send notification clicked event to uuid with the context.
                    deferDispatchOrIgnore(source, event);
                } else if (action.type === Action.DISPATCH_DEFERRED_EVENTS && connected) {
                    action.events.forEach((event: DeferredEvent) => {
                        this._apiHandler.dispatchAppEvent(event.target.uuid, event.event);
                    });
                }
            }
        });
    }

    /**
     * createNotification Create the notification and dispatch it to the UI
     * @param payload The contents to be dispatched to the UI
     * @param sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
     */
    private async createNotification(payload: NotificationOptions, sender: ProviderIdentity): Promise<Notification> {
        // Explicity create the identity object to avoid storing other unneeded info from ProviderIdentity
        const notification = this.hydrateNotification(payload, {uuid: sender.uuid, name: sender.name});
        this._store.dispatch({type: Action.CREATE, notification});
        return notification.notification;
    }

    private async registerClient(payload: string, sender: ProviderIdentity): Promise<void> {
        const events: DeferredEvent[] = mutable(this._store.state.deferredEvents.filter(action => action.target.uuid === sender.uuid && action.event.type === payload));
        if (events.length > 0) {
            this._store.dispatch({type: Action.DISPATCH_DEFERRED_EVENTS, target: sender, eventType: payload, events});
        }
        this.interestMap.add(payload, sender);
    }

    private async unregisterClient(payload: string, sender: ProviderIdentity): Promise<void> {
        this.interestMap.remove(payload, sender);
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
    private fetchAppNotifications(payload: undefined, sender: ProviderIdentity): Notification[] {
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
    private hydrateNotification(payload: NotificationOptions, sender: Identity): StoredNotification {
        if (!payload.body) {
            throw new Error('Invalid arguments passed to createNotification. "body" must have a value');
        }
        if (!payload.title) {
            throw new Error('Invalid arguments passed to createNotification. "title" must have a value');
        }

        const notification: Notification = {
            id: payload.id || this.generateId(),
            body: payload.body,
            title: payload.title,
            subtitle: payload.subtitle || '',
            icon: payload.icon || '',
            customData: payload.customData,
            date: payload.date || new Date(),
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
