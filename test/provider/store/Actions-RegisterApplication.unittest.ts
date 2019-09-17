import 'reflect-metadata';

import {RootAction, RegisterApplication} from '../../../src/provider/store/Actions';
import {createMockServiceStore, getterMock} from '../../utils/unit/mocks';
import {RootState} from '../../../src/provider/store/State';
import {createFakeRootState, createFakeStoredApplication} from '../../utils/unit/fakes';

const mockServiceStore = createMockServiceStore();
let state: RootState;

beforeEach(() => {
    jest.resetAllMocks();

    state = createFakeRootState();

    mockServiceStore.dispatch.mockImplementation(async (action: RootAction) => {
        state = action.reduce(state);
    });

    getterMock(mockServiceStore, 'state').mockImplementation(() => state);
});

test('When registering an application, the application is added to the store', () => {
    const storedApplication = createFakeStoredApplication();

    const action = new RegisterApplication(storedApplication);

    expect(action.reduce(state).applications.get(storedApplication.id)).toEqual(storedApplication);
});
