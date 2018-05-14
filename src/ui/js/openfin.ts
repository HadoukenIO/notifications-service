import { Fin } from '../../fin';
import { WindowInfo } from './WindowInfo';
import { TrayMenu } from './TrayMenu';
import { deregister } from 'openfin-layouts';

declare var fin: Fin;

export class WindowManager {
    private windowInfo: WindowInfo = new WindowInfo();
    private trayMenu: TrayMenu;

    constructor() {
        this.setEventListeners();
        this.trayMenu = new TrayMenu("https://openfin.co/favicon-32x32.png", this);

        
        //opts out of openfin layouts docking
        deregister()
            .then(() => {
                fin.desktop.Window.getCurrent().animate({
                    opacity: {
                        opacity: 1,
                        duration: 200
                    }
                }, {
                    interrupt: false
                })
            });
    }

    /**
     * @method setEventListeners Initalizes event listeners for the window
     * @returns void
     */
    public setEventListeners(): void {
        //When window is ready
        window.addEventListener(
            'DOMContentLoaded',
            this.onWindowLoad.bind(this)
        );

        //On window close requested
        this.windowInfo
            .getWindow()
            .addEventListener('close-requested', () => this.hideWindow());

        //On monitor dimension change
        fin.desktop.System.addEventListener(
            'monitor-info-changed',
            this.sizeToFit.bind(this)
        );
    }

    /**
     * @method onWindowLoad Fired when the window DOM is loaded
     * @returns void
     */
    public onWindowLoad(): void {
        this.sizeToFit(true);

        document.getElementById('exitLink').addEventListener('click', () => this.hideWindow());
    }

    /**
     * @method sizeToFit Sets the window dimensions in shape of a side bar
     * @returns void
     */
    public sizeToFit(forceShow: boolean = false): void {
        fin.desktop.System.getMonitorInfo((monitorInfo: fin.MonitorInfo) => {
            this.windowInfo.getWindow().setBounds(
                monitorInfo.primaryMonitor.availableRect.right -
                    this.windowInfo.getIdealWidth(),
                0,
                this.windowInfo.getIdealWidth(),
                monitorInfo.primaryMonitor.availableRect.bottom,
                () => {
                    if (forceShow) {
                        this.showWindow();
                    }
                },
                (reason: string) => {
                    console.warn('MOVED FAILED', reason);
                }
            );
        });
    }

    /**
     * @method showWindow Shows the Window with Fade()
     * @returns void
     */
    public showWindow(): void {
        this.fade(true, 450);
        this.windowInfo.getWindow().resizeBy(1, 0, "top-left");
        this.windowInfo.getWindow().resizeBy(-1, 0, "top-left");
        this.windowInfo.setShowing(true);
    }

    /**
     * @method hideWindow Hides the window with Fade()
     * @returns void
     */
    public hideWindow(): void {
        this.fade(false, 450);
        this.windowInfo.setShowing(false);
    }

    /**
     * @method fade Fades the window in or out
     * @param fadeOut 
     * @param timeout 
     */
    public fade(fadeOut: boolean, timeout: number): void {
        if (fadeOut) {
            this.windowInfo.getWindow().show();
        }

        this.windowInfo.getWindow().animate(
            {
                opacity: {
                    opacity: fadeOut ? 1 : 0,
                    duration: timeout
                }
            },
            { interrupt: false },
            () => {
                !fadeOut
                    ? this.windowInfo.getWindow().hide()
                    : this.windowInfo.getWindow().focus();
            }
        );
    }
}

//Run the window manager right away
new WindowManager();    // tslint:disable-line:no-unused-expression
