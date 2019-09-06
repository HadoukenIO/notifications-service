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

let eventOrdering: Events[];
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

    eventOrdering = [];
    actionListener = jest.fn<void, [NotificationActionEvent]>().mockImplementation((event) => eventOrdering.push(event));
    closedListener = jest.fn<void, [NotificationClosedEvent]>().mockImplementation((event) => eventOrdering.push(event));

    await notifsRemote.addEventListener(testWindow.identity, 'notification-closed', closedListener);
    await notifsRemote.addEventListener(testWindow.identity, 'notification-action', actionListener);
});

afterEach(async () => {
    await providerRemote.clearStoredNotifications(testWindow.identity);
    await testApp.quit();
});

test('When a notification is created with an expiration, the notification is removed when the expiration is reached', async () => {
    await notifsRemote.createAndAwait(testWindow.identity, {...options, expiration: new Date(Date.now() + (5 * 1000))});

    await delay(6 * 1000);

    expect(closedListener).toBeCalledTimes(1);
});

test('When a notification is created with an expiration in the past, the notification is removed immediately', async () => {
    await notifsRemote.createAndAwait(testWindow.identity, {...options, expiration: new Date(Date.now() - (5 * 1000))});

    await delay(Duration.EVENT_PROPAGATED);

    expect(closedListener).toBeCalledTimes(1);
});

test('When a notification is created with an expiration and a expiry action, an action event is received when it expires', async () => {
    const note = (await notifsRemote.createAndAwait(testWindow.identity, {
        ...options,
        expiration: new Date(Date.now() + (5 * 1000)),
        onExpired: {task: 'expired'}
    })).note;

    await delay(6 * 1000);

    expect(actionListener).toBeCalledTimes(1);
    expect(actionListener).toBeCalledWith({
        type: 'notification-action',
        notification: {...note, date: note.date.toJSON(), expiration: note.expiration!.toJSON()},
        trigger: ActionTrigger.EXPIRE,
        result: {task: 'expired'}
    });

    expect(closedListener).toBeCalledTimes(1);

    expect(eventOrdering.map((event) => event.type)).toEqual(['notification-action', 'notification-closed']);
});
