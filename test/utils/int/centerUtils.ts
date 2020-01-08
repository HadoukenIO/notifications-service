import {ElementHandle} from 'puppeteer';

import {OFPuppeteerBrowser} from './ofPuppeteer';
import {fin} from './fin';
import {getElementById, querySelector} from './dom';
import {delay, Duration} from './delay';

const CENTER_IDENTITY = {uuid: 'notifications-service', name: 'Notification-Center'};
const CARDS_SELECTOR = '.group:not([class*="exit"]) li:not([class*="exit"]) .notification-card';
const ofBrowser = new OFPuppeteerBrowser();

export async function getAllCenterCards(): Promise<ElementHandle[]> {
    const centerPage = await ofBrowser.getPage(CENTER_IDENTITY);
    return centerPage!.$$(CARDS_SELECTOR);
}

export async function getCenterCardsByApp(sourceUuid: string): Promise<ElementHandle[]> {
    return querySelector(CENTER_IDENTITY, `${CARDS_SELECTOR}[data-id*="${sourceUuid}"]`);
}

export async function getCenterCardsByNotification(sourceUuid: string, notificationId: string): Promise<ElementHandle[]> {
    return querySelector(CENTER_IDENTITY, `${CARDS_SELECTOR}[data-id="${sourceUuid}:${notificationId}"]`);
}

export async function getCenterCloseButton(): Promise<ElementHandle> {
    return getElementById(CENTER_IDENTITY, 'hide-center');
}

export async function isCenterShowing(): Promise<boolean> {
    const center = fin.Window.wrapSync(CENTER_IDENTITY);
    const centerOpacity = (await center.getOptions()).opacity;
    return (await center.isShowing()) && centerOpacity === 1;
}

export async function toggleCenterLocked(): Promise<void> {
    const lockButton = await getElementById(CENTER_IDENTITY, 'lock-link');

    await lockButton.click();
    await delay(Duration.EVENT_PROPAGATED);
}
