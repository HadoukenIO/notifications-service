import 'reflect-metadata';

import {ServiceStore} from '../../../src/provider/store/ServiceStore';
import {createMockDatabase, createMockCollection, getterMock, createMockAction} from '../../utils/unit/mocks';
import {StoredNotification} from '../../../src/provider/model/StoredNotification';
import {StoredApplication} from '../../../src/provider/model/Environment';
import {CollectionMap, Database} from '../../../src/provider/model/database/Database';
import {DeferredPromise} from '../../../src/provider/common/DeferredPromise';
import {createFakeStoredNotification, createFakeStoredApplication, createFakeRootState} from '../../utils/unit/fakes';
import {normalizeRootState} from '../../utils/unit/normalization';
import {RootState} from '../../../src/provider/store/State';
import {Action} from '../../../src/provider/store/Store';
import {pumpPromiseChain} from '../../utils/unit/time';

const mockDatabase = createMockDatabase();

const mockNotificationsCollection = createMockCollection<StoredNotification>();
const mockApplicationsCollection = createMockCollection<StoredApplication>();

let databaseInitializedDeferredPromise: DeferredPromise<jest.Mocked<Database>>;

let serviceStore: ServiceStore;

beforeEach(() => {
    jest.resetAllMocks();

    databaseInitializedDeferredPromise = new DeferredPromise<jest.Mocked<Database>>();
    databaseInitializedDeferredPromise.resolve(mockDatabase);

    getterMock(mockDatabase, 'initialized').mockReturnValue(databaseInitializedDeferredPromise.promise);
    mockDatabase.get.mockImplementation((collectionName: CollectionMap) => {
        if (collectionName === CollectionMap.NOTIFICATIONS) {
            return mockNotificationsCollection;
        } else if (collectionName === CollectionMap.APPLICATIONS) {
            return mockApplicationsCollection;
        } else {
            throw new Error('Attempting to get unknown collection');
        }
    });

    serviceStore = new ServiceStore(mockDatabase);
});

describe('When the store is uninitialized', () => {
    test('When creating the store, and the database is populated, the state is set from the database', async () => {
        const note1 = createFakeStoredNotification();
        const note2 = createFakeStoredNotification();
        const note3 = createFakeStoredNotification();

        const app1 = createFakeStoredApplication();
        const app2 = createFakeStoredApplication();
        const app3 = createFakeStoredApplication();

        mockNotificationsCollection.getAll.mockResolvedValue([note1, note2, note3]);
        mockApplicationsCollection.getAll.mockResolvedValue([app1, app2, app3]);

        await serviceStore.delayedInit();

        expect(normalizeRootState(serviceStore.state)).toEqual(normalizeRootState({
            notifications: [note1, note2, note3],
            applications: new Map([[app1.id, app1], [app2.id, app2], [app3.id, app3]]),
            centerVisible: false,
            centerLocked: false}));
    });

    test('When creating the store, and the database is empty, the state is set from the database', async () => {
        mockNotificationsCollection.getAll.mockResolvedValue([]);
        mockApplicationsCollection.getAll.mockResolvedValue([]);

        await serviceStore.delayedInit();

        expect(normalizeRootState(serviceStore.state)).toEqual(normalizeRootState({
            notifications: [],
            applications: new Map([]),
            centerVisible: false,
            centerLocked: false}));
    });
});

describe('When the store is initialized', () => {
    let mockAction: jest.Mocked<Action<RootState>>;

    beforeEach(async () => {
        mockNotificationsCollection.getAll.mockResolvedValue([]);
        mockApplicationsCollection.getAll.mockResolvedValue([]);

        await serviceStore.delayedInit();

        mockAction = createMockAction();
    });

    test('When an action is dispatched, tt is reduced synchronously', async () => {
        const state = {...createFakeRootState(), notifications: [createFakeStoredNotification()]};
        mockAction.reduce.mockReturnValue(state);

        const promise = serviceStore.dispatch(mockAction);

        expect(serviceStore.state).toEqual(state);

        await promise;
    });

    describe('When action listeners are added', () => {
        let deferredPromise1: DeferredPromise;
        let listener1: jest.Mock<Promise<void>, []>;

        let deferredPromise2: DeferredPromise;
        let listener2: jest.Mock<Promise<void>, []>;

        let deferredPromise3: DeferredPromise;
        let listener3: jest.Mock<Promise<void>, []>;

        beforeEach(() => {
            deferredPromise1 = new DeferredPromise();
            listener1 = jest.fn().mockReturnValue(deferredPromise1.promise);

            deferredPromise2 = new DeferredPromise();
            listener2 = jest.fn().mockReturnValue(deferredPromise2.promise);

            deferredPromise3 = new DeferredPromise();
            listener3 = jest.fn().mockReturnValue(deferredPromise3.promise);

            serviceStore.onAction.add(listener1);
            serviceStore.onAction.add(listener2);
            serviceStore.onAction.add(listener3);
        });

        test('Action listeners are called synchronously', async () => {
            mockAction.reduce.mockReturnValue(createFakeRootState());

            const promise = serviceStore.dispatch(mockAction);

            expect(listener1).toBeCalledTimes(1);
            expect(listener2).toBeCalledTimes(1);
            expect(listener3).toBeCalledTimes(1);

            deferredPromise1.resolve();
            deferredPromise2.resolve();
            deferredPromise3.resolve();

            await promise;
        });

        test('The call only resolves once all action listeners have resolved', async () => {
            mockAction.reduce.mockReturnValue(createFakeRootState());

            let resolved = false;

            const promise = serviceStore.dispatch(mockAction).then(() => resolved = true);
            await pumpPromiseChain();
            expect(resolved).toBeFalsy();

            deferredPromise1.resolve();
            await pumpPromiseChain();
            expect(resolved).toBeFalsy();

            deferredPromise3.resolve();
            await pumpPromiseChain();
            expect(resolved).toBeFalsy();

            deferredPromise2.resolve();
            await pumpPromiseChain();
            expect(resolved).toBeTruthy();

            await promise;
        });
    });
});
