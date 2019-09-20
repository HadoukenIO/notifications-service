import 'reflect-metadata';

import {ClickNotification, ClickButton, ExpireNotification, RemoveNotifications} from '../../../src/provider/store/Actions';
import {Action} from '../../../src/provider/store/Store';
import {RootState} from '../../../src/provider/store/State';
import {StoredNotification} from '../../../src/provider/model/StoredNotification';
import {createMockServiceStore, getterMock} from '../../utils/unit/mocks';
import {createFakeStoredNotification, createFakeEmptyRootState} from '../../utils/unit/fakes';

type TestParam = [string, (note: StoredNotification) => Action<RootState>];

const mockServiceStore = createMockServiceStore();

let state: RootState;
let note: StoredNotification;

beforeEach(() => {
    jest.resetAllMocks();

    note = createFakeStoredNotification();
    state = {...createFakeEmptyRootState(), notifications: [note]};

    getterMock(mockServiceStore, 'state').mockImplementation(() => state);
    mockServiceStore.dispatch.mockImplementation(async (action: Action<RootState>) => {
        state = action.reduce(state);
    });
});

test.each([
    ['a notification is clicked', (note: StoredNotification) => new ClickNotification(note)],
    ['a button on a notification is clicked', (note: StoredNotification) => new ClickButton(note, 0)],
    ['a notification expires', (note: StoredNotification) => new ExpireNotification(note)]
] as TestParam[])(
    'When %s, it removed synchronously from the store',
    async (titleParam: string, actionFactory: (note: StoredNotification) => Action<RootState>) => {
        const action = actionFactory(note);

        const promise = action.dispatch(mockServiceStore);

        expect(mockServiceStore.dispatch).toBeCalledWith(new RemoveNotifications([note]));

        await promise;
    }
);
