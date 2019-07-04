import {ElementHandle} from 'puppeteer';
import * as moment from 'moment';

import {Notification} from '../../../src/client';

import {OFPuppeteerBrowser} from './ofPuppeteer';
import {fin} from './fin';
import { promiseMap } from './asyncUtils';

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

export interface NotificationCardMetadata {
    title?: string;
    body?: string;
    sourceApp?: string;
    timeString?: string;
    icon?: string;
    buttons?: ButtonMetadata[]
}

export interface ButtonMetadata {
    title?: string;
    iconUrl?: string;
}

/**
 * Allow you to get a `Notification`-like object containing the data displayed on a notification card.
 *
 * Returns undefined if it cannot find a card for the given uuid/id pair
 *
 * Undefined properties imply that the html element for that property could not be found
 */
export async function getCardMetadata(sourceUuid: string, notificationId: string): Promise<NotificationCardMetadata | undefined> {
    const noteCards = await getCardsByNotification(sourceUuid, notificationId);
    if (noteCards.length === 0) {
        return undefined;
    }
    if (noteCards.length > 1) {
        throw new Error(`Multiple notification cards found for the given uuid/id pair: ${sourceUuid}/${notificationId}`);
    }

    const card = noteCards[0];

    const title = await getPropertyByQueryString(card, '.body .title', 'innerHTML');
    const body = await getPropertyByQueryString(card, '.body .text', 'innerHTML');
    const sourceApp = await getPropertyByQueryString(card, '.source .app-name', 'innerHTML');
    const timeString = await getPropertyByQueryString(card, '.time span', 'innerHTML');
    const icon = (await getPropertyByQueryString(card, '.source img', 'src')) || '';

    const buttonElements = await card.$$('.button');
    const buttons = await promiseMap(buttonElements, async (button): Promise<ButtonMetadata> => {
        return {
            title: await getPropertyByQueryString(button, 'span', 'innerHTML'),
            iconUrl: (await getPropertyByQueryString(button, 'img', 'src')) || ''
        };
    });

    return {title, body, sourceApp, timeString, icon, buttons};
}

export async function isCenterShowing(): Promise<boolean> {
    const center = fin.Window.wrapSync(CENTER_IDENTITY);
    const centerOpacity = (await center.getOptions()).opacity;
    return (await center.isShowing()) && centerOpacity === 1;
}

/**
 * Uses `$`, so only the first matching element is queried
 */
async function getPropertyByQueryString(rootElement: ElementHandle, queryString: string, property: string): Promise<string | undefined> {
    const queryElement = await rootElement.$(queryString);
    if (!queryElement) {
        return undefined;
    }
    const propertyHandle = await queryElement.getProperty(property);
    return propertyHandle.jsonValue();
}

export async function assertDOMMatches(sourceUuid: string, note: Notification): Promise<void> {
    const cardContent: NotificationCardMetadata | undefined = await getCardMetadata(sourceUuid, note.id);
    expect(cardContent).not.toBeUndefined();

    const expectedContent: NotificationCardMetadata = {
        title: note.title,
        body: note.body,
        buttons: note.buttons,
        icon: note.icon,
        sourceApp: sourceUuid,
        timeString: moment(note.date).fromNow()
    };

    expect(cardContent).toEqual(expectedContent);
}
