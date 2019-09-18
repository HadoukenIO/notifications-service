import 'reflect-metadata';

import {CreateNotification, RemoveNotifications} from '../../../src/provider/store/Actions';
import {StoredNotification} from '../../../src/provider/model/StoredNotification';
import {createMockServiceStore, getterMock} from '../../utils/unit/mocks';
import {RootState} from '../../../src/provider/store/State';
import {createFakeStoredNotification, createFakeRootState} from '../../utils/unit/fakes';
import {normalizeRootState} from '../../utils/unit/normalization';

const mockServiceStore = createMockServiceStore();

let state: RootState;
let note: StoredNotification;

let action: CreateNotification;

beforeEach(() => {
    jest.resetAllMocks();

    getterMock(mockServiceStore, 'state').mockImplementation(() => state);

    note = createFakeStoredNotification();

    action = new CreateNotification(note);
});

describe('When creating a new notification', () => {
    beforeEach(() => {
        state = {
            ...createFakeRootState(),
            notifications: [createFakeStoredNotification()]
        };
    });

    test('When the action is dispatched, no other action is dispatched to the store', async () => {
        await action.dispatch(mockServiceStore);

        expect(mockServiceStore.dispatch).toBeCalledTimes(1);
        expect(mockServiceStore.dispatch).toBeCalledWith(action);
    });

    test('When the action is reduced, the notification is added to the state', () => {
        expect(normalizeRootState(action.reduce(state))).toEqual(normalizeRootState({...state, notifications: [...state.notifications, note]}));
    });
});

describe('When creating a notification with the same ID as an existing notification', () => {
    let oldNote: StoredNotification;

    beforeEach(() => {
        oldNote = {...note, notification: {...note.notification, title: `Old ${note.notification.title}`}};

        state = {
            ...createFakeRootState(),
            notifications: [oldNote]
        };
    });

    test('When the action is dispatched, the duplicate notification is removed from the store', async () => {
        await action.dispatch(mockServiceStore);

        expect(mockServiceStore.dispatch).toBeCalledTimes(2);
        expect(mockServiceStore.dispatch.mock.calls).toEqual([[new RemoveNotifications([oldNote])], [action]]);
    });

    test('When the action is reduced, the old notification is replaced in the store', () => {
        expect(normalizeRootState(action.reduce(state))).toEqual(normalizeRootState({...state, notifications: [note]}));
    });
});
