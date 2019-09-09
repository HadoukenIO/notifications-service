import {Application} from 'hadouken-js-adapter';
import {_Window} from 'hadouken-js-adapter/out/types/src/api/window/window';

import {NotificationClosedEvent, NotificationOptions, NotificationActionEvent} from '../../src/client';
import {ActionTrigger} from '../../src/client/actions';
import {Events} from '../../src/client/internal';

import {createAppInServiceRealm} from './utils/spawnRemote';
import {defaultTestAppUrl, testManagerIdentity} from './utils/constants';
import * as notifsRemote from './utils/notificationsRemote';
import * as providerRemote from './utils/providerRemote';
import {delay, Duration} from './utils/delay';

let testApp: Application;
let testWindow: _Window;

let eventLog: {event: Events, time: number}[];
let closedListener: jest.Mock<void, [NotificationClosedEvent]>;
let actionListener: jest.Mock<void, [NotificationActionEvent]>;

const options: NotificationOptions = {
    body: 'Test Notification Body',
    title: 'Test Notification Title',
    category: 'Test Notification Category'
};

beforeEach(async () => {
    jest.resetAllMocks();

    testApp = await createAppInServiceRealm(testManagerIdentity, {url: defaultTestAppUrl});
    testWindow = await testApp.getWindow();

    eventLog = [];
    const eventLogger = (event: Events) => eventLog.push({event, time: Date.now()});

    actionListener = jest.fn<void, [NotificationActionEvent]>().mockImplementation(eventLogger);
    closedListener = jest.fn<void, [NotificationClosedEvent]>().mockImplementation(eventLogger);

    await notifsRemote.addEventListener(testWindow.identity, 'notification-closed', closedListener);
    await notifsRemote.addEventListener(testWindow.identity, 'notification-action', actionListener);
});

afterEach(async () => {
    await providerRemote.clearStoredNotifications(testWindow.identity);
    await testApp.quit();
});

test('When a notification is created with an expiry, the notification is removed when the expiry is reached', async () => {
    const expiry = future(seconds(5));

    await notifsRemote.createAndAwait(testWindow.identity, {...options, expiry});

    await delay(seconds(5));
    await delay(Duration.EVENT_PROPAGATED);

    expect(closedListener).toBeCalledTimes(1);
    expectTimeSoonAfter(eventLog[0].time, expiry.getTime());
});

test('When a notification is created with an expiry in the past, the notification is removed immediately', async () => {
    await notifsRemote.createAndAwait(testWindow.identity, {...options, expiry: past(seconds(5))});

    await delay(Duration.EVENT_PROPAGATED);

    expect(closedListener).toBeCalledTimes(1);
});

test('When a notification is created with an expiry and a expiry action, an action event is received when it expires', async () => {
    const expiry = future(seconds(5));

    const note = (await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        expiry,
        onExpired: {task: 'expired'}
    })).note;

    await delay(seconds(5));
    await delay(Duration.EVENT_PROPAGATED);

    expect(actionListener).toBeCalledTimes(1);
    expect(actionListener).toBeCalledWith({
        type: 'notification-action',
        notification: {...note, date: note.date.toJSON(), expiry: note.expiry!.toJSON()},
        trigger: ActionTrigger.EXPIRE,
        result: {task: 'expired'}
    });

    expect(closedListener).toBeCalledTimes(1);
    expect(actionListener).toBeCalledTimes(1);
    expect(eventLog.map((entry) => entry.event.type)).toEqual(['notification-action', 'notification-closed']);

    expectTimeSoonAfter(eventLog[0].time, expiry.getTime());
    expectTimeSoonAfter(eventLog[1].time, expiry.getTime());
});

test('When two notifications are created with different expiries, the notifications are expired in the correct order', async () => {
    const earlyExpiry = future(seconds(5));
    const lateExpiry = future(seconds(10));

    const earlyNote = (await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        expiry: earlyExpiry
    })).note;

    const lateNote = (await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        expiry: lateExpiry
    })).note;

    await delay(seconds(10));
    await delay(Duration.EVENT_PROPAGATED);

    expect(eventLog.map((entry) => entry.event.notification.id)).toEqual([earlyNote.id, lateNote.id]);

    expectTimeSoonAfter(eventLog[0].time, earlyExpiry.getTime());
    expectTimeSoonAfter(eventLog[1].time, lateExpiry.getTime());
});

test('When two notifications are created with the same expiries, the notifications are expired simultaneously', async () => {
    const expiry = future(seconds(5));

    await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        expiry
    });

    await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        expiry
    });

    await delay(seconds(5));
    await delay(Duration.EVENT_PROPAGATED);

    expectTimeSoonAfter(eventLog[0].time, expiry.getTime());
    expectTimeSoonAfter(eventLog[1].time, expiry.getTime());
});

function expectTimeSoonAfter(actualTime: number, expectedTime: number): void {
    expect(actualTime - expectedTime).toBeGreaterThan(0);
    expect(actualTime - expectedTime).toBeLessThan(Duration.EVENT_PROPAGATED);
}

function future(duration: number): Date {
    return new Date(Date.now() + duration);
}

function past(duration: number): Date {
    return new Date(Date.now() - duration);
}

function seconds(seconds: number): Duration {
    return (seconds * 1000) as Duration;
}
