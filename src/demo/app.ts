import * as ofnotes from '../client/index';
import {NotificationOptions, NotificationClickedEvent, NotificationClosedEvent, NotificationButtonClickedEvent} from '../client/Notification';

function makeNote(id: string, opts: NotificationOptions) {
    return ofnotes.create(Object.assign(opts, {date: Date.now(), notificationId: id}));
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
    context: {testContext: 'testContext'},
    date: new Date(),
    buttons: []
};

const buttonNote: NotificationOptions = {
    body: 'Notification Body',
    title: 'Notification Title ',
    subtitle: 'testSubtitle',
    icon: 'favicon.ico',
    context: {testContext: 'testContext'},
    date: new Date(),
    buttons: [{title: 'test1', iconUrl: 'favicon.ico'}, {title: 'test2', iconUrl: 'favicon.ico'}]
};

function makeNoteOfType(index: number) {
    if (index % 2 === 1) {
        return makeNote(`1q2w3e4r${index}`, normalNote);
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

    ofnotes.addEventListener<NotificationClickedEvent>('notification-clicked', (event: NotificationClickedEvent) => {
        // document.getElementById('clientResponse').innerHTML = `CLICK action
        // received from notification ${payload.id}`
        logit(`CLICK action received from notification ${event.notification.notificationId}`);
    });

    ofnotes.addEventListener('notification-closed', (event: NotificationClosedEvent) => {
        // document.getElementById('clientResponse').innerHTML = `CLOSE action
        // received from notification ${payload.id}`
        logit(`CLOSE action received from notification ${event.notification.notificationId}`);
    });
    ofnotes.addEventListener('notification-button-clicked', (event: NotificationButtonClickedEvent) => {
        const {buttonIndex, notification} = event;
        console.log(buttonIndex);
        // document.getElementById('clientResponse').innerHTML = `Button Click
        // on ${buttonTitle} action received from notification ${payload.id}`
        logit(`BUTTON CLICK on button ${buttonIndex} on notification ${notification.notificationId}`);
    });
});
