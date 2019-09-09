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

test('When a notification is created with an expiration, the notification is removed when the expiration is reached', async () => {
    const expiration = future(seconds(5));

    await notifsRemote.createAndAwait(testWindow.identity, {...options, expiration});

    await delay(seconds(5));
    await delay(Duration.EVENT_PROPAGATED);

    expect(closedListener).toBeCalledTimes(1);
    expectTimeSoonAfter(eventLog[0].time, expiration.getTime());
});

test('When a notification is created with an expiration in the past, the notification is removed immediately', async () => {
    await notifsRemote.createAndAwait(testWindow.identity, {...options, expiration: past(seconds(5))});

    await delay(Duration.EVENT_PROPAGATED);

    expect(closedListener).toBeCalledTimes(1);
});

test('When a notification is created with an expiration and a expiry action, an action event is received when it expires', async () => {
    const expiration = future(seconds(5));

    const note = (await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        expiration,
        onExpired: {task: 'expired'}
    })).note;

    await delay(seconds(5));
    await delay(Duration.EVENT_PROPAGATED);

    expect(actionListener).toBeCalledTimes(1);
    expect(actionListener).toBeCalledWith({
        type: 'notification-action',
        notification: {...note, date: note.date.toJSON(), expiration: note.expiration!.toJSON()},
        trigger: ActionTrigger.EXPIRE,
        result: {task: 'expired'}
    });

    expect(closedListener).toBeCalledTimes(1);
    expect(actionListener).toBeCalledTimes(1);
    expect(eventLog.map((entry) => entry.event.type)).toEqual(['notification-action', 'notification-closed']);

    expectTimeSoonAfter(eventLog[0].time, expiration.getTime());
    expectTimeSoonAfter(eventLog[1].time, expiration.getTime());
});

test('When two notifications are created with different expirations, the notifications are expired in the correct order', async () => {
    const earlyExpiration = future(seconds(5));
    const lateExpiration = future(seconds(10));

    const earlyNote = (await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        expiration: earlyExpiration
    })).note;

    const lateNote = (await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        expiration: lateExpiration
    })).note;

    await delay(seconds(10));
    await delay(Duration.EVENT_PROPAGATED);

    expect(eventLog.map((entry) => entry.event.notification.id)).toEqual([earlyNote.id, lateNote.id]);

    expectTimeSoonAfter(eventLog[0].time, earlyExpiration.getTime());
    expectTimeSoonAfter(eventLog[1].time, lateExpiration.getTime());
});

test('When two notifications are created with the same expirations, the notifications are expired simultaneously', async () => {
    const expiration = future(seconds(5));

    await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        expiration
    });

    await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        expiration
    });

    await delay(seconds(5));
    await delay(Duration.EVENT_PROPAGATED);

    expectTimeSoonAfter(eventLog[0].time, expiration.getTime());
    expectTimeSoonAfter(eventLog[1].time, expiration.getTime());
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