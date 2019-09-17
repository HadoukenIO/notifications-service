import 'reflect-metadata';

import {ClickNotification, ClickButton, ExpireNotification, RemoveNotifications} from '../../../src/provider/store/Actions';
import {Action} from '../../../src/provider/store/Store';
import {RootState} from '../../../src/provider/store/State';
import {StoredNotification} from '../../../src/provider/model/StoredNotification';
import {createMockServiceStore, getterMock} from '../../utils/unit/mocks';

type TestParam = [string, (note: StoredNotification) => Action<RootState>];

const mockServiceStore = createMockServiceStore();

let state: RootState;

beforeEach(() => {
    jest.resetAllMocks();

    getterMock(mockServiceStore, 'state').mockImplementation(() => state);
});

describe.each([
    ['a notification is clicked', (note: StoredNotification) => new ClickNotification(note)],
    ['a button on a notification is clicked', (note: StoredNotification) => new ClickButton(note, 0)],
    ['a notification expires', (note: StoredNotification) => new ExpireNotification(note)]
] as TestParam[])('When %s', (titleParam: string, actionFactory: (note: StoredNotification) => Action<RootState>) => {
    test.todo('The notification is also removed');
});
