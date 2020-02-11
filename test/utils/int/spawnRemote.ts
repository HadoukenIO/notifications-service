import {Application, Window, Identity} from 'hadouken-js-adapter';
import {createApp as createAppRemote, createWindow as createWindowRemote} from 'openfin-service-tooling/spawn';

import {OFPuppeteerBrowser, BaseWindowContext} from './ofPuppeteer';
import {fin} from './fin';
import {serviceRealm} from './constants';

interface SpawnEnabledContext extends BaseWindowContext {
    createWindow: CreateWindowType;
    createApp: CreateAppType;
}

type CreateWindowType = typeof createWindowRemote;
type CreateAppType = typeof createAppRemote;

const ofBrowser = new OFPuppeteerBrowser<SpawnEnabledContext>();
export async function createApp(executionTarget: Identity, ...spawnArgs: Parameters<CreateAppType>): Promise<Application> {
    const identity: Identity = await ofBrowser.executeOnWindow(executionTarget, async function (...remoteArgs: Parameters<CreateAppType>) {
        const remoteApp = await this.createApp(...remoteArgs);
        return remoteApp.identity;
    }, ...spawnArgs);
    return fin.Application.wrapSync(identity);
}

/**
 * A helper function that wraps `createApp` to spawn a new application in the same security realm as the provider.
 *
 * @param executionTarget The remote window that will run the spawn code.
 * @param options The options for the created app. These are the same options as `createApp` but any given values
 * for `realm` or `enableMesh` will be ignored.
 */
export async function createAppInServiceRealm(executionTarget: Identity, options: Parameters<CreateAppType>[0]): Promise<Application> {
    return createApp(executionTarget, {...options, ...{realm: serviceRealm, enableMesh: true}});
}

export async function createWindow(executionTarget: Identity, ...spawnArgs: Parameters<CreateWindowType>): Promise<Window> {
    const identity: Identity = await ofBrowser.executeOnWindow(executionTarget, async function (...remoteArgs: Parameters<CreateWindowType>) {
        const remoteWindow = await this.createWindow(...remoteArgs);
        return remoteWindow.identity;
    }, ...spawnArgs);
    return fin.Window.wrapSync(identity);
}
