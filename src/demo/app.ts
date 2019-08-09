import {addSpawnListeners, createApp, createWindow} from 'openfin-service-tooling/spawn';

import * as ofnotes from '../client/index';
import {NotificationOptions, NotificationActionEvent, NotificationClosedEvent, NotificationCreatedEvent, create, addEventListener, clear, getAll} from '../client/index';

addSpawnListeners();

// Mount createWindow and createApp on the window to be used by puppeteer
Object.assign(window, {createWindow, createApp, notifications: ofnotes});

const normalNote: NotificationOptions = {
    title: 'Notification Title',
    body: 'Notification Body',
    category: 'Short',
    icon: 'favicon.ico',
    customData: {testContext: 'testContext'},
    onSelect: 'Selected',
    buttons: []
};

const longNote: NotificationOptions = {
    // eslint-disable-next-line max-len
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    category: 'Long',
    title: 'Notification Title ',
    icon: 'favicon.ico',
    customData: {testContext: 'testContext'},
    date: new Date(),
    buttons: []
};

const buttonNote: NotificationOptions = {
    title: 'Notification Title',
    body: 'Notification Body',
    category: 'Buttons',
    icon: 'favicon.ico',
    customData: {testContext: 'testContext'},
    onSelect: 'Selected',
    buttons: [
        {title: 'test1', iconUrl: 'favicon.ico', onClick: 'Button 1'},
        {title: 'test2', iconUrl: 'favicon.ico', onClick: 'Button 2'}
    ]
};

function makeNoteOfType(index: number) {
    if (index % 3 === 1) {
        return create({id: `1q2w3e4r${index}`, date: new Date(), ...normalNote});
    } else if (index % 3 === 2) {
        return create({id: `1q2w3e4r${index}`, date: new Date(), ...longNote});
    } else {
        return create({id: `1q2w3e4r${index}`, date: new Date(), ...buttonNote});
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
