import 'jest';

import { Application, Window } from 'hadouken-js-adapter';

import { NotificationOptions, Notification, NotificationClosedEvent } from '../../src/client';

import { createApp } from './utils/spawnRemote';
import { isCenterShowing, assertDOMMatches } from './utils/notificationCenterUtils';
import * as notifsRemote from './utils/notificationsRemoteExecution';
import { delay } from './utils/delay';

const testManagerIdentity = { uuid: 'test-app', name: 'test-app' };

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
            }
        });

        beforeEach(async () => {
            testApp = await createApp(testManagerIdentity, {});
            testWindow = await testApp.getWindow();

            // Quick sanity check that there is not already a notification with that ID
            const notes = await notifsRemote.getAll(testWindow.identity);
            expect(notes.some(note => note.id === firstOptions.id)).not.toBeTruthy();

            // Create the "exisitng" notificaiton
            existingNote = await notifsRemote.create(testWindow.identity, firstOptions);
        });

        afterEach(async () => {
            await notifsRemote.clearAll(testWindow.identity);
            await testApp.quit();
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
            await delay(100);

            // Listener not triggered
            expect(closeListener).not.toHaveBeenCalled();
        });

        test('The card in the center is updated to show the new notification details', async () => {
            // Existing card matches `firstOptions`
            await assertDOMMatches(testApp.identity.uuid, existingNote);

            // Recreate the notification
            const newNote = await notifsRemote.create(testWindow.identity, secondOptions);

            // New card matches `secondOptions`
            await assertDOMMatches(testApp.identity.uuid, newNote);
        });

        // Extra tests for toasts only when the center is hidden
        if (!showCenter) {
            describe('When the existing notification has an active toast', () => {
                test.todo('The existing toast window is closed');
                test.todo('A new toast window is created');
                test.todo('The new toast matches the options of the new notification');
            });
        }
    });
});
