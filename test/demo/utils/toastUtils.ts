import {ElementHandle} from 'puppeteer';
import {Identity, Window} from 'hadouken-js-adapter';

import {SERVICE_IDENTITY} from '../../../src/client/internal';

import {OFPuppeteerBrowser} from './ofPuppeteer';
import {fin} from './fin';

export function getToastIdentity(sourceUuid: string, notificationId: string): Identity {
    return {uuid: SERVICE_IDENTITY.uuid, name: `Notification-Toast:${sourceUuid}:${notificationId}`};
}

export async function getToastWindow(sourceUuid: string, notificationId: string): Promise<Window | undefined> {
    const toastIdentity = getToastIdentity(sourceUuid, notificationId);
    const childWindows = await fin.Application.wrapSync(SERVICE_IDENTITY).getChildWindows();
    return childWindows.find(win => win.identity.uuid === toastIdentity.uuid && win.identity.name === toastIdentity.name);
}

const ofBrowser = new OFPuppeteerBrowser();
export async function getToastCards(sourceUuid: string, notificationId: string): Promise<ElementHandle[] | undefined> {
    const toastIdentity = getToastIdentity(sourceUuid, notificationId);
    const toastPage = await ofBrowser.getPage(toastIdentity);

    if (!toastPage) {
        return undefined;
    } else {
        return toastPage.$$('.notification');
    }
}
