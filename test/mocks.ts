import 'jest';
import {Signal} from 'openfin-service-signal';
import {Identity, Fin} from 'openfin/_v2/main';

import {Environment, StoredApplication} from '../src/provider/model/Environment';
import {APIHandler} from '../src/provider/model/APIHandler';
import {APITopic, Events} from '../src/client/internal';
import {ClientRegistry} from '../src/provider/model/ClientRegistry';
import {Database} from '../src/provider/model/database/Database';

import {PartiallyWritable} from './types';

jest.mock('../src/provider/model/APIHandler');
jest.mock('../src/provider/model/ClientRegistry');

export function createMockEnvironment(): jest.Mocked<Environment> {
    return {
        isApplicationRunning: jest.fn<Promise<boolean>, [string]>(),
        getApplication: jest.fn<Promise<StoredApplication>, [string]>(),
        startApplication: jest.fn<Promise<void>, [StoredApplication]>()
    };
}

export function createMockApiHandler(): jest.Mocked<APIHandler<APITopic, Events>> {
    const mockApiHandler = new APIHandler<APITopic, Events>() as jest.Mocked<APIHandler<APITopic, Events>>;

    (mockApiHandler as PartiallyWritable<typeof mockApiHandler, 'onConnection'>).onConnection = new Signal<[Identity]>();
    (mockApiHandler as PartiallyWritable<typeof mockApiHandler, 'onDisconnection'>).onDisconnection = new Signal<[Identity]>();

    return mockApiHandler;
}

export function createMockClientRegistry(): jest.Mocked<ClientRegistry> {
    const mockClientRegistry = new ClientRegistry(null!, null!, null!) as jest.Mocked<ClientRegistry>;
    (mockClientRegistry as PartiallyWritable<typeof mockClientRegistry, 'onAppActionReady'>).onAppActionReady = new Signal<[Identity]>();

    return mockClientRegistry;
}

export function createMockDatabase(): jest.Mocked<Database> {
    return new Database() as jest.Mocked<Database>;
}

export function createMockFin(): jest.Mocked<Fin> {
    return {
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
    } as unknown as jest.Mocked<Fin>;
}
