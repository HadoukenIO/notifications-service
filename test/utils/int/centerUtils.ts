import {ElementHandle} from 'puppeteer';

import {OFPuppeteerBrowser} from './ofPuppeteer';
import {fin} from './fin';
import {getElementById, querySelector} from './dom';

const CENTER_IDENTITY = {uuid: 'notifications-service', name: 'Notification-Center'};
const CARDS_SELECTOR = '.group:not([class*="exit"]) li:not([class*="exit"]) .notification-card';
const ofBrowser = new OFPuppeteerBrowser();

export async function getAllCenterCards(): Promise<ElementHandle[]> {
    const centerPage = await ofBrowser.getPage(CENTER_IDENTITY);
    return centerPage!.$$(CARDS_SELECTOR);
}

export async function getCenterCardsByApp(sourceUuid: string): Promise<ElementHandle[]> {
    return querySelector(`${CARDS_SELECTOR}[data-id*="${sourceUuid}"]`, CENTER_IDENTITY);
}

export async function getCenterCardsByNotification(sourceUuid: string, notificationId: string): Promise<ElementHandle[]> {
    return querySelector(`${CARDS_SELECTOR}[data-id="${sourceUuid}:${notificationId}"]`, CENTER_IDENTITY);
}

export async function getCenterCloseButton(): Promise<ElementHandle> {
    return getElementById('hide-center', CENTER_IDENTITY);
}

export async function isCenterShowing(): Promise<boolean> {
    const center = fin.Window.wrapSync(CENTER_IDENTITY);
    const centerOpacity = (await center.getOptions()).opacity;
    return (await center.isShowing()) && centerOpacity === 1;
}
