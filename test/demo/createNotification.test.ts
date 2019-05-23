import 'jest';

import {NotificationClosedEvent} from '../../src/client';

import {fin} from './utils/fin';
import * as notifsRemote from './utils/notificationsRemoteExecution';

describe('', () => {
    test('', async () => {
        const listener = jest.fn<void>((event: NotificationClosedEvent) => {});
        await notifsRemote.addEventListener({uuid: 'a', name: 'a'}, 'notification-closed', listener);
        await notifsRemote.clear({uuid: 'a', name: 'a'}, 'asvaefa');
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith();
    });
});
