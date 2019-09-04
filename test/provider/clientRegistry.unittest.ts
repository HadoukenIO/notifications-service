import 'jest';
import 'fake-indexeddb/auto';

import {Signal} from 'openfin-service-signal';
import {Identity} from 'openfin/_v2/main';

import {Database, CollectionMap} from '../../src/provider/model/database/Database';
import {APITopic, Events} from '../../src/client/internal';
import {APIHandler} from '../../src/provider/model/APIHandler';
import {ClientRegistry} from '../../src/provider/model/ClientRegistry';
import {StoredApplication, Environment} from '../../src/provider/model/Environment';
import {createMockEnvironment} from '../mocks';
import {PartiallyWritable} from '../types';

jest.mock('../../src/provider/model/APIHandler');

describe('When attempting to launch an app through the client registry', () => {
    const storedApp: StoredApplication = {
        type: 'manifest',
        id: 'cr-test-app',
        manifestUrl: 'some-manifest-url'
    };

    let clientRegistry: ClientRegistry;
    let mockDatabase: Database;
    let mockEnvironment: jest.Mocked<Environment>;

    beforeEach(async () => {
        jest.resetAllMocks();

        const mockApiHandler: APIHandler<APITopic, Events> = new APIHandler<APITopic, Events>() as jest.Mocked<APIHandler<APITopic, Events>>;
        (mockApiHandler as PartiallyWritable<typeof mockApiHandler, 'onConnection'>).onConnection = new Signal<[Identity]>();
        (mockApiHandler as PartiallyWritable<typeof mockApiHandler, 'onDisconnection'>).onDisconnection = new Signal<[Identity]>();

        mockDatabase = await new Database().delayedInit();
        mockEnvironment = createMockEnvironment();

        const collection = mockDatabase.get(CollectionMap.APPLICATIONS);
        await collection.upsert(storedApp);

        clientRegistry = new ClientRegistry(mockApiHandler, mockDatabase, mockEnvironment);
    });

    afterEach(async () => {
        const collection = mockDatabase.get(CollectionMap.APPLICATIONS);
        await collection.delete((await collection.getAll()).map(app => app.id));
    });

    it('If the app is not running, the client registry will try to start the app from the stored data in the database', async () => {
        mockEnvironment.isApplicationRunning.mockImplementation(async () => {
            return false;
        });

        await clientRegistry.tryLaunchApplication(storedApp.id);

        expect(mockEnvironment.startApplication).toBeCalledTimes(1);
        expect(mockEnvironment.startApplication).toBeCalledWith(storedApp);
    });

    it('If the app is already running, the client registry will not attempt to start the app', async () => {
        mockEnvironment.isApplicationRunning.mockImplementation(async () => {
            return true;
        });

        await clientRegistry.tryLaunchApplication(storedApp.id);

        expect(mockEnvironment.startApplication).toBeCalledTimes(0);
    });
});
