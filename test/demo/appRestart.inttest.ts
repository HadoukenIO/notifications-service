import 'jest';

import {Application, Window} from 'hadouken-js-adapter';
import {ElementHandle} from 'puppeteer';

import {NotificationOptions} from '../../src/client';
import * as notifsRemote from '../utils/int/notificationsRemote';
import * as providerRemote from '../utils/int/providerRemote';
import {delay, Duration} from '../utils/int/delay';
import {getToastCards} from '../utils/int/toastUtils';
import {testManagerIdentity, testAppUrlListenersOnStartup} from '../utils/int/constants';
import {waitForAppToBeRunning} from '../utils/int/common';
import {createAppInServiceRealm} from '../utils/int/spawnRemote';

const relaunchNotificationOptions: NotificationOptions = {
    body: 'Test Notification Body',
    title: 'Test Notification Title',
    category: 'Test Notification Category',
    customData: {testContext: 'testContext'},
    onSelect: {task: 'Selected'},
    buttons: []
};

const nonRelaunchNotificationOptions: NotificationOptions = {
    body: 'Test Notification Body',
    title: 'Test Notification Title',
    category: 'Test Notification Category'
};

describe('When an app that uses notification-service is created', () => {
    let testApp: Application;
    let testWindow: Window;

    beforeEach(async () => {
        testApp = await createAppInServiceRealm(testManagerIdentity, {url: testAppUrlListenersOnStartup});
        testWindow = await testApp.getWindow();
    });

    afterEach(async () => {
        await providerRemote.clearStoredNotifications(testWindow.identity);
        if (await testApp.isRunning()) {
            await testApp.quit();
        }
    });

    describe('When the application creates a notification with an action result and then quits', () => {
        let toastCards: ElementHandle[] | undefined;

        beforeEach(async () => {
            const {note} = await notifsRemote.createAndAwait(testWindow.identity, relaunchNotificationOptions);
            await delay(Duration.TOAST_DOM_LOADED * 2);
            toastCards = await getToastCards(testApp.identity.uuid, note.id);
            await testApp.quit();
        });

        test('Clicking the notification restarts the application and then the application received the deferred event', async () => {
            toastCards![0].click();
            await waitForAppToBeRunning(testApp.identity);
            expect(await testApp.isRunning()).toBeTruthy();

            expect(await notifsRemote.getReceivedEvents((await testApp.getWindow()).identity, 'notification-action')).toHaveLength(1);
        });
    });

    describe('When the application creates a notification without an action result and then quits', () => {
        let toastCards: ElementHandle[] | undefined;

        beforeEach(async () => {
            const {note} = await notifsRemote.createAndAwait(testWindow.identity, nonRelaunchNotificationOptions);
            await delay(Duration.TOAST_DOM_LOADED * 2);
            toastCards = await getToastCards(testApp.identity.uuid, note.id);
            await testApp.quit();
        });

        test('Clicking the notification does not restart the app', async () => {
            toastCards![0].click();
            await expect(waitForAppToBeRunning(testApp.identity)).rejects.toBeDefined();
        });
    });
});
