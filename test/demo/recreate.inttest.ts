import 'jest';

import {Application, Window} from 'hadouken-js-adapter';
import {WindowEvent} from 'hadouken-js-adapter/out/types/src/api/events/base';

import {NotificationOptions, Notification, NotificationClosedEvent, NotificationCreatedEvent} from '../../src/client';
import * as notifsRemote from '../utils/int/notificationsRemote';
import {delay, Duration} from '../utils/int/delay';
import {fin} from '../utils/int/fin';
import {getToastIdentity} from '../utils/int/toastUtils';
import {assertDOMMatches, CardType} from '../utils/int/cardUtils';
import {testManagerIdentity, testAppUrlDefault} from '../utils/int/constants';
import {setupCenterBookends, CenterState, setupCommonBookends} from '../utils/int/common';
import {createAppInServiceRealm} from '../utils/int/spawnRemote';

const firstOptions: NotificationOptions = {
    id: 'duplicate-test-1',
    body: 'First Notification Body',
    title: 'First Notification Title',
    category: 'Test Notification Category'
};

const secondOptions: NotificationOptions = {
    id: 'duplicate-test-1',
    body: 'Second Notification Body',
    title: 'Second Notification Title',
    category: 'Test Notification Category'
};

setupCommonBookends();

describe('When creating a notification with an ID that already exists but different options', () => {
    describe.each(['center-open', 'center-closed'] as CenterState[])('Center showing: %s', (centerVisibility) => {
        let testApp: Application;
        let testWindow: Window;

        let existingNote: Notification;

        setupCenterBookends(centerVisibility);

        beforeEach(async () => {
            testApp = await createAppInServiceRealm(testManagerIdentity, {url: testAppUrlDefault});
            testWindow = await testApp.getWindow();

            // Quick sanity check that there is not already a notification with that ID
            const notes = await notifsRemote.getAll(testWindow.identity);
            expect(notes.some((note) => note.id === firstOptions.id)).not.toBeTruthy();

            // Create the "existing" notification
            existingNote = await notifsRemote.create(testWindow.identity, firstOptions);
        });

        afterEach(async () => {
            await notifsRemote.clearAll(testWindow.identity);
            await testApp.quit(true).catch(() => {});
            await delay(Duration.TOAST_CLOSE);
        });

        test('The promise resolves to the new notification object', async () => {
            const newNotePromise = notifsRemote.create(testWindow.identity, secondOptions);
            // eslint-disable-next-line
            expect(newNotePromise).resolves;

            expect(await newNotePromise).toMatchObject(secondOptions);
        });

        test('A "closed" event is emitted, followed by a "created" event', async () => {
            // Register a closed listener on the window
            const eventOrdering: string[] = [];
            const createdListener = jest.fn<void, [NotificationCreatedEvent]>().mockImplementation(() => eventOrdering.push('created'));
            const closedListener = jest.fn<void, [NotificationClosedEvent]>().mockImplementation(() => eventOrdering.push('closed'));
            await notifsRemote.addEventListener(testWindow.identity, 'notification-created', createdListener);
            await notifsRemote.addEventListener(testWindow.identity, 'notification-closed', closedListener);

            // Recreate the notification and pause momentarily to allow the event to propagate
            await notifsRemote.create(testWindow.identity, secondOptions);
            await delay(Duration.EVENT_PROPAGATED);

            // Listeners triggered
            expect(createdListener).toHaveBeenCalledTimes(1);
            expect(closedListener).toHaveBeenCalledTimes(1);

            // Closed listener should be called first
            expect(eventOrdering).toEqual(['closed', 'created']);
        });

        test('The card in the center is updated to show the new notification details', async () => {
            // Existing card matches `firstOptions`
            await assertDOMMatches(CardType.CENTER, testApp.identity.uuid, existingNote);

            // Recreate the notification
            const newNote = await notifsRemote.create(testWindow.identity, secondOptions);

            // New card matches `secondOptions`
            await assertDOMMatches(CardType.CENTER, testApp.identity.uuid, newNote);
        });

        // Extra tests for toasts only when the center is hidden
        if (centerVisibility === 'center-closed') {
            describe('When the existing notification has an active toast', () => {
                let finOpenListener: jest.Mock<void, [WindowEvent<'system', 'window-created'>]>;
                let finCloseListener: jest.Mock<void, [WindowEvent<'system', 'window-closed'>]>;

                beforeEach(async () => {
                    finOpenListener = jest.fn<void, [WindowEvent<'system', 'window-created'>]>();
                    finCloseListener = jest.fn<void, [WindowEvent<'system', 'window-closed'>]>();
                    // Listen for any window-opened and -closed events
                    await fin.System.addListener('window-created', finOpenListener);
                    await fin.System.addListener('window-closed', finCloseListener);
                });

                afterEach(async () => {
                    // Tidy up the listeners when we're done
                    await fin.System.removeListener('window-created', finOpenListener);
                    await fin.System.removeListener('window-closed', finCloseListener);
                });

                test('The existing toast window is closed', async () => {
                    const expectedEvent = {
                        topic: 'system',
                        type: 'window-closed',
                        ...getToastIdentity(testApp.identity.uuid, firstOptions.id!)
                    };

                    // Recreate the notification and pause momentarily to allow the service time to process
                    await notifsRemote.create(testWindow.identity, secondOptions);
                    await delay(Duration.TOAST_CLOSE + Duration.TOAST_CREATE);

                    expect(finCloseListener).toHaveBeenCalledWith(expectedEvent);
                });

                test('A new toast window is created', async () => {
                    const expectedEvent = {
                        topic: 'system',
                        type: 'window-created',
                        ...getToastIdentity(testApp.identity.uuid, firstOptions.id!)
                    };

                    // Recreate the notification and pause momentarily to allow the service time to process
                    await notifsRemote.create(testWindow.identity, secondOptions);
                    await delay(Duration.TOAST_CLOSE + Duration.TOAST_CREATE);

                    expect(finOpenListener).toHaveBeenCalledWith(expectedEvent);
                });

                test('The new toast matches the options of the new notification', async () => {
                    // Recreate the notification and delay stlight to allow the toast to spawn
                    const newNote = await notifsRemote.create(testWindow.identity, secondOptions);
                    await delay(Duration.TOAST_CLOSE + Duration.TOAST_CREATE + Duration.TOAST_DOM_LOADED);

                    // New toast matches `secondOptions`
                    await assertDOMMatches(CardType.TOAST, testApp.identity.uuid, newNote);
                });
            });
        }
    });
});
