import 'jest';
import 'reflect-metadata';

import {EventEmitter} from 'events';

import {ApplicationOption} from 'openfin/_v2/api/application/applicationOption';
import {Application} from 'openfin/_v2/main';

import {FinEnvironment} from '../../../src/provider/model/FinEnvironment';
import {StoredApplication} from '../../../src/provider/model/Environment';
import {createMockFin, createMockApplication} from '../../utils/unit/mocks';
import {createFakeManifestStoredApplication as createFakeManifestStoredApplication, createFakeProgrammaticApplication} from '../../utils/unit/fakes';

const mockFin = createMockFin();

let environment: FinEnvironment;

beforeEach(async () => {
    jest.resetAllMocks();

    environment = new FinEnvironment();

    mockFin.Application.wrapSync;
});

describe('When launching a manifest application', () => {
    let manifestApp: StoredApplication & {type: 'manifest', manifestUrl: string};

    let mockCreateFromManifest: jest.Mock<Promise<Application>, [string]>;

    beforeEach(() => {
        manifestApp = createFakeManifestStoredApplication();

        mockCreateFromManifest = mockFin.Application.createFromManifest;

        mockCreateFromManifest.mockResolvedValue(createMockApplication());
    });

    test('The app is launched through the OpenFin runtime', async () => {
        await environment.startApplication(manifestApp);

        expect(mockCreateFromManifest).toBeCalledTimes(1);
        expect(mockCreateFromManifest).toBeCalledWith(manifestApp.manifestUrl);
    });

    test('Subsequent attempts to launch the same application are ignored', async () => {
        await environment.startApplication(manifestApp);

        for (let i = 0; i < 10; i++) {
            await environment.startApplication(manifestApp);
        }

        expect(mockCreateFromManifest).toBeCalledTimes(1);
    });

    test('Subsequent attempts to launch a different application are not ignored', async () => {
        const otherApplication = createFakeManifestStoredApplication();

        await environment.startApplication(manifestApp);
        await environment.startApplication(otherApplication);

        expect(mockCreateFromManifest).toBeCalledTimes(2);
        expect(mockCreateFromManifest.mock.calls[1]).toEqual([otherApplication.manifestUrl]);
    });

    test('Once the app is initialized, we can attempt to launch the app again', async () => {
        const mockApp = new EventEmitter() as unknown as Application;
        Object.assign(mockApp, {
            run: jest.fn<Promise<void>, []>()
        });

        mockCreateFromManifest.mockResolvedValue(mockApp);

        await environment.startApplication(manifestApp);
        mockApp.emit('initialized', {uuid: manifestApp.id, type: 'initialized', topic: 'application'});
        await environment.startApplication(manifestApp);

        expect(mockCreateFromManifest).toBeCalledTimes(2);
    });

    test('If app launch fails, we can attempt to launch the app again', async () => {
        mockCreateFromManifest.mockImplementationOnce(async () => {
            throw new Error();
        }).mockResolvedValue(createMockApplication());

        await environment.startApplication(manifestApp);
        await environment.startApplication(manifestApp);

        expect(mockCreateFromManifest).toBeCalledTimes(2);
    });
});

describe('When launching a programmatic application', () => {
    let programmaticApp: StoredApplication & {type: 'programmatic', initialOptions: ApplicationOption};

    let mockCreate: jest.Mock<Promise<Application>, [ApplicationOption]>;

    beforeEach(() => {
        programmaticApp = createFakeProgrammaticApplication();

        mockCreate = mockFin.Application.create;

        mockCreate.mockResolvedValue(createMockApplication());
    });

    test('The app is launched through the OpenFin runtime', async () => {
        await environment.startApplication(programmaticApp);

        expect(mockCreate).toBeCalledTimes(1);
        expect(mockCreate).toBeCalledWith(programmaticApp.initialOptions);
    });

    test('Subsequent attempts to launch the same application are ignored', async () => {
        await environment.startApplication(programmaticApp);

        for (let i = 0; i < 1; i++) {
            await environment.startApplication(programmaticApp);
        }

        expect(mockCreate).toBeCalledTimes(1);
    });

    test('Subsequent attempts to launch a different application are not ignored', async () => {
        const otherApplication = createFakeProgrammaticApplication();

        await environment.startApplication(programmaticApp);
        await environment.startApplication(otherApplication);

        expect(mockCreate).toBeCalledTimes(2);
        expect(mockCreate.mock.calls[1]).toEqual([otherApplication.initialOptions]);
    });

    test('Once the app is initialized, we can attempt to launch the app again', async () => {
        const mockApp = new EventEmitter() as unknown as Application;
        Object.assign(mockApp, {
            run: jest.fn<Promise<void>, []>()
        });

        mockCreate.mockResolvedValue(mockApp);

        await environment.startApplication(programmaticApp);
        mockApp.emit('initialized', {uuid: programmaticApp.id, type: 'initialized', topic: 'application'});
        await environment.startApplication(programmaticApp);

        expect(mockCreate).toBeCalledTimes(2);
    });

    test('If app launch fails, we can attempt to launch the app again', async () => {
        mockCreate.mockImplementationOnce(async () => {
            throw new Error();
        }).mockResolvedValue(createMockApplication());

        await environment.startApplication(programmaticApp);
        await environment.startApplication(programmaticApp);

        expect(mockCreate).toBeCalledTimes(2);
    });
});
