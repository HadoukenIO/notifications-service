import 'reflect-metadata';

import {RemoveNotifications} from '../../../src/provider/store/Actions';
import {StoredNotification} from '../../../src/provider/model/StoredNotification';
import {createMockServiceStore, getterMock} from '../../utils/unit/mocks';
import {RootState} from '../../../src/provider/store/State';
import {createFakeStoredNotification, createFakeEmptyRootState} from '../../utils/unit/fakes';
import {normalizeRootState} from '../../utils/unit/normalization';
import {Action} from '../../../src/provider/store/Store';

const mockServiceStore = createMockServiceStore();

let note1: StoredNotification;
let note2: StoredNotification;
let note3: StoredNotification;

let state: RootState;

beforeEach(() => {
    jest.resetAllMocks();

    note1 = createFakeStoredNotification();
    note2 = createFakeStoredNotification();
    note3 = createFakeStoredNotification();

    state = {
        ...createFakeEmptyRootState(),
        notifications: [note1, note2, note3]
    };

    mockServiceStore.dispatch.mockImplementation(async (action: Action<RootState>) => {
        state = action.reduce(state);
    });

    getterMock(mockServiceStore, 'state').mockImplementation(() => state);
});

test('When removing a single notification from the store, the notification is removed from the store', async () => {
    const action = new RemoveNotifications([note2]);
    await action.dispatch(mockServiceStore);

    expect(normalizeRootState(state)).toEqual(normalizeRootState({...state, notifications: [note1, note3]}));
});

test('When removing multiple notifications from the store, the notifications are removed from the store', async () => {
    const action = new RemoveNotifications([note2, note3]);
    await action.dispatch(mockServiceStore);

    expect(normalizeRootState(state)).toEqual(normalizeRootState({...state, notifications: [note1]}));
});

test('When removing a notification that is not in the store, no notifications are removed from the store', async () => {
    const action = new RemoveNotifications([createFakeStoredNotification()]);
    await action.dispatch(mockServiceStore);

    expect(normalizeRootState(state)).toEqual(normalizeRootState({...state, notifications: [note1, note2, note3]}));
});

test('When removing a mix of notification that are and are not in the store, the notifications that are in the store are removed', async () => {
    const action = new RemoveNotifications([createFakeStoredNotification(), note3]);
    await action.dispatch(mockServiceStore);

    expect(normalizeRootState(state)).toEqual(normalizeRootState({...state, notifications: [note1, note2]}));
});

test('When removing the same notification twice, the notification is removed from the store', async () => {
    const action = new RemoveNotifications([note1, note1]);
    await action.dispatch(mockServiceStore);

    expect(normalizeRootState(state)).toEqual(normalizeRootState({...state, notifications: [note2, note3]}));
});
