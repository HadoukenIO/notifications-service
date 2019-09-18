import 'jest';
import 'fake-indexeddb/auto';

import {Identity} from 'openfin/_v2/main';

import {ClientRegistry} from '../../../src/provider/model/ClientRegistry';
import {StoredApplication} from '../../../src/provider/model/Environment';
import {createMockEnvironment, createMockApiHandler, createMockServiceStore} from '../../mocks';
import {PartiallyWritable} from '../../types';
import {RegisterApplication} from '../../../src/provider/store/Actions';

jest.unmock('../../../src/provider/model/ClientRegistry');

beforeEach(async () => {
    jest.resetAllMocks();
});

describe('When attemping to launch an app through the client registry', () => {
    const storedApp: StoredApplication = {
        type: 'manifest',
        id: 'cr-test-app',
        manifestUrl: 'some-manifest-url'
    };

    const mockApiHandler = createMockApiHandler();
    const mockEnvironment = createMockEnvironment();
    const mockServiceStore = createMockServiceStore();

    let clientRegistry: ClientRegistry;

    beforeEach(async () => {
        const state = {
            notifications: [],
            applications: new Map<string, StoredApplication>(),
            centerVisible: false,
            centerLocked: false
        };

        state.applications.set(storedApp.id, storedApp);

        (mockServiceStore as PartiallyWritable<typeof mockServiceStore, 'state'>).state = state;

        clientRegistry = new ClientRegistry(mockApiHandler, mockServiceStore, mockEnvironment);
    });

    test('If the app is not running, the client registry will try to start the app from the stored data in the database', async () => {
        mockEnvironment.isApplicationRunning.mockImplementation(async () => {
            return false;
        });

        await clientRegistry.tryLaunchApplication(storedApp.id);

        expect(mockEnvironment.startApplication).toBeCalledTimes(1);
        expect(mockEnvironment.startApplication).toBeCalledWith(storedApp);
    });

    test('If the app is already running, the client registry will not attempt to start the app', async () => {
        mockEnvironment.isApplicationRunning.mockImplementation(async () => {
            return true;
        });

        await clientRegistry.tryLaunchApplication(storedApp.id);

        expect(mockEnvironment.startApplication).toBeCalledTimes(0);
    });
});

describe('When querying windows', () => {
    const mockUuid1 = 'mock-app-1';
    const mockUuid2 = 'mock-app-2';

    const mockApp1Window1 = {uuid: mockUuid1, name: 'mock-window-1'};
    const mockApp1Window2 = {uuid: mockUuid1, name: 'mock-window-2'};

    const mockApiHandler = createMockApiHandler();
    const mockEnvironment = createMockEnvironment();
    const mockServiceStore = createMockServiceStore();

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
    const mockApiHandler = createMockApiHandler();
    const mockEnvironment = createMockEnvironment();
    const mockServiceStore = createMockServiceStore();

    const mockWindow = {name: 'mock-window', uuid: 'mock-app'};
    const mockStoredApplication: StoredApplication = {
        type: 'manifest',
        id: mockWindow.uuid,
        manifestUrl: 'manifest-url'
    };

    beforeEach(async () => {
        mockEnvironment.getApplication.mockImplementation(async (uuid: string) => {
            if (uuid === mockWindow.uuid) {
                return mockStoredApplication;
            } else {
                return null!;
            }
        });

        new ClientRegistry(mockApiHandler, mockServiceStore, mockEnvironment);
    });

    test('The app is registered with the store', async () => {
        mockApiHandler.onConnection.emit(mockWindow);

        // Give the promises internal to ClientRegistry a chance to resolve
        await Promise.resolve();

        expect(mockServiceStore.dispatch).toBeCalledTimes(1);
        expect(mockServiceStore.dispatch).toBeCalledWith(new RegisterApplication(mockStoredApplication));
    });
});
