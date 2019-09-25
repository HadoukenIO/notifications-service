import {Identity} from 'openfin/_v2/main';
import {TrayInfo, Application} from 'openfin/_v2/api/application/application';
import {WindowOption} from 'openfin/_v2/api/window/windowOption';
import {ApplicationOption} from 'openfin/_v2/api/application/applicationOption';
import {SubOptions} from 'openfin/_v2/api/base';

import {Environment, StoredApplication} from '../../../src/provider/model/Environment';
import {APIHandler} from '../../../src/provider/model/APIHandler';
import {APITopic, Events} from '../../../src/client/internal';
import {ClientRegistry} from '../../../src/provider/model/ClientRegistry';
import {Database, Collections} from '../../../src/provider/model/database/Database';
import {ServiceStore} from '../../../src/provider/store/ServiceStore';
import {Injector} from '../../../src/provider/common/Injector';
import {Inject, InjectableMap} from '../../../src/provider/common/Injectables';
import {ClientEventController} from '../../../src/provider/controller/ClientEventController';
import {EventPump} from '../../../src/provider/model/EventPump';
import {ExpiryController} from '../../../src/provider/controller/ExpiryController';
import {Layouter} from '../../../src/provider/controller/Layouter';
import {Persistor} from '../../../src/provider/controller/Persistor';
import {ToastManager} from '../../../src/provider/controller/ToastManager';
import {MonitorModel} from '../../../src/provider/model/MonitorModel';
import {NotificationCenter} from '../../../src/provider/controller/NotificationCenter';
import {TrayIcon} from '../../../src/provider/model/TrayIcon';
import {WebWindowFactory, WebWindow} from '../../../src/provider/model/WebWindow';
import {Collection} from '../../../src/provider/model/database/Collection';
import {Action} from '../../../src/provider/store/Store';
import {RootState} from '../../../src/provider/store/State';

/**
 * Methods for creating mocks for use in unit tests. Mocks are created so they will be reset to their original state by
 * `jest.resetAllMocks`.
 *
 * This module also provides utility functions for working with these mocks.
 */

/**
 * Incomplete type representing a mock `fin` object. This should be expanded as tests require.
 */
export type MockFin = {
    Application: {
        wrapSync: jest.Mock<Promise<Application>, [Identity]>;
        createFromManifest: jest.Mock<Promise<Application>, [string]>;
        create: jest.Mock<Promise<Application>, [ApplicationOption]>;
    };
 };

const apiHandlerPath = '../../../src/provider/model/APIHandler';
const clientEventControllerPath = '../../../src/provider/controller/ClientEventController';
const clientRegistryPath = '../../../src/provider/model/ClientRegistry';
const databasePath = '../../../src/provider/model/database/Database';
const eventPumpPath = '../../../src/provider/model/EventPump';
const expiryControllerPath = '../../../src/provider/controller/ExpiryController';
const layouterPath = '../../../src/provider/controller/Layouter';
const notificationCenterPath = '../../../src/provider/controller/NotificationCenter';
const persistorPath = '../../../src/provider/controller/Persistor';
const serviceStorePath = '../../../src/provider/store/ServiceStore';
const toastManagerPath = '../../../src/provider/controller/ToastManager';

const collectionPath = '../../../src/provider/model/database/Collection';
const actionPath = '../../../src/provider/store/Store';

export function createMockApiHandler(): jest.Mocked<APIHandler<APITopic, Events>> {
    const {APIHandler} = jest.requireMock(apiHandlerPath);

    const apiHandler = new APIHandler() as jest.Mocked<APIHandler<APITopic, Events>>;

    assignMockGetter(apiHandler, 'onConnection');
    assignMockGetter(apiHandler, 'onDisconnection');
    assignMockGetter(apiHandler, 'channel');

    return apiHandler;
}

export function createMockClientEventController(): jest.Mocked<ClientEventController> {
    const {ClientEventController} = jest.requireMock(clientEventControllerPath);
    return new ClientEventController();
}

export function createMockClientRegistry(): jest.Mocked<ClientRegistry> {
    const {ClientRegistry} = jest.requireMock(clientRegistryPath);

    const clientRegistry = new ClientRegistry() as jest.Mocked<ClientRegistry>;

    assignMockGetter(clientRegistry, 'onAppActionReady');

    return clientRegistry;
}

export function createMockDatabase(): jest.Mocked<Database> {
    const {Database} = jest.requireMock(databasePath);

    const database = new Database() as jest.Mocked<Database>;
    assignMockGetter(database, 'initialized');

    return database;
}

export function createMockEnvironment(): jest.Mocked<Environment> {
    return {
        isApplicationRunning: jest.fn<Promise<boolean>, [string]>(),
        getApplication: jest.fn<Promise<StoredApplication>, [string]>(),
        startApplication: jest.fn<Promise<void>, [StoredApplication]>()
    };
}

export function createMockEventPump(): jest.Mocked<EventPump> {
    const {EventPump} = jest.requireMock(eventPumpPath);
    return new EventPump();
}

export function createMockExpiryController(): jest.Mocked<ExpiryController> {
    const {ExpiryController} = jest.requireMock(expiryControllerPath);
    return new ExpiryController();
}

export function createMockLayouter(): jest.Mocked<Layouter> {
    const {Layouter} = jest.requireMock(layouterPath);

    const layouter = new Layouter() as jest.Mocked<Layouter>;

    assignMockGetter(layouter, 'initialized');
    assignMockGetter(layouter, 'onLayoutRequired');

    return layouter;
}

export function createMockMonitorModel(): jest.Mocked<MonitorModel> {
    const monitorModel: jest.Mocked<MonitorModel> = {
        onMonitorInfoChanged: null!,
        initialized: null!,
        monitorInfo: null!
    };

    assignMockGetter(monitorModel, 'onMonitorInfoChanged');
    assignMockGetter(monitorModel, 'initialized');
    assignMockGetter(monitorModel, 'monitorInfo');

    return monitorModel;
}

export function createMockNotificationCenter(): jest.Mocked<NotificationCenter> {
    const {NotificationCenter} = jest.requireMock(notificationCenterPath);

    const notificationCenter = new NotificationCenter() as jest.Mocked<NotificationCenter>;
    assignMockGetter(notificationCenter, 'initialized');

    return notificationCenter;
}

export function createMockPeristor(): jest.Mocked<Persistor> {
    const {Persistor} = jest.requireMock(persistorPath);
    return new Persistor();
}

export function createMockServiceStore(): jest.Mocked<ServiceStore> {
    const {ServiceStore} = jest.requireMock(serviceStorePath);

    const serviceStore = new ServiceStore() as jest.Mocked<ServiceStore>;

    assignMockGetter(serviceStore, 'initialized');
    assignMockGetter(serviceStore, 'state');
    assignMockGetter(serviceStore, 'onAction');

    return serviceStore;
}

export function createMockToastManager(): jest.Mocked<ToastManager> {
    const {ToastManager} = jest.requireMock(toastManagerPath);

    const toastManager = new ToastManager() as jest.Mocked<ToastManager>;
    assignMockGetter(toastManager, 'initialized');

    return toastManager;
}

export function createMockTrayIcon(): jest.Mocked<TrayIcon> {
    const trayIcon: jest.Mocked<TrayIcon> = {
        onLeftClick: null!,
        onRightClick: null!,
        setIcon: jest.fn<Promise<void>, [string]>(),
        getInfo: jest.fn<Promise<TrayInfo>, []>()
    };

    assignMockGetter(trayIcon, 'onLeftClick');
    assignMockGetter(trayIcon, 'onRightClick');

    return trayIcon;
}

export function createMockWebWindowFactory(): jest.Mocked<WebWindowFactory> {
    return {
        createWebWindow: jest.fn<Promise<WebWindow>, [WindowOption]>()
    };
}

export function createMockCollection<T extends Collections[keyof Collections]>(): jest.Mocked<Collection<T>> {
    const {Collection} = jest.requireMock(collectionPath);
    return new Collection();
}

export function createMockAction(): jest.Mocked<Action<RootState>> {
    const {Action} = jest.requireMock(actionPath);

    return new Action;
}

/**
 * Note that this also assigns the created mock to the global `fin` object. Incomplete, and
 * should be expanded as tests require.
 */
export function createMockFin(): MockFin {
    const fin = {
        Application: {
            wrapSync: jest.fn<Promise<Application>, [Identity]>(),
            createFromManifest: jest.fn<Promise<Application>, [string]>(),
            create: jest.fn<Promise<Application>, [ApplicationOption]>()
        }
    };

    Object.assign(global, {fin});

    return fin;
}

export function createMockApplication(): jest.Mocked<Application> {
    type AddListenerParams = [string, (...args: any[]) => void, SubOptions];

    return {
        addListener: jest.fn<Promise<Application>, AddListenerParams>(),
        run: jest.fn<Promise<void>, []>()
    } as unknown as jest.Mocked<Application>;
}

/**
 * Resets `Injector`, and configures it to return mocks for all injectables.
 */
export function useMocksInInjector(): void {
    Injector.reset();

    const bindings: InjectableMap = {
        [Inject.API_HANDLER]: createMockApiHandler(),
        [Inject.CLIENT_EVENT_CONTROLLER]: createMockClientEventController(),
        [Inject.CLIENT_REGISTRY]: createMockClientRegistry(),
        [Inject.DATABASE]: createMockDatabase(),
        [Inject.ENVIRONMENT]: createMockEnvironment(),
        [Inject.EVENT_PUMP]: createMockEventPump(),
        [Inject.EXPIRY_CONTROLLER]: createMockExpiryController(),
        [Inject.LAYOUTER]: createMockLayouter(),
        [Inject.MONITOR_MODEL]: createMockMonitorModel(),
        [Inject.NOTIFICATION_CENTER]: createMockNotificationCenter(),
        [Inject.PERSISTOR]: createMockPeristor(),
        [Inject.STORE]: createMockServiceStore(),
        [Inject.TOAST_MANAGER]: createMockToastManager(),
        [Inject.TRAY_ICON]: createMockTrayIcon(),
        [Inject.WEB_WINDOW_FACTORY]: createMockWebWindowFactory()
    };

    Object.keys(bindings).forEach(k => {
        const key = k as keyof InjectableMap;
        Injector.rebind(key).toConstantValue(bindings[key]);
    });
}

/**
 * Returns the mock getter function of an object. Assumes the mock has already been assigned.
 *
 * @param mock The mock object to get a getter mock of
 * @param key The key of the mock getter to get
 */
export function getterMock<Mock extends object, Key extends keyof Mock, Value extends Mock[Key]>(mock: Mock, key: Key): jest.Mock<Value, []> {
    return Object.getOwnPropertyDescriptor(mock, key)!.get as jest.Mock<Value, []>;
}

/**
 * Returns the mock setter function of an object. Assumes the mock has already been assigned.
 *
 * @param mock The mock object to get a setter mock of
 * @param key The key of the mock setter to get
 */
export function setterMock<Mock extends object, Key extends keyof Mock, Value extends Mock[Key]>(mock: Mock, key: Key): jest.Mock<void, [Value]> {
    return Object.getOwnPropertyDescriptor(mock, key)!.set as jest.Mock<void, [Value]>;
}

function assignMockGetter<Mock extends object, Key extends keyof Mock, Value extends Mock[Key]>(mock: Mock, key: Key): void {
    Object.defineProperty(mock, key, {
        'get': jest.fn<Value, []>()
    });
}
