import 'jest';

import {Application, Window, Identity} from 'hadouken-js-adapter';
import {ElementHandle} from 'puppeteer';

import {NotificationOptions} from '../../src/client';

import * as notifsRemote from './utils/notificationsRemote';
import * as providerRemote from './utils/providerRemote';
import {delay, Duration} from './utils/delay';
import {getToastCards} from './utils/toastUtils';
import {createApp} from './utils/spawnRemote';
import {testManagerIdentity, defaultTestAppUrl} from './utils/constants';
import {waitForAppToBeRunning} from './utils/common';

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
        testApp = await createApp(testManagerIdentity, {url: defaultTestAppUrl});
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
        let restartedTestWindow: Window;

        beforeEach(async () => {
            const {note} = await notifsRemote.createAndAwait(testWindow.identity, relaunchNotificationOptions);
            await delay(Duration.TOAST_DOM_LOADED);
            toastCards = await getToastCards(testApp.identity.uuid, note.id);
            await testApp.quit();
        });

        test('Clicking the notification restarts the application and then the application received the deferred event', async () => {
            toastCards![0].click();
            await waitForAppToBeRunning(testApp.identity);
            expect(await testApp.isRunning()).toBeTruthy();

            restartedTestWindow = await testApp.getWindow();
            expect(await notifsRemote.getReceivedEvents(restartedTestWindow.identity, 'notification-action')).toHaveLength(1);
        });
    });

    describe('When the application creates a notification without an action result and then quits', () => {
        let toastCards: ElementHandle[] | undefined;

        beforeEach(async () => {
            const {note} = await notifsRemote.createAndAwait(testWindow.identity, nonRelaunchNotificationOptions);
            await delay(Duration.TOAST_DOM_LOADED);
            toastCards = await getToastCards(testApp.identity.uuid, note.id);
            await testApp.quit();
        });

        test('Clicking the notification does not restart the app', async () => {
            toastCards![0].click();
            await expect(waitForAppToBeRunning(testApp.identity)).rejects.toBeDefined();
        });
    });
});
