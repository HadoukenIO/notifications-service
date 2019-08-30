import 'jest';
import 'fake-indexeddb/auto';

import {Database, CollectionMap} from '../../src/provider/model/database/Database';
import {APITopic, Events} from '../../src/client/internal';
import {APIHandler} from '../../src/provider/model/APIHandler';
import {ClientRegistry, StoredApplication} from '../../src/provider/model/ClientRegistry';

describe('When the same app is attempted to be launched multiple times instantaneously through ClientRegistry', () => {
    const storedApp: StoredApplication = {
        type: 'manifest',
        id: 'cr-test-app',
        manifestUrl: 'some-manifest-url'
    };
    let clientRegistry: ClientRegistry;
    let database: Database;

    beforeEach(async () => {
        Object.assign(global, {
            fin: {
                Application: {
                    wrapSync: jest.fn().mockReturnValue({
                        isRunning: jest.fn()
                    }),
                    createFromManifest: jest.fn().mockReturnValue({
                        addListener: jest.fn(),
                        run: jest.fn()
                    })
                },
                InterApplicationBus: {
                    create: jest.fn()
                }
            }
        });
        const apiHandler: APIHandler<APITopic, Events> = new APIHandler<APITopic, Events>();
        database = await new Database().delayedInit();
        clientRegistry = new ClientRegistry(apiHandler, database);
        const collection = database.get(CollectionMap.APPLICATIONS);
        await collection.upsert(storedApp);
    });

    afterEach(async () => {
        const collection = database.get(CollectionMap.APPLICATIONS);
        await collection.delete(storedApp.id);
    });

    it('create method should be called only once', async () => {
        for (let i = 0; i < 10; ++i) {
            await clientRegistry.tryLaunchApplication(storedApp.id);
        }
        expect(fin.Application.createFromManifest).toBeCalledTimes(1);
    });
});
