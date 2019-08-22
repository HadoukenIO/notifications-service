import {Store} from '../../../src/provider/store/Store';
import {Action} from '../../../src/provider/store/Actions';

import {OFPuppeteerBrowser, BaseWindowContext} from './ofPuppeteer';
import {serviceIdentity} from './constants';

export interface ProviderContext extends BaseWindowContext {
    store: Store;
}

const ofBrowser = new OFPuppeteerBrowser<ProviderContext>();
export async function clearStoredNotifications(): Promise<void> {
    await ofBrowser.executeOnWindow(serviceIdentity, async function() {
        await this.store.dispatch({type: Action.REMOVE, notifications: this.store.state.notifications});
    });
}
