import 'jest';

import {Application, Window} from 'hadouken-js-adapter';

import {Notification, NotificationOptions} from '../../src/client';
import {getCenterCardsByNotification, toggleCenterMuted} from '../utils/int/centerUtils';
import * as notifsRemote from '../utils/int/notificationsRemote';
import {assertNotificationStored, getStoredNotificationsByApp} from '../utils/int/storageRemote';
import {delay, Duration} from '../utils/int/delay';
import {getToastWindow} from '../utils/int/toastUtils';
import {assertDOMMatches, CardType, getCardMetadata} from '../utils/int/cardUtils';
import {testManagerIdentity, testAppUrlDefault} from '../utils/int/constants';
import {assertHydratedCorrectly} from '../utils/int/hydrateNotification';
import {setupOpenCenterBookends, setupCommonBookends} from '../utils/int/common';
import {createAppInServiceRealm} from '../utils/int/spawnRemote';

setupCommonBookends();

describe('When creating a notification with the center showing', () => {
    let testApp: Application;
    let testWindow: Window;

    setupOpenCenterBookends();

    beforeEach(async () => {
        testApp = await createAppInServiceRealm(testManagerIdentity, {url: testAppUrlDefault});
        testWindow = await testApp.getWindow();
    });

    afterEach(async () => {
        await notifsRemote.clearAll(testWindow.identity);
        await testApp.quit();
    });

    describe('When passing a valid set of options', () => {
        const options: NotificationOptions = {
            body: 'Test Notification Body',
            title: 'Test Notification Title',
            category: 'Test Notification Category',
            id: 'test-notification-0',
            icon: 'https://openfin.co/favicon.ico'
        };

        let createPromise: Promise<Notification>;
        let pregeneratedNote: Notification;
        beforeEach(async () => {
            ({createPromise, note: pregeneratedNote} = await notifsRemote.createAndAwait(testWindow.identity, options));
        });

        test('The promise resolves to the fully hydrated notification object', async () => {
            // eslint-disable-next-line
            await expect(createPromise).resolves;
            assertHydratedCorrectly(options, pregeneratedNote);
        });

        test('One card appears in the Notification Center', async () => {
            const noteCards = await getCenterCardsByNotification(testApp.identity.uuid, pregeneratedNote.id);
            expect(noteCards).toHaveLength(1);
        });

        test('The card has the same data as the returned notification object', async () => {
            await assertDOMMatches(CardType.CENTER, testApp.identity.uuid, pregeneratedNote);
        });

        test('The notification is added to the persistence store', async () => {
            await assertNotificationStored(testWindow.identity, pregeneratedNote);
        });

        test('The notification is included in the result of a getAll call', async () => {
            const appNotes = await notifsRemote.getAll(testWindow.identity);
            expect(appNotes).toContainEqual(pregeneratedNote);
        });

        test('No toast is shown for the created notification', async () => {
            // The notification is created immediately before this, so we need
            // a slight delay to allow time for the toast to spawn.
            await delay(Duration.TOAST_CREATE);

            const toastWindow = await getToastWindow(testApp.identity.uuid, pregeneratedNote.id);
            expect(toastWindow).toBe(undefined);
        });

        describe('When the Notification Center is muted', () => {
            beforeAll(toggleCenterMuted);
            afterAll(toggleCenterMuted);

            test('One card appears in the Notification Center', async () => {
                const noteCards = await getCenterCardsByNotification(testApp.identity.uuid, pregeneratedNote.id);
                expect(noteCards).toHaveLength(1);
            });

            test('No toast is shown for the created notification', async () => {
                // The notification is created immediately before this, so we need
                // a slight delay to allow time for the toast to spawn.
                await delay(Duration.TOAST_CREATE);

                const toastWindow = await getToastWindow(testApp.identity.uuid, pregeneratedNote.id);
                expect(toastWindow).toBe(undefined);
            });
        });

        test.skip('Markdown inside of `body` gets rendered to HTML', async () => {
            const body = `
            # Title
            
            - item 1
            - item 2
            `;

            const note = await notifsRemote.create(testWindow.identity, {...options, body});
            const card = await getCenterCardsByNotification(testApp.identity.uuid, note.id);
            const cardValues = await getCardMetadata(card[0]);

            expect(cardValues.body).toBeDefined();
            expect(cardValues.body!.search(/<h1>Title<\/h1>/)).toBe(true);
            expect(cardValues.body!.search(/<ul>(\s*<li>([\w\s])*<\/li>\s*)+<\/ul>/)).toBe(true);
        });
    });

    describe('When options does not include title and body', () => {
        // Intentionally circumventing type check with cast for testing purposes
        const options: NotificationOptions = {id: 'invalid-notification'} as NotificationOptions;

        let createPromise: Promise<Notification>;
        beforeEach(async () => {
            ({createPromise} = await notifsRemote.createAndAwait(testWindow.identity, options));
        });

        afterEach(async () => {
            // Cleanup the created notification (just in case it does get made)
            await notifsRemote.clear(testWindow.identity, options.id!);
        });

        test('The promise rejects with a suitable error message', async () => {
            await expect(createPromise).rejects.toThrow(/Invalid arguments passed to create:.*"title" must have a value.*"body" must have a value/s);
        });

        test('A card is not added to the Notification Center', async () => {
            const noteCards = await getCenterCardsByNotification(testApp.identity.uuid, options.id!);
            expect(noteCards).toEqual([]);
        });

        test('The notification is not added to the persistence store', async () => {
            const storedNotes = await getStoredNotificationsByApp(testApp.identity.uuid);

            expect(storedNotes).toEqual([]);
        });

        test('The notification does not appear in the result of getAll', async () => {
            const appNotes = await notifsRemote.getAll(testWindow.identity);
            expect(appNotes).toEqual([]);
        });
    });

    describe('When options does not include id', () => {
        const options: NotificationOptions = {
            body: 'Test Notification Body',
            title: 'Test Notification Title',
            category: 'Test Notification Category'
        };

        test('The notification is created as expected with a randomly generated ID', async () => {
            const {createPromise, note} = await notifsRemote.createAndAwait(testWindow.identity, options);

            // eslint-disable-next-line
            await expect(createPromise).resolves;
            assertHydratedCorrectly(options, note);

            // Card is created
            const noteCards = await getCenterCardsByNotification(testApp.identity.uuid, note.id);
            expect(noteCards).toHaveLength(1);

            // Card is correct
            await assertDOMMatches(CardType.CENTER, testApp.identity.uuid, note);

            // Notification is persisted
            await assertNotificationStored(testWindow.identity, note);
        });
    });

    describe.each([1, 2, 3])('With %i button(s)', (numButtons) => {
        const options: NotificationOptions = {
            body: 'Test Notification Body',
            title: 'Test Notification Title',
            category: 'Test Notification Category',
            buttons: []
        };

        for (let i = 0; i < numButtons; i++) {
            // options.buttons is assigned immediatly before this, but we need the ! because typescript doesn't realize.
            options.buttons!.push({title: `Button ${i}`});
        }

        let createPromise: Promise<Notification>;
        let pregeneratedNote: Notification;
        beforeEach(async () => {
            ({createPromise, note: pregeneratedNote} = await notifsRemote.createAndAwait(testWindow.identity, options));
        });

        test('The notification is created as expected', async () => {
            // eslint-disable-next-line
            await expect(createPromise).resolves;
            assertHydratedCorrectly(options, pregeneratedNote);

            // Card is created
            const noteCards = await getCenterCardsByNotification(testApp.identity.uuid, pregeneratedNote.id);
            expect(noteCards).toHaveLength(1);

            // Card is correct
            await assertDOMMatches(CardType.CENTER, testApp.identity.uuid, pregeneratedNote);

            // Notification is persisted
            await assertNotificationStored(testWindow.identity, pregeneratedNote);
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
