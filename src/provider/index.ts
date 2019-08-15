import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {ProviderIdentity} from 'openfin/_v2/api/interappbus/channel/channel';
import {Identity} from 'openfin/_v2/main';
import moment from 'moment';

import {APITopic, API, ClearPayload, CreatePayload, NotificationInternal, Events} from '../client/internal';
import {NotificationClosedEvent, NotificationActionEvent, NotificationCreatedEvent} from '../client';
import {ButtonOptions} from '../client/controls';
import {Transport, Targeted} from '../client/EventRouter';
import {ActionTrigger} from '../client/actions';

import {Injector} from './common/Injector';
import {Inject} from './common/Injectables';
import {NotificationCenter} from './controller/NotificationCenter';
import {ToastManager} from './controller/ToastManager';
import {APIHandler} from './model/APIHandler';
import {StoredNotification} from './model/StoredNotification';
import {Action, RootAction, CreateNotification, RemoveNotifications, ToggleVisibility} from './store/Actions';
import {mutable} from './store/State';
import {Store} from './store/Store';
import {Database} from './model/database/Database';

@injectable()
export class Main {
    private _config = null;

    @inject(Inject.API_HANDLER)
    private _apiHandler!: APIHandler<APITopic, Events>;

    @inject(Inject.STORE)
    private _store!: Store;

    @inject(Inject.NOTIFICATION_CENTER)
    private _notificationCenter!: NotificationCenter;

    @inject(Inject.TOAST_MANAGER)
    private _toastManager!: ToastManager;

    @inject(Inject.DATABASE)
    private _database!: Database;

    public async register(): Promise<void> {
        Object.assign(window, {
            main: this,
            config: this._config,
            store: this._store,
            center: this._notificationCenter,
            toast: this._toastManager,
            database: this._database
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

        this._store.onAction.add(async (action: RootAction): Promise<void> => {
            if (action.type === Action.CREATE) {
                const {notification, source} = action.notification;
                const event: Targeted<Transport<NotificationCreatedEvent>> = {
                    target: 'default',
                    type: 'notification-created',
                    notification: mutable(notification)
                };
                this._apiHandler.dispatchEvent<NotificationCreatedEvent>(source, event);
            } else if (action.type === Action.REMOVE) {
                const {notifications} = action;
                notifications.forEach((storedNotification: StoredNotification) => {
                    const {notification, source} = storedNotification;
                    const event: Targeted<Transport<NotificationClosedEvent>> = {
                        target: 'default',
                        type: 'notification-closed',
                        notification: mutable(notification)
                    };
                    this._apiHandler.dispatchEvent<NotificationClosedEvent>(source, event);
                });
            } else if (action.type === Action.CLICK_BUTTON) {
                const {notification, source} = action.notification;
                const button: ButtonOptions = notification.buttons[action.buttonIndex];

                if (button && button.onClick !== undefined) {
                    const event: Targeted<Transport<NotificationActionEvent>> = {
                        target: 'default',
                        type: 'notification-action',
                        trigger: ActionTrigger.CONTROL,
                        notification: mutable(notification),
                        controlSource: 'buttons',
                        controlIndex: action.buttonIndex,
                        result: button.onClick
                    };
                    this._apiHandler.dispatchEvent(source, event);
                }
            } else if (action.type === Action.CLICK_NOTIFICATION) {
                const {notification, source} = action.notification;

                if (notification.onSelect) {
                    const event: Targeted<Transport<NotificationActionEvent>> = {
                        target: 'default',
                        type: 'notification-action',
                        trigger: ActionTrigger.SELECT,
                        notification: mutable(notification),
                        result: notification.onSelect
                    };
                    this._apiHandler.dispatchEvent(source, event);
                }
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
        // Explicitly create the identity object to avoid storing other unneeded info from ProviderIdentity
        const notification = this.hydrateNotification(payload, {uuid: sender.uuid, name: sender.name});
        this._store.dispatch(new CreateNotification(notification));
        return mutable(notification.notification);
    }

    /**
     * Dispatch the Notification Center toggle action to the UI
     * @param payload Not used.
     * @param sender Window info for the sending client. This can be found in the relevant app.json within the demo folder.
     */
    private async toggleNotificationCenter(payload: undefined, sender: ProviderIdentity): Promise<void> {
        this._store.dispatch(new ToggleVisibility());
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
            this._store.dispatch(new RemoveNotifications([notification]));
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

    private async clearAppNotifications(payload: undefined, sender: ProviderIdentity): Promise<number> {
        const notifications = this.getAppNotifications(sender.uuid);
        await this._store.dispatch(new RemoveNotifications(notifications));

        return notifications.length;
    }

    private getAppNotifications(uuid: string): StoredNotification[] {
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

        if (typeof payload.title === 'undefined') {
            problems.push('"title" must have a value');
        } else if (typeof payload.title !== 'string') {
            problems.push('"title" must be a string');
        }

        if (typeof payload.body === 'undefined') {
            problems.push('"body" must have a value');
        } else if (typeof payload.body !== 'string') {
            problems.push('"body" must be a string');
        }

        if (typeof payload.category === 'undefined') {
            problems.push('"category" must have a value');
        } else if (typeof payload.category !== 'string') {
            problems.push('"category" must be a string');
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
        } else if (payload.buttons && payload.buttons.length > 4) {
            problems.push('notifications can have at-most four buttons');
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
            category: payload.category,
            icon: payload.icon || '',
            customData: payload.customData !== undefined ? payload.customData : {},
            date: payload.date || Date.now(),
            onSelect: payload.onSelect || null,
            buttons: payload.buttons ? payload.buttons.map(btn => ({...btn, type: 'button', iconUrl: btn.iconUrl || ''})) : []
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
