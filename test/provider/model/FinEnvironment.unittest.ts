import 'reflect-metadata';

import {EventEmitter} from 'events';

import {Application} from 'openfin/_v2/main';

import {FinEnvironment} from '../../../src/provider/model/FinEnvironment';
import {StoredApplication} from '../../../src/provider/model/Environment';
import {createMockFin, createMockApplication} from '../../utils/unit/mocks';
import {createFakeManifestStoredApplication, createFakeProgrammaticApplication} from '../../utils/unit/fakes';

const mockFin = createMockFin();

let environment: FinEnvironment;

beforeEach(() => {
    jest.resetAllMocks();

    environment = new FinEnvironment();
});

describe('When launching a manifest application', () => {
    testLaunch(
        mockFin.Application.createFromManifest,
        createFakeManifestStoredApplication,
        (application) => application.manifestUrl
    );
});

describe('When launching a programmatic application', () => {
    testLaunch(
        mockFin.Application.create,
        createFakeProgrammaticApplication,
        (application) => application.initialOptions
    );
});

function testLaunch<TStoredApplication extends StoredApplication, TCreateParam>(
    mockCreate: jest.Mock<Promise<Application>, [TCreateParam]>,
    createFakeStoredApplication: () => TStoredApplication,
    extractCreateParameter: (param: TStoredApplication) => TCreateParam
): void {
    let storedApp: TStoredApplication;

    beforeEach(() => {
        storedApp = createFakeStoredApplication();

        mockCreate.mockResolvedValue(createMockApplication());
    });

    test('The app is launched through the OpenFin runtime', async () => {
        await environment.startApplication(storedApp);

        expect(mockCreate).toBeCalledTimes(1);
        expect(mockCreate).toBeCalledWith(extractCreateParameter(storedApp));
    });

    test('Subsequent attempts to launch the same application are ignored', async () => {
        await environment.startApplication(storedApp);

        for (let i = 0; i < 10; i++) {
            await environment.startApplication(storedApp);
        }

        expect(mockCreate).toBeCalledTimes(1);
    });

    test('If app launch fails, we can attempt to launch the app again', async () => {
        mockCreate.mockRejectedValueOnce(new Error()).mockResolvedValue(createMockApplication());

        await environment.startApplication(storedApp);
        await environment.startApplication(storedApp);

        expect(mockCreate).toBeCalledTimes(2);
    });

    test('Once the app is initialized, we can attempt to launch the app again', async () => {
        const mockApp = new EventEmitter() as unknown as Application;
        Object.assign(mockApp, {
            run: jest.fn<Promise<void>, []>()
        });

        mockCreate.mockResolvedValue(mockApp);

        await environment.startApplication(storedApp);
        mockApp.emit('initialized', {uuid: storedApp.id, type: 'initialized', topic: 'application'});
        await environment.startApplication(storedApp);

        expect(mockCreate).toBeCalledTimes(2);
    });

    test('Subsequent attempts to launch a different application are not ignored', async () => {
        const otherApplication = createFakeStoredApplication();

        await environment.startApplication(storedApp);
        await environment.startApplication(otherApplication);

        expect(mockCreate).toBeCalledTimes(2);
        expect(mockCreate.mock.calls[1]).toEqual([extractCreateParameter(otherApplication)]);
    });
}
