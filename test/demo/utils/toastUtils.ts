import {Identity, Window} from 'openfin/_v2/main';
import {ElementHandle} from 'puppeteer';

import {SERVICE_IDENTITY} from '../../../src/client/internal';

import {OFPuppeteerBrowser} from './ofPuppeteer';

export function getToastIdentity(sourceApp: Identity, notificationId: string): Identity {
    return {uuid: SERVICE_IDENTITY.uuid, name: `Notification-Toast:${sourceApp.uuid}:${notificationId}`};
}

export async function getToastWindow(sourceApp: Identity, notificationId: string): Promise<Window | undefined> {
    const toastIdentity = getToastIdentity(sourceApp, notificationId);
    const childWindows = await fin.Application.wrapSync(SERVICE_IDENTITY).getChildWindows();
    return childWindows.find(win => win.identity.uuid === toastIdentity.uuid && win.identity.name === toastIdentity.name);
}

const ofBrowser = new OFPuppeteerBrowser();
export async function getToastCards(sourceApp: Identity, notificationId: string): Promise<ElementHandle[] | null> {
    const toastIdentity = getToastIdentity(sourceApp, notificationId);
    const toastPage = await ofBrowser.getPage(toastIdentity);

    if (!toastPage) {
        return null;
    } else {
        return toastPage.$$('.notification');
    }
}
