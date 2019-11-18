import {ElementHandle} from 'puppeteer';
import {parallelMap} from 'openfin-async-utils';

import {Notification} from '../../../src/client';
import {getDate} from '../../../src/provider/view/utils/Time';
import {renderMarkdown} from '../../../src/provider/view/utils/Markdown';

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
    buttons?: ButtonMetadata[];
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
    const noteCards = type === 'center' ? await getCenterCardsByNotification(sourceUuid, note.id) : await getToastCards(sourceUuid, note.id);
    if (!noteCards || noteCards.length === 0) {
        return undefined;
    }
    if (noteCards.length > 1) {
        throw new Error(`Multiple notification cards found for the given UUID/ID pair: ${sourceUuid}/${note.id}`);
    }

    const expectedMetadata: NotificationCardMetadata = {
        title: note.title,
        body: renderMarkdown(note.body),
        buttons: note.buttons.map((button) => ({title: button.title, iconUrl: button.iconUrl || ''})),
        icon: note.icon,
        sourceApp: sourceUuid,
        timeString: getDate(note.date)
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
export async function getCardMetadata(card: ElementHandle): Promise<NotificationCardMetadata> {
    const title = await getPropertyBySelector(card, '.content .title', 'innerText');
    const body = await getPropertyBySelector(card, '.content .text', 'innerHTML') || '';
    const sourceApp = await getPropertyBySelector(card, '.header .app-name', 'innerText');
    const timeString = await getPropertyBySelector(card, '.time', 'innerText');
    const icon = (await getStyleBySelector(card, '.app-icon', 'background-image')) || '';

    const buttonElements = await card.$$('.button');
    const buttons = await parallelMap(buttonElements, async (button): Promise<ButtonMetadata> => {
        return {
            title: await getPropertyBySelector(button, 'span', 'innerText'),
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

async function getStyleBySelector(rootElement: ElementHandle, selectorString: string, styleAttribute: string): Promise<string | undefined> {
    const queryElement = await rootElement.$(selectorString);
    if (!queryElement) {
        return undefined;
    }

    const style = await queryElement.getProperty('style');
    const styleProp = await style.getProperty(styleAttribute);
    let value: string = await styleProp.jsonValue() || '';
    // strip url(\"\") from strings
    value = /\(['"](.*?)['"]\)/.exec(value)![1];

    return value;
}
