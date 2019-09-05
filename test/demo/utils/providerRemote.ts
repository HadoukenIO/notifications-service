import {Identity} from 'hadouken-js-adapter';

import {ServiceStore} from '../../../src/provider/store/ServiceStore';
import {RemoveNotifications} from '../../../src/provider/store/Actions';

import {OFPuppeteerBrowser, BaseWindowContext} from './ofPuppeteer';
import {serviceIdentity} from './constants';

export interface ProviderContext extends BaseWindowContext {
    store: ServiceStore;
}

const ofBrowser = new OFPuppeteerBrowser<ProviderContext>();
export async function clearStoredNotifications(windowIdentity: Identity): Promise<void> {
    await ofBrowser.executeOnWindow<Identity[], void>(serviceIdentity, async function(sourceWindow: Identity) {
        await this.store.dispatch(new RemoveNotifications(this.store.state.notifications.filter((notification) => {
            return notification.source.uuid === sourceWindow.uuid && notification.source.name === sourceWindow.name;
        })));
    }, windowIdentity);
}
