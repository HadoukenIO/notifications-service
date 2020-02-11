import 'reflect-metadata';

import {Signal} from 'openfin-service-signal';
import {Identity} from 'openfin/_v2/main';
import {ChannelProvider} from 'openfin/_v2/api/interappbus/channel/provider';

import {EventPump} from '../../../src/provider/model/EventPump';
import {NotificationClosedEvent, NotificationActionEvent} from '../../../src/client';
import {Targeted, Transport} from '../../../src/client/EventRouter';
import {createMockApiHandler, createMockClientRegistry, getterMock} from '../../utils/unit/mocks';
import {createFakeUuid, createFakeIdentity} from '../../utils/unit/fakes';

beforeEach(() => {
    jest.resetAllMocks();
});

const mockApiHandler = createMockApiHandler();
const mockClientRegistry = createMockClientRegistry();

const fakeAppUuid = createFakeUuid();
const fakeWindow1 = {...createFakeIdentity(), uuid: fakeAppUuid};
const fakeWindow2 = {...createFakeIdentity(), uuid: fakeAppUuid};

let eventPump: EventPump;

beforeEach(() => {
    getterMock(mockApiHandler, 'channel').mockReturnValue({} as ChannelProvider);
    getterMock(mockClientRegistry, 'onAppActionReady').mockReturnValue(new Signal<[Identity]>());

    eventPump = new EventPump(mockClientRegistry, mockApiHandler);
});

describe('When pushing a non-action event', () => {
    const mockNotificationClosedEvent: Targeted<Transport<NotificationClosedEvent>> = {
        type: 'notification-closed'
    } as Targeted<Transport<NotificationClosedEvent>>;

    test('When one window is open, that window receives the event', () => {
        mockApiHandler.getClientConnections.mockReturnValue([fakeWindow1]);

        eventPump.push<NotificationClosedEvent>(fakeAppUuid, mockNotificationClosedEvent);

        expect(mockApiHandler.dispatchEvent).toBeCalledTimes(1);
        expect(mockApiHandler.dispatchEvent).toBeCalledWith(fakeWindow1, mockNotificationClosedEvent);
    });

    test('When multiple windows are open, all windows receive the event', () => {
        mockApiHandler.getClientConnections.mockReturnValue([fakeWindow1, fakeWindow2]);

        eventPump.push<NotificationClosedEvent>(fakeAppUuid, mockNotificationClosedEvent);

        expect(mockApiHandler.dispatchEvent).toBeCalledTimes(2);
        expect(mockApiHandler.dispatchEvent).toBeCalledWith(fakeWindow1, mockNotificationClosedEvent);
        expect(mockApiHandler.dispatchEvent).toBeCalledWith(fakeWindow2, mockNotificationClosedEvent);
    });

    test('When the app is not running, the event is discarded', () => {
        mockApiHandler.getClientConnections.mockReturnValue([]);

        eventPump.push<NotificationClosedEvent>(fakeAppUuid, mockNotificationClosedEvent);

        expect(mockApiHandler.dispatchEvent).toBeCalledTimes(0);

        // Start the app, and check the event is still not dispatched
        mockApiHandler.getClientConnections.mockReturnValue([fakeWindow1]);
        mockClientRegistry.onAppActionReady.emit(fakeWindow1);

        expect(mockApiHandler.dispatchEvent).toBeCalledTimes(0);
    });
});

describe('When pushing an action event', () => {
    const mockNotificationActionEvent: Targeted<Transport<NotificationActionEvent>> = {
        type: 'notification-action'
    } as Targeted<Transport<NotificationActionEvent>>;

    test('When one window is open and the app is action-ready, that window receives the event', () => {
        mockApiHandler.getClientConnections.mockReturnValue([fakeWindow1]);

        mockClientRegistry.isAppActionReady.mockImplementation((uuid: string) => {
            return uuid === fakeAppUuid;
        });

        eventPump.push<NotificationActionEvent>(fakeAppUuid, mockNotificationActionEvent);

        expect(mockApiHandler.dispatchEvent).toBeCalledTimes(1);
        expect(mockApiHandler.dispatchEvent).toBeCalledWith(fakeWindow1, mockNotificationActionEvent);
    });

    test('When multiple windows are open, and the app is action-ready. all windows receive the event', () => {
        mockApiHandler.getClientConnections.mockReturnValue([fakeWindow1, fakeWindow2]);

        mockClientRegistry.isAppActionReady.mockImplementation((uuid: string) => {
            return uuid === fakeAppUuid;
        });

        eventPump.push<NotificationActionEvent>(fakeAppUuid, mockNotificationActionEvent);

        expect(mockApiHandler.dispatchEvent).toBeCalledTimes(2);
        expect(mockApiHandler.dispatchEvent).toBeCalledWith(fakeWindow1, mockNotificationActionEvent);
        expect(mockApiHandler.dispatchEvent).toBeCalledWith(fakeWindow2, mockNotificationActionEvent);
    });

    test('When the app is running, but not action ready, and the event queued until the app is action-ready', () => {
        mockApiHandler.getClientConnections.mockReturnValue([]);
        mockClientRegistry.isAppActionReady.mockReturnValue(false);

        eventPump.push<NotificationActionEvent>(fakeAppUuid, mockNotificationActionEvent);

        expect(mockApiHandler.dispatchEvent).toBeCalledTimes(0);

        // Make the app action-ready, and check the event is dispatched
        mockClientRegistry.isAppActionReady.mockImplementation((uuid: string) => {
            return uuid === fakeAppUuid;
        });
        mockClientRegistry.onAppActionReady.emit(fakeWindow1);

        expect(mockApiHandler.dispatchEvent).toBeCalledTimes(1);
        expect(mockApiHandler.dispatchEvent).toBeCalledWith(fakeWindow1, mockNotificationActionEvent);
    });

    test('When the app is not running, the app will be started, the event will be queued until the app starts and is action-ready', () => {
        mockApiHandler.getClientConnections.mockReturnValue([]);
        mockClientRegistry.isAppActionReady.mockReturnValue(false);

        eventPump.push<NotificationActionEvent>(fakeAppUuid, mockNotificationActionEvent);

        expect(mockApiHandler.dispatchEvent).toBeCalledTimes(0);

        // Start the app, and check the event is dispatched
        mockApiHandler.getClientConnections.mockReturnValue([fakeWindow1]);
        mockClientRegistry.isAppActionReady.mockImplementation((uuid: string) => {
            return uuid === fakeAppUuid;
        });

        mockClientRegistry.onAppActionReady.emit(fakeWindow1);

        expect(mockApiHandler.dispatchEvent).toBeCalledTimes(1);
        expect(mockApiHandler.dispatchEvent).toBeCalledWith(fakeWindow1, mockNotificationActionEvent);
    });
});
