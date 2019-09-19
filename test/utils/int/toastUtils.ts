import {ElementHandle} from 'puppeteer';
import {Identity, Window} from 'hadouken-js-adapter';

import {SERVICE_IDENTITY} from '../../../src/client/internal';

import {OFPuppeteerBrowser} from './ofPuppeteer';
import {fin} from './fin';
import {querySelector} from './dom';

export function getToastIdentity(sourceUuid: string, notificationId: string): Identity {
    return {uuid: SERVICE_IDENTITY.uuid, name: `Notification-Toast:${sourceUuid}:${notificationId}`};
}

export async function getAllToastWindows(): Promise<Window[]> {
    const childWindows = await fin.Application.wrapSync(SERVICE_IDENTITY).getChildWindows();
    return childWindows.filter(win => win.identity.name && win.identity.name.startsWith('Notification-Toast:'));
}

export async function getToastWindowsByApp(sourceUuid: string): Promise<Window[]> {
    const childWindows = await fin.Application.wrapSync(SERVICE_IDENTITY).getChildWindows();
    return childWindows.filter(win => win.identity.name && win.identity.name.startsWith(`Notification-Toast:${sourceUuid}:`));
}

export async function getToastWindow(sourceUuid: string, notificationId: string): Promise<Window | undefined> {
    const toastIdentity = getToastIdentity(sourceUuid, notificationId);
    const childWindows = await fin.Application.wrapSync(SERVICE_IDENTITY).getChildWindows();
    return childWindows.find(win => win.identity.uuid === toastIdentity.uuid && win.identity.name === toastIdentity.name);
}

const ofBrowser = new OFPuppeteerBrowser();
export async function getToastCards(sourceUuid: string, notificationId: string): Promise<ElementHandle[] | undefined> {
    return toastQuerySelector('.notification-card', sourceUuid, notificationId);
}

export async function getToastButtons(sourceUuid: string, notificationId: string): Promise<ElementHandle[] | undefined> {
    return toastQuerySelector('.button', sourceUuid, notificationId);
}

export async function getToastMinimizeButton(sourceUuid: string, notificationId: string): Promise<ElementHandle[] | undefined> {
    return toastQuerySelector('.minimize', sourceUuid, notificationId);
}

export async function toastQuerySelector(selector: string, sourceUuid: string, notificationId: string): Promise<ElementHandle[] | undefined> {
    const target = getToastIdentity(sourceUuid, notificationId);
    const result = await querySelector(target, selector);
    return (result === []) ? undefined : result;
}

export async function getToastName(sourceUuid: string, notificationId: string): Promise<string | undefined> {
    const target = getToastIdentity(sourceUuid, notificationId);
    const page = await ofBrowser.getPage(target);

    if (!page) {
        return undefined;
    } else {
        page.waitForSelector('.app-name', {timeout: 500});
        return page.$eval('.app-name', (element) => {
            return element.innerHTML;
        });
    }
}
