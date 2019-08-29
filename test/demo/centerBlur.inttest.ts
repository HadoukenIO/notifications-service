import {Application, Window} from 'hadouken-js-adapter';

import * as notifsRemote from './utils/notificationsRemote';
import {testManagerIdentity, defaultTestAppUrl} from './utils/constants';
import {createApp} from './utils/spawnRemote';
import {isCenterShowing} from './utils/centerUtils';
import {delay, Duration} from './utils/delay';

describe('When the Notification Center is open', () => {
    let testApp: Application;
    let testWindow: Window;

    afterAll(async () => {
        // Close center when we're done
        if (await isCenterShowing()) {
            await notifsRemote.toggleNotificationCenter(testManagerIdentity);
            await delay(Duration.CENTER_TOGGLED);
        }
    });

    beforeEach(async () => {
        testApp = await createApp(testManagerIdentity, {url: defaultTestAppUrl});
        testWindow = await testApp.getWindow();

        // Ensure center is showing
        if (!(await isCenterShowing())) {
            await notifsRemote.toggleNotificationCenter(testManagerIdentity);
            await delay(Duration.CENTER_TOGGLED);
        }
    });

    afterEach(async () => {
        await notifsRemote.clearAll(testWindow.identity);
        await testApp.quit();
    });

    test('The Notification Center is closed when it loses focus', async () => {
        await testWindow.focus();
        await delay(Duration.EVENT_PROPAGATED);
        await expect(isCenterShowing()).resolves.toBe(false);
    });

    test('If the Notification Center loses focus due to a click on a \'Toggle Visibility\' button, the Center is closed and remains closed', async () => {
        const toggleButton = await notifsRemote.getDomElementById(testWindow.identity, 'toggleNotificationCenter');

        await testWindow.focus();
        await toggleButton.click();

        await delay(Duration.EVENT_PROPAGATED);
        await expect(isCenterShowing()).resolves.toBe(false);
    });
});
