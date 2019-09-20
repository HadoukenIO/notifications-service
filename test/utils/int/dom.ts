import {Identity} from 'openfin/_v2/main';
import {ElementHandle} from 'puppeteer';

import {OFPuppeteerBrowser} from './ofPuppeteer';
import {Duration} from './delay';

const ofBrowser = new OFPuppeteerBrowser();

export async function getElementById(target: Identity, id: string): Promise<ElementHandle> {
    return (await querySelector(target, `#${id}`))[0]!;
}

export async function querySelector(target: Identity, selector: string): Promise<ElementHandle[]> {
    const centerPage = await ofBrowser.getPage(target);
    if (centerPage) {
        try {
            await centerPage.waitForSelector(selector, {timeout: Duration.WAIT_FOR_SELECTOR});
        } catch (error) {
            return [];
        }
        return centerPage.$$(selector);
    }
    return [];
}
