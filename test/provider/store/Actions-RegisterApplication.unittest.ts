import 'reflect-metadata';

import {RegisterApplication} from '../../../src/provider/store/Actions';
import {createMockServiceStore, getterMock} from '../../utils/unit/mocks';
import {RootState} from '../../../src/provider/store/State';
import {createFakeRootState, createFakeStoredApplication} from '../../utils/unit/fakes';
import { Action } from '../../../src/provider/store/Store';

const mockServiceStore = createMockServiceStore();
let state: RootState;

beforeEach(() => {
    jest.resetAllMocks();

    state = createFakeRootState();

    mockServiceStore.dispatch.mockImplementation(async (action: Action<RootState>) => {
        state = action.reduce(state);
    });

    getterMock(mockServiceStore, 'state').mockImplementation(() => state);
});

test('When registering an application, the application is added to the store', async () => {
    const storedApplication = createFakeStoredApplication();

    const action = new RegisterApplication(storedApplication);
    await action.dispatch(mockServiceStore);

    expect(state.applications.get(storedApplication.id)).toEqual(storedApplication);
});
