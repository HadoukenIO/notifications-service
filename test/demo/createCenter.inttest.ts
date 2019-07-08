import 'jest';

import {Application, Window} from 'hadouken-js-adapter';

import {Notification, NotificationOptions} from '../../src/client';

import {createApp} from './utils/spawnRemote';
import {isCenterShowing, getCenterCardsByNotification} from './utils/centerUtils';
import * as notifsRemote from './utils/notificationsRemote';
import {assertNotificationStored, getAppNotifications} from './utils/storageRemote';
import {delay} from './utils/delay';
import {getToastWindow} from './utils/toastUtils';
import {assertDOMMatches, CardType} from './utils/cardUtils';


const testManagerIdentity = {uuid: 'test-app', name: 'test-app'};

describe('When creating a notification with the center showing', () => {
    let testApp: Application;
    let testWindow: Window;

    beforeAll(async () => {
        // Toggle the center on/off based on test type
        if (!(await isCenterShowing())) {
            await notifsRemote.toggleNotificationCenter(testManagerIdentity);
        }
    });

    beforeEach(async () => {
        testApp = await createApp(testManagerIdentity, {});
        testWindow = await testApp.getWindow();
    });

    afterEach(async () => {
        await notifsRemote.clearAll(testWindow.identity);
        await testApp.quit();
    });

    describe('When passing a valid set of options', () => {
        const options: NotificationOptions = {
            body: 'Test Notification Body',
            title: 'Test Notificaiton Title',
            id: 'test-notification-0',
            icon: 'https://openfin.co/favicon.ico'
        };

        let createPromise: Promise<Notification>;
        let note: Notification;
        beforeEach(async () => {
            createPromise = notifsRemote.create(testWindow.identity, options);

            // We want to be sure the operation is completed, but don't care if it succeeds
            note = await createPromise.catch(() => ({} as Notification));
        });

        test('The promise resolves to the fully hydrated notification object', async () => {
            await expect(createPromise).resolves;
            expect(note).toMatchObject(options);
        });

        test('One card appears in the notification center', async () => {
            const noteCards = await getCenterCardsByNotification(testApp.identity.uuid, note.id);
            expect(noteCards).toHaveLength(1);
        });

        test('The card has the same data as the returned notification object', async () => {
            await assertDOMMatches(CardType.CENTER, testApp.identity.uuid, note);
        });

        test('The notification is added to the persistence store', async () => {
            await assertNotificationStored(testWindow.identity, note);
        });

        test('The notification is included in the result of a getAll call', async () => {
            const appNotes = await notifsRemote.getAll(testWindow.identity);
            expect(appNotes).toContainEqual(note);
        });

        test('No toast is shown for the created notification', async () => {
            // The notification is created immediately before this, so we need
            // a slight delay to allow time for the toast to spawn.
            await delay(100);

            const toastWindow = await getToastWindow(testApp.identity.uuid, note.id);
            expect(toastWindow).toBe(undefined);
        });
    });

    describe('When options does not include title and/or body', () => {
        // Intentionally circumventing type check with cast for testing purposes
        const options: NotificationOptions = {id: 'invalid-notification'} as NotificationOptions;

        let createPromise: Promise<Notification>;
        beforeEach(async () => {
            createPromise = notifsRemote.create(testWindow.identity, options);

            // We want to be sure the operation is completed, but don't care if it succeeds
            await createPromise.catch(() => {});
        });

        afterEach(async () => {
            // Cleanup the created notification (just in case it does get made)
            await notifsRemote.clear(testWindow.identity, options.id!);
        });

        test('The promise rejects with a suitable error message', async () => {
            await expect(createPromise).rejects.toThrow(/Invalid arguments passed to createNotification/);
        });

        test('A card is not added to the notification center', async () => {
            const noteCards = await getCenterCardsByNotification(testApp.identity.uuid, options.id!);
            expect(noteCards).toEqual([]);
        });

        test('The notification is not added to the persistence store', async () => {
            const storedNotes = await getAppNotifications(testApp.identity.uuid);

            expect(storedNotes).toEqual([]);
        });

        test('The notification does not appear in the result of getAll', async () => {
            const appNotes = await notifsRemote.getAll(testWindow.identity);
            expect(appNotes).toEqual([]);
        });
    });

    describe('When options does not include id', () => {
        const options: NotificationOptions = {body: 'Test Notification Body', title: 'Test Notificaiton Title'};

        let createPromise: Promise<Notification>;
        let note: Notification;
        beforeEach(async () => {
            createPromise = notifsRemote.create(testWindow.identity, options);

            // We want to be sure the operation is completed, but don't care if it succeeds
            note = await createPromise.catch(() => ({} as Notification));
        });

        test('The notification is created as expected', async () => {
            await expect(createPromise).resolves;
            expect(note).toMatchObject(options);

            // Card is created
            const noteCards = await getCenterCardsByNotification(testApp.identity.uuid, note.id);
            expect(noteCards).toHaveLength(1);

            // Card is correct
            await assertDOMMatches(CardType.CENTER, testApp.identity.uuid, note);

            // Notification is persisted
            await assertNotificationStored(testWindow.identity, note);
        });

        test('An id is generated by the service and returned in the hydrated object', async () => {
            await expect(createPromise).resolves;

            expect(note).toMatchObject(options);
            expect(note.id).toMatch(/[0-9]{9}/); // Random 9-digit numeric string
        });
    });

    describe.each([1, 2, 3])('With %i button(s)', numButtons => {
        const options: NotificationOptions = {body: 'Test Notification Body', title: 'Test Notificaiton Title', buttons: []};
        for (let i = 0; i < numButtons; i++) {
            // options.buttons is assigned immediatly before this, but we need the ! because typescript doesn't realize.
            options.buttons!.push({title: 'Button ' + i});
        }

        let createPromise: Promise<Notification>;
        let note: Notification;
        beforeEach(async () => {
            createPromise = notifsRemote.create(testWindow.identity, options);

            // We want to be sure the operation is completed, but don't care if it succeeds
            note = await createPromise.catch(() => ({} as Notification));
        });

        test('The notification is created as expected', async () => {
            await expect(createPromise).resolves;
            expect(note).toMatchObject(options);

            // Card is created
            const noteCards = await getCenterCardsByNotification(testApp.identity.uuid, note.id);
            expect(noteCards).toHaveLength(1);

            // Card is correct
            await assertDOMMatches(CardType.CENTER, testApp.identity.uuid, note);

            // Notification is persisted
            await assertNotificationStored(testWindow.identity, note);
        });

        test('The notification card has the correct number of button elements', async () => {
            const note = await createPromise;

            const noteCards = await getCenterCardsByNotification(testApp.identity.uuid, note.id);
            expect(noteCards).toHaveLength(1);

            const buttons = await noteCards[0].$$('.button');
            expect(buttons).toHaveLength(numButtons);
        });
    });
});
