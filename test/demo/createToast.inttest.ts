import 'jest';

import {Application, Window} from 'hadouken-js-adapter';

import {NotificationOptions, Notification} from '../../src/client';

import * as notifsRemote from './utils/notificationsRemote';
import {isCenterShowing, getCenterCardsByNotification} from './utils/centerUtils';
import {delay, Duration} from './utils/delay';
import {getToastWindow, getToastCards} from './utils/toastUtils';
import {createApp} from './utils/spawnRemote';
import {assertNotificationStored} from './utils/storageRemote';
import {assertDOMMatches, CardType} from './utils/cardUtils';
import {testManagerIdentity} from './utils/constants';

const options: NotificationOptions = {
    body: 'Test Notification Body',
    title: 'Test Notification Title'
};

describe('When calling createNotification with the notification center not showing', () => {
    let testApp: Application;
    let testWindow: Window;

    let createPromise: Promise<Notification>;
    let note: Notification;

    beforeAll(async () => {
        // Ensure center is not showing
        if (await isCenterShowing()) {
            await notifsRemote.toggleNotificationCenter(testManagerIdentity);
            await delay(Duration.CENTER_TOGGLED);
        }
    });

    beforeEach(async () => {
        testApp = await createApp(testManagerIdentity, {});
        testWindow = await testApp.getWindow();

        ({createPromise, note} = await notifsRemote.createAndAwait(testWindow.identity, options));
    });

    afterEach(async () => {
        await notifsRemote.clearAll(testWindow.identity);
        await testApp.quit();
    });

    test('The promise resolves to the fully hydrated notification object', async () => {
        await expect(createPromise).resolves;
        expect(note).toMatchObject(options);
    });

    test('A toast is shown for the notification', async () => {
        // The toast creation is not awaited as part of notes.create, so we add a small
        // delay to allow the toast time to spawn.
        await delay(Duration.TOAST_DOM_LOADED);

        const toastWindow = await getToastWindow(testApp.identity.uuid, note.id);
        expect(toastWindow).not.toBe(undefined);
    });

    test('The toast is displaying the correct data', async () => {
        // The toast creation is not awaited as part of notes.create, so we add a small
        // delay to allow the toast time to spawn.
        await delay(Duration.TOAST_DOM_LOADED);

        const toastCards = await getToastCards(testApp.identity.uuid, note.id);

        expect(Array.isArray(toastCards)).toBe(true);
        expect(toastCards).toHaveLength(1);

        await assertDOMMatches(CardType.TOAST, testApp.identity.uuid, note);
    });

    test('A card is added to the center with correct data', async () => {
        const note = await notifsRemote.create(testWindow.identity, options);
        expect(note).toMatchObject(options);

        const noteCards = await getCenterCardsByNotification(testApp.identity.uuid, note.id);
        expect(noteCards).toHaveLength(1);

        await assertDOMMatches(CardType.CENTER, testApp.identity.uuid, note);
    });

    test('The notification is added to the persistence store', async () => {
        const note = await notifsRemote.create(testWindow.identity, options);

        await assertNotificationStored(testWindow.identity, note);
    });
});
