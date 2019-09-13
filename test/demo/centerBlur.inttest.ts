import {Application, Window} from 'hadouken-js-adapter';

import * as notifsRemote from '../utils/int/notificationsRemote';
import {testManagerIdentity, testAppUrlDefault} from '../utils/int/constants';
import {createAppInServiceRealm} from '../utils/int/spawnRemote';
import {isCenterShowing, getCenterCloseButton} from '../utils/int/centerUtils';
import {delay, Duration} from '../utils/int/delay';
import {getElementById} from '../utils/int/dom';

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
        testApp = await createAppInServiceRealm(testManagerIdentity, {url: testAppUrlDefault});
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
        const toggleButton = await getElementById('toggleNotificationCenter', testWindow.identity);

        await testWindow.focus();
        await toggleButton.click();

        await delay(Duration.EVENT_PROPAGATED);
        await expect(isCenterShowing()).resolves.toBe(false);
    });

    test('The Notificiation Center is closed when its close button is clicked', async () => {
        const closeButton = await getCenterCloseButton();

        await closeButton.click();

        await delay(Duration.EVENT_PROPAGATED);
        expect(isCenterShowing()).resolves.toBe(false);
    });
});
