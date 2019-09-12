import {Application, Window} from 'hadouken-js-adapter';

import {NotificationOptions, CustomData, NotificationClosedEvent, NotificationActionEvent, Notification} from '../../src/client';
import {ActionTrigger} from '../../src/client/actions';
import {testManagerIdentity, testAppUrlDefault} from '../utils/int/constants';
import {delay, Duration} from '../utils/int/delay';
import * as notifsRemote from '../utils/int/notificationsRemote';
import * as providerRemote from '../utils/int/providerRemote';
import {setupCenterBookends, CenterState} from '../utils/int/common';
import {createAppInServiceRealm} from '../utils/int/spawnRemote';
import {getCenterCardsByApp} from '../utils/int/centerUtils';
import {getToastWindowsByApp} from '../utils/int/toastUtils';

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
    CenterState
];

type ClearAllCallTestParam = [
    string,
    NotificationOptions[],
    (CustomData | undefined)[]
];

const clearAllCallTestParam: ClearAllCallTestParam[] = [
    [
        'When no notifiactions had been created',
        [],
        []
    ],
    [
        'When one notification had been created',
        [notificationWithoutOnCloseActionResult],
        [undefined]
    ],
    [
        'When one notification with an `onClose` action result had been created',
        [notificationWithOnCloseActionResult1],
        [{task: 'close-1'}]
    ],
    [
        'When two notifications, one with an `onClose` action result, had been created',
        [notificationWithoutOnCloseActionResult, notificationWithOnCloseActionResult1],
        [undefined, {task: 'close-1'}]
    ],
    [
        'When two notifications with an `onClose` action result had been created',
        [notificationWithOnCloseActionResult1, notificationWithOnCloseActionResult2],
        [{task: 'close-1'}, {task: 'close-2'}]
    ]
];

describe.each([
    ['When clearing all notifications with the Notification Center open', 'center-open'],
    ['When clearing all notifications with the Notification Center closed', 'center-closed']
] as EnvironmentTestParam[])('%s', (
    titleParam: string,
    centerVisibility: CenterState
) => {
    let testApp: Application;
    let testWindow: Window;

    let actionListener: jest.Mock<void, [NotificationActionEvent]>;
    let closedListener: jest.Mock<void, [NotificationClosedEvent]>;

    setupCenterBookends(centerVisibility);

    beforeEach(async () => {
        testApp = await createAppInServiceRealm(testManagerIdentity, {url: testAppUrlDefault});
        testWindow = await testApp.getWindow();

        actionListener = jest.fn<void, [NotificationActionEvent]>();
        closedListener = jest.fn<void, [NotificationClosedEvent]>();

        await notifsRemote.addEventListener(testWindow.identity, 'notification-action', actionListener);
        await notifsRemote.addEventListener(testWindow.identity, 'notification-closed', closedListener);
    });

    afterEach(async () => {
        await providerRemote.clearStoredNotifications(testWindow.identity);
        await testApp.quit();
    });

    describe.each(clearAllCallTestParam)('%s', (titleParam: string, noteOptions: NotificationOptions[], expectedResults: (CustomData | undefined)[]) => {
        const notes: Notification[] = [];

        beforeEach(async () => {
            notes.length = 0;

            for (const note of noteOptions) {
                notes.push(await (await notifsRemote.createAndAwait(testWindow.identity, note)).createPromise);
            }

            await notifsRemote.clearAll(testWindow.identity);
        });

        if (centerVisibility === 'center-open') {
            test('The Notification Center contains no cards', async () => {
                await expect(getCenterCardsByApp(testApp.identity.uuid)).resolves.toHaveLength(0);
            });
        } else {
            test('No toast windows are showing', async () => {
                await delay(Duration.TOAST_CLOSE);
                await expect(getToastWindowsByApp(testApp.identity.uuid)).resolves.toHaveLength(0);
            });
        }

        test('The `notification-closed` event has been fired the expected number of times', async () => {
            expect(closedListener).toBeCalledTimes(noteOptions.length);
        });

        test('The `notification-action` event has been fired with the expected payload', async () => {
            expect(actionListener).toBeCalledTimes(expectedResults.filter(result => result !== undefined).length);

            for (let i = 0; i < notes.length; i++) {
                const note = notes[i];
                const result = expectedResults[i];

                if (result !== undefined) {
                    expect(actionListener).toBeCalledWith({
                        type: 'notification-action',
                        notification: {...note, date: note.date.toJSON()},
                        trigger: ActionTrigger.CLOSE,
                        result
                    });
                }
            }
        });

        test('No notifications are returned by `getAll`', async () => {
            await expect(notifsRemote.getAll(testWindow.identity)).resolves.toEqual([]);
        });
    });
});
