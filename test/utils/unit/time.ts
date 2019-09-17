const MAX_PROMISE_CHAIN_LENGTH = 100;

const realDateNow = Date.now;
let moketime = 0;
let usingMockTime = false;

export function mockTime(): void {
    jest.useFakeTimers();

    Date.now = () => {
        return moketime;
    };

    moketime = 0;
    usingMockTime = true;
}

export function unmockTime(): void {
    jest.useRealTimers();
    Date.now = realDateNow;

    usingMockTime = false;
}

export async function advanceTime(duration: number): Promise<void> {
    if (usingMockTime) {
        for (let i = 0; i < duration; i++) {
            for (let j = 0; j < MAX_PROMISE_CHAIN_LENGTH; j++) {
                await Promise.resolve();
            }
            moketime++;
            jest.advanceTimersByTime(1);
        }
    } else {
        await new Promise(res => setTimeout(res, duration));
    }
}
