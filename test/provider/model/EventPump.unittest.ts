import 'reflect-metadata';

import {Signal} from 'openfin-service-signal';
import {Identity} from 'openfin/_v2/main';

import {EventPump} from '../../../src/provider/model/EventPump';
import {NotificationClosedEvent, NotificationActionEvent} from '../../../src/client';
import {Targeted, Transport} from '../../../src/client/EventRouter';
import {createMockApiHandler, createMockClientRegistry, getterMock} from '../../utils/unit/mocks';

beforeEach(() => {
    jest.resetAllMocks();
});

const mockUuid = 'mock-app';
const mockWindow1 = {uuid: mockUuid, name: 'mock-window-1'};
const mockWindow2 = {uuid: mockUuid, name: 'mock-window-2'};

const mockApiHandler = createMockApiHandler();
const mockClientRegistry = createMockClientRegistry();

let eventPump: EventPump;
beforeEach(() => {
    getterMock(mockClientRegistry, 'onAppActionReady').mockReturnValue(new Signal<[Identity]>());

    eventPump = new EventPump(mockClientRegistry, mockApiHandler);
});

describe('When pushing a non-action event', () => {
    const mockNotificationClosedEvent: Targeted<Transport<NotificationClosedEvent>> = {
        type: 'notification-closed'
    } as Targeted<Transport<NotificationClosedEvent>>;

    test('When one window is open, that window receives the event', () => {
        mockApiHandler.getClientConnections.mockReturnValue([mockWindow1]);

        eventPump.push<NotificationClosedEvent>(mockUuid, mockNotificationClosedEvent);

        expect(mockApiHandler.dispatchEvent).toBeCalledTimes(1);
        expect(mockApiHandler.dispatchEvent).toBeCalledWith(mockWindow1, mockNotificationClosedEvent);
    });

    test('When multiple windows are open, all windows receive the event', () => {
        mockApiHandler.getClientConnections.mockReturnValue([mockWindow1, mockWindow2]);

        eventPump.push<NotificationClosedEvent>(mockUuid, mockNotificationClosedEvent);

        expect(mockApiHandler.dispatchEvent).toBeCalledTimes(2);
        expect(mockApiHandler.dispatchEvent).toBeCalledWith(mockWindow1, mockNotificationClosedEvent);
        expect(mockApiHandler.dispatchEvent).toBeCalledWith(mockWindow2, mockNotificationClosedEvent);
    });

    test('When the app is not running, the event is discarded', () => {
        mockApiHandler.getClientConnections.mockReturnValue([]);

        eventPump.push<NotificationClosedEvent>(mockUuid, mockNotificationClosedEvent);

        expect(mockApiHandler.dispatchEvent).toBeCalledTimes(0);

        // Start the app, and check the event is still not dispatched
        mockApiHandler.getClientConnections.mockReturnValue([mockWindow1]);
        mockClientRegistry.onAppActionReady.emit(mockWindow1);

        expect(mockApiHandler.dispatchEvent).toBeCalledTimes(0);
    });
});

describe('When pushing an action event', () => {
    const mockNotificationActionEvent: Targeted<Transport<NotificationActionEvent>> = {
        type: 'notification-action'
    } as Targeted<Transport<NotificationActionEvent>>;

    test('When one window is open and the app is action-ready, that window receives the event', () => {
        mockApiHandler.getClientConnections.mockReturnValue([mockWindow1]);

        mockClientRegistry.isAppActionReady.mockImplementation((uuid: string) => {
            return uuid === mockUuid;
        });

        eventPump.push<NotificationActionEvent>(mockUuid, mockNotificationActionEvent);

        expect(mockApiHandler.dispatchEvent).toBeCalledTimes(1);
        expect(mockApiHandler.dispatchEvent).toBeCalledWith(mockWindow1, mockNotificationActionEvent);
    });

    test('When multiple windows are open, and the app is action-ready. all windows receive the event', () => {
        mockApiHandler.getClientConnections.mockReturnValue([mockWindow1, mockWindow2]);

        mockClientRegistry.isAppActionReady.mockImplementation((uuid: string) => {
            return uuid === mockUuid;
        });

        eventPump.push<NotificationActionEvent>(mockUuid, mockNotificationActionEvent);

        expect(mockApiHandler.dispatchEvent).toBeCalledTimes(2);
        expect(mockApiHandler.dispatchEvent).toBeCalledWith(mockWindow1, mockNotificationActionEvent);
        expect(mockApiHandler.dispatchEvent).toBeCalledWith(mockWindow2, mockNotificationActionEvent);
    });

    test('When the app is running, but not action ready, and the event queued until the app is action-ready', () => {
        mockApiHandler.getClientConnections.mockReturnValue([]);
        mockClientRegistry.isAppActionReady.mockReturnValue(false);

        eventPump.push<NotificationActionEvent>(mockUuid, mockNotificationActionEvent);

        expect(mockApiHandler.dispatchEvent).toBeCalledTimes(0);

        // Make the app action-ready, and check the event is dispatched
        mockClientRegistry.isAppActionReady.mockImplementation((uuid: string) => {
            return uuid === mockUuid;
        });
        mockClientRegistry.onAppActionReady.emit(mockWindow1);

        expect(mockApiHandler.dispatchEvent).toBeCalledTimes(1);
        expect(mockApiHandler.dispatchEvent).toBeCalledWith(mockWindow1, mockNotificationActionEvent);
    });

    test('When the app is not running, the app will be started, the event will be queued until the app starts and is action-ready', () => {
        mockApiHandler.getClientConnections.mockReturnValue([]);
        mockClientRegistry.isAppActionReady.mockReturnValue(false);

        eventPump.push<NotificationActionEvent>(mockUuid, mockNotificationActionEvent);

        expect(mockApiHandler.dispatchEvent).toBeCalledTimes(0);

        // Start the app, and check the event is dispatched
        mockApiHandler.getClientConnections.mockReturnValue([mockWindow1]);
        mockClientRegistry.isAppActionReady.mockImplementation((uuid: string) => {
            return uuid === mockUuid;
        });

        mockClientRegistry.onAppActionReady.emit(mockWindow1);

        expect(mockApiHandler.dispatchEvent).toBeCalledTimes(1);
        expect(mockApiHandler.dispatchEvent).toBeCalledWith(mockWindow1, mockNotificationActionEvent);
    });
});
