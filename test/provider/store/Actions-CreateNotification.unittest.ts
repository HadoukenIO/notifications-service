import 'reflect-metadata';

import {CreateNotification, RemoveNotifications} from '../../../src/provider/store/Actions';
import {StoredNotification} from '../../../src/provider/model/StoredNotification';
import {createMockServiceStore, getterMock} from '../../utils/unit/mocks';
import {RootState} from '../../../src/provider/store/State';
import {createFakeStoredNotification, createFakeEmptyRootState} from '../../utils/unit/fakes';
import {normalizeRootState} from '../../utils/unit/normalization';
import {Action} from '../../../src/provider/store/Store';

const mockServiceStore = createMockServiceStore();

let state: RootState;
let note: StoredNotification;

beforeEach(() => {
    jest.resetAllMocks();

    mockServiceStore.dispatch.mockImplementation(async (action: Action<RootState>) => {
        state = action.reduce(state);
    });

    getterMock(mockServiceStore, 'state').mockImplementation(() => state);

    note = createFakeStoredNotification();

    state = {
        ...createFakeEmptyRootState(),
        notifications: [note]
    };
});

describe('When creating a new notification', () => {
    let newNote: StoredNotification;
    let action: CreateNotification;

    beforeEach(() => {
        newNote = createFakeStoredNotification();
        action = new CreateNotification(newNote);
    });

    test('When the action is dispatched, no other action is dispatched to the store', async () => {
        await action.dispatch(mockServiceStore);

        expect(mockServiceStore.dispatch).toBeCalledTimes(1);
        expect(mockServiceStore.dispatch).toBeCalledWith(action);
    });

    test('When the action is dispatched, the notification is added to the state', async () => {
        await action.dispatch(mockServiceStore);

        expect(normalizeRootState(state)).toEqual(normalizeRootState({...state, notifications: [note, newNote]}));
    });
});

describe('When creating a notification with the same ID as an existing notification', () => {
    let newNote: StoredNotification;
    let action: CreateNotification;

    beforeEach(() => {
        newNote = {...note, notification: {...note.notification, title: `New ${note.notification.title}`}};
        action = new CreateNotification(newNote);
    });

    test('When the action is dispatched, a remove action is also dispatched', async () => {
        await action.dispatch(mockServiceStore);

        expect(mockServiceStore.dispatch).toBeCalledTimes(2);
        expect(mockServiceStore.dispatch.mock.calls).toEqual([[new RemoveNotifications([note])], [action]]);
    });

    test('When the action is dispatched, the old notification is replaced in the store', async () => {
        await action.dispatch(mockServiceStore);

        expect(normalizeRootState(state)).toEqual(normalizeRootState({...state, notifications: [newNote]}));
    });
});
