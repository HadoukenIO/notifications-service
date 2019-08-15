import {ElementHandle} from 'puppeteer';
import * as moment from 'moment';

import {Notification} from '../../../src/client';

import {promiseMap} from './asyncUtils';
import {getToastCards} from './toastUtils';
import {getCenterCardsByNotification} from './centerUtils';

/**
 * Manifestation of the elements in the DOM, as opposed to NotificationOptions.
 */
export interface NotificationCardMetadata {
    title?: string;
    body?: string;
    sourceApp?: string;
    timeString?: string;
    icon: string;
    buttons?: ButtonMetadata[]
}

/**
 * Manifestation of the elements in the DOM, as opposed to ButtonOptions.
 */
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
        buttons: note.buttons.map(button => ({title: button.title, iconUrl: button.iconUrl || ''})),
        icon: note.icon,
        sourceApp: sourceUuid,
        timeString: moment(note.date).fromNow()
    };

    const actualMetadata: NotificationCardMetadata = await getCardMetadata(noteCards[0]);
    expect(actualMetadata).toEqual(expectedMetadata);
}

/**
 * Allow you to get a `Notification`-like object containing the data displayed on a notification card.
 *
 * Undefined properties imply that the html element for that property could not be found
 *
 * @param card DOM element that holds the visual representation of a notification
 */
async function getCardMetadata(card: ElementHandle): Promise<NotificationCardMetadata> {
    const title = await getPropertyBySelector(card, '.body .title', 'innerHTML');
    const body = await getPropertyBySelector(card, '.body .text', 'innerHTML');
    const sourceApp = await getPropertyBySelector(card, '.source .app-name', 'innerHTML');
    const timeString = await getPropertyBySelector(card, '.time span', 'innerHTML');
    const icon = (await getPropertyBySelector(card, '.source img', 'src')) || '';

    const buttonElements = await card.$$('.button');
    const buttons = await promiseMap(buttonElements, async (button): Promise<ButtonMetadata> => {
        return {
            title: await getPropertyBySelector(button, 'span', 'innerHTML'),
            iconUrl: (await getPropertyBySelector(button, 'img', 'src')) || ''
        };
    });

    return {title, body, sourceApp, timeString, icon, buttons};
}

/**
 * Uses `$`, so only the first matching element is returned. Will return `undefined` if no element matching selector.
 *
 * @param rootElement The DOM element to query
 * @param selectorString A selector that matches a child element of rootElement
 * @param property The property to extract from the selected element
 */
async function getPropertyBySelector(rootElement: ElementHandle, selectorString: string, property: string): Promise<string | undefined> {
    const queryElement = await rootElement.$(selectorString);
    if (!queryElement) {
        return undefined;
    }
    const propertyHandle = await queryElement.getProperty(property);
    return propertyHandle.jsonValue();
}
