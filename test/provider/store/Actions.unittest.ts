import 'reflect-metadata';

import {ClickNotification, ClickButton, ExpireNotification, RemoveNotifications} from '../../../src/provider/store/Actions';
import {Action} from '../../../src/provider/store/Store';
import {RootState} from '../../../src/provider/store/State';
import {StoredNotification} from '../../../src/provider/model/StoredNotification';
import {createMockServiceStore, getterMock} from '../../utils/unit/mocks';
import {createFakeStoredNotification} from '../../utils/unit/fakes';

type TestParam = [string, (note: StoredNotification) => Action<RootState>];

const mockServiceStore = createMockServiceStore();

let state: RootState;

beforeEach(() => {
    jest.resetAllMocks();

    getterMock(mockServiceStore, 'state').mockImplementation(() => state);
});

/*
test.each([
    ['a notification is clicked', (note: StoredNotification) => new ClickNotification(note)],
    ['a button on a notification is clicked', (note: StoredNotification) => new ClickButton(note, 0)],
    ['a notification expires', (note: StoredNotification) => new ExpireNotification(note)]
] as TestParam[])('When %s, the notification is also removed', (titleParam: string, actionFactory: (note: StoredNotification) => Action<RootState>) => {
    const note = createFakeStoredNotification();
    const action = actionFactory(note);

    action.dispatch(mockServiceStore);

    expect(mockServiceStore.dispatch).toBeCalledTimes(2);
    expect(mockServiceStore.dispatch.mock.calls[1]).toEqual(new RemoveNotifications([note]));
});
*/
