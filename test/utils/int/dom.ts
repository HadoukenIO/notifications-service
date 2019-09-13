import {Identity} from 'openfin/_v2/main';
import {ElementHandle} from 'puppeteer';

import {OFPuppeteerBrowser} from './ofPuppeteer';

const ofBrowser = new OFPuppeteerBrowser();

export async function getElementById(id: string, target: Identity): Promise<ElementHandle> {
    return (await querySelector(`#${id}`, target))![0]!;
}

export async function querySelector(selector: string, target: Identity): Promise<ElementHandle[]> {
    const centerPage = await ofBrowser.getPage(target);
    return centerPage!.$$(selector);
}
