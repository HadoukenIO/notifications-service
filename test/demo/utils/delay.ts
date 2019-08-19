export async function delay(duration: Duration) {
    return new Promise(res => setTimeout(res, duration));
}

export enum Duration {
    APP_RESTART = 10000,
    TOAST_DOM_LOADED = 500,
    TOAST_CREATE = 200,
    TOAST_CLOSE = 600,
    EVENT_PROPAGATED = 100,
    CENTER_TOGGLED = 300
}
