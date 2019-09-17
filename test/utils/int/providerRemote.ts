import {Identity} from 'hadouken-js-adapter';

import {ServiceStore} from '../../../src/provider/store/ServiceStore';
import {Injector} from '../../../src/provider/common/Injector';

import {OFPuppeteerBrowser, BaseWindowContext} from './ofPuppeteer';
import {serviceIdentity} from './constants';
import {delay} from './delay';
import {fin} from './fin';

export interface ProviderContext extends BaseWindowContext {
    main: {
        clearNotification: (payload: {id: string}, identity: Identity) => Promise<boolean>
    }
    store: ServiceStore;
    injector: typeof Injector;
}

const ofBrowser = new OFPuppeteerBrowser<ProviderContext>();
export async function clearStoredNotifications(windowIdentity: Identity): Promise<void> {
    await ofBrowser.executeOnWindow<Identity[], void>(serviceIdentity, async function(sourceWindow: Identity) {
        this.store.state.notifications.filter((notification) => {
            return notification.source.uuid === sourceWindow.uuid;
        }).forEach(n => {
            this.main.clearNotification({id: n.notification.id}, sourceWindow);
        });
    }, windowIdentity);
}

/**
 * Closes all of the service providers child windows and then restarts the main window. Promise resolves once the service is fully initialized.
 * This will not reopen any child windows unless the provider automatically does so.
 */
export async function restartProvider(): Promise<void> {
    const providerApp = fin.Application.wrapSync(serviceIdentity);
    await providerApp.getChildWindows().then(children => children.forEach(win => win.close()));
    await providerApp.restart();

    await providerReady();
}

/**
 * Checks that the provider is ready and has been initialized.
 */
export async function providerReady(): Promise<void> {
    const TIMEOUT = 5000;
    const RETRY_TIMEOUT = 250;

    await new Promise((resolve, reject) => {
        let counter: number = 0;

        setInterval(async () => {
            // Keep retrying until injector is initialized
            await ofBrowser.executeOnWindow(serviceIdentity, async function() {
                await this.injector.initialized;
            }).then(resolve).catch(() => null);

            if (counter >= TIMEOUT) {
                reject(new Error(`Provider has not returned within timeout of: ${TIMEOUT}`));
            }

            counter += RETRY_TIMEOUT;
        }, RETRY_TIMEOUT);
    });

    // TODO: Remove delay with SERVICE-729
    // Give the service one second to allow for any post injector initialization to process.
    await delay(1000);
}
