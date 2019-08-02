import 'jest';
import {Application, Window as FinWindow} from 'hadouken-js-adapter';

import {Notification, NotificationOptions, NotificationCreatedEvent, NotificationActionEvent, NotificationClosedEvent} from '../../src/client';

import * as notifsRemote from './utils/notificationsRemote';
import {getCenterCardsByNotification, isCenterShowing} from './utils/centerUtils';
import {delay, Duration} from './utils/delay';
import {createApp} from './utils/spawnRemote';
import {testManagerIdentity} from './utils/constants';

const defaultNoteOptions: NotificationOptions = {
    body: 'Test Notification Body',
    title: 'Test Notification Title',
    category: 'Test Notification Category',
    onSelect: {action: 'select'},
    buttons: [
        {title: 'Button 1', onClick: {action: 'click'}}
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
            testApp = await createApp(testManagerIdentity, {});
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
                // Register the listener
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
                    notification: note
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
                    notification: note,
                    trigger: 'select',
                    result: {action: 'select'}
                });
            });

            test('Clicking on the card\'s button triggers the buttonClickListener and does not trigger the clickListener', async () => {
                const noteCards = await getCenterCardsByNotification(testApp.identity.uuid, note.id);

                // Get a remote handle to the button DOM element
                const buttonHandles = await noteCards[0].$$('.button');
                expect(buttonHandles).toHaveLength(1);

                // Click on the button and pause momentarily to allow the event to propagate
                await buttonHandles[0].click();
                await delay(Duration.EVENT_PROPAGATED);

                // buttonClickListener triggered with correct metadata
                expect(actionListener).toHaveBeenCalledTimes(1);
                expect(actionListener).toHaveBeenCalledWith({
                    type: 'notification-action',
                    notification: note,
                    trigger: 'control',
                    control: note.buttons[0],
                    result: {action: 'click'}
                });

                // select action not triggered
                expect(actionListener).not.toHaveBeenCalledWith({trigger: 'select'});
            });

            describe('When clicking the close button', () => {
                beforeEach(async () => {
                    const noteCards = await getCenterCardsByNotification(testApp.identity.uuid, note.id);

                    // Close button is only visible/clickable when card is hovered
                    await noteCards[0].hover();

                    // Get a remote handle to the close button DOM element
                    const closeHandles = await noteCards[0].$$('.close');
                    expect(closeHandles).toHaveLength(1);

                    // Click on the button and pause momentarily to allow the event to propagate
                    await closeHandles[0].click();
                    await delay(Duration.EVENT_PROPAGATED);
                });

                test('The closeListener is called once with the correct metadata the other listeners are not called', async () => {
                    expect(closedListener).toHaveBeenCalledTimes(1);
                    expect(closedListener).toHaveBeenCalledWith({
                        type: 'notification-closed',
                        notification: note
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
    });
});
