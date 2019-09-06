import {ToggleCenterVisibilitySource} from '../store/Actions';

import {Timer} from './Timer';

/**
 * This is a large value, as typically client apps will send the 'Toggle' API call on the release of the mouse button, and a tray icon
 * click will not be dispatched until the release of the mouse button, and this may be a non-trival time after the blur event
 */
const POST_BLUR_API_TOGGLE_BLOCK_DURATION = 750;
const POST_TOGGLE_BLUR_BLOCK_DURATION = 200;

/**
 * Helper class to decide whether to ignore 'Toggle' actions. If the Notification Center is open, and the user clicks the toggle button in
 * another app, or clicks the tray icon, both a ToggleCenter action, and a blur event will be generated. Processed naively, these may cause
 * the Center to rapidly turn off then on again. This class may be used to mitigate this problem
 */
export class ToggleFilter {
    private readonly _toggleBlockTimer: Timer;

    private readonly _blurBlockTimer: Timer;

    constructor() {
        this._toggleBlockTimer = new Timer(POST_BLUR_API_TOGGLE_BLOCK_DURATION);

        this._blurBlockTimer = new Timer(POST_TOGGLE_BLUR_BLOCK_DURATION);
    }

    public recordBlur(): boolean {
        if (this._blurBlockTimer.running) {
            // Blur occured shortly after an unblocked interaction, so ignore
            this._blurBlockTimer.clear();
            return false;
        } else {
            // Blur was the first event in a blur/toggle pair, so start times to temporarily block toggles
            this._toggleBlockTimer.start();
            return true;
        }
    }

    public recordToggle(source: ToggleCenterVisibilitySource): boolean {
        if (source === ToggleCenterVisibilitySource.API || source === ToggleCenterVisibilitySource.TRAY) {
            const running = this._toggleBlockTimer.running;

            // We only want to block a single toggle per-blur, so always clear timer
            this._toggleBlockTimer.clear();

            if (!running) {
                // If a blur event occurs shortly after this toggle, we want to regard it as part of the same interaction, so start a short timer
                this._blurBlockTimer.start();
                return true;
            } else {
                return false;
            }
        } else {
            // An internal button won't be associated with a blur, so ignore timers
            return true;
        }
    }
}
