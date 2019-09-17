import 'jest';
import 'jsdom';

import {Signal} from 'openfin-service-signal';
import {Identity, Fin} from 'openfin/_v2/main';
import {MonitorInfo} from 'openfin/_v2/api/system/monitor';
import ApplicationModule, {TrayInfo, Application} from 'openfin/_v2/api/application/application';
import {WindowOption} from 'openfin/_v2/api/window/windowOption';
import {ApplicationOption} from 'openfin/_v2/api/application/applicationOption';

import {Environment, StoredApplication} from '../../../src/provider/model/Environment';
import {APIHandler} from '../../../src/provider/model/APIHandler';
import {APITopic, Events} from '../../../src/client/internal';
import {ClientRegistry} from '../../../src/provider/model/ClientRegistry';
import {Database} from '../../../src/provider/model/database/Database';
import {PartiallyWritable} from '../../types';
import {ServiceStore} from '../../../src/provider/store/ServiceStore';
import {Injector} from '../../../src/provider/common/Injector';
import {Inject} from '../../../src/provider/common/Injectables';
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
import {RootAction} from '../../../src/provider/store/Actions';
import {DeferredPromise} from '../../../src/provider/common/DeferredPromise';

import {createFakeMonitorInfo} from './fakes';

/**
 * Methods for creating mocks for use in unit tests. Within the mocked objects, methods, getters and setters are jest
 * mock functions without any implementation, and readonly member variables are set to sensible defaults, which
 * includes instantiating any signals the object holds.
 *
 * Roughly, mocks are created in the same state that they will be reset to by `jest.resetMocks`.
 *
 * This module also provides functions for mounting a mock `fin` object, and populating the injector with mocks.
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

export function createMockApiHandler(): jest.Mocked<APIHandler<APITopic, Events>> {
    const {APIHandler} = jest.requireMock(apiHandlerPath);

    const apiHandler = new APIHandler() as jest.Mocked<APIHandler<APITopic, Events>>;

    (apiHandler as PartiallyWritable<APIHandler<APITopic, Events>, 'onConnection'>).onConnection = new Signal<[Identity]>();
    (apiHandler as PartiallyWritable<APIHandler<APITopic, Events>, 'onDisconnection'>).onDisconnection = new Signal<[Identity]>();

    Object.defineProperty(apiHandler, 'channel', {
        'get': jest.fn()
    });

    return apiHandler;
}

export function createMockClientEventController(): jest.Mocked<ClientEventController> {
    const {ClientEventController} = jest.requireMock(clientEventControllerPath);
    return new ClientEventController();
}

export function createMockClientRegistry(): jest.Mocked<ClientRegistry> {
    const {ClientRegistry} = jest.requireMock(clientRegistryPath);

    const clientRegistry = new ClientRegistry() as jest.Mocked<ClientRegistry>;
    (clientRegistry as PartiallyWritable<typeof clientRegistry, 'onAppActionReady'>).onAppActionReady = new Signal<[Identity]>();

    return clientRegistry;
}

export function createMockDatabase(): jest.Mocked<Database> {
    const {Database} = jest.requireMock(databasePath);
    return new Database();
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
    (layouter as PartiallyWritable<Layouter, 'onLayoutRequired'>).onLayoutRequired = new Signal<[]>();

    return layouter;
}

export function createMockMonitorModel(): jest.Mocked<MonitorModel> {
    const initialized = new DeferredPromise<MonitorModel>();

    const monitorModel: jest.Mocked<MonitorModel> = {
        onMonitorInfoChanged: new Signal<[MonitorInfo]>(),
        initialized: initialized.promise,
        monitorInfo: createFakeMonitorInfo()
    };

    initialized.resolve(monitorModel);

    return monitorModel;
}

export function createMockNotificationCenter(): jest.Mocked<NotificationCenter> {
    const {NotificationCenter} = jest.requireMock(notificationCenterPath);
    return new NotificationCenter();
}

export function createMockPeristor(): jest.Mocked<Persistor> {
    const {Persistor} = jest.requireMock(persistorPath);
    return new Persistor();
}

export function createMockServiceStore(): jest.Mocked<ServiceStore> {
    const {ServiceStore} = jest.requireMock(serviceStorePath);

    const serviceStore = new ServiceStore() as jest.Mocked<ServiceStore>;
    (serviceStore as PartiallyWritable<ServiceStore, 'onAction'>).onAction = new Signal<[RootAction], Promise<void>, Promise<void>>();

    Object.defineProperty(serviceStore, 'state', {
        'get': jest.fn()
    });

    return serviceStore;
}

export function createMockToastManager(): jest.Mocked<ToastManager> {
    const {ToastManager} = jest.requireMock(toastManagerPath);
    return new ToastManager();
}

export function createMockTrayIcon(): jest.Mocked<TrayIcon> {
    return {
        onLeftClick: new Signal<[]>(),
        onRightClick: new Signal<[]>(),
        setIcon: jest.fn<Promise<void>, [string]>(),
        getInfo: jest.fn<Promise<TrayInfo>, []>()
    };
}

export function createMockWebWindowFactory(): jest.Mocked<WebWindowFactory> {
    return {
        createWebWindow: jest.fn<Promise<WebWindow>, [WindowOption]>()
    };
}

/**
 * Note that this also assigns the created mock to the global `fin` object. Also note that this is impconplete, and
 * should be expanded as tests require
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
    return {
        addListener: jest.fn(),
        run: jest.fn()
    } as unknown as jest.Mocked<Application>;
}

export function useMocksInInjector(): void {
    Injector.reset();

    Injector.rebind(Inject.API_HANDLER).toConstantValue(createMockApiHandler());
    Injector.rebind(Inject.CLIENT_EVENT_CONTROLLER).toConstantValue(createMockClientEventController());
    Injector.rebind(Inject.CLIENT_REGISTRY).toConstantValue(createMockClientRegistry());
    Injector.rebind(Inject.DATABASE).toConstantValue(createMockDatabase());
    Injector.rebind(Inject.ENVIRONMENT).toConstantValue(createMockEnvironment());
    Injector.rebind(Inject.EVENT_PUMP).toConstantValue(createMockEventPump());
    Injector.rebind(Inject.EXPIRY_CONTROLLER).toConstantValue(createMockExpiryController());
    Injector.rebind(Inject.LAYOUTER).toConstantValue(createMockLayouter());
    Injector.rebind(Inject.MONITOR_MODEL).toConstantValue(createMockMonitorModel());
    Injector.rebind(Inject.NOTIFICATION_CENTER).toConstantValue(createMockNotificationCenter());
    Injector.rebind(Inject.PERSISTOR).toConstantValue(createMockPeristor());
    Injector.rebind(Inject.STORE).toConstantValue(createMockServiceStore());
    Injector.rebind(Inject.TOAST_MANAGER).toConstantValue(createMockToastManager());
    Injector.rebind(Inject.TRAY_ICON).toConstantValue(createMockTrayIcon());
    Injector.rebind(Inject.WEB_WINDOW_FACTORY).toConstantValue(createMockWebWindowFactory());
}
