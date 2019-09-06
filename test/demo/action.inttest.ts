import 'jest';

import {Application, Window} from 'hadouken-js-adapter';
import {ElementHandle} from 'puppeteer';

import {NotificationOptions} from '../../src/client';

import * as notifsRemote from './utils/notificationsRemote';
import * as providerRemote from './utils/providerRemote';
import {delay, Duration} from './utils/delay';
import {getToastCards} from './utils/toastUtils';
import {createAppInServiceRealm} from './utils/spawnRemote';
import {testManagerIdentity, defaultTestAppUrl} from './utils/constants';

const notificationOptions: NotificationOptions = {
    body: 'Test Notification Body',
    title: 'Test Notification Title',
    category: 'Test Notification Category',
    customData: {testContext: 'testContext'},
    onSelect: {task: 'Selected'},
    buttons: []
};

describe('When an app that uses notification-service is created', () => {
    let testApp: Application;
    let testWindow: Window;

    beforeEach(async () => {
        testApp = await createAppInServiceRealm(testManagerIdentity, {url: defaultTestAppUrl});
        testWindow = await testApp.getWindow();
    });

    afterEach(async () => {
        await providerRemote.clearStoredNotifications(testWindow.identity);
        if (await testApp.isRunning()) {
            await testApp.quit();
        }
    });

    describe('When the application creates a notification', () => {
        let toastCards: ElementHandle[] | undefined;

        beforeEach(async () => {
            const {note} = await notifsRemote.createAndAwait(testWindow.identity, notificationOptions);
            await delay(Duration.TOAST_DOM_LOADED);
            toastCards = await getToastCards(testApp.identity.uuid, note.id);
        });

        test('Clicking the notification should close the notification card after notification action is dispatched.', async () => {
            toastCards![0].click();
            await delay(Duration.EVENT_PROPAGATED);
            expect(await notifsRemote.getReceivedEvents((await testApp.getWindow()).identity, 'notification-action')).toHaveLength(1);
            expect(await notifsRemote.getReceivedEvents((await testApp.getWindow()).identity, 'notification-closed')).toHaveLength(1);
        });
    });
});
