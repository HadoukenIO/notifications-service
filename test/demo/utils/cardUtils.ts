import {ElementHandle} from 'puppeteer';
import * as moment from 'moment';

import {Notification} from '../../../src/client';

import {promiseMap} from './asyncUtils';
import {getToastCards} from './toastUtils';
import {getCenterCardsByNotification} from './centerUtils';

export interface NotificationCardMetadata {
    title?: string;
    body?: string;
    sourceApp?: string;
    timeString?: string;
    icon: string;
    buttons?: ButtonMetadata[]
}

export interface ButtonMetadata {
    title?: string;
    iconUrl: string;
}

export enum CardType {
    CENTER = 'center',
    TOAST = 'toast'
}

export async function assertDOMMatches(type: CardType, sourceUuid: string, note: Notification): Promise<void> {
    const noteCards = type === 'center' ? await getCenterCardsByNotification(sourceUuid, note.id): await getToastCards(sourceUuid, note.id);
    if (!noteCards || noteCards.length === 0) {
        return undefined;
    }
    if (noteCards.length > 1) {
        throw new Error(`Multiple notification cards found for the given UUID/ID pair: ${sourceUuid}/${note.id}`);
    }

    const expectedMetadata: NotificationCardMetadata = {
        title: note.title,
        body: note.body,
        buttons: note.buttons as ButtonMetadata[],
        icon: note.icon,
        sourceApp: sourceUuid,
        timeString: moment(note.date).fromNow()
    };

    const actualMetadata: NotificationCardMetadata = await getCardMetadata(noteCards[0]);
    expect(actualMetadata).toEqual(expectedMetadata);
}

/**
 * Allow you to get a `Notification`-like object containing the data displayed on a notification card.

 * Undefined properties imply that the html element for that property could not be found
 */
async function getCardMetadata(card: ElementHandle): Promise<NotificationCardMetadata> {
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
 * Uses `$`, so only the first matching element is returned
 */
async function getPropertyByQueryString(rootElement: ElementHandle, queryString: string, property: string): Promise<string | undefined> {
    const queryElement = await rootElement.$(queryString);
    if (!queryElement) {
        return undefined;
    }
    const propertyHandle = await queryElement.getProperty(property);
    return propertyHandle.jsonValue();
}
