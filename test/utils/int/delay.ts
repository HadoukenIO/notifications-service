export async function delay(duration: Duration) {
    return new Promise(res => setTimeout(res, duration));
}

export enum Duration {
    TOAST_DOM_LOADED = 500,
    TOAST_CREATE = 200,
    TOAST_CLOSE = 600,
    EVENT_PROPAGATED = 1000,
    CENTER_TOGGLED = 500,
    APP_STARTUP_TIME = 30 * 1000,
    NAVIGATE_BACK = 750
}
