import 'jest';
import {ElementHandle} from 'puppeteer';
import {Application, Window} from 'hadouken-js-adapter';

import {NotificationOptions, Notification} from '../../src/client';
import * as notifsRemote from '../utils/int/notificationsRemote';
import {getCenterCardsByNotification} from '../utils/int/centerUtils';
import {delay, Duration} from '../utils/int/delay';
import {getToastWindow, getToastCards, getToastMinimizeButton} from '../utils/int/toastUtils';
import {assertNotificationStored} from '../utils/int/storageRemote';
import {testManagerIdentity, testAppUrlDefault} from '../utils/int/constants';
import {setupClosedCenterBookends} from '../utils/int/common';
import {createAppInServiceRealm} from '../utils/int/spawnRemote';

const options: NotificationOptions = {
    body: 'Test Notification Body',
    title: 'Test Notification Title',
    category: 'Test Notification Category'
};

describe('When minimizing a toast', () => {
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

    async function minimizeToast() {
        const minimizeButton = (await getToastMinimizeButton(testApp.identity.uuid, note.id))![0]!;
        await toastCard.hover();
        await minimizeButton.click();
        await delay(Duration.TOAST_CLOSE);
    }

    test('A toast will have a minimize button', async () => {
        expect(getToastMinimizeButton(testApp.identity.uuid, note.id)).resolves.toBeDefined();
    });

    test('Clicking the minimize button removes the toast', async () => {
        await minimizeToast();
        const toastWindow = await getToastWindow(testApp.identity.uuid, note.id);
        expect(toastWindow).toBeUndefined();
    });

    test('The card still exists in the center', async () => {
        await minimizeToast();
        const noteCards = await getCenterCardsByNotification(testApp.identity.uuid, note.id);
        expect(noteCards).toHaveLength(1);
    });

    test('The card in the center does not have a minimize button', async () => {
        await minimizeToast();
        const noteCards = await getCenterCardsByNotification(testApp.identity.uuid, note.id);
        const minimizeButton = await noteCards[0].$$('.minimize');
        expect(minimizeButton).toHaveLength(0);
    });

    test('The notification still persists in storage', async () => {
        await minimizeToast();
        await assertNotificationStored(testWindow.identity, note);
    });
});
