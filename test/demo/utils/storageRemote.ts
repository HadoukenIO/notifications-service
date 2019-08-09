import {Identity} from 'hadouken-js-adapter';

import {SERVICE_IDENTITY} from '../../../src/client/internal';
import {StoredNotification} from '../../../src/provider/model/StoredNotification';
import {Notification} from '../../../src/client';
import {Storage, StorageMap} from '../../../src/provider/model/Storage';

import {OFPuppeteerBrowser, BaseWindowContext} from './ofPuppeteer';

interface ProviderWindow extends BaseWindowContext {
    storage: Storage;
}

const ofBrowser = new OFPuppeteerBrowser<ProviderWindow>();

export async function getAllStoredNotifications(): Promise<StoredNotification[]> {
    return ofBrowser.executeOnWindow(SERVICE_IDENTITY, async function(): Promise<StoredNotification[]> {
        const allNotes: StoredNotification[] = [];
        await (await this.storage.get(StorageMap.NOTIFICATIONS)).iterate((val: string) => {
            allNotes.push(JSON.parse(val));
        });
        return allNotes;
    });
}

export async function getStoredNotificationsByApp(uuid: string): Promise<StoredNotification[]> {
    return ofBrowser.executeOnWindow(SERVICE_IDENTITY, async function(appUuid: string): Promise<StoredNotification[]> {
        const allNotes: StoredNotification[] = [];
        await (await this.storage.get(StorageMap.NOTIFICATIONS)).iterate((val: string) => {
            const noteObject: StoredNotification = JSON.parse(val);
            if (noteObject.source.uuid === appUuid) {
                allNotes.push(noteObject);
            }
        });
        return allNotes;
    }, uuid);
}

export async function assertNotificationStored(source: Identity, note: Notification): Promise<void> {
    const storedId = `${source.uuid}:${note.id}`;

    const expectedStoredNote: StoredNotification = {
        id: storedId,
        notification: {...note, date: note.date.valueOf()},
        source
    };
    const actualStoredNote = await getStoredNotification(storedId);

    expect(actualStoredNote).toEqual(expectedStoredNote);
}

/**
 * @param id ID of the stored notification. Note: this is the internal ID of format "UUID:NoteID" and must be an exact match.
 *
 * Returns `undefined` if no notification is stored with given ID.
 */
async function getStoredNotification(id: string): Promise<StoredNotification | undefined> {
    return ofBrowser.executeOnWindow(SERVICE_IDENTITY, async function(remoteID: string): Promise<StoredNotification | undefined> {
        const note = await (await this.storage.get(StorageMap.NOTIFICATIONS)).getItem<string | null>(remoteID);
        // Localforage returns null for non-existent keys, but we will return undefined for consistency with other utils
        return note !== null ? JSON.parse(note) : undefined;
    }, id);
}
