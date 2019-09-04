import 'jest';
import {Environment, StoredApplication} from '../src/provider/model/Environment';

export function createMockEnvironment(): jest.Mocked<Environment> {
    return {
        isApplicationRunning: jest.fn<Promise<boolean>, [string]>(),
        getApplication: jest.fn<Promise<StoredApplication>, [string]>(),
        startApplication: jest.fn<Promise<void>, [StoredApplication]>()
    };
}
