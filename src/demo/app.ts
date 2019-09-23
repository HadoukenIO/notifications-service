import {addSpawnListeners, createApp, createWindow} from 'openfin-service-tooling/spawn';

import * as ofnotes from '../client/index';
import {NotificationOptions, NotificationActionEvent, NotificationClosedEvent, NotificationCreatedEvent, create, addEventListener, clear, getAll, toggleNotificationCenter} from '../client/index';
import {Events} from '../client/internal';
import {ActionTrigger} from '../client/actions';

addSpawnListeners();

const receivedEvents: Events[] = [];

// Mount functions and objects used by puppeteer
Object.assign(window, {createWindow, createApp, notifications: ofnotes, receivedEvents});

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
    body: `
# H1 Title
Some text below.

# H2 Title
Some text below. **Bold**. _Italic_.

- Item 1
- Item 2
    1. A
    2. B
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

// Counts how many times each type of notification has been created
const notificationCounter: Map<number, number> = new Map();

function makeNoteOfType(index: number) {
    let options: NotificationOptions;
    if (index % 3 === 1) {
        options = {id: `1q2w3e4r${index}`, date: new Date(), ...normalNote};
    } else if (index % 3 === 2) {
        options = {id: `1q2w3e4r${index}`, date: new Date(), ...longNote};
    } else if (index === 6) {
        options = {id: `1q2w3e4r${index}`, date: new Date(), expires: new Date(Date.now() + 30 * 1000), onExpire: {foo: 'bar'}, ...buttonNote};
    } else {
        options = {id: `1q2w3e4r${index}`, date: new Date(), ...buttonNote};
    }

    if (notificationCounter.has(index)) {
        // Increment counter
        const count = notificationCounter.get(index)! + 1;
        notificationCounter.set(index, count);

        // Include count within title
        options.title += ` (x${count})`;
    } else {
        notificationCounter.set(index, 1);
    }

    return create(options);
}

fin.desktop.main(async () => {
    const clientResponse = document.getElementById('clientResponse')!;

    document.title = fin.Window.me.uuid;

    function logMessage(msg: string) {
        const logEntry = document.createElement('div');
        logEntry.innerHTML = msg;
        clientResponse.insertBefore(logEntry, clientResponse.firstChild);
    }

    for (let index = 1; index <= 6; index++) {
        document.getElementById(`button${index}`)!.addEventListener('click', () => {
            makeNoteOfType(index).catch((err) => {
                logMessage(`Error creating notification: ${err}`);
            });
        });

        document.getElementById(`clearbutton${index}`)!.addEventListener('click', async () => {
            await clear(`1q2w3e4r${index}`);
        });
    }

    // Press 1-9 to create a notification, ctrl+1-9 to remove notification
    document.addEventListener('keydown', async (event: KeyboardEvent) => {
        const index = parseInt(event.key);

        if (index >= 1) {
            if (event.ctrlKey) {
                await clear(`1q2w3e4r${index}`);
            } else {
                makeNoteOfType(index);
            }
        }
    });

    document.getElementById('create2')!.addEventListener('click', () => {
        for (let i = 1; i <= 2; i++) {
            makeNoteOfType(100 + Math.floor(Math.random() * 1000));
        }
    });
    document.getElementById('create5')!.addEventListener('click', () => {
        for (let i = 1; i <= 5; i++) {
            makeNoteOfType(100 + Math.floor(Math.random() * 1000));
        }
    });
    document.getElementById('clear2')!.addEventListener('click', async () => {
        const notifications = await getAll();
        for (let i = 0; i < 2 && notifications.length > 0; i++) {
            const index = Math.floor(Math.random() * notifications.length);
            await clear(notifications[index].id);
            notifications.splice(index, 1);
        }
    });
    document.getElementById('clear5')!.addEventListener('click', async () => {
        const notifications = await getAll();
        for (let i = 0; i < 5 && notifications.length > 0; i++) {
            const index = Math.floor(Math.random() * notifications.length);
            await clear(notifications[index].id);
            notifications.splice(index, 1);
        }
    });
    document.getElementById('fetchAppNotifications')!.addEventListener('click', () => {
        getAll().then((notifications) => {
            logMessage(`${notifications.length} notifications received from the Notification Center`);
        });
    });
    document.getElementById('toggleNotificationCenter')!.addEventListener('click', async () => {
        await toggleNotificationCenter();
    });

    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('inttest') === null) {
        addEventListener('notification-created', (event: NotificationCreatedEvent) => {
            logMessage(`CREATE action received from notification ${event.notification.id}`);
        });
        addEventListener('notification-closed', (event: NotificationClosedEvent) => {
            logMessage(`CLOSE action received from notification ${event.notification.id}`);
        });
        addEventListener('notification-action', (event: NotificationActionEvent) => {
            const {notification, trigger, control} = event;

            if (trigger !== ActionTrigger.CONTROL) {
                logMessage(`${trigger.toUpperCase()} action received from notification ${event.notification.id}`);
            } else if (control && control.type === 'button') {
                const buttonIndex = notification.buttons.indexOf(control);

                logMessage(`${trigger.toUpperCase()} action on button ${control.title} (Index: ${buttonIndex}) on notification ${notification.id}`);
            }
        });
    } else if (queryParams.get('inttest') === 'listeners-on-startup') {
        ofnotes.addEventListener('notification-action', (event) => {
            receivedEvents.push(event);
        });
        ofnotes.addEventListener('notification-created', (event) => {
            receivedEvents.push(event);
        });
        ofnotes.addEventListener('notification-closed', (event) => {
            receivedEvents.push(event);
        });
    }
});
