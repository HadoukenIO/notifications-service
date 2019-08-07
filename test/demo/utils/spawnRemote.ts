import {Application, Window, Identity} from 'hadouken-js-adapter';

import {createApp as createAppRemote, createWindow as createWindowRemote} from '../../../src/demo/spawn';

import {OFPuppeteerBrowser, BaseWindowContext} from './ofPuppeteer';
import {fin} from './fin';

interface SpawnEnabledContext extends BaseWindowContext {
    createWindow: CreateWindowType,
    createApp: CreateAppType;
}

type CreateWindowType = typeof createWindowRemote;
type CreateAppType = typeof createAppRemote;

const ofBrowser = new OFPuppeteerBrowser<SpawnEnabledContext>();
export async function createApp(executionTarget: Identity, ...spawnArgs: Parameters<CreateAppType>): Promise<Application> {
    const identity: Identity = await ofBrowser.executeOnWindow(executionTarget, async function(...remoteArgs: Parameters<CreateAppType>) {
        const remoteApp = await this.createApp(...remoteArgs);
        return remoteApp.identity;
    }, ...spawnArgs);
    return fin.Application.wrapSync(identity);
}

export async function createWindow(executionTarget: Identity, ...spawnArgs: Parameters<CreateWindowType>): Promise<Window> {
    const identity: Identity = await ofBrowser.executeOnWindow(executionTarget, async function(...remoteArgs: Parameters<CreateWindowType>) {
        const remoteWindow = await this.createWindow(...remoteArgs);
        return remoteWindow.identity;
    }, ...spawnArgs);
    return fin.Window.wrapSync(identity);
}
