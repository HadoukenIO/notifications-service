import {ElementHandle} from 'puppeteer';

import {OFPuppeteerBrowser} from './ofPuppeteer';
import {fin} from './fin';

const CENTER_IDENTITY = {uuid: 'notifications-service', name: 'Notification-Center'};

const ofBrowser = new OFPuppeteerBrowser();
export async function getAllCards() {
    const centerPage = await ofBrowser.getPage(CENTER_IDENTITY);
    return centerPage!.$$('.notification-item');
}
export async function getCardsByApp(sourceUuid: string): Promise<ElementHandle[]> {
    const centerPage = await ofBrowser.getPage(CENTER_IDENTITY);
    return centerPage!.$$(`.notification-item[data-id*="${sourceUuid}"]`);
}
export async function getCardsByNotification(sourceUuid: string, notificationId: string): Promise<ElementHandle[]> {
    const centerPage = await ofBrowser.getPage(CENTER_IDENTITY);
    return centerPage!.$$(`.notification-item[data-id="${sourceUuid}:${notificationId}"]`);
}

export async function isCenterShowing(): Promise<boolean> {
    const center = fin.Window.wrapSync(CENTER_IDENTITY);
    return center.isShowing();
}
