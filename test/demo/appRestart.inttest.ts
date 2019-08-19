import 'jest';

import {Application, Window} from 'hadouken-js-adapter';
import {ElementHandle} from 'puppeteer';

import {NotificationOptions, Notification} from '../../src/client';

import * as notifsRemote from './utils/notificationsRemote';
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

    let createPromise: Promise<Notification>;
    let note: Notification;

    beforeEach(async () => {
        testApp = await createApp(testManagerIdentity, {url: defaultTestAppUrl});
        testWindow = await testApp.getWindow();
    });

    describe('When the application creates a notification and quits', () => {
        let toastCards: ElementHandle[] | undefined;

        beforeEach(async () => {
            ({createPromise, note} = await notifsRemote.createAndAwait(testWindow.identity, relaunchNotificationOptions));
            await delay(Duration.TOAST_DOM_LOADED);
            toastCards = await getToastCards(testApp.identity.uuid, note.id);
            await testApp.quit();
        });

        afterEach(async () => {
            await notifsRemote.clearAll(testWindow.identity);
            await testApp.quit();
        });

        test('A notification event that requires app restart causes the application to application restarts', async () => {
            toastCards![0].click();

            await waitForAppToBeRunning(testApp.identity);
            testWindow = await testApp.getWindow();
            expect(await testApp.isRunning()).toBeTruthy();
        });
    });

    describe('When the application creates a notification and quits', () => {
        let toastCards: ElementHandle[] | undefined;

        beforeEach(async () => {
            ({createPromise, note} = await notifsRemote.createAndAwait(testWindow.identity, nonRelaunchNotificationOptions));
            await delay(Duration.TOAST_DOM_LOADED);
            toastCards = await getToastCards(testApp.identity.uuid, note.id);
            await testApp.quit();
        });

        test('A notification event that requires app restart doesn\'t cause the application to applicatio', async () => {
            toastCards![0].click();
            testWindow = await testApp.getWindow();
            expect(await testApp.isRunning()).toBeFalsy();
        });
    });
});
