declare const window: Window&fin.OpenFinWindow&{WindowInfo: WindowInfo};

export class WindowInfo {
    private height: number = 0;
    private width: number = 0;
    private window!: fin.OpenFinWindow;
    private idealHeight: number = 0;
    private idealWidth: number = 388;
    private isShowing: boolean = false;
    private static singleton: WindowInfo;

    constructor() {
        if (WindowInfo.singleton) {
            return WindowInfo.singleton;
        }

        this.recalibrate();

        fin.desktop.System.addEventListener('monitor-info-changed', this.recalibrate.bind(this));

        this.window = fin.desktop.Window.getCurrent();
        this.window.addEventListener('bounds-changed', this.recalibrate.bind(this));
        this.window.addEventListener('minimized', () => {
            this.setShowing(false);
        });
        this.window.addEventListener('hidden', () => {
            this.setShowing(false);
        });
        this.window.addEventListener('shown', () => {
            this.setShowing(true);
        });
        this.window.addEventListener('restored', () => {
            this.setShowing(true);
        });


        WindowInfo.singleton = this;
    }

    /**
     * @function getHeight Gets Attached Windows Height
     * @returns number
     */
    public getHeight(): number {
        return this.height;
    }

    /**
     * @function getWidth Gets Attached Windows Width
     * @returns number
     */
    public getWidth(): number {
        return this.width;
    }

    /**
     * @function getWindow Gets Attached Window
     * @returns fin.desktop.Window
     */
    public getWindow(): fin.OpenFinWindow {
        return this.window;
    }

    /**
     * @function getIdealHeight Gets the "ideal Height" for the window
     * @returns number
     */
    public getIdealHeight(): number {
        return this.idealHeight;
    }

    /**
     * @function getIdealWidth Gets the "ideal Width" for the window
     * @returns number
     */
    public getIdealWidth(): number {
        return this.idealWidth;
    }

    /**
     * @function recalibrate Recalibrates the window, height, and width
     * @returns void
     */
    public recalibrate(): void {
        this.window = fin.desktop.Window.getCurrent();
        this.height = window.innerHeight;
        this.width = window.innerWidth;
    }

    /**
     * @function setShowing set if the window is showing
     * @param showing boolean
     */
    public setShowing(showing: boolean): void {
        this.isShowing = showing;

        window.dispatchEvent(new CustomEvent('WindowShowingUpdate', {detail: {showing}}));
    }

    /**
     * @function getShowingStatus Gets the showing status of the window
     * @returns boolean
     */
    public getShowingStatus(): boolean {
        return this.isShowing;
    }

    /**
     * @function instance Gets this WindowInfo instance on the window.
     * @returns WindowInfo
     */
    public static get instance(): WindowInfo {
        if (WindowInfo.singleton) {
            return WindowInfo.singleton;
        } else {
            return new WindowInfo();
        }
    }
}
