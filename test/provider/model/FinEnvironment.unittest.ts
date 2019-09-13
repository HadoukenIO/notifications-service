import 'jest';
import 'reflect-metadata';

import {FinEnvironment} from '../../../src/provider/model/FinEnvironment';
import {StoredApplication} from '../../../src/provider/model/Environment';
import {createMockFin} from '../../utils/unit/mocks';

describe('When the same app is attempted to be launched multiple times instantaneously through the Environment', () => {
    const storedApp: StoredApplication = {
        type: 'manifest',
        id: 'cr-test-app',
        manifestUrl: 'some-manifest-url'
    };
    let environment: FinEnvironment;

    beforeEach(async () => {
        Object.assign(global, {
            fin: createMockFin()
        });
        environment = new FinEnvironment();
    });

    test('The Environment will only attempt to start the app once', async () => {
        for (let i = 0; i < 10; ++i) {
            await environment.startApplication(storedApp);
        }
        expect(fin.Application.createFromManifest).toBeCalledTimes(1);
        expect(fin.Application.createFromManifest).toBeCalledWith(storedApp.manifestUrl);
    });
});
