export async function delay(duration: number) {
    return new Promise(res => setTimeout(res, duration));
}

export enum Duration {
    toastDOMLoaded = 500,
    windowClosed = 200,
    windowCreated = 200,
    eventPropagated = 100,
    centerToggled = 300
}
