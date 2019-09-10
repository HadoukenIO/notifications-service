import {addSpawnListeners, createApp, createWindow} from 'openfin-service-tooling/spawn';

import * as ofnotes from '../client/index';
import {NotificationOptions, NotificationActionEvent, NotificationClosedEvent, NotificationCreatedEvent, create, addEventListener, clear, getAll, toggleNotificationCenter} from '../client/index';

addSpawnListeners();

// Mount createWindow and createApp on the window to be used by puppeteer
Object.assign(window, {createWindow, createApp, notifications: ofnotes});

const normalNote: NotificationOptions = {
    title: 'Notification Title',
    body: 'Notification Body',
    category: 'Short',
    icon: 'favicon.ico',
    customData: {testContext: 'testContext'},
    onSelect: {task: 'Selected'},
    buttons: []
};

const longNote: NotificationOptions = {
    // eslint-disable-next-line max-len
    body: `
# H1 Title
Some text below.

# H2 Title
Some text below. **Bold**. _Italic_.

- Item 1
- Item 2
    - A
    - B
- Item 3

> Block quote
Paragraph: Ut enim ad minim veniam, quis nostrud *exercitation* ullamco laboris nisi ut aliquip ex ea commodo consequat.

Paragraph: Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
    category: 'Long',
    title: 'Notification Title ',
    icon: 'favicon.ico',
    customData: {testContext: 'testContext'},
    onSelect: {task: 'Selected'},
    buttons: []
};

const buttonNote: NotificationOptions = {
    title: 'Notification Title',
    body: 'Notification Body',
    category: 'Buttons',
    icon: 'favicon.ico',
    customData: {testContext: 'testContext'},
    onSelect: {task: 'Selected'},
    buttons: [
        {title: 'test1', iconUrl: 'favicon.ico', onClick: {btn: 'Button 1'}},
        {title: 'test2', iconUrl: 'favicon.ico', onClick: {btn: 'Button 2'}}
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

    document.title = fin.Window.me.uuid;

    function logMessage(msg: string) {
        const logEntry = document.createElement('div');
        logEntry.innerHTML = msg;
        clientResponse.insertBefore(logEntry, clientResponse.firstChild);
    }

    for (let index = 1; index < 7; index++) {
        document.getElementById(`button${index}`)!.addEventListener('click', () => {
            makeNoteOfType(index).catch((err) => {
                logMessage(`Error creating notification: ${err}`);
            });
        });

        document.getElementById(`clearbutton${index}`)!.addEventListener('click', () => {
            clear(`1q2w3e4r${index}`);
        });
    }

    // Press 1-9 to create a notification, ctrl+1-9 to remove notification
    document.addEventListener('keydown', (event: KeyboardEvent) => {
        const index = parseInt(event.key);

        if (index >= 1) {
            if (event.ctrlKey) {
                clear(`1q2w3e4r${index}`);
            } else {
                makeNoteOfType(index);
            }
        }
    });

    document.getElementById('fetchAppNotifications')!.addEventListener('click', () => {
        getAll().then((notifications) => {
            logMessage(`${notifications.length} notifications received from the Notification Center`);
        });
    });

    document.getElementById('toggleNotificationCenter')!.addEventListener('click', () => {
        toggleNotificationCenter();
    });

    addEventListener('notification-created', (event: NotificationCreatedEvent) => {
        logMessage(`CREATE action received from notification ${event.notification.id}`);
    });
    addEventListener('notification-closed', (event: NotificationClosedEvent) => {
        logMessage(`CLOSE action received from notification ${event.notification.id}`);
    });
    addEventListener('notification-action', (event: NotificationActionEvent) => {
        const {notification, trigger, control} = event;

        if (trigger === 'select') {
            logMessage(`SELECT action received from notification ${event.notification.id}`);
        } else if (control && control.type === 'button') {
            const buttonIndex = notification.buttons.indexOf(control);

            logMessage(`CONTROL action on button ${control.title} (Index: ${buttonIndex}) on notification ${notification.id}`);
        }
    });
});
