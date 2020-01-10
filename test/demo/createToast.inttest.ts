import 'jest';

import {Application, Window} from 'hadouken-js-adapter';

import {NotificationOptions, Notification} from '../../src/client';
import * as notifsRemote from '../utils/int/notificationsRemote';
import {getCenterCardsByNotification} from '../utils/int/centerUtils';
import {delay, Duration} from '../utils/int/delay';
import {getToastWindow, getToastCards} from '../utils/int/toastUtils';
import {assertNotificationStored} from '../utils/int/storageRemote';
import {assertDOMMatches, CardType} from '../utils/int/cardUtils';
import {testManagerIdentity, testAppUrlDefault} from '../utils/int/constants';
import {assertHydratedCorrectly} from '../utils/int/hydrateNotification';
import {setupClosedCenterBookends, setupCommonBookends} from '../utils/int/common';
import {createAppInServiceRealm} from '../utils/int/spawnRemote';

const options: NotificationOptions = {
    body: 'Test Notification Body',
    title: 'Test Notification Title',
    category: 'Test Notification Category'
};

setupCommonBookends();

describe('When calling createNotification with the Notification Center not showing', () => {
    let testApp: Application;
    let testWindow: Window;

    let createPromise: Promise<Notification>;
    let pregeneratedNote: Notification;

    setupClosedCenterBookends();

    beforeEach(async () => {
        testApp = await createAppInServiceRealm(testManagerIdentity, {url: testAppUrlDefault});
        testWindow = await testApp.getWindow();

        ({createPromise, note: pregeneratedNote} = await notifsRemote.createAndAwait(testWindow.identity, options));
    });

    afterEach(async () => {
        await notifsRemote.clearAll(testWindow.identity);
        await testApp.quit();
    });

    test('The promise resolves to the fully hydrated notification object', async () => {
        // eslint-disable-next-line
        await expect(createPromise).resolves;
        assertHydratedCorrectly(options, pregeneratedNote);
    });

    test('A toast is shown for the notification', async () => {
        // The toast creation is not awaited as part of notes.create, so we add a small
        // delay to allow the toast time to spawn.
        await delay(Duration.TOAST_DOM_LOADED);

        const toastWindow = await getToastWindow(testApp.identity.uuid, pregeneratedNote.id);
        expect(toastWindow).not.toBe(undefined);
    });

    test('The toast is displaying the correct data', async () => {
        // The toast creation is not awaited as part of notes.create, so we add a small
        // delay to allow the toast time to spawn.
        await delay(Duration.TOAST_DOM_LOADED);

        const toastCards = await getToastCards(testApp.identity.uuid, pregeneratedNote.id);

        expect(Array.isArray(toastCards)).toBe(true);
        expect(toastCards).toHaveLength(1);

        await assertDOMMatches(CardType.TOAST, testApp.identity.uuid, pregeneratedNote);
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
