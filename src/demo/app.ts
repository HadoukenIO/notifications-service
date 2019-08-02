import * as ofnotes from '../client/index';
import {NotificationOptions, NotificationActionEvent, NotificationClosedEvent, NotificationCreatedEvent, create, addEventListener, clear, getAll} from '../client/index';

import {addSpawnListeners, createWindow, createApp} from './spawn';

addSpawnListeners();

// Mount createWindow and createApp on the window to be used by puppeteer
Object.assign(window, {createWindow, createApp, notifications: ofnotes});

const normalNote: NotificationOptions = {
    title: 'Notification Title',
    body: 'Notification Body',
    category: 'Test',
    icon: 'favicon.ico',
    customData: {testContext: 'testContext'},
    onSelect: 'Selected',
    buttons: []
};

const buttonNote: NotificationOptions = {
    title: 'Notification Title',
    body: 'Notification Body',
    category: 'Test',
    icon: 'favicon.ico',
    customData: {testContext: 'testContext'},
    date: new Date(),
    onSelect: 'Selected',
    buttons: [
        {title: 'test1', iconUrl: 'favicon.ico', onClick: 'Button 1'},
        {title: 'test2', iconUrl: 'favicon.ico', onClick: 'Button 2'}
    ]
};

function makeNoteOfType(index: number) {
    if (index % 2 === 1) {
        return create({id: `1q2w3e4r${index}`, ...normalNote});
    } else {
        return create({id: `1q2w3e4r${index}`, ...buttonNote});
    }
}

fin.desktop.main(async () => {
    const clientResponse = document.getElementById('clientResponse')!;

    function logit(msg: string) {
        const logEntry = document.createElement('div');
        logEntry.innerHTML = msg;
        clientResponse.insertBefore(logEntry, clientResponse.firstChild);
    }

    for (let index = 1; index < 7; index++) {
        document.getElementById(`button${index}`)!.addEventListener('click', () => {
            makeNoteOfType(index).catch((err) => {
                logit(`Error creating notification: ${err}`);
            });
        });

        document.getElementById(`clearbutton${index}`)!.addEventListener('click', () => {
            clear(`1q2w3e4r${index}`);
        });
    }

    document.getElementById('fetchAppNotifications')!.addEventListener('click', () => {
        getAll().then((notifications) => {
            logit(`${notifications.length} notifications received from the Notification Center`);
        });
    });

    addEventListener('notification-created', (event: NotificationCreatedEvent) => {
        logit(`CREATE action received from notification ${event.notification.id}`);
    });
    addEventListener('notification-closed', (event: NotificationClosedEvent) => {
        logit(`CLOSE action received from notification ${event.notification.id}`);
    });
    addEventListener('notification-action', (event: NotificationActionEvent) => {
        const {notification, trigger, control} = event;

        if (trigger === 'select') {
            logit(`SELECT action received from notification ${event.notification.id}`);
        } else if (control && control.type === 'button') {
            const buttonIndex = notification.buttons.indexOf(control);

            logit(`CONTROL action on button ${control.title} (Index: ${buttonIndex}) on notification ${notification.id}`);
        }
    });
});
