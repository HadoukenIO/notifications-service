import 'jest';

import * as notifs from './utils/notificationsNode';
import {delay} from './utils/delay';
import {isCenterShowing} from './utils/notificationCenterUtils';

test('toggle', async () => {
    const startedVisible = await isCenterShowing();

    await notifs.toggleNotificationCenter();
    await delay(1000);

    const intermediateVisible = await isCenterShowing();

    expect(intermediateVisible).toEqual(!startedVisible);

    await notifs.toggleNotificationCenter();
    await delay(1000);

    const endedVisible = await isCenterShowing();
    expect(endedVisible).toEqual(startedVisible);
});
