import {ElementHandle} from 'puppeteer';

import {OFPuppeteerBrowser} from './ofPuppeteer';
import {fin} from './fin';
import {getDomElementById} from './dom';

const CENTER_IDENTITY = {uuid: 'notifications-service', name: 'Notification-Center'};
const ofBrowser = new OFPuppeteerBrowser();
export async function getAllCenterCards() {
    const centerPage = await ofBrowser.getPage(CENTER_IDENTITY);
    return centerPage!.$$('.group:not([class*="exit"]) .notification-card:not([class*="exit"])');
}
export async function getCenterCardsByApp(sourceUuid: string): Promise<ElementHandle[]> {
    const centerPage = await ofBrowser.getPage(CENTER_IDENTITY);
    return centerPage!.$$(`.group:not([class*="exit"]) .notification-card[data-id*="${sourceUuid}"]:not([class*="exit"])`);
}
export async function getCenterCardsByNotification(sourceUuid: string, notificationId: string): Promise<ElementHandle[]> {
    const centerPage = await ofBrowser.getPage(CENTER_IDENTITY);
    return centerPage!.$$(`.group:not([class*="exit"]) .notification-card[data-id="${sourceUuid}:${notificationId}"]:not([class*="exit"])`);
}

export async function getCenterCloseButton(): Promise<ElementHandle> {
    return getDomElementById(CENTER_IDENTITY, 'exit-link');
}

export async function isCenterShowing(): Promise<boolean> {
    const center = fin.Window.wrapSync(CENTER_IDENTITY);
    const centerOpacity = (await center.getOptions()).opacity;
    return (await center.isShowing()) && centerOpacity === 1;
}
