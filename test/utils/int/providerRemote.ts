import {Identity} from 'hadouken-js-adapter';

import {ServiceStore} from '../../../src/provider/store/ServiceStore';
import {Injector} from '../../../src/provider/common/Injector';

import {OFPuppeteerBrowser, BaseWindowContext} from './ofPuppeteer';
import {serviceIdentity, testManagerIdentity} from './constants';
import {delay, Duration} from './delay';
import {fin} from './fin';
import {withTimeout} from './common';

export interface ProviderContext extends BaseWindowContext {
    main: {
        clearNotification: (payload: {id: string}, identity: Identity) => Promise<boolean>;
    };
    store: ServiceStore;
    injector: typeof Injector;
}

const ofBrowser = new OFPuppeteerBrowser<ProviderContext>();
export async function clearStoredNotifications(windowIdentity: Identity): Promise<void> {
    await ofBrowser.executeOnWindow<Identity[], void>(serviceIdentity, function (sourceWindow: Identity) {
        this.store.state.notifications.filter((notification) => {
            return notification.source.uuid === sourceWindow.uuid;
        }).forEach((n) => {
            this.main.clearNotification({id: n.notification.id}, sourceWindow);
        });
    }, windowIdentity);
}

/**
 * Closes all of the service providers child windows and then restarts the main window after a provided amount of time.
 * Resolves once the service is fully initialized.
 * This will not reopen any child windows unless the provider automatically does so.
 */
export async function restartProvider(snoozeTime: number = 0): Promise<void> {
    const providerApp = fin.Application.wrapSync(serviceIdentity);
    const providerAppWindow = await providerApp.getWindow();
    await providerApp.getChildWindows().then((children) => children.forEach((win) => win.close()));
    await providerAppWindow.navigate('about:blank');

    // A small delay is needed in order for OpenFin to handle the navigateBack call successfully.
    // If a snoozeTime is less than the minimum we enforce the minimum otherwise let it be
    await delay(Math.max(snoozeTime, Duration.NAVIGATE_BACK));

    await providerAppWindow.navigateBack();
    await providerReady();
    await restartTestManager();
}

export async function restartTestManager(snoozeTime: number = 0): Promise<void> {
    const testManager = fin.Application.wrapSync(testManagerIdentity);
    const testManagerWindow = await testManager.getWindow();
    await testManagerWindow.navigate('about:blank');

    // A small delay is needed in order for OpenFin to handle the navigateBack call successfully.
    // If a snoozeTime is less than the minimum we enforce the minimum otherwise let it be
    await delay(Math.max(snoozeTime, Duration.NAVIGATE_BACK));

    await testManagerWindow.navigateBack();

    await ofBrowser.executeOnWindow(testManagerIdentity, function () {
        if (this.document.readyState === 'complete') {
            return;
        } else {
            return new Promise((res) => this.document.addEventListener('DOMContentLoaded', res));
        }
    });
}

/**
 * Checks that the provider is ready and has been initialized.
 */
export async function providerReady(): Promise<void> {
    const TIMEOUT = 5000;
    let timedOut = false;

    [timedOut] = await withTimeout(TIMEOUT, new Promise<void>(async (resolve) => {
        let initialized = false;

        while (!initialized && !timedOut) {
            initialized = await ofBrowser.executeOnWindow(serviceIdentity, async function () {
                await this.injector.initialized;
            }).then(() => true).catch(() => false);
        }

        resolve();
    }));

    if (timedOut) {
        throw new Error(`Provider has not returned within timeout of: ${TIMEOUT}`);
    }

    // TODO: Remove delay with SERVICE-729
    // Give the service one second to allow for any post injector initialization to process.
    await delay(1000);
}
