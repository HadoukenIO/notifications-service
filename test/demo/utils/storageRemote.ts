import * as LocalForage from 'localforage';

import {SERVICE_IDENTITY} from '../../../src/client/internal';
import {StoredNotification} from '../../../src/provider/model/StoredNotification';

import {OFPuppeteerBrowser, BaseWindowContext} from './ofPuppeteer';


interface ProviderWindow extends BaseWindowContext {
    settingsStorage: LocalForage;
    notificationStorage: LocalForage;
}

const ofBrowser = new OFPuppeteerBrowser<ProviderWindow>();

export async function getAllNotifications(): Promise<StoredNotification[]> {
    return ofBrowser.executeOnWindow(SERVICE_IDENTITY, async function(): Promise<StoredNotification[]> {
        const allNotes: StoredNotification[] = [];
        this.notificationStorage.iterate((val: StoredNotification) => {
            allNotes.push(val);
        });
        return allNotes;
    });
}

export async function getAppNotifications(uuid: string): Promise<StoredNotification[]> {
    return ofBrowser.executeOnWindow(SERVICE_IDENTITY, async function(appUuid: string): Promise<StoredNotification[]> {
        const allNotes: StoredNotification[] = [];
        this.notificationStorage.iterate((val: string) => {
            const noteObject: StoredNotification = JSON.parse(val);
            if (noteObject.source.uuid === appUuid) {
                allNotes.push(noteObject);
            }
        });
        return allNotes;
    }, uuid);
}

/**
 * @param id ID of the stored notificaiton. Note: this is the internal id of format "UUID:NoteID" and must be an exact match.
 *
 * Returns `undefined` if no notification is stored with given id.
 */
export async function getStoredNotification(id: string): Promise<StoredNotification | undefined>{
    return ofBrowser.executeOnWindow(SERVICE_IDENTITY, async function(remoteID: string): Promise<StoredNotification | undefined>{
        const note = await this.notificationStorage.getItem<StoredNotification | null>(remoteID);
        // Localforage returns null for non-existent keys, but we will return undefined for consistency with other utils
        return note || undefined;
    }, id);
}
