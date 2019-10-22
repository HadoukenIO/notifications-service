import {Identity} from 'openfin/_v2/main';

import {NotificationOptions, Notification} from '../../../src/client';
import {Events} from '../../../src/client/internal';

import {OFPuppeteerBrowser, BaseWindowContext} from './ofPuppeteer';

export interface NotifsTestContext extends BaseWindowContext {
    notifications: typeof import('../../../src/client');
    receivedEvents: Events[];
}

export interface CreateAndAwait {
    createPromise: Promise<Notification>;
    note: Notification;
}

const ofBrowser = new OFPuppeteerBrowser<NotifsTestContext>();

export async function create(executionTarget: Identity, options: NotificationOptions): Promise<Notification> {
    const result = await ofBrowser.executeOnWindow(executionTarget, async function (optionsRemote: NotificationOptions) {
        // Manually un-stringify Dates, as puppeteer will not do so on the runner-to-remote journey
        const date =
            (optionsRemote.date !== undefined)
                ? new Date(optionsRemote.date)
                : optionsRemote.date;
        const expires =
            (optionsRemote.expires !== undefined && optionsRemote.expires !== null)
                ? new Date(optionsRemote.expires)
                : optionsRemote.date;

        optionsRemote = {...optionsRemote, date, expires};

        const note = await this.notifications.create(optionsRemote);

        // We need to manually stringify Date objects as puppeteer fails to do so on the remote-to-runner journey
        return {...note, date: note.date.toJSON(), expires: note.expires !== null ? note.expires.toJSON() : null};
    }, options);
    // And then manually un-stringify them
    return {...result, date: new Date(result.date), expires: result.expires !== null ? new Date(result.expires) : null};
}

export async function createAndAwait(executionTarget: Identity, options: NotificationOptions): Promise<CreateAndAwait> {
    const createPromise = create(executionTarget, options);

    // We want to be sure the operation is completed, but don't care if it succeeds
    const note = await createPromise.catch(() => ({} as Notification));

    return {createPromise, note};
}

export async function clear(executionTarget: Identity, id: string): Promise<boolean> {
    return ofBrowser.executeOnWindow(executionTarget, function (idRemote: string) {
        return this.notifications.clear(idRemote);
    }, id);
}

export async function getAll(executionTarget: Identity): Promise<Notification[]> {
    const result = await ofBrowser.executeOnWindow(executionTarget, async function () {
        const notes = await this.notifications.getAll();
        // We need to manually stringify Date objects as puppeteer fails to do so on the remote-to-runner journey
        return notes.map((note) => ({...note, date: note.date.toJSON(), expires: note.expires !== null ? note.expires.toJSON() : null}));
    });
    // And then manually un-stringify them
    return result.map((note) => ({...note, date: new Date(note.date), expires: note.expires !== null ? new Date(note.expires) : null}));
}

export async function clearAll(executionTarget: Identity): Promise<number> {
    return ofBrowser.executeOnWindow(executionTarget, function () {
        return this.notifications.clearAll();
    });
}

export async function toggleNotificationCenter(executionTarget: Identity): Promise<void> {
    return ofBrowser.executeOnWindow(executionTarget, function () {
        return this.notifications.toggleNotificationCenter();
    });
}

export async function addEventListener
<E extends Events>(executionTarget: Identity, eventType: E['type'], listener: (event: E) => void): Promise<void> {
    const remoteFn = await ofBrowser.getOrMountRemoteFunction(executionTarget, listener);
    await ofBrowser.executeOnWindow(executionTarget, function (eventTypeRemote: any, listenerRemote: any) {
        return this.notifications.addEventListener(eventTypeRemote, listenerRemote);
    }, eventType, remoteFn);
}

export async function removeEventListener
<E extends Events>(executionTarget: Identity, eventType: E['type'], listener: (event: E) => void): Promise<void> {
    const remoteFn = await ofBrowser.getOrMountRemoteFunction(executionTarget, listener);
    await ofBrowser.executeOnWindow(executionTarget, function (eventTypeRemote: any, listenerRemote: any) {
        return this.notifications.removeEventListener(eventTypeRemote, listenerRemote);
    }, eventType, remoteFn);
}

export async function getReceivedEvents(executionTarget: Identity, type: Events['type']): Promise<Events[]> {
    const events = await ofBrowser.executeOnWindow(executionTarget, function () {
        // We need to manually stringify Date objects as puppeteer fails to do so on the remote-to-runner journey
        return this.receivedEvents.map((event) => ({
            ...event, notification: {
                ...event.notification,
                date: event.notification.date.toJSON(),
                expires: event.notification.expires !== null ? event.notification.expires.toJSON() : null
            }
        }));
    });
    // And then manually un-stringify them
    return events.filter((event) => event.type === type).map((event) => ({
        ...event, notification: {
            ...event.notification,
            date: new Date(event.notification.date),
            expires: event.notification.expires !== null ? new Date(event.notification.expires) : null
        }
    }));
}
