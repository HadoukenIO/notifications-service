import {ElementHandle} from 'puppeteer';
import {Identity, Window} from 'hadouken-js-adapter';
import * as moment from 'moment';

import {SERVICE_IDENTITY} from '../../../src/client/internal';
import {Notification} from '../../../src/client';

import {OFPuppeteerBrowser} from './ofPuppeteer';
import {fin} from './fin';
import {promiseMap} from './asyncUtils';

export function getToastIdentity(sourceApp: Identity, notificationId: string): Identity {
    return {uuid: SERVICE_IDENTITY.uuid, name: `Notification-Toast:${sourceApp.uuid}:${notificationId}`};
}

export async function getToastWindow(sourceApp: Identity, notificationId: string): Promise<Window | undefined> {
    const toastIdentity = getToastIdentity(sourceApp, notificationId);
    const childWindows = await fin.Application.wrapSync(SERVICE_IDENTITY).getChildWindows();
    return childWindows.find(win => win.identity.uuid === toastIdentity.uuid && win.identity.name === toastIdentity.name);
}

const ofBrowser = new OFPuppeteerBrowser();
export async function getToastCards(sourceApp: Identity, notificationId: string): Promise<ElementHandle[] | undefined> {
    const toastIdentity = getToastIdentity(sourceApp, notificationId);
    const toastPage = await ofBrowser.getPage(toastIdentity);

    if (!toastPage) {
        return undefined;
    } else {
        return toastPage.$$('.notification');
    }
}

/* Copy/Pasted code below */

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

export async function getCardMetadata(sourceUuid: string, notificationId: string): Promise<NotificationCardMetadata | undefined> {
    const noteCards = await getToastCards({uuid: sourceUuid}, notificationId);
    if (!noteCards || noteCards.length === 0) {
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
