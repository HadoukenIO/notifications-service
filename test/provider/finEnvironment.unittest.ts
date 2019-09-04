import 'jest';
import 'reflect-metadata';

import {FinEnvironment} from '../../src/provider/model/FinEnvironment';
import {StoredApplication} from '../../src/provider/model/Environment';

describe('When the same app is attempted to be launched multiple times instantaneously through the Environment', () => {
    const storedApp: StoredApplication = {
        type: 'manifest',
        id: 'cr-test-app',
        manifestUrl: 'some-manifest-url'
    };
    let environment: FinEnvironment;

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
        environment = new FinEnvironment();
    });

    it('The Environment will only attempt to start the app once', async () => {
        for (let i = 0; i < 10; ++i) {
            await environment.startApplication(storedApp);
        }
        expect(fin.Application.createFromManifest).toBeCalledTimes(1);
        expect(fin.Application.createFromManifest).toBeCalledWith(storedApp.manifestUrl);
    });
});
