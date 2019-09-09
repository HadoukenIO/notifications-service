import {Identity} from 'openfin/_v2/main';

import {NotificationOptions, Notification} from '../../../src/client';
import {Events} from '../../../src/client/internal';

import {OFPuppeteerBrowser, BaseWindowContext} from './ofPuppeteer';

export interface NotifsTestContext extends BaseWindowContext {
    notifications: typeof import('../../../src/client'),
    receivedEvents: Events[];
}

const ofBrowser = new OFPuppeteerBrowser<NotifsTestContext>();

export async function create(executionTarget: Identity, options: NotificationOptions) {
    const result = await ofBrowser.executeOnWindow(executionTarget, async function(optionsRemote: NotificationOptions) {
        // Manually un-stringify Dates, as puppeteer will not do so on the runner-to-remote journey
        const date =
            (optionsRemote.date !== undefined) ?
                new Date(optionsRemote.date) :
                optionsRemote.date;
        const expiry =
            (optionsRemote.expiry !== undefined && optionsRemote.expiry !== null) ?
                new Date(optionsRemote.expiry) :
                optionsRemote.date;

        optionsRemote = {...optionsRemote, date, expiry};

        const note = await this.notifications.create(optionsRemote);

        // We need to manually stringify Dates object as puppeteer fails to do so on the remote-to-runner journey
        return {...note, date: note.date.toJSON(), expiry: note.expiry !== null ? note.expiry.toJSON() : null};
    }, options);
    // And then manually un-stringify them
    return {...result, date: new Date(result.date), expiry: result.expiry !== null ? new Date(result.expiry) : null};
}

export async function createAndAwait(executionTarget: Identity, options: NotificationOptions) {
    const createPromise = create(executionTarget, options);

    // We want to be sure the operation is completed, but don't care if it succeeds
    const note = await createPromise.catch(() => ({} as Notification));

    return {createPromise, note};
}

export async function clear(executionTarget: Identity, id: string) {
    return ofBrowser.executeOnWindow(executionTarget, function(idRemote: string) {
        return this.notifications.clear(idRemote);
    }, id);
}

export async function getAll(executionTarget: Identity) {
    const result = await ofBrowser.executeOnWindow(executionTarget, async function() {
        const notes = await this.notifications.getAll();
        // We need to manually stringify the date object as puppeteer fails to do so
        return notes.map(note => ({...note, date: note.date.toJSON()}));
    });
    // And then manually un-stringify it
    return result.map(note => ({...note, date: new Date(note.date), expiry: note.expiry !== null ? new Date(note.expiry) : null}));
}

export async function clearAll(executionTarget: Identity) {
    return ofBrowser.executeOnWindow(executionTarget, function() {
        return this.notifications.clearAll();
    });
}

export async function toggleNotificationCenter(executionTarget: Identity) {
    return ofBrowser.executeOnWindow(executionTarget, function() {
        return this.notifications.toggleNotificationCenter();
    });
}

export async function addEventListener
    <E extends Events>(executionTarget: Identity, eventType: E['type'], listener: (event: E) => void): Promise<void> {
    const remoteFn = await ofBrowser.getOrMountRemoteFunction(executionTarget, listener);
    await ofBrowser.executeOnWindow(executionTarget, function(eventTypeRemote: any, listenerRemote: any) {
        return this.notifications.addEventListener(eventTypeRemote, listenerRemote);
    }, eventType, remoteFn);
}

export async function removeEventListener
    <E extends Events>(executionTarget: Identity, eventType: E['type'], listener: (event: E) => void): Promise<void> {
    const remoteFn = await ofBrowser.getOrMountRemoteFunction(executionTarget, listener);
    await ofBrowser.executeOnWindow(executionTarget, function(eventTypeRemote: any, listenerRemote: any) {
        return this.notifications.removeEventListener(eventTypeRemote, listenerRemote);
    }, eventType, remoteFn);
}

export async function getReceivedEvents(executionTarget: Identity, type: Event['type']): Promise<Events[]> {
    const events = await ofBrowser.executeOnWindow(executionTarget, function() {
        return this.receivedEvents;
    });
    return events.filter(event => event.type === type);
}
