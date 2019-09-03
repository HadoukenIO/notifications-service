export class Timer {
    private readonly _duration: number;
    private _timeoutHandle: any | undefined;

    constructor(duration: number) {
        this._duration = duration;
    }

    public start(): void {
        this.clear();

        this._timeoutHandle = setTimeout(() => {
            this._timeoutHandle = undefined;
        }, this._duration);
    }

    public clear(): void {
        if (this._timeoutHandle !== undefined) {
            clearTimeout(this._timeoutHandle);
        }

        this._timeoutHandle = undefined;
    }

    public get running(): boolean {
        return this._timeoutHandle !== undefined;
    }
}
