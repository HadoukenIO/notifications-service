import 'jest';
import {Application, Window as FinWindow} from 'hadouken-js-adapter';

import {Notification, NotificationOptions, NotificationCreatedEvent, NotificationActionEvent, NotificationClosedEvent} from '../../src/client';

import * as notifsRemote from './utils/notificationsRemote';
import {getCenterCardsByNotification, isCenterShowing} from './utils/centerUtils';
import {delay, Duration} from './utils/delay';
import {createApp} from './utils/spawnRemote';
import {testManagerIdentity, testAppUrlDefault} from './utils/constants';

const defaultNoteOptions: NotificationOptions = {
    body: 'Test Notification Body',
    title: 'Test Notification Title',
    category: 'Test Notification Category',
    onSelect: {task: 'select'},
    buttons: [
        {title: 'Button 1', onClick: {task: 'click'}}
    ]
};

describe('Click listeners', () => {
    beforeAll(async () => {
        // Make sure the center is showing
        if (!(await isCenterShowing())) {
            await notifsRemote.toggleNotificationCenter(testManagerIdentity);
        }
    });

    describe('With one app running', () => {
        let testApp: Application;
        let testAppMainWindow: FinWindow;
        beforeEach(async () => {
            testApp = await createApp(testManagerIdentity, {url: testAppUrlDefault});
            testAppMainWindow = await testApp.getWindow();
        });

        afterEach(async () => {
            await notifsRemote.clearAll(testAppMainWindow.identity);
            await testApp.quit();
        });

        describe('With a notification in the center and all three listener types registered', () => {
            let createdListener: jest.Mock<void, [NotificationCreatedEvent]>;
            let actionListener: jest.Mock<void, [NotificationActionEvent]>;
            let closedListener: jest.Mock<void, [NotificationClosedEvent]>;
            let note: Notification;

            beforeEach(async () => {
                // Register the listeners
                createdListener = jest.fn<void, [NotificationCreatedEvent]>();
                actionListener = jest.fn<void, [NotificationActionEvent]>();
                closedListener = jest.fn<void, [NotificationClosedEvent]>();
                await notifsRemote.addEventListener(testAppMainWindow.identity, 'notification-created', createdListener);
                await notifsRemote.addEventListener(testAppMainWindow.identity, 'notification-action', actionListener);
                await notifsRemote.addEventListener(testAppMainWindow.identity, 'notification-closed', closedListener);

                // Create the notification
                note = await notifsRemote.create(testAppMainWindow.identity, defaultNoteOptions);

                // Quick sanity check that there is exactly one notification card with this ID
                // This is tested more thoroughly in creatNotification tests
                const noteCards = await getCenterCardsByNotification(testApp.identity.uuid, note.id);
                expect(noteCards).toHaveLength(1);
            });

            afterEach(async () => {
                // Clean up the leftover notification
                await notifsRemote.clearAll(testAppMainWindow.identity);
            });

            test('The createListener is called when a notification is created', async () => {
                // Listener was triggered once with the correct data
                expect(createdListener).toHaveBeenCalledTimes(1);
                expect(createdListener).toHaveBeenCalledWith({
                    type: 'notification-created',
                    notification: {...note, date: note.date.toJSON()}
                });
            });

            test('Clicking on the card will trigger the listener with the metadata of the clicked notification', async () => {
                const noteCards = await getCenterCardsByNotification(testApp.identity.uuid, note.id);

                // Click on the card and pause momentarily to allow the event to propagate
                await noteCards[0].click();
                await delay(Duration.EVENT_PROPAGATED);

                // Listener was triggered once with the correct data
                expect(actionListener).toHaveBeenCalledTimes(1);
                expect(actionListener).toHaveBeenCalledWith({
                    type: 'notification-action',
                    notification: {...note, date: note.date.toJSON()},
                    trigger: 'select',
                    result: {task: 'select'}
                });
            });

            test('Clicking on the card\'s button triggers an ActionTrigger.CONTROL action and does not trigger an ActionTrigger.SELECT action', async () => {
                const noteCards = await getCenterCardsByNotification(testApp.identity.uuid, note.id);

                // Get a remote handle to the button DOM element
                const buttonHandles = await noteCards[0].$$('.button');
                expect(buttonHandles).toHaveLength(1);

                // Click on the button and pause momentarily to allow the event to propagate
                await buttonHandles[0].click();
                await delay(Duration.EVENT_PROPAGATED);

                // control triggered with correct metadata
                expect(actionListener).toHaveBeenCalledTimes(1);
                expect(actionListener).toHaveBeenCalledWith({
                    type: 'notification-action',
                    notification: {...note, date: note.date.toJSON()},
                    trigger: 'control',
                    control: note.buttons[0],
                    result: {task: 'click'}
                });
            });

            describe('When clicking the close button', () => {
                beforeEach(async () => {
                    await clickNotificationCloseButton(testApp.identity.uuid, note.id);
                });

                test('The closeListener is called once with the correct metadata the other listeners are not called', async () => {
                    expect(closedListener).toHaveBeenCalledTimes(1);
                    expect(closedListener).toHaveBeenCalledWith({
                        type: 'notification-closed',
                        notification: {...note, date: note.date.toJSON()}
                    });

                    // No 'action', or additional 'created', events
                    expect(createdListener).toHaveBeenCalledTimes(1);
                    expect(actionListener).toHaveBeenCalledTimes(0);
                });

                test('The notification is cleared and no longer appears in the center or when calling getAll', async () => {
                    // No card in the center
                    const noteCards = await getCenterCardsByNotification(testApp.identity.uuid, note.id);
                    expect(noteCards).toHaveLength(0);

                    // Not returned from getAll
                    const appNotes = await notifsRemote.getAll(testAppMainWindow.identity);
                    expect(appNotes).not.toContainEqual(note);
                });
            });
        });

        describe('With a notification in the center and only a closed listener registered', () => {
            let closedListener: jest.Mock<void, [NotificationClosedEvent]>;
            let note: Notification;

            beforeEach(async () => {
                // Register the listener
                closedListener = jest.fn<void, [NotificationClosedEvent]>();
                await notifsRemote.addEventListener(testAppMainWindow.identity, 'notification-closed', closedListener);

                // Create the notification
                note = await notifsRemote.create(testAppMainWindow.identity, defaultNoteOptions);

                // Quick sanity check that there is exactly one notification card with this ID
                // This is tested more thoroughly in creatNotification tests
                const noteCards = await getCenterCardsByNotification(testApp.identity.uuid, note.id);
                expect(noteCards).toHaveLength(1);
            });

            afterEach(async () => {
                // Clean up the leftover notification
                await notifsRemote.clearAll(testAppMainWindow.identity);
            });

            describe('When clicking the close button', () => {
                beforeEach(async () => {
                    await clickNotificationCloseButton(testApp.identity.uuid, note.id);
                });

                test('The closeListener is called once with the correct metadata the other listeners are not called', async () => {
                    expect(closedListener).toHaveBeenCalledTimes(1);
                    expect(closedListener).toHaveBeenCalledWith({
                        type: 'notification-closed',
                        notification: {...note, date: note.date.toJSON()}
                    });
                });
            });
        });
    });
});

async function clickNotificationCloseButton(uuid: string, notificationId: string): Promise<void> {
    const noteCards = await getCenterCardsByNotification(uuid, notificationId);

    // Close button is only visible/clickable when card is hovered
    await noteCards[0].hover();

    // Get a remote handle to the close button DOM element
    const closeHandles = await noteCards[0].$$('.close');
    expect(closeHandles).toHaveLength(1);

    // Click on the button and pause momentarily to allow the event to propagate
    await closeHandles[0].click();
    await delay(Duration.EVENT_PROPAGATED);
}
