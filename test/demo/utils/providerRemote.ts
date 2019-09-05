import {Identity} from 'hadouken-js-adapter';

import {ServiceStore} from '../../../src/provider/store/ServiceStore';

import {OFPuppeteerBrowser, BaseWindowContext} from './ofPuppeteer';
import {serviceIdentity} from './constants';

export interface ProviderContext extends BaseWindowContext {
    main: any;
    store: ServiceStore;
}

const ofBrowser = new OFPuppeteerBrowser<ProviderContext>();
export async function clearStoredNotifications(windowIdentity: Identity): Promise<void> {
    await ofBrowser.executeOnWindow<Identity[], void>(serviceIdentity, async function(sourceWindow: Identity) {
        this.store.state.notifications.filter((notification) => {
            return notification.source.uuid === sourceWindow.uuid;
        }).forEach(n => {
            this.main.clearNotification({id: n.id}, sourceWindow);
        });
    }, windowIdentity);
}
