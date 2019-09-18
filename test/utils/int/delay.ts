export async function delay(duration: Duration) {
    return new Promise(res => setTimeout(res, duration));
}

// values of TOAST_DOM_LOADED and TOAST_CLOSE durations are increased due to integration test issues,
// to be investigated within the scope of ticket SERVICE-730
export enum Duration {
    TOAST_DOM_LOADED = 1000,
    TOAST_CREATE = 200,
    TOAST_CLOSE = 1000,
    EVENT_PROPAGATED = 1000,
    CENTER_TOGGLED = 500,
    APP_STARTUP_TIME = 30 * 1000
}
