export async function delay(duration: Duration) {
    return new Promise(res => setTimeout(res, duration));
}

// TODO: Investigate TOAST_DOM_LOADED and TOAST_CLOSE needing to be increased for tests to pass on CI [SERVICE-730]
export enum Duration {
    TOAST_DOM_LOADED = 1000,
    TOAST_CREATE = 200,
    TOAST_CLOSE = 1000,
    EVENT_PROPAGATED = 1000,
    CENTER_TOGGLED = 500,
    APP_STARTUP_TIME = 30 * 1000,
    NAVIGATE_BACK = 750,
    WAIT_FOR_SELECTOR = 1000
}
