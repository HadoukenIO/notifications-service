import {ProviderIdentity} from 'openfin/_v2/api/interappbus/channel/channel';

import * as ofnotes from '../client/index';
import {NotificationEvent, NotificationOptions} from '../client/Notification';

function makeNote(id: string, opts: NotificationOptions) {
    return ofnotes.create(id, Object.assign(opts, {date: Date.now()}));
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
    buttons: [],
    inputs: []
};

const buttonNote: NotificationOptions = {
    body: 'Notification Body',
    title: 'Notification Title ',
    subtitle: 'testSubtitle',
    icon: 'favicon.ico',
    context: {testContext: 'testContext'},
    date: new Date(),
    buttons: [{title: 'test1', icon: 'favicon.ico'}, {title: 'test2', icon: 'favicon.ico'}],
    inputs: []
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
            makeNoteOfType(index).then((notification) => {
                if (!notification.success) {
                    // document.getElementById('clientResponse').innerHTML = `
                    //             Notification ids must be unique! This id already
                    //             exists!
                    //         `
                    logit(`Notification ids must be unique! This id already exists!`);
                }
            });
        });

        document.getElementById(`clearbutton${index}`)!.addEventListener('click', () => {
            clearNote(`1q2w3e4r${index}`);
        });
    }

    document.getElementById(`fetchAppNotifications`)!.addEventListener('click', () => {
        getNotes().then((notifications) => {
            // document.getElementById('clientResponse').innerHTML = `
            //     ${notifications.value.length} notifications received from the
            //     Notification Center!
            // `
            logit(`${notifications.value.length} notifications received from the Notification Center`);
        });
    });

    ofnotes.addEventListener('click', (payload: NotificationEvent, sender: ProviderIdentity) => {
        // document.getElementById('clientResponse').innerHTML = `CLICK action
        // received from notification ${payload.id}`
        logit(`CLICK action received from notification ${payload.id}`);
        return '';
    });

    ofnotes.addEventListener('close', (payload: NotificationEvent, sender: ProviderIdentity) => {
        // document.getElementById('clientResponse').innerHTML = `CLOSE action
        // received from notification ${payload.id}`
        logit(`CLOSE action received from notification ${payload.id}`);
        return '';
    });
    ofnotes.addEventListener('button-click', (payload: NotificationEvent, sender: ProviderIdentity) => {
        const buttonClicked = payload.buttons[payload.buttonIndex];
        console.log(buttonClicked);
        const buttonTitle = buttonClicked.title;
        // document.getElementById('clientResponse').innerHTML = `Button Click
        // on ${buttonTitle} action received from notification ${payload.id}`
        logit(`BUTTON CLICK on ${buttonTitle} from notification ${payload.id}`);
        return '';
    });
});