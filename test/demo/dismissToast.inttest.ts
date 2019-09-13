import 'jest';
import {ElementHandle} from 'puppeteer';
import {Application, Window} from 'hadouken-js-adapter';

import {NotificationOptions, Notification} from '../../src/client';
import * as notifsRemote from '../utils/int/notificationsRemote';
import {getCenterCardsByNotification} from '../utils/int/centerUtils';
import {delay, Duration} from '../utils/int/delay';
import {getToastWindow, getToastCards, getToastDismissButton} from '../utils/int/toastUtils';
import {assertNotificationStored} from '../utils/int/storageRemote';
import {testManagerIdentity, testAppUrlDefault} from '../utils/int/constants';
import {setupClosedCenterBookends} from '../utils/int/common';
import {createAppInServiceRealm} from '../utils/int/spawnRemote';

const options: NotificationOptions = {
    body: 'Test Notification Body',
    title: 'Test Notification Title',
    category: 'Test Notification Category'
};

describe('When dismissing a toast', () => {
    let testApp: Application;
    let testWindow: Window;
    let note: Notification;
    let toastCard: ElementHandle;

    setupClosedCenterBookends();

    beforeEach(async () => {
        testApp = await createAppInServiceRealm(testManagerIdentity, {url: testAppUrlDefault});
        testWindow = await testApp.getWindow();

        ({note} = await notifsRemote.createAndAwait(testWindow.identity, options));
        await delay(Duration.TOAST_DOM_LOADED);
        toastCard = (await getToastCards(testApp.identity.uuid, note.id))![0];
    });

    afterEach(async () => {
        await notifsRemote.clearAll(testWindow.identity);
        await testApp.quit();
    });

    async function dismissToast() {
        const dismissButton = (await getToastDismissButton(testApp.identity.uuid, note.id))![0]!;
        await toastCard.hover();
        await dismissButton.click();
        await delay(Duration.TOAST_CLOSE);
    }

    test('A toast will have a dismiss button', async () => {
        expect(getToastDismissButton(testApp.identity.uuid, note.id)).resolves.toBeDefined();
    });

    test('Clicking the dismiss button removes the toast', async () => {
        await dismissToast();
        const toastWindow = await getToastWindow(testApp.identity.uuid, note.id);
        expect(toastWindow).toBeUndefined();
    });

    test('The card still exists in the center', async () => {
        await dismissToast();
        const noteCards = await getCenterCardsByNotification(testApp.identity.uuid, note.id);
        expect(noteCards).toHaveLength(1);
    });

    test('The card in the center does not have a dismiss button', async () => {
        await dismissToast();
        const noteCards = await getCenterCardsByNotification(testApp.identity.uuid, note.id);
        const dismissButton = await noteCards[0].$$('.dismiss');
        expect(dismissButton).toHaveLength(0);
    });

    test('The notification still persists in storage', async () => {
        await dismissToast();
        await assertNotificationStored(testWindow.identity, note);
    });
});
