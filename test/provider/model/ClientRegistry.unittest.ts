import 'reflect-metadata';

import {Identity} from 'openfin/_v2/main';
import {Signal} from 'openfin-service-signal';

import {ClientRegistry} from '../../../src/provider/model/ClientRegistry';
import {StoredApplication} from '../../../src/provider/model/Environment';
import {createMockEnvironment, createMockApiHandler, createMockServiceStore, getterMock} from '../../utils/unit/mocks';
import {RegisterApplication} from '../../../src/provider/store/Actions';
import {createFakeStoredApplication} from '../../utils/unit/fakes';
import {resolvePromiseChain} from '../../utils/unit/time';

const mockApiHandler = createMockApiHandler();
const mockEnvironment = createMockEnvironment();
const mockServiceStore = createMockServiceStore();

beforeEach(async () => {
    jest.resetAllMocks();

    getterMock(mockApiHandler, 'onConnection').mockReturnValue(new Signal<[Identity]>());
    getterMock(mockApiHandler, 'onDisconnection').mockReturnValue(new Signal<[Identity]>());
});

describe('When attemping to launch an app through the client registry', () => {
    let storedApp: StoredApplication;

    let clientRegistry: ClientRegistry;

    beforeEach(async () => {
        storedApp = createFakeStoredApplication();

        const state = {
            notifications: [],
            applications: new Map<string, StoredApplication>(),
            centerVisible: false,
            centerLocked: false
        };

        state.applications.set(storedApp.id, storedApp);

        getterMock(mockServiceStore, 'state').mockReturnValue(state);

        clientRegistry = new ClientRegistry(mockApiHandler, mockServiceStore, mockEnvironment);
    });

    test('If the app is not running, the client registry will try to start the app from the stored data in the database', async () => {
        mockEnvironment.isApplicationRunning.mockResolvedValue(false);

        await clientRegistry.tryLaunchApplication(storedApp.id);

        expect(mockEnvironment.startApplication).toBeCalledTimes(1);
        expect(mockEnvironment.startApplication).toBeCalledWith(storedApp);
    });

    test('If the app is already running, the client registry will not attempt to start the app', async () => {
        mockEnvironment.isApplicationRunning.mockResolvedValue(true);

        await clientRegistry.tryLaunchApplication(storedApp.id);

        expect(mockEnvironment.startApplication).toBeCalledTimes(0);
    });
});

describe('When querying windows', () => {
    const mockUuid1 = 'mock-app-1';
    const mockUuid2 = 'mock-app-2';

    const mockApp1Window1 = {uuid: mockUuid1, name: 'mock-window-1'};
    const mockApp1Window2 = {uuid: mockUuid1, name: 'mock-window-2'};

    let clientRegistry: ClientRegistry;

    beforeEach(() => {
        clientRegistry = new ClientRegistry(mockApiHandler, mockServiceStore, mockEnvironment);
    });

    test('Apps start not action-ready', () => {
        expect(clientRegistry.isAppActionReady(mockUuid1)).toBe(false);
    });

    test('When a window adds an action listener, its app, and only its app, becomes action-ready', () => {
        clientRegistry.onAddEventListener('notification-action', mockApp1Window1);

        expect(clientRegistry.isAppActionReady(mockUuid1)).toBe(true);
        expect(clientRegistry.isAppActionReady(mockUuid2)).toBe(false);
    });

    test('When a window removes its action listener, and it is an app\'s only window, the app becomes not action-ready', () => {
        clientRegistry.onAddEventListener('notification-action', mockApp1Window1);
        clientRegistry.onRemoveEventListener('notification-action', mockApp1Window1);

        expect(clientRegistry.isAppActionReady(mockUuid1)).toBe(false);
    });

    test('When a window with an action listener disconnects, the app becomes not action-ready', () => {
        clientRegistry.onAddEventListener('notification-action', mockApp1Window1);

        mockApiHandler.onDisconnection.emit(mockApp1Window1);

        expect(clientRegistry.isAppActionReady(mockUuid1)).toBe(false);
    });

    test('When two windows of the same app add an action listener, and then one removes its action listener, the app stays action-ready', () => {
        clientRegistry.onAddEventListener('notification-action', mockApp1Window1);
        clientRegistry.onAddEventListener('notification-action', mockApp1Window2);

        clientRegistry.onRemoveEventListener('notification-action', mockApp1Window1);

        expect(clientRegistry.isAppActionReady(mockUuid1)).toBe(true);
    });

    test('When two windows of the same app add an action listener, and then both removes their action listener, the app becomes not action-ready', () => {
        clientRegistry.onAddEventListener('notification-action', mockApp1Window1);
        clientRegistry.onAddEventListener('notification-action', mockApp1Window2);

        clientRegistry.onRemoveEventListener('notification-action', mockApp1Window1);
        clientRegistry.onRemoveEventListener('notification-action', mockApp1Window2);

        expect(clientRegistry.isAppActionReady(mockUuid1)).toBe(false);
    });

    test('When a window adds a non-action listener, the app stays not action-ready', () => {
        clientRegistry.onAddEventListener('notification-closed', mockApp1Window1);

        expect(clientRegistry.isAppActionReady(mockUuid1)).toBe(false);
    });

    test('When an app becomes action-ready, a signal is fired', () => {
        const listener = jest.fn<void, [Identity]>();

        clientRegistry.onAppActionReady.add(listener);

        clientRegistry.onAddEventListener('notification-action', mockApp1Window1);

        expect(listener).toBeCalledTimes(1);
        expect(listener).toBeCalledWith(mockApp1Window1);
    });

    test('When an app listens for a non-action event, no signal is fired', () => {
        const listener = jest.fn<void, [Identity]>();

        clientRegistry.onAppActionReady.add(listener);

        clientRegistry.onAddEventListener('notification-closed', mockApp1Window1);

        expect(listener).toBeCalledTimes(0);
    });
});

describe('When an app connects', () => {
    let mockStoredApplication: StoredApplication;
    let mockWindow: Identity;

    beforeEach(async () => {
        mockStoredApplication = createFakeStoredApplication();
        mockWindow = {name: 'mock-window', uuid: mockStoredApplication.id};

        mockEnvironment.getApplication.mockImplementation(async (uuid: string) => {
            return (uuid === mockWindow.uuid) ? mockStoredApplication : null!;
        });

        new ClientRegistry(mockApiHandler, mockServiceStore, mockEnvironment);
    });

    test('The app is registered with the store', async () => {
        mockApiHandler.onConnection.emit(mockWindow);

        // Give the promises internal to ClientRegistry a chance to resolve
        await resolvePromiseChain();

        expect(mockServiceStore.dispatch).toBeCalledTimes(1);
        expect(mockServiceStore.dispatch).toBeCalledWith(new RegisterApplication(mockStoredApplication));
    });
});
