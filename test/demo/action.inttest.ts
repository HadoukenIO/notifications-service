import 'jest';

import {Application, Window} from 'hadouken-js-adapter';
import {ElementHandle} from 'puppeteer';

import {NotificationOptions, NotificationActionEvent, NotificationClosedEvent} from '../../src/client';
import * as notifsRemote from '../utils/int/notificationsRemote';
import * as providerRemote from '../utils/int/providerRemote';
import {delay, Duration} from '../utils/int/delay';
import {getToastCards, getToastButtons} from '../utils/int/toastUtils';
import {createAppInServiceRealm} from '../utils/int/spawnRemote';
import {testManagerIdentity, testAppUrlDefault} from '../utils/int/constants';

const notificationOptions: NotificationOptions = {
    body: 'Test Notification Body',
    title: 'Test Notification Title',
    category: 'Test Notification Category',
    customData: {testContext: 'testContext'},
    onSelect: {task: 'Selected'},
    buttons: [{title: 'testButton', onClick: {btn: 'testAction'}}]
};

describe('When an app that uses notification-service is created', () => {
    let eventOrdering: string[];
    let actionListener: jest.Mock<void, [NotificationActionEvent]>;
    let closedListener: jest.Mock<void, [NotificationClosedEvent]>;
    let testApp: Application;
    let testWindow: Window;

    beforeEach(async () => {
        eventOrdering = [];
        actionListener = jest.fn<void, [NotificationActionEvent]>().mockImplementation(() => eventOrdering.push('action'));
        closedListener = jest.fn<void, [NotificationClosedEvent]>().mockImplementation(() => eventOrdering.push('closed'));
        testApp = await createAppInServiceRealm(testManagerIdentity, {url: testAppUrlDefault});
        testWindow = await testApp.getWindow();
        await notifsRemote.addEventListener(testWindow.identity, 'notification-action', actionListener);
        await notifsRemote.addEventListener(testWindow.identity, 'notification-closed', closedListener);
    });

    afterEach(async () => {
        await providerRemote.clearStoredNotifications(testWindow.identity);
        if (await testApp.isRunning()) {
            await testApp.quit();
        }
    });

    describe('When the application creates a notification', () => {
        let noteId: string;
        beforeEach(async () => {
            const {note} = await notifsRemote.createAndAwait(testWindow.identity, notificationOptions);
            noteId = note.id;
            await delay(Duration.TOAST_DOM_LOADED);
        });

        describe('When the notification body is clicked', () => {
            let toastCards: ElementHandle[] | undefined;
            beforeEach(async () => {
                toastCards = await getToastCards(testApp.identity.uuid, noteId);
            });

            test('Notification card should be closed after the action is dispatched.', async () => {
                toastCards![0].click();
                await delay(Duration.EVENT_PROPAGATED);
                expect(eventOrdering).toEqual(['action', 'closed']);
            });
        });

        describe('When a button in notification is clicked', () => {
            let toastButtons: ElementHandle[] | undefined;
            beforeEach(async () => {
                toastButtons = await getToastButtons(testApp.identity.uuid, noteId);
            });

            test('Notification card should be closed after the action is dispatched.', async () => {
                toastButtons![0].click();
                await delay(Duration.EVENT_PROPAGATED);
                expect(eventOrdering).toEqual(['action', 'closed']);
            });
        });
    });
});
