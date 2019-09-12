export class Timer {
    private readonly _duration: number;
    private _timeoutHandle: number | undefined;

    constructor(duration: number) {
        this._duration = duration;
    }

    public start(): void {
        this.clear();

        this._timeoutHandle = window.setTimeout(() => {
            this._timeoutHandle = undefined;
        }, this._duration);
    }

    public clear(): void {
        if (this._timeoutHandle !== undefined) {
            window.clearTimeout(this._timeoutHandle);
        }

        this._timeoutHandle = undefined;
    }

    public get running(): boolean {
        return this._timeoutHandle !== undefined;
    }
}
