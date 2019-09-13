import 'reflect-metadata';

import {CreateNotification, RemoveNotifications} from '../../../src/provider/store/Actions';
import {StoredNotification} from '../../../src/provider/model/StoredNotification';
import {createMockServiceStore} from '../../utils/unit/mocks';
import {PartiallyWritable} from '../../types';
import {RootState} from '../../../src/provider/store/State';
import {createFakeStoredNotification, createFakeRootState} from '../../utils/common/fakes';
import {normalizeRootState} from '../../utils/common/normalization';

describe('When creating a notification', () => {
    const mockStore = createMockServiceStore();

    let action: CreateNotification;
    let note: StoredNotification;

    beforeEach(() => {
        jest.resetAllMocks();

        note = createFakeStoredNotification();

        action = new CreateNotification(note);
    });

    describe('When the store does not contain a duplicate notificiation', () => {
        let state: RootState;

        beforeEach(() => {
            state = {
                ...createFakeRootState(),
                notifications: [createFakeStoredNotification()]
            };

            (mockStore as PartiallyWritable<typeof mockStore, 'state'>).state = state;
        });

        test('When the action is dispatched, no other action is dispatched to the store', () => {
            action.dispatch(mockStore);

            expect(mockStore.dispatch).toBeCalledTimes(0);
        });

        test('When the action is reduced, the notification is added to the state', () => {
            expect(normalizeRootState(action.reduce(state))).toEqual(normalizeRootState({...state, notifications: [...state.notifications, note]}));
        });
    });

    describe('When the store contains a notificiation with the same ID', () => {
        let state: RootState;
        let oldNote: StoredNotification;

        beforeEach(() => {
            oldNote = {...note, notification: {...note.notification, title: `Old ${note.notification.title}`}};

            state = {
                ...createFakeRootState(),
                notifications: [oldNote]
            };

            (mockStore as PartiallyWritable<typeof mockStore, 'state'>).state = state;
        });

        test('When the action is dispatched, the duplicate notification is removed from the store', () => {
            action.dispatch(mockStore);

            expect(mockStore.dispatch).toBeCalledTimes(1);
            expect(mockStore.dispatch).toBeCalledWith(new RemoveNotifications([oldNote]));
        });

        test('When the action is reduced, the old notification is replaced in the store', () => {
            expect(normalizeRootState(action.reduce(state))).toEqual(normalizeRootState({...state, notifications: [note]}));
        });
    });
});
