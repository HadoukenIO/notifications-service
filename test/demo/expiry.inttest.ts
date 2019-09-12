import {Application} from 'hadouken-js-adapter';
import {_Window} from 'hadouken-js-adapter/out/types/src/api/window/window';

import {NotificationClosedEvent, NotificationOptions, NotificationActionEvent, Notification} from '../../src/client';
import {ActionTrigger} from '../../src/client/actions';
import {Events} from '../../src/client/internal';
import {createAppInServiceRealm} from '../utils/int/spawnRemote';
import {testManagerIdentity, testAppUrlListenersOnStartup} from '../utils/int/constants';
import * as notifsRemote from '../utils/int/notificationsRemote';
import * as providerRemote from '../utils/int/providerRemote';
import {delay, Duration} from '../utils/int/delay';
import {waitForAppToBeRunning} from '../utils/int/common';

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

    testApp = await createAppInServiceRealm(testManagerIdentity, {url: testAppUrlListenersOnStartup});
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
    const expires = future(seconds(5));

    await notifsRemote.createAndAwait(testWindow.identity, {...options, expires});

    await delay(seconds(5));
    await delay(Duration.EVENT_PROPAGATED);

    await expect(notifsRemote.getAll(testWindow.identity)).resolves.toEqual([]);

    expect(closedListener).toBeCalledTimes(1);
    expectTimeSoonAfter(eventLog[0].time, expires.getTime());

    expect(actionListener).toBeCalledTimes(0);
});

test('When a notification is created with an expiry in the past, the notification is removed immediately', async () => {
    await notifsRemote.createAndAwait(testWindow.identity, {...options, expires: past(seconds(5))});

    await delay(Duration.EVENT_PROPAGATED);

    await expect(notifsRemote.getAll(testWindow.identity)).resolves.toEqual([]);

    expect(closedListener).toBeCalledTimes(1);
    expect(actionListener).toBeCalledTimes(0);
});

test('When a notification is created with an expiry and an expiry action, an action event is received when it expires', async () => {
    const expires = future(seconds(5));

    const note = (await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        expires,
        onExpire: {task: 'expired'}
    })).note;

    await delay(seconds(5));
    await delay(Duration.EVENT_PROPAGATED);

    expect(actionListener).toBeCalledTimes(1);
    expect(actionListener).toBeCalledWith({
        type: 'notification-action',
        notification: {...note, date: note.date.toJSON(), expires: note.expires!.toJSON()},
        trigger: ActionTrigger.EXPIRE,
        result: {task: 'expired'}
    });

    expect(closedListener).toBeCalledTimes(1);
    expect(actionListener).toBeCalledTimes(1);
    expect(eventLog.map((entry) => entry.event.type)).toEqual(['notification-action', 'notification-closed']);

    expectTimeSoonAfter(eventLog[0].time, expires.getTime());
    expectTimeSoonAfter(eventLog[1].time, expires.getTime());
});

test('When two notifications are created with different expiries, the notifications are expired in the correct order', async () => {
    const earlyExpires = future(seconds(5));
    const lateExpires = future(seconds(10));

    const earlyNote = (await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        expires: earlyExpires
    })).note;

    const lateNote = (await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        expires: lateExpires
    })).note;

    await delay(seconds(10));
    await delay(Duration.EVENT_PROPAGATED);

    expect(eventLog.map((entry) => entry.event.notification.id)).toEqual([earlyNote.id, lateNote.id]);

    expectTimeSoonAfter(eventLog[0].time, earlyExpires.getTime());
    expectTimeSoonAfter(eventLog[1].time, lateExpires.getTime());
});

test('When two notifications are created with different expiries, in reverse expiry order, the notifications are expired in the correct order', async () => {
    const earlyExpires = future(seconds(5));
    const lateExpires = future(seconds(10));

    const lateNote = (await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        expires: lateExpires
    })).note;

    const earlyNote = (await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        expires: earlyExpires
    })).note;

    await delay(seconds(10));
    await delay(Duration.EVENT_PROPAGATED);

    expect(eventLog.map((entry) => entry.event.notification.id)).toEqual([earlyNote.id, lateNote.id]);

    expectTimeSoonAfter(eventLog[0].time, earlyExpires.getTime());
    expectTimeSoonAfter(eventLog[1].time, lateExpires.getTime());
});

test('When two notifications are created with the same expiries, the notifications are expired simultaneously', async () => {
    const expires = future(seconds(5));

    await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        expires
    });

    await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        expires
    });

    await delay(seconds(5));
    await delay(Duration.EVENT_PROPAGATED);

    expectTimeSoonAfter(eventLog[0].time, expires.getTime());
    expectTimeSoonAfter(eventLog[1].time, expires.getTime());
});

test('When a notification is removed before it expires, the notification does not expire', async () => {
    const note = (await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        expires: future(seconds(5)),
        onExpire: {task: 'expired'}
    })).note;

    await notifsRemote.clear(testWindow.identity, note.id);

    expect(closedListener).toBeCalledTimes(1);

    await delay(seconds(5));
    await delay(Duration.EVENT_PROPAGATED);

    expect(actionListener).toBeCalledTimes(0);
    expect(closedListener).toBeCalledTimes(1);
});

test('When a notification is recreated with a later expiry, the expiry time is changed', async () => {
    const note = (await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        expires: future(seconds(5))
    })).note;

    const laterExpiry = future(seconds(10));

    await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        id: note.id,
        expires: laterExpiry
    });

    await delay(seconds(10));
    await delay(Duration.EVENT_PROPAGATED);

    expect(closedListener).toBeCalledTimes(2);
    expectTimeSoonAfter(eventLog[1].time, laterExpiry.getTime());
});

test('When a notification is recreated with an earlier expiry, the expiry time is changed', async () => {
    const note = (await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        expires: future(seconds(10))
    })).note;

    const earlierExpiry = future(seconds(5));

    await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        id: note.id,
        expires: earlierExpiry
    });

    await delay(seconds(5));
    await delay(Duration.EVENT_PROPAGATED);

    expect(closedListener).toBeCalledTimes(2);
    expectTimeSoonAfter(eventLog[1].time, earlierExpiry.getTime());
});

test('When a notification is recreated with no expiry, the notification does not expire', async () => {
    const originalNote = (await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        expires: future(seconds(5))
    })).note;

    const recreatedNote = (await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        id: originalNote.id,
        expires: null
    })).note;

    await delay(seconds(5));
    await delay(Duration.EVENT_PROPAGATED);

    await expect(notifsRemote.getAll(testWindow.identity)).resolves.toEqual([{...recreatedNote, expires: null}]);
    expect(closedListener).toBeCalledTimes(1);
});

describe('When a notification with an expiry is created by an app that then quits', () => {
    let note: Notification;

    beforeEach(async () => {
        const expires = future(seconds(5));

        note = (await notifsRemote.createAndAwait(testWindow.identity, {
            ...options,
            expires,
            onExpire: {task: 'expired'}
        })).note;

        await testApp.quit();
    });

    test('The app is restarted, and the app receives the `onExpire` result', async () => {
        await delay(seconds(5));

        await waitForAppToBeRunning(testApp.identity);
        expect(await testApp.isRunning()).toBe(true);

        await delay(Duration.EVENT_PROPAGATED);

        const receivedActionEvents = await notifsRemote.getReceivedEvents((await testApp.getWindow()).identity, 'notification-action');

        expect(receivedActionEvents).toEqual([{
            type: 'notification-action',
            notification: note,
            trigger: ActionTrigger.EXPIRE,
            result: {task: 'expired'}
        }]);
    });
});

// TODO: [SERVICE-619]
test.todo('When the provider is started and there are notifications with expiries in the past, they are expired on startup');

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
