import 'jest';

import {Application, Window} from 'hadouken-js-adapter';

import {NotificationOptions} from '../../src/client';
import * as notifsRemote from '../utils/int/notificationsRemote';
import * as providerRemote from '../utils/int/providerRemote';
import {delay, Duration} from '../utils/int/delay';
import {testManagerIdentity, testAppUrlListenersOnStartup} from '../utils/int/constants';
import {createAppInServiceRealm} from '../utils/int/spawnRemote';
import {getToastName} from '../utils/int/toastUtils';
import {setupCommonBookends} from '../utils/int/common';

const notificationOptions: NotificationOptions = {
    body: 'Test Notification Body',
    title: 'Test Notification Title',
    category: 'Test Notification Category',
    customData: {testContext: 'testContext'},
    onSelect: {task: 'Selected'},
    buttons: []
};

const testShortcutName = 'Test App Shortcut Name';
const testApplicationName = 'Test App Name';

type TestParam = [
    string,
    string,
    string | undefined,
    string | undefined,
    string | undefined
];

setupCommonBookends();

describe.each([
    ['When an application which has a shortcut name and an application name creates a notifiction',
        'shortcut name',
        testShortcutName,
        testApplicationName,
        testShortcutName],
    ['When an application which does not have a shortcut name but has an application name creates a notifiction',
        'application name',
        undefined,
        testApplicationName,
        testApplicationName],
    ['When an application which does not have a shortcut name or an application name creates a notifiction',
        'application identity',
        undefined,
        undefined,
        undefined]
] as TestParam[])('%s', (
    titleParam: string,
    expectedTitleDescription: string,
    shortcutName: string | undefined,
    applicationName: string | undefined,
    expectedTitleValue: string | undefined
) => {
    let testApp: Application;
    let testWindow: Window;
    let noteId: string;

    beforeEach(async () => {
        testApp = await createAppInServiceRealm(testManagerIdentity, {url: testAppUrlListenersOnStartup, name: applicationName, shortcutName});
        testWindow = await testApp.getWindow();
        const {note} = await notifsRemote.createAndAwait(testWindow.identity, notificationOptions);
        noteId = note.id;
        await delay(Duration.TOAST_DOM_LOADED);
    });

    afterEach(async () => {
        await providerRemote.clearStoredNotifications(testWindow.identity);
        if (await testApp.isRunning()) {
            await testApp.quit();
        }
    });

    test(`The notification card should have ${expectedTitleDescription} as its card title`, async () => {
        const toastTitle = await getToastName(testApp.identity.uuid, noteId);
        const expected = expectedTitleValue || testApp.identity.uuid;
        expect(toastTitle).toEqual(expected);
    });
});
