import 'jest';
import {Application, Window as FinWindow} from 'hadouken-js-adapter';

import {Notification, NotificationOptions, NotificationCreatedEvent, NotificationActionEvent, NotificationClosedEvent} from '../../src/client';
import * as notifsRemote from '../utils/int/notificationsRemote';
import {getCenterCardsByNotification} from '../utils/int/centerUtils';
import {delay, Duration} from '../utils/int/delay';
import {testManagerIdentity, testAppUrlDefault} from '../utils/int/constants';
import {createAppInServiceRealm} from '../utils/int/spawnRemote';
import {setupOpenCenterBookends, setupCommonBookends} from '../utils/int/common';

const defaultNoteOptions: NotificationOptions = {
    body: 'Test Notification Body',
    title: 'Test Notification Title',
    category: 'Test Notification Category',
    onSelect: {task: 'select'},
    onClose: {task: 'close'},
    buttons: [
        {title: 'Button 1', onClick: {task: 'click'}}
    ]
};

setupCommonBookends();

describe('Click listeners', () => {
    setupOpenCenterBookends();

    describe('With one app running', () => {
        let testApp: Application;
        let testAppMainWindow: FinWindow;
        beforeEach(async () => {
            testApp = await createAppInServiceRealm(testManagerIdentity, {url: testAppUrlDefault});
            testAppMainWindow = await testApp.getWindow();
        });

        afterEach(async () => {
            await notifsRemote.clearAll(testAppMainWindow.identity);
            await testApp.quit();
        });

        describe('With a notification in the center and all three listener types registered', () => {
            let eventOrdering: string[];
            let createdListener: jest.Mock<void, [NotificationCreatedEvent]>;
            let actionListener: jest.Mock<void, [NotificationActionEvent]>;
            let closedListener: jest.Mock<void, [NotificationClosedEvent]>;
            let note: Notification;

            beforeEach(async () => {
                // Register the listeners
                eventOrdering = [];
                createdListener = jest.fn<void, [NotificationCreatedEvent]>().mockImplementation(() => eventOrdering.push('created'));
                actionListener = jest.fn<void, [NotificationActionEvent]>().mockImplementation(() => eventOrdering.push('action'));
                closedListener = jest.fn<void, [NotificationClosedEvent]>().mockImplementation(() => eventOrdering.push('closed'));
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

                // Listener was triggered twice with the correct data
                // (once for notification-action and once for notification-action triggered by notification-closed events)
                expect(actionListener).toHaveBeenCalledTimes(2);
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

                // control triggered with correct metadata followed by a notification-action triggered by notification-closed event.
                expect(actionListener).toHaveBeenCalledTimes(2);
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
                    expect(actionListener).toHaveBeenCalledTimes(1);
                    expect(actionListener).toHaveBeenCalledWith({
                        type: 'notification-action',
                        notification: {...note, date: note.date.toJSON()},
                        trigger: 'close',
                        result: {task: 'close'}
                    });

                    expect(closedListener).toHaveBeenCalledTimes(1);
                    expect(closedListener).toHaveBeenCalledWith({
                        type: 'notification-closed',
                        notification: {...note, date: note.date.toJSON()}
                    });

                    // Action event fired before closed event
                    expect(eventOrdering).toEqual(['created', 'action', 'closed']);

                    // No additional 'created' events
                    expect(createdListener).toHaveBeenCalledTimes(1);
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
