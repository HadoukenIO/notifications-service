export async function delay(duration: Duration) {
    return new Promise(res => setTimeout(res, duration));
}

export enum Duration {
    TOAST_DOM_LOADED = 500,
    WINDOW_CLOSED = 200,
    WINDOW_CREATED = 200,
    EVENT_PROPAGATED = 100,
    CENTER_TOGGLED = 300
}
