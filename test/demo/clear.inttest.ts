import {Application, Window} from 'hadouken-js-adapter';

import {NotificationOptions, CustomData, NotificationClosedEvent, NotificationActionEvent, Notification} from '../../src/client';
import {ActionTrigger} from '../../src/client/actions';

import {getAllCenterCards, getCenterCardsByNotification} from './utils/centerUtils';
import {testManagerIdentity, defaultTestAppUrl} from './utils/constants';
import {delay, Duration} from './utils/delay';
import {createApp} from './utils/spawnRemote';
import * as notifsRemote from './utils/notificationsRemote';
import {getAllToastWindows, getToastWindow} from './utils/toastUtils';
import {setupCenterBookends} from './common';

const notificationWithoutOnCloseActionResult: NotificationOptions = {
    body: 'Test Notification Body',
    title: 'Test Notification Title',
    category: 'Test Notification Category'
};

const notificationWithOnCloseActionResult1: NotificationOptions = {
    body: 'Action Test Notification Body 1',
    title: 'Action Test Notification Title 1',
    category: 'Action Test Notification Category 1',
    onClose: {task: 'close-1'}
};

const notificationWithOnCloseActionResult2: NotificationOptions = {
    body: 'Action Test Notification Body 2',
    title: 'Action Test Notification Title 2',
    category: 'Action Test Notification Category 2',
    onClose: {task: 'close-2'}
};

type EnvironmentTestParam = [
    string,
    'center-open' | 'center-closed',
];

type ClearCallTestParam = [
    string,
    NotificationOptions[],
    number,
    (CustomData | undefined)[]
];

const clearCallTestParams: ClearCallTestParam[] = [
    [
        'When clearing a notification, and no others have been created',
        [notificationWithoutOnCloseActionResult],
        0,
        [undefined]
    ],
    [
        'When clearing a notification with an `onClose` action result, and no other have been created',
        [notificationWithOnCloseActionResult1],
        0,
        [{task: 'close-1'}]
    ],
    [
        'When clearing a notification with an `onClose` action result, and one other notification has been created',
        [notificationWithOnCloseActionResult1, notificationWithoutOnCloseActionResult],
        0,
        [{task: 'close-1'}, undefined]
    ],
    [
        'When clearing a notification with an `onClose` action result, and one other notification with an `onClose` action result has been created',
        [notificationWithOnCloseActionResult1, notificationWithOnCloseActionResult2],
        1,
        [undefined, {task: 'close-2'}]
    ]
];

describe.each([
    ['When clearing a notification with the Notification Center open', 'center-open'],
    ['When clearing a notification with the Notification Center closed', 'center-closed']
] as EnvironmentTestParam[])('%s', (
    titleParam: string,
    centerState: 'center-open' | 'center-closed',
) => {
    let testApp: Application;
    let testWindow: Window;

    let actionListener: jest.Mock<void, [NotificationActionEvent]>;
    let closedListener: jest.Mock<void, [NotificationClosedEvent]>;

    setupCenterBookends(centerState);

    beforeEach(async () => {
        testApp = await createApp(testManagerIdentity, {url: defaultTestAppUrl});
        testWindow = await testApp.getWindow();

        actionListener = jest.fn<void, [NotificationActionEvent]>();
        closedListener = jest.fn<void, [NotificationClosedEvent]>();

        await notifsRemote.addEventListener(testWindow.identity, 'notification-action', actionListener);
        await notifsRemote.addEventListener(testWindow.identity, 'notification-closed', closedListener);
    });

    afterEach(async () => {
        // TODO - how do we better do this? we shouldn't rely on clearAll working since that's what we're testing
        await notifsRemote.clearAll(testWindow.identity);
        await testApp.quit();
    });

    describe.each(clearCallTestParams)('%s', (
        titleParam: string,
        noteOptions: NotificationOptions[],
        indexToClear: number,
        expectedResults: (CustomData | undefined)[]
    ) => {
        const notes: Notification[] = [];

        beforeEach(async () => {
            notes.length = 0;

            for (const note of noteOptions) {
                notes.push(await (await notifsRemote.createAndAwait(testWindow.identity, note)).createPromise);
            }

            await notifsRemote.clear(testWindow.identity, notes[indexToClear].id);
        });

        if (centerState === 'center-open') {
            test('The expected card has been removed from the Notification Center', async () => {
                await expect(getAllCenterCards()).resolves.toHaveLength(notes.length - 1);

                await expect(getCenterCardsByNotification(testApp.identity.uuid, notes[indexToClear].id)).resolves.toEqual([]);

                for (const note of notes.filter((note, index) => index !== indexToClear)) {
                    await expect(getCenterCardsByNotification(testApp.identity.uuid, note.id)).resolves.toBeTruthy();
                }
            });
        } else {
            test('The expected toast has been removed', async () => {
                await delay(Duration.TOAST_CLOSE);

                await expect(getAllToastWindows()).resolves.toHaveLength(notes.length - 1);

                await expect(getToastWindow(testApp.identity.uuid, notes[indexToClear].id)).resolves.toEqual(undefined);

                for (const note of notes.filter((note, index) => index !== indexToClear)) {
                    await expect(getToastWindow(testApp.identity.uuid, note.id)).resolves.toBeTruthy();
                }
            });
        }

        test('The `notification-closed` event has been fired with the expected payload', async () => {
            const note = notes[indexToClear];

            expect(closedListener).toHaveBeenCalledTimes(1);
            expect(closedListener).toHaveBeenCalledWith({
                type: 'notification-closed',
                notification: {...note, date: note.date.toJSON()}
            });
        });

        test('The `notification-action` event has been fired with the expected payload, if the notification had an `onClose` action result', async () => {
            const result = expectedResults[indexToClear];
            const note = notes[indexToClear];

            if (result !== undefined) {
                expect(actionListener).toBeCalledTimes(1);
                expect(actionListener).toBeCalledWith({
                    type: 'notification-action',
                    notification: {...note, date: note.date.toJSON()},
                    trigger: ActionTrigger.CLOSE,
                    result
                });
            } else {
                expect(actionListener).toBeCalledTimes(0);
            }
        });

        test('Expected notifications are returned by `getAll`', async () => {
            const result = await notifsRemote.getAll(testWindow.identity);

            expect(result).toHaveLength(notes.length - 1);

            for (const note of notes.filter((note, index) => index !== indexToClear)) {
                expect(result).toContainEqual(note);
            }
        });
    });
});

describe('When attempting to clear a notification that does not exist', () => {
    let testApp: Application;
    let testWindow: Window;

    let closedListener: jest.Mock<void, [NotificationClosedEvent]>;

    beforeEach(async () => {
        testApp = await createApp(testManagerIdentity, {url: defaultTestAppUrl});
        testWindow = await testApp.getWindow();

        closedListener = jest.fn<void, [NotificationClosedEvent]>();

        await notifsRemote.addEventListener(testWindow.identity, 'notification-closed', closedListener);
    });

    afterEach(async () => {
        await notifsRemote.clearAll(testWindow.identity);
        await testApp.quit();
    });

    describe('When no notification exists', () => {
        test('`clear` fails', async () => {
            await expect(notifsRemote.clear(testApp.identity, 'does-not-exist')).rejects.toBeTruthy();
        });

        test('No closed event is fired', async () => {
            expect(closedListener).toBeCalledTimes(0);
        });
    });

    describe('When a notification exists', () => {
        let note: Notification;

        beforeEach(async () => {
            note = await (await notifsRemote.createAndAwait(testWindow.identity, notificationWithoutOnCloseActionResult)).createPromise;
        });

        test('`clear` fails', async () => {
            await expect(notifsRemote.clear(testApp.identity, 'does-not-exist')).rejects.toBeTruthy();
        });

        test('No closed event is fired', async () => {
            expect(closedListener).toBeCalledTimes(0);
        });

        test('The existing notification remains', async () => {
            await expect(notifsRemote.getAll(testWindow.identity)).resolves.toContainEqual(note);
        });
    });
});
