import 'reflect-metadata';

import {RootAction, RegisterApplication} from '../../../src/provider/store/Actions';
import {createMockServiceStore} from '../../utils/unit/mocks';
import {RootState} from '../../../src/provider/store/State';
import {createFakeRootState, createFakeStoredApplication} from '../../utils/common/fakes';

describe('When regsitering an application', () => {
    const mockServiceStore = createMockServiceStore();
    let state: RootState;

    beforeEach(() => {
        jest.resetAllMocks();

        state = createFakeRootState();

        mockServiceStore.dispatch.mockImplementation(async (action: RootAction) => {
            state = action.reduce(state);
        });

        (Object.getOwnPropertyDescriptor(mockServiceStore, 'state')!.get as jest.Mock<RootState, []>).mockImplementation(() => state);
    });

    test('When registering an application, the application is added to the store', () => {
        const storedApplication = createFakeStoredApplication();

        const action = new RegisterApplication(storedApplication);

        expect(action.reduce(state).applications.get(storedApplication.id)).toEqual(storedApplication);
    });
});
