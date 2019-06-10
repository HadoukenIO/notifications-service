import {Identity} from 'openfin/_v2/main';

import {NotificationOptions, NotificationEvent} from '../../../src/client';

import {OFPuppeteerBrowser, BaseWindowContext} from './ofPuppeteer';

export interface NotifsTestContext extends BaseWindowContext {
    notifications: typeof import('../../../src/client')
}

const ofBrowser = new OFPuppeteerBrowser<NotifsTestContext>();

export async function create(executionTarget: Identity, options: NotificationOptions) {
    return ofBrowser.executeOnWindow(executionTarget, function(optionsRemote: NotificationOptions){
        return this.notifications.create(optionsRemote);
    }, options);
}

export async function clear(executionTarget: Identity, id: string) {
    return ofBrowser.executeOnWindow(executionTarget, function(idRemote: string){
        return this.notifications.clear(idRemote);
    }, id);
}

export async function getAll(executionTarget: Identity) {
    return ofBrowser.executeOnWindow(executionTarget, function(){
        return this.notifications.getAll();
    });
}

export async function clearAll(executionTarget: Identity) {
    return ofBrowser.executeOnWindow(executionTarget, function(){
        return this.notifications.clearAll();
    });
}

export async function toggleNotificationCenter(executionTarget: Identity) {
    return ofBrowser.executeOnWindow(executionTarget, function() {
        return this.notifications.toggleNotificationCenter();
    });
}

export async function addEventListener
    <E extends NotificationEvent>(executionTarget: Identity, eventType: E['type'], listener: (event: E) => void): Promise<void> {
    const remoteFn = await ofBrowser.getOrMountRemoteFunction(executionTarget, listener);
    await ofBrowser.executeOnWindow(executionTarget, function(eventTypeRemote: typeof eventType, listenerRemote: typeof listener) {
        return this.notifications.addEventListener(eventTypeRemote, listenerRemote);
    }, eventType, remoteFn as any as typeof listener);
}

export async function removeEventListener
    <E extends NotificationEvent>(executionTarget: Identity, eventType: E['type'], listener: (event: E) => void): Promise<void> {
    const remoteFn = await ofBrowser.getOrMountRemoteFunction(executionTarget, listener);
    await ofBrowser.executeOnWindow(executionTarget, function(eventTypeRemote: typeof eventType, listenerRemote: typeof listener) {
        return this.notifications.removeEventListener(eventTypeRemote, listenerRemote);
    }, eventType, remoteFn as any as typeof listener);
}
