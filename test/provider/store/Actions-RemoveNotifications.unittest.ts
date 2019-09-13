import 'reflect-metadata';

import {RemoveNotifications} from '../../../src/provider/store/Actions';
import {StoredNotification} from '../../../src/provider/model/StoredNotification';
import {createMockServiceStore} from '../../utils/unit/mocks';
import {PartiallyWritable} from '../../types';
import {RootState} from '../../../src/provider/store/State';
import {createFakeStoredNotification, createFakeRootState} from '../../utils/common/fakes';
import {normalizeRootState} from '../../utils/common/normalization';

describe('When removing notifications', () => {
    const mockStore = createMockServiceStore();

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
            ...createFakeRootState(),
            notifications: [note1, note2, note3]
        };

        (Object.getOwnPropertyDescriptor(mockStore, 'state')!.get as jest.Mock<RootState, []>).mockImplementation(() => state);
    });

    test('When removing a single notification from the store, the notification is removed from the store', () => {
        const action = new RemoveNotifications([note2]);

        expect(normalizeRootState(action.reduce(state))).toEqual(normalizeRootState({...state, notifications: [note1, note3]}));
    });

    test('When removing multiple notifications from the store, the notifications are removed from the store', () => {
        const action = new RemoveNotifications([note2, note3]);

        expect(normalizeRootState(action.reduce(state))).toEqual(normalizeRootState({...state, notifications: [note1]}));
    });

    test('When removing a notification that is not in the store, no notifications are removed from the store', () => {
        const action = new RemoveNotifications([createFakeStoredNotification()]);

        expect(normalizeRootState(action.reduce(state))).toEqual(normalizeRootState({...state, notifications: [note1, note2, note3]}));
    });

    test('When removing a mix of notification that are and are not in the store, the notifications that are in the store are removed', () => {
        const action = new RemoveNotifications([createFakeStoredNotification(), note3]);

        expect(normalizeRootState(action.reduce(state))).toEqual(normalizeRootState({...state, notifications: [note1, note2]}));
    });

    test('When removing the same notification twice, the notification is removed from the store', () => {
        const action = new RemoveNotifications([note1, note1]);

        expect(normalizeRootState(action.reduce(state))).toEqual(normalizeRootState({...state, notifications: [note2, note3]}));
    });
});
