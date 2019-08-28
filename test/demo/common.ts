import * as notifsRemote from './utils/notificationsRemote';
import {isCenterShowing} from './utils/centerUtils';
import {testManagerIdentity} from './utils/constants';
import {delay, Duration} from './utils/delay';

export function setupOpenCenterBookends(): void {
    beforeAll(async () => {
        // Ensure center is showing
        if (!(await isCenterShowing())) {
            await notifsRemote.toggleNotificationCenter(testManagerIdentity);
        }
    });

    afterAll(async () => {
        // Close center when we're done
        if (await isCenterShowing()) {
            await notifsRemote.toggleNotificationCenter(testManagerIdentity);
            await delay(Duration.CENTER_TOGGLED);
        }
    });
}

export function setupClosedCenterBookends(): void {
    beforeAll(async () => {
        // Ensure center is not showing
        if (await isCenterShowing()) {
            await notifsRemote.toggleNotificationCenter(testManagerIdentity);
            await delay(Duration.CENTER_TOGGLED);
        }
    });
}
