import 'reflect-metadata';

import {ExpiryController} from '../../../src/provider/controller/ExpiryController';
import {createMockServiceStore, useMocksInInjector, getterMock} from '../../utils/unit/mocks';
import {createFakeRootState, createFakeStoredNotification, createFakeNotificationInternal} from '../../utils/unit/fakes';
import {RootState} from '../../../src/provider/store/State';
import {RootAction, ExpireNotification, RemoveNotifications} from '../../../src/provider/store/Actions';
import {StoredNotification} from '../../../src/provider/model/StoredNotification';
import {useFakeTime, advanceTime} from '../../utils/unit/time';
import {Injector} from '../../../src/provider/common/Injector';

let state: RootState;

const mockServiceStore = createMockServiceStore();

beforeEach(async () => {
    jest.resetAllMocks();

    useFakeTime();

    // Advance time so we don't need to deal with negative time to work in the past
    await advanceTime(1000);

    useMocksInInjector();

    mockServiceStore.dispatch.mockImplementation(async (action: RootAction) => {
        if (action instanceof RemoveNotifications) {
            state = {...state, notifications: state.notifications.filter(note => !action.notifications.includes(note))};
        }
    });

    getterMock(mockServiceStore, 'state').mockImplementation(() => state);

    new ExpiryController(mockServiceStore);
});

test('When the service is started with notification that expired in the past, the notification is expired as expected', async () => {
    const expiredNotification = createFakeExpiringStoredNotification(100);

    state = {
        ...createFakeRootState(),
        notifications: [expiredNotification]
    };

    await Injector.init();

    expect(mockServiceStore.dispatch).toBeCalledTimes(2);
    expect(mockServiceStore.dispatch).toBeCalledWith(new ExpireNotification(expiredNotification));
    expect(mockServiceStore.dispatch).toBeCalledWith(new RemoveNotifications([expiredNotification]));
});

test('When the service is started with multiple notifications that expired in the past, the notifications are expired in order', async () => {
    const expiredNotification1 = createFakeExpiringStoredNotification(100);
    const expiredNotification2 = createFakeExpiringStoredNotification(200);
    const expiredNotification3 = createFakeExpiringStoredNotification(300);

    state = {
        ...createFakeRootState(),
        // Intentionally out of order, so we know expiry ordering is determined by time, and not order in store
        notifications: [expiredNotification2, expiredNotification1, expiredNotification3]
    };

    await Injector.init();

    expect(mockServiceStore.dispatch.mock.calls).toEqual([
        [new ExpireNotification(expiredNotification1)],
        [new RemoveNotifications([expiredNotification1])],
        [new ExpireNotification(expiredNotification2)],
        [new RemoveNotifications([expiredNotification2])],
        [new ExpireNotification(expiredNotification3)],
        [new RemoveNotifications([expiredNotification3])]
    ]);
});

function createFakeExpiringStoredNotification(expires: number): StoredNotification {
    return {
        ...createFakeStoredNotification(),
        notification: {
            ...createFakeNotificationInternal(),
            expires
        }
    };
}
