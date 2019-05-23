import 'jest';

import {Application, Identity} from 'hadouken-js-adapter';

import {NotificationClosedEvent} from '../../src/client';

import {fin} from './utils/fin';
import * as notifsRemote from './utils/notificationsRemoteExecution';

const mainWindowIdentity = {uuid: 'test-app', name: 'test-app'};

describe('', () => {
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
        const listener = jest.fn((event: NotificationClosedEvent) => {});
        await notifsRemote.addEventListener(testWindowIdentity, 'notification-closed', listener);
        expect(await notifsRemote.clear(testWindowIdentity, 'asvaefa')).toBe(false);
        expect(listener).toHaveBeenCalledTimes(0);
    });
});

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
