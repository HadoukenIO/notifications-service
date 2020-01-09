import {Application, Window} from 'hadouken-js-adapter';

import * as notifsRemote from '../utils/int/notificationsRemote';
import {testManagerIdentity, testAppUrlDefault} from '../utils/int/constants';
import {createAppInServiceRealm} from '../utils/int/spawnRemote';
import {isCenterShowing, getCenterCloseButton, toggleCenterLocked} from '../utils/int/centerUtils';
import {delay, Duration} from '../utils/int/delay';
import {getElementById} from '../utils/int/dom';
import {isCenterLocked} from '../utils/int/providerRemote';
import {setupCommonBookends} from '../utils/int/common';

type TestParam = [string, boolean];

const testParams: TestParam[] = [['unlocked', false], ['locked', true]];

setupCommonBookends();

describe.each(testParams)('When the Notification Center is open and %s', (titleParam: string, locked: boolean) => {
    let testApp: Application;
    let testWindow: Window;

    beforeEach(async () => {
        // Ensure center is unlocked/locked
        if (await isCenterLocked() !== locked) {
            await toggleCenterLocked();
        }
    });

    afterAll(async () => {
        // Ensure center finishes locked
        if (!locked) {
            await toggleCenterLocked();
        }

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

    test(`The Notification Center is ${locked ? 'not ' : ''}closed when it loses focus`, async () => {
        await testWindow.focus();
        await delay(Duration.EVENT_PROPAGATED);
        await expect(isCenterShowing()).resolves.toBe(locked);
    });

    test('If the Notification Center loses focus due to a click on a \'Toggle Visibility\' button, the Center is closed and remains closed', async () => {
        const toggleButton = await getElementById(testWindow.identity, 'toggleNotificationCenter');

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
