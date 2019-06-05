import 'jest';

import {Application, Identity} from 'hadouken-js-adapter';

import {Notification, NotificationOptions} from '../../src/client';

import {fin} from './utils/fin';
import * as notifsRemote from './utils/notificationsRemoteExecution';
import {getCardsByNotification, isCenterShowing} from './utils/notificationCenterUtils';
import {delay} from './utils/delay';
import {getToastWindow, getToastCards} from './utils/toastUtils';

const validOptions: NotificationOptions = {
    body: 'Test Notification Body',
    title: 'Test Notification Title'
};

describe('When calling createNotification', () => {
    describe('With the notification center not showing', () => {
        beforeAll(async () => {
            // Hide the center to be sure we get toasts
            if (await isCenterShowing()) {
                await notifsRemote.toggleNotificationCenter({uuid: 'test-app', name: 'test-app'});
            }
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

        test('A toast is shown for the notification', async () => {
            const note = await notifsRemote.create(testWindowIdentity, validOptions);
            await delay(1000);
            const toastWindow = await getToastWindow(testApp.identity, note.id);
            expect(toastWindow).not.toBe(undefined);


            await notifsRemote.clear(testWindowIdentity, note.id);
        });

        test('The toast is displaying the correct data', async () => {
            const note = await notifsRemote.create(testWindowIdentity, validOptions);
            await delay(1000);

            const toastCards = await getToastCards(testApp.identity, note.id);

            expect(Array.isArray(toastCards)).toBe(true);
            expect(toastCards).toHaveLength(1);

            const toastCard = toastCards![0];
            const titleElement = await toastCard.$('.title');
            const cardTitle = await titleElement!.getProperty('innerHTML').then(val => val.jsonValue());

            expect(cardTitle).toEqual(note.title);
        });
    });

    describe('With the notification center showing', () => {
        beforeAll(async () => {
            // Show the center to ensure we don't get toasts
            if (!(await isCenterShowing())) {
                await notifsRemote.toggleNotificationCenter({uuid: 'test-app', name: 'test-app'});
            }
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

        test('No toast is shown for the created notification', async () => {
            const note = await notifsRemote.create(testWindowIdentity, validOptions);
            await delay(1000);

            const toastWindow = await getToastWindow(testApp.identity, note.id);
            expect(toastWindow).toBe(undefined);

            await notifsRemote.clear(testWindowIdentity, note.id);
        });

        describe('When passing invalid options', () => {
            let createPromise: Promise<Notification>;
            beforeEach(() => {
                // Intentionally circumventing type check with cast for testing purposes
                createPromise = notifsRemote.create(testWindowIdentity, {id: 'invalid-notification'} as NotificationOptions);
            });

            afterEach(async () => {
                // Cleanup the created notification (just in case it does get made)
                await createPromise.catch(() => {});
                await notifsRemote.clear(testWindowIdentity, 'invalid-notification');
            });

            test('An error is thrown', async () => {
                expect(createPromise).rejects.toThrow();
            });

            test('No notification is created', async () => {
                // We want to be sure the action has completed, but don't care about the result
                await createPromise.catch(() => {});

                // Should be no card in the center for this ID
                const noteCards = await getCardsByNotification(testWindowIdentity.uuid, 'invalid-notification');
                expect(noteCards.length).toBe(0);
            });
        });

        describe('With no ID specified', () => {
            let createPromise: Promise<Notification>;
            beforeEach(async () => {
                createPromise = notifsRemote.create(testWindowIdentity, validOptions);
            });

            afterEach(async () => {
                try {
                    const note = await createPromise;
                    await notifsRemote.clear(testWindowIdentity, note.id);
                } catch (e) {
                    // do nothing
                }
            });

            test('An ID is generated by the service and the notification is created and added to the center', async () =>{
                await expect(createPromise).resolves;

                const note = await createPromise;

                expect(note).toMatchObject(validOptions);
                expect(note.id).toMatch(/[0-9]{6,9}/); // Random 9-digit numeric string
            });
        });
    });
});

// TODO: Make this a util modeled on layouts' spawn utils (SERVICE-524)
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
