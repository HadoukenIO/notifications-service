import 'jest';

import {Application, Identity} from 'hadouken-js-adapter';
import {ElementHandle} from 'puppeteer';

import {NotificationClosedEvent, NotificationClickedEvent} from '../../src/client';

import {fin} from './utils/fin';
import * as notifsRemote from './utils/notificationsRemoteExecution';
import {delay} from './utils/delay';
import {OFPuppeteerBrowser} from './utils/ofPuppeteer';

const mainWindowIdentity = {uuid: 'test-app', name: 'test-app'};
const centerIdentity = {uuid: 'notifications-service', name: 'Notification-Center'};

describe('', () => {
    beforeAll(async () => {
        // Show the center - Revisit when we have more than one file.
        await notifsRemote.toggleNotificationCenter(mainWindowIdentity);
    });

    let testApp: Application;
    let testWindowIdentity: Identity;
    beforeEach(async () => {
        testApp = await createTestApp();
        testWindowIdentity = await testApp.getWindow().then(w => w.identity);
    });

    afterEach(async () => {
        testApp.close();
    });

    test('', async () => {
        const clickListener = jest.fn((event: NotificationClickedEvent) => {});
        const closeListener = jest.fn((event: NotificationClosedEvent) => {});
        await notifsRemote.addEventListener(testWindowIdentity, 'notification-clicked', clickListener);
        await notifsRemote.addEventListener(testWindowIdentity, 'notification-closed', closeListener);

        // Check that returned object has the correct data
        const note = await notifsRemote.create(testWindowIdentity, {body: 'body body body body', title: 'Title title title'});
        expect(note).toHaveProperty('body', 'body body body body');

        // Get all cards for the notification we just created
        const noteCards = await getCardsByNoteID(testWindowIdentity.uuid, note.id);

        // Should only be one card per ID
        expect(noteCards.length).toBe(1);

        // Click triggers listener
        await noteCards[0].click();
        await delay(1000);
        expect(clickListener).toHaveBeenCalledTimes(1);

        // Close triggers listener
        const closeButtonHandle = await noteCards[0].$('.notification-close-x');
        if (closeButtonHandle) {
            await closeButtonHandle.click();
        }
        await delay(1000);
        expect(closeListener).toHaveBeenCalledTimes(1);

        // Clear after close returns false
        expect(await notifsRemote.clear(testWindowIdentity, note.id)).toBe(false);
    });
});


// TODO: Pull all of the notification center utils into their own file
const ofBrowser = new OFPuppeteerBrowser();
async function getAllCards() {
    const centerPage = await ofBrowser.getPage(centerIdentity);
    return centerPage!.$$('.notification-item');
}
async function getCardsByApp(sourceUuid: string): Promise<ElementHandle[]> {
    const centerPage = await ofBrowser.getPage(centerIdentity);
    return centerPage!.$$(`.notification-item[note-id*="${sourceUuid}"]`);
}
async function getCardsByNoteID(sourceUuid: string, notificationId: string): Promise<ElementHandle[]> {
    const centerPage = await ofBrowser.getPage(centerIdentity);
    return centerPage!.$$(`.notification-item[note-id="${sourceUuid}:${notificationId}"]`);
}

// TODO: Window/App creation utils
const nextUuid = (() => {
    let count = 0;
    return () => 'notifications-test-app-' + (count++);
})();

async function createTestApp():Promise<Application> {
    const uuid = nextUuid();
    const app = await fin.Application.create({
        uuid,
        name: uuid,
        url: 'http://localhost:3922/test/test-app.html',
        autoShow: true,
        showTaskbarIcon: false,
        defaultHeight: 400,
        defaultWidth: 500
    });
    await app.run();
    return app;
}
