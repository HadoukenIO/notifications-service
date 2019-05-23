import 'jest';

import {Application, Identity} from 'hadouken-js-adapter';

import {NotificationClosedEvent, NotificationClickedEvent} from '../../src/client';

import {fin} from './utils/fin';
import * as notifsRemote from './utils/notificationsRemoteExecution';
import {delay} from './utils/delay';
import { OFPuppeteerBrowser } from './utils/ofPuppeteer';

const mainWindowIdentity = {uuid: 'test-app', name: 'test-app'};
const centerIdentity = {uuid: "notifications-service", name: "Notification-Center"};

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
        const listener = jest.fn((event: NotificationClickedEvent) => {});
        await notifsRemote.addEventListener(testWindowIdentity, 'notification-clicked', listener);
        const note = await notifsRemote.create(testWindowIdentity, {body: 'body body body body', title: 'Title title title'});
        expect(note).toHaveProperty('body', 'body body body body');
        await delay(2000);
        const noteCards = await getCenterNotifications();
        await noteCards[0].click();
        await delay(2000);
        expect(listener).toHaveBeenCalledTimes(1);
        expect(await notifsRemote.clear(testWindowIdentity, note.id)).toBe(true);
    });
});

const nextUuid = (() => {
    let count = 0;
    return () => 'notifications-test-app-' + (count++);
})();

const ofBrowser = new OFPuppeteerBrowser();
async function getCenterNotifications() {
    const centerPage = await ofBrowser.getPage(centerIdentity);
    return centerPage!.$$('.notification-item');
}

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
