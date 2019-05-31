import 'jest';
import {Application, Window as FinWindow} from 'hadouken-js-adapter';

import {NotificationClickedEvent, Notification, NotificationOptions} from '../../src/client';

import {fin} from './utils/fin';
import * as notifsRemote from './utils/notificationsRemoteExecution';
import {getCardsByNotification} from './utils/notificationCenterUtils';
import {delay} from './utils/delay';

const defaultNoteOptions: NotificationOptions = {
    body: 'Test Notification Body',
    title: 'Test Notification Title'
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

        test('Can call addEventListener witout errors', async () => {
            await expect(notifsRemote.addEventListener(testAppMainWindow.identity, 'notification-clicked', () => {})).resolves;
        });

        describe('With a notification in the center and a click-listener registered', () => {
            let clickListener: jest.Mock<void, [NotificationClickedEvent]>;
            let note: Notification;

            beforeEach(async () => {
                // Register the listener
                clickListener = jest.fn<void, [NotificationClickedEvent]>();
                await notifsRemote.addEventListener(testAppMainWindow.identity, 'notification-clicked', clickListener);

                // Create the notification
                note = await notifsRemote.create(testAppMainWindow.identity, defaultNoteOptions);
            });

            test('Clicking on the card will trigger the listener with the metadata of the clicked notification', async () => {
                const noteCards = await getCardsByNotification(testApp.identity.uuid, note.id);

                // Quick sanity check that there is only one notification with this ID
                // This is tested more thoroughly in creatNotification tests
                expect(noteCards).toHaveLength(1);

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
