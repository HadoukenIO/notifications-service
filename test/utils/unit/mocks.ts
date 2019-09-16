import 'jest';
import {Signal} from 'openfin-service-signal';
import {Identity, Fin} from 'openfin/_v2/main';

import {Environment, StoredApplication} from '../../../src/provider/model/Environment';
import {APIHandler} from '../../../src/provider/model/APIHandler';
import {APITopic, Events} from '../../../src/client/internal';
import {ClientRegistry} from '../../../src/provider/model/ClientRegistry';
import {Database} from '../../../src/provider/model/database/Database';
import {PartiallyWritable} from '../../types';
import {ServiceStore} from '../../../src/provider/store/ServiceStore';

jest.mock('../../../src/provider/model/APIHandler');
jest.mock('../../../src/provider/model/ClientRegistry');
jest.mock('../../../src/provider/model/database/Database');
jest.mock('../../../src/provider/store/ServiceStore');

export function createMockApiHandler(): jest.Mocked<APIHandler<APITopic, Events>> {
    const mockApiHandler = new APIHandler<APITopic, Events>() as jest.Mocked<APIHandler<APITopic, Events>>;

    (mockApiHandler as PartiallyWritable<typeof mockApiHandler, 'onConnection'>).onConnection = new Signal<[Identity]>();
    (mockApiHandler as PartiallyWritable<typeof mockApiHandler, 'onDisconnection'>).onDisconnection = new Signal<[Identity]>();

    return mockApiHandler;
}

export function createMockEnvironment(): jest.Mocked<Environment> {
    return {
        isApplicationRunning: jest.fn<Promise<boolean>, [string]>(),
        getApplication: jest.fn<Promise<StoredApplication>, [string]>(),
        startApplication: jest.fn<Promise<void>, [StoredApplication]>()
    };
}

export function createMockClientRegistry(): jest.Mocked<ClientRegistry> {
    const mockClientRegistry = new ClientRegistry(null!, null!, null!) as jest.Mocked<ClientRegistry>;
    (mockClientRegistry as PartiallyWritable<typeof mockClientRegistry, 'onAppActionReady'>).onAppActionReady = new Signal<[Identity]>();

    return mockClientRegistry;
}

export function createMockDatabase(): jest.Mocked<Database> {
    return new Database() as jest.Mocked<Database>;
}

export function createMockServiceStore(): jest.Mocked<ServiceStore> {
    const serviceStore = new ServiceStore(null!) as jest.Mocked<ServiceStore>;

    Object.defineProperty(serviceStore, 'state', {
        'get': jest.fn()
    });

    return serviceStore;
}

/**
 * Note that this is a special case. It provides implementations that will unavoidably be lost with any calls to
 * `jest.resetAllMocks`, and so should be recreated for each test. It also assigns itself to the global `fin` object
 */
export function createMockFin(): jest.Mocked<Fin> {
    const fin = {
        Application: {
            wrapSync: jest.fn(async () => ({
                isRunning: jest.fn()
            })),
            createFromManifest: jest.fn(async () => ({
                addListener: jest.fn(),
                run: jest.fn()
            })),
            create: jest.fn(async () => ({
                addListener: jest.fn(),
                run: jest.fn()
            }))
        },
        InterApplicationBus: {
            create: jest.fn()
        }
    } as unknown as jest.Mocked<Fin>;

    Object.assign(global, {
        fin
    });

    return fin;
}
