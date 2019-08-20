export async function delay(duration: Duration) {
    return new Promise(res => setTimeout(res, duration));
}

export enum Duration {
    TOAST_DOM_LOADED = 500,
    TOAST_CREATE = 200,
    TOAST_CLOSE = 600,
    EVENT_PROPAGATED = 100,
    CENTER_TOGGLED = 300,
    APP_STARTUP_TIME = 30 * 1000
}
