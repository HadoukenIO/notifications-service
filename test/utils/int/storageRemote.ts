import {Identity} from 'hadouken-js-adapter';

import {SERVICE_IDENTITY} from '../../../src/client/internal';
import {StoredNotification} from '../../../src/provider/model/StoredNotification';
import {Notification} from '../../../src/client';
import {Database, CollectionMap} from '../../../src/provider/model/database/Database';

import {OFPuppeteerBrowser, BaseWindowContext} from './ofPuppeteer';

interface ProviderWindow extends BaseWindowContext {
    database: Database;
}

const ofBrowser = new OFPuppeteerBrowser<ProviderWindow>();

export async function getAllStoredNotifications(): Promise<StoredNotification[]> {
    return ofBrowser.executeOnWindow(SERVICE_IDENTITY, async function(): Promise<StoredNotification[]> {
        const allNotes: StoredNotification[] = await this.database.get(CollectionMap.NOTIFICATIONS).getAll();

        return allNotes;
    });
}

export async function getStoredNotificationsByApp(uuid: string): Promise<StoredNotification[]> {
    return ofBrowser.executeOnWindow(SERVICE_IDENTITY, async function(appUuid: string): Promise<StoredNotification[]> {
        const allNotes: StoredNotification[] = (await this.database.get(CollectionMap.NOTIFICATIONS).getAll())
            .filter(noteObject => noteObject.source.uuid === appUuid);

        return allNotes;
    }, uuid);
}

export async function assertNotificationStored(source: Identity, note: Notification): Promise<void> {
    const storedId = `${source.uuid}:${note.id}`;

    const expectedStoredNote: StoredNotification = {
        id: storedId,
        notification: {...note, date: note.date.valueOf(), expiry: note.expiry !== null ? note.expiry.valueOf() : null},
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
        const note = await this.database.get(CollectionMap.NOTIFICATIONS).get(remoteID);

        return note;
    }, id);
}
