import {Identity} from 'hadouken-js-adapter';

import {fin} from './fin';
import {delay} from './delay';
import {Duration} from './delay';
import * as notifsRemote from './notificationsRemote';
import {isCenterShowing} from './centerUtils';
import {testManagerIdentity} from './constants';

export type CenterState = 'center-open' | 'center-closed'

/**
 * Races a given promise against a timeout, and resolves to a `[didTimeout, value?]` tuple indicating
 * whether the timeout occurred, and the value the promise resolved to (if timeout didn't occur)
 * @param timeoutMs Timeout period in ms
 * @param promise Promise to race against the timeout
 */
export function withTimeout<T>(timeoutMs: number, promise: Promise<T>): Promise<[boolean, T | undefined]> {
    const timeout = new Promise<[boolean, undefined]>(res => setTimeout(() => res([true, undefined]), timeoutMs));
    const p = promise.then(value => ([false, value] as [boolean, T]));
    return Promise.race([timeout, p]);
}

export async function waitForAppToBeRunning(app: Identity): Promise<void> {
    let timedOut = false;

    [timedOut] = await withTimeout(Duration.APP_STARTUP_TIME, new Promise<void>(async (resolve) => {
        while (!await fin.Application.wrapSync(app).isRunning() && !timedOut) {
            await delay(100);
        }

        resolve();
    }));

    if (timedOut) {
        throw new Error(`Timeout waiting for app ${JSON.stringify(app)} to start`);
    }

    // Additional delay to ensure app window is ready for puppeteer connection
    await delay(500);
}

export function setupCenterBookends(centerVisibility: CenterState): void {
    if (centerVisibility === 'center-open') {
        setupOpenCenterBookends();
    } else {
        setupClosedCenterBookends();
    }
}

export function setupOpenCenterBookends(): void {
    beforeAll(async () => {
        // Ensure center is showing
        if (!(await isCenterShowing())) {
            await notifsRemote.toggleNotificationCenter(testManagerIdentity);
            await delay(Duration.CENTER_TOGGLED);
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
