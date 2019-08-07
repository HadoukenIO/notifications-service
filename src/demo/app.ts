import {addSpawnListeners, createApp, createWindow} from 'openfin-service-tooling/spawn';

import * as ofnotes from '../client/index';
import {NotificationOptions, NotificationClickedEvent, NotificationClosedEvent, NotificationButtonClickedEvent} from '../client/index';

addSpawnListeners();

// Mount createWindow and createApp on the window to be used by puppeteer
Object.assign(window, {createWindow, createApp, notifications: ofnotes});

function makeNote(id: string, opts: NotificationOptions) {
    return ofnotes.create(Object.assign(opts, {date: new Date(), id}));
}

function clearNote(id: string) {
    return ofnotes.clear(id);
}

function getNotes() {
    return ofnotes.getAll();
}

const normalNote: NotificationOptions = {
    body: 'Notification Body',
    title: 'Notification Title ',
    subtitle: 'testSubtitle',
    icon: 'favicon.ico',
    customData: {testContext: 'testContext'},
    date: new Date(),
    buttons: []
};

const longNote: NotificationOptions = {
    // eslint-disable-next-line max-len
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    title: 'Notification Title ',
    subtitle: 'testSubtitle',
    icon: 'favicon.ico',
    customData: {testContext: 'testContext'},
    date: new Date(),
    buttons: []
};

const buttonNote: NotificationOptions = {
    body: 'Notification Body',
    title: 'Notification Title ',
    subtitle: 'testSubtitle',
    icon: 'favicon.ico',
    customData: {testContext: 'testContext'},
    date: new Date(),
    buttons: [{title: 'test1', iconUrl: 'favicon.ico'}, {title: 'test2', iconUrl: 'favicon.ico'}]
};

function makeNoteOfType(index: number) {
    if (index % 3 === 1) {
        return makeNote(`1q2w3e4r${index}`, normalNote);
    } else if (index % 3 === 2) {
        return makeNote(`1q2w3e4r${index}`, longNote);
    } else {
        return makeNote(`1q2w3e4r${index}`, buttonNote);
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
            clearNote(`1q2w3e4r${index}`);
        });
    }

    document.getElementById('fetchAppNotifications')!.addEventListener('click', () => {
        getNotes().then((notifications) => {
            // document.getElementById('clientResponse').innerHTML = `
            //     ${notifications.value.length} notifications received from the
            //     Notification Center!
            // `
            logit(`${notifications.length} notifications received from the Notification Center`);
        });
    });

    ofnotes.addEventListener('notification-clicked', (event: NotificationClickedEvent) => {
        // document.getElementById('clientResponse').innerHTML = `CLICK action
        // received from notification ${payload.id}`
        logit(`CLICK action received from notification ${event.notification.id}`);
    });

    ofnotes.addEventListener('notification-closed', (event: NotificationClosedEvent) => {
        // document.getElementById('clientResponse').innerHTML = `CLOSE action
        // received from notification ${payload.id}`
        logit(`CLOSE action received from notification ${event.notification.id}`);
    });
    ofnotes.addEventListener('notification-button-clicked', (event: NotificationButtonClickedEvent) => {
        const {buttonIndex, notification} = event;
        console.log(buttonIndex);
        // document.getElementById('clientResponse').innerHTML = `Button Click
        // on ${buttonTitle} action received from notification ${payload.id}`
        logit(`BUTTON CLICK on button ${buttonIndex} on notification ${notification.id}`);
    });
});
