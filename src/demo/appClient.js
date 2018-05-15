import * as ofnotes from "openfin-notifications"

function makeNote(id, opts) {
    return ofnotes.create(id,opts);
}

function clearNote(id) {
   return ofnotes.clear(id);
}

function getNotes() {
    return ofnotes.getAll();
}

document.addEventListener("DOMContentLoaded", function (event) {
    for (let index = 1; index < 7; index++) {
        document.getElementById(`button${index}`).addEventListener('click', () => {
            makeNote(`1q2w3e4r${index}`, { body: 'Notification Body ', title: 'Notification Title ', subtitle: 'testSubtitle', icon: 'favicon.ico', context: { testContext: 'testContext' }, date: Date.now(), buttons: [{ title: 'test1', icon: 'favicon.ico' }, { title: 'test2', icon: 'favicon.ico' }]})
                .then((notification) => {
                    if (!notification.success) {
                        document.getElementById('clientResponse').innerHTML = `
                                Notification ids must be unique! This id already exists!
                            `
                    }
                })
        });
    
        document.getElementById(`clearbutton${index}`).addEventListener('click', () => {
            clearNote(`1q2w3e4r${index}`)
        });
    }
    
    document.getElementById(`fetchAppNotifications`).addEventListener('click', () => {
        getNotes()
            .then((notifications) => {
                document.getElementById('clientResponse').innerHTML = `
                    ${notifications.value.length} notifications received from the Notification Center!                
                `
            })
    });
});





fin.desktop.main(async () => {
    ofnotes.addEventListener('click', (payload) => {
        document.getElementById('clientResponse').innerHTML = `CLICK action received from notification ${payload.id}`
    });
    
    ofnotes.addEventListener('close', (payload) => {
        document.getElementById('clientResponse').innerHTML = `CLOSE action received from notification ${payload.id}`
    });
    ofnotes.addEventListener('button-click', (payload) => {
        let buttonClicked = payload.buttons[payload.buttonIndex]
        console.log(buttonClicked);
        let buttonTitle = buttonClicked.title
        document.getElementById('clientResponse').innerHTML = `Button Click on ${buttonTitle} action received from notification ${payload.id}`
    });
});