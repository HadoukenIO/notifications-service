import {Identity} from 'openfin/_v2/main';
import {ElementHandle} from 'puppeteer';

import {OFPuppeteerBrowser} from './ofPuppeteer';

const ofBrowser = new OFPuppeteerBrowser();

export async function getDomElementById(executionTarget: Identity, id: string): Promise<ElementHandle> {
    const centerPage = await ofBrowser.getPage(executionTarget);
    return (await centerPage!.$$(`#${id}`))[0];
}
