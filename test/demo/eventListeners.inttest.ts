import 'jest';
import {Application, Window as FinWindow} from 'hadouken-js-adapter';

import {NotificationClickedEvent, Notification, NotificationOptions, NotificationButtonClickedEvent, NotificationClosedEvent} from '../../src/client';

import {fin} from './utils/fin';
import * as notifsRemote from './utils/notificationsRemoteExecution';
import {getCardsByNotification} from './utils/notificationCenterUtils';
import {delay} from './utils/delay';

const defaultNoteOptions: NotificationOptions = {
    body: 'Test Notification Body',
    title: 'Test Notification Title',
    buttons: [
        {title: 'Button 1'}
    ]
};

describe('Click listeners', () => {
    describe('With one app running', () => {
        let testApp: Application;
        let testAppMainWindow: FinWindow;
        beforeEach(async () => {
            testApp = await createTestApp();
            testAppMainWindow = await testApp.getWindow();
            await delay(2000);
        });

        afterEach(async () => {
            await testApp.close();
            await delay(2000);
        });

        describe('With a notification in the center and all three listener types registered', () => {
            let clickListener: jest.Mock<void, [NotificationClickedEvent]>;
            let buttonClickListener: jest.Mock<void, [NotificationButtonClickedEvent]>;
            let closeListener: jest.Mock<void, [NotificationClosedEvent]>;
            let note: Notification;

            beforeEach(async () => {
                // Register the listener
                clickListener = jest.fn<void, [NotificationClickedEvent]>();
                buttonClickListener = jest.fn<void, [NotificationButtonClickedEvent]>();
                closeListener = jest.fn<void, [NotificationClosedEvent]>();
                await notifsRemote.addEventListener(testAppMainWindow.identity, 'notification-clicked', clickListener);
                await notifsRemote.addEventListener(testAppMainWindow.identity, 'notification-button-clicked', buttonClickListener);
                await notifsRemote.addEventListener(testAppMainWindow.identity, 'notification-closed', closeListener);

                // Create the notification
                note = await notifsRemote.create(testAppMainWindow.identity, defaultNoteOptions);

                // Quick sanity check that there is exactly one notification card with this ID
                // This is tested more thoroughly in creatNotification tests
                const noteCards = await getCardsByNotification(testApp.identity.uuid, note.id);
                expect(noteCards).toHaveLength(1);
            });

            afterEach(async () => {
                // Clean up the leftover notification
                await notifsRemote.clearAll(testAppMainWindow.identity);
            });

            test('Clicking on the card will trigger the listener with the metadata of the clicked notification', async () => {
                const noteCards = await getCardsByNotification(testApp.identity.uuid, note.id);

                // Click on the card and pause momentarily to allow the event to propagate
                await noteCards[0].click();
                await delay(100);

                // Listener was triggered once with the correct data
                expect(clickListener).toHaveBeenCalledTimes(1);
                expect(clickListener).toHaveBeenCalledWith({
                    type: 'notification-clicked',
                    notification: note
                });
            });

            test('Clicking on the card\'s button triggers the buttonClickListener and does not trigger the clickListener', async () => {
                const noteCards = await getCardsByNotification(testApp.identity.uuid, note.id);

                // Get a remote handle to the button DOM element
                const buttonHandles = await noteCards[0].$$('.button');
                expect(buttonHandles).toHaveLength(1);

                // Click on the button and pause momentarily to allow the event to propagate
                await buttonHandles[0].click();
                await delay(100);

                // clickListener not triggered
                expect(clickListener).toHaveBeenCalledTimes(0);

                // buttonClickListener triggered with correct metadata
                expect(buttonClickListener).toHaveBeenCalledTimes(1);
                expect(buttonClickListener).toHaveBeenCalledWith({
                    type: 'notification-button-clicked',
                    notification: note,
                    buttonIndex: 0
                });
            });
        });
    });
});

// TODO: Window/App creation utils
const nextUuid = (() => {
    let count = 100;
    return () => 'notifications-test-app-' + (count++);
})();

async function createTestApp():Promise<Application> {
    const uuid = nextUuid();
    const app = await fin.Application.create({
        uuid,
        name: uuid,
        url: 'http://localhost:3922/test/test-app.html',
        autoShow: true,
        showTaskbarIcon: false,
        defaultHeight: 400,
        defaultWidth: 500
    });
    await app.run();
    return app;
}


// Params:
// Event Type:
// - Click
// - Button click
// - Closed

// Multiple windows/apps
// - One app / one window
// - One app / two windows
// - Two apps / one window each
// - Two apps / two windows each
