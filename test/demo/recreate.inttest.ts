import 'jest';

import {Application, Window} from 'hadouken-js-adapter';
import {WindowEvent} from 'hadouken-js-adapter/out/types/src/api/events/base';

import {NotificationOptions, Notification, NotificationClosedEvent} from '../../src/client';

import {createApp} from './utils/spawnRemote';
import {isCenterShowing} from './utils/centerUtils';
import * as notifsRemote from './utils/notificationsRemote';
import {delay, Duration} from './utils/delay';
import {fin} from './utils/fin';
import {getToastIdentity} from './utils/toastUtils';
import {assertDOMMatches, CardType} from './utils/cardUtils';
import {testManagerIdentity} from './utils/constants';

const firstOptions: NotificationOptions = {
    id: 'duplicate-test-1',
    body: 'First Notification Body',
    title: 'First Notification Title'
};

const secondOptions: NotificationOptions = {
    id: 'duplicate-test-1',
    body: 'Second Notification Body',
    title: 'Second Notification Title'
};

describe('When creating a notification with an ID that already exists but different options', () => {
    describe.each([true, false])('Center showing: %p', showCenter => {
        let testApp: Application;
        let testWindow: Window;

        let existingNote: Notification;

        beforeAll(async () => {
            // Toggle the center on/off based on test type
            if (await isCenterShowing() !== showCenter) {
                await notifsRemote.toggleNotificationCenter(testManagerIdentity);
                await delay(Duration.CENTER_TOGGLED);
            }
        });

        afterAll(async () => {
            // Close center when we're done
            if (await isCenterShowing()) {
                await notifsRemote.toggleNotificationCenter(testManagerIdentity);
                await delay(Duration.CENTER_TOGGLED);
            }
        });

        beforeEach(async () => {
            testApp = await createApp(testManagerIdentity, {url: 'http://localhost:3922/demo/app.html'});
            testWindow = await testApp.getWindow();

            // Quick sanity check that there is not already a notification with that ID
            const notes = await notifsRemote.getAll(testWindow.identity);
            expect(notes.some(note => note.id === firstOptions.id)).not.toBeTruthy();

            // Create the "existing" notification
            existingNote = await notifsRemote.create(testWindow.identity, firstOptions);
        });

        afterEach(async () => {
            await notifsRemote.clearAll(testWindow.identity);
            await testApp.quit(true).catch(() => {});
        });

        test('The promise resolves to the new notification object', async () => {
            const newNotePromise = notifsRemote.create(testWindow.identity, secondOptions);
            expect(newNotePromise).resolves;

            expect(await newNotePromise).toMatchObject(secondOptions);
        });

        test('No "cleared" event is emitted', async () => {
            // Register a closed listener on the window
            const closeListener = jest.fn<void, [NotificationClosedEvent]>();
            await notifsRemote.addEventListener(testWindow.identity, 'notification-closed', closeListener);

            // Recreate the notification and pause momentarily to allow the event to propagate
            await notifsRemote.create(testWindow.identity, secondOptions);
            await delay(Duration.EVENT_PROPAGATED);

            // Listener not triggered
            expect(closeListener).not.toHaveBeenCalled();
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
        if (!showCenter) {
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

                afterEach(async () =>{
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
                    await delay(Duration.WINDOW_CLOSED);

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
                    await delay(Duration.WINDOW_CLOSED + Duration.WINDOW_CREATED);

                    expect(finOpenListener).toHaveBeenCalledWith(expectedEvent);
                });

                test('The new toast matches the options of the new notification', async () => {
                    // Recreate the notification and delay stlight to allow the toast to spawn
                    const newNote = await notifsRemote.create(testWindow.identity, secondOptions);
                    await delay(Duration.WINDOW_CLOSED + Duration.TOAST_DOM_LOADED);

                    // New toast matches `secondOptions`
                    await assertDOMMatches(CardType.TOAST, testApp.identity.uuid, newNote);
                });
            });
        }
    });
});
