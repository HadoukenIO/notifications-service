import {ElementHandle} from 'puppeteer';

import {OFPuppeteerBrowser} from './ofPuppeteer';
import {fin} from './fin';
import {delay} from './delay';

const CENTER_IDENTITY = {uuid: 'notifications-service', name: 'Notification-Center'};

const ofBrowser = new OFPuppeteerBrowser();
export async function getAllCards() {
    const centerPage = await ofBrowser.getPage(CENTER_IDENTITY);
    return centerPage!.$$('.notification');
}
export async function getCardsByApp(sourceUuid: string): Promise<ElementHandle[]> {
    const centerPage = await ofBrowser.getPage(CENTER_IDENTITY);
    return centerPage!.$$(`.notification[data-id*="${sourceUuid}"]`);
}
export async function getCardsByNotification(sourceUuid: string, notificationId: string): Promise<ElementHandle[]> {
    const centerPage = await ofBrowser.getPage(CENTER_IDENTITY);
    return centerPage!.$$(`.notification[data-id="${sourceUuid}:${notificationId}"]`);
}

export async function isCenterShowing(): Promise<boolean> {
    const center = fin.Window.wrapSync(CENTER_IDENTITY);
    const centerOpacity = (await center.getOptions()).opacity;
    return (await center.isShowing()) && centerOpacity === 1;
}
