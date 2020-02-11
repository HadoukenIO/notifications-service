import {ElementHandle} from 'puppeteer';

import {ROUTES} from '../../../src/provider/view/routes';

import * as notifsRemote from './notificationsRemote';
import {OFPuppeteerBrowser} from './ofPuppeteer';
import {fin} from './fin';
import {getElementById, querySelector} from './dom';
import {delay, Duration} from './delay';
import {testManagerIdentity} from './constants';
import {navigateCenter} from './providerRemote';

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
    await toggleCenterSetting('lock-link');
}

export async function toggleCenterMuted(): Promise<void> {
    await toggleCenterSetting('mute-link');
}

async function toggleCenterSetting(elementId: string): Promise<void> {
    const hidden = !(await isCenterShowing());
    if (hidden) {
        await notifsRemote.toggleNotificationCenter(testManagerIdentity);
        await delay(Duration.CENTER_TOGGLED);
    }

    await navigateCenter(ROUTES.SETTINGS);

    const settingButton = await getElementById(CENTER_IDENTITY, elementId);
    await settingButton.click();
    await delay(Duration.EVENT_PROPAGATED);

    await navigateCenter(ROUTES.NOTIFICATIONS);

    if (hidden) {
        await notifsRemote.toggleNotificationCenter(testManagerIdentity);
        await delay(Duration.CENTER_TOGGLED);
    }
}
