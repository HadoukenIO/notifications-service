
import {toggleCenterLocked, toggleCenterMuted} from '../utils/int/centerUtils';
import {isCenterLocked, isCenterMuted, restartProvider} from '../utils/int/providerRemote';

type TestParam = [string, boolean];

const lockTestParams: TestParam[] = [['unlocked', false], ['locked', true]];
const muteTestParams: TestParam[] = [['unmuted', false], ['muted', true]];

afterAll(async () => {
    if (await isCenterLocked()) {
        await toggleCenterLocked();
    }

    if (await isCenterMuted()) {
        await toggleCenterMuted();
    }
});

describe.each(lockTestParams)('When the Notification Center is %s, the setting is preserved', (titleParam: string, locked: boolean) => {
    beforeAll(async () => {
        // Ensure center is unlocked/unlocked
        if ((await isCenterLocked()) !== locked) {
            await toggleCenterLocked();
        }
    });

    test(`When the Notification Center is restarted it is ${locked ? 'locked' : 'unlocked'}`, async () => {
        await restartProvider();

        await expect(isCenterLocked()).resolves.toBe(locked);
    });
});

describe.each(muteTestParams)('When the Notification Center is %s, the setting is preserved', (titleParam: string, muted: boolean) => {
    beforeAll(async () => {
        // Ensure center is unmuted/muted
        if ((await isCenterMuted()) !== muted) {
            await toggleCenterMuted();
        }
    });

    test(`When the Notification Center is restarted it is ${muted ? 'muted' : 'unmuted'}`, async () => {
        await restartProvider();

        await expect(isCenterMuted()).resolves.toBe(muted);
    });
});
