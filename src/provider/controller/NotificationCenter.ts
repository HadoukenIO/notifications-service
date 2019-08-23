import {injectable, inject} from 'inversify';
import {WindowOption} from 'openfin/_v2/api/window/windowOption';
import {MonitorEvent} from 'openfin/_v2/api/events/system';

import {Inject} from '../common/Injectables';
import {TrayIcon} from '../common/TrayIcon';
import {WebWindow, createWebWindow} from '../model/WebWindow';
import {ToggleVisibility} from '../store/Actions';
import {Store} from '../store/Store';
import {renderApp} from '../view/containers/NotificationCenterApp';

import {AsyncInit} from './AsyncInit';

const windowOptions: WindowOption = {
    name: 'Notification-Center',
    url: 'ui/notification-center.html',
    autoShow: false,
    defaultHeight: 400,
    defaultWidth: 500,
    resizable: false,
    saveWindowState: false,
    defaultTop: 0,
    contextMenu: !(process.env.NODE_ENV === 'production'),
    frame: false,
    alwaysOnTop: true,
    icon: 'ui/favicon.ico',
    showTaskbarIcon: false,
    opacity: 0
};

@injectable()
export class NotificationCenter extends AsyncInit {
    private static readonly WIDTH: number = 388;

    @inject(Inject.STORE)
    private _store!: Store;

    private _webWindow!: WebWindow;
    private _trayIcon!: TrayIcon;

    protected async init() {
        await this._store.initialized;

        // Create notification center app window
        try {
            this._webWindow = await createWebWindow(windowOptions);
        } catch (error) {
            console.error('Notification Center window could not be created!', error.message);
            throw error;
        }
        await this.hideWindowOffscreen();
        this._trayIcon = new TrayIcon('https://openfin.co/favicon-32x32.png');
        this._trayIcon.addLeftClickHandler(() => {
            this._store.dispatch(new ToggleVisibility());
        });
        await this.sizeToFit();
        await this.addListeners();
        renderApp(this._webWindow.document, this._store);
        this.subscribe();
    }

    /**
     * Subscribe to the store.
     * Perform all watching for state change in here.
     */
    private subscribe(): void {
        // Window visibility
        this._store.watchForChange(
            state => state.windowVisible,
            (_, value) => this.toggleWindow(value)
        );
    }

    /**
     * The window visibility state.
     */
    public get visible(): boolean {
        const state = this._store.state;
        return state.windowVisible;
    }

    /**
     * Add listeners to the window.
     */
    private async addListeners(): Promise<void> {
        const {window} = this._webWindow;

        window.addListener('blurred', async () => {
            if (this.visible) {
                this._store.dispatch(new ToggleVisibility(false, true));
            }
        });

        fin.System.addListener('monitor-info-changed', ((event: MonitorEvent<string, string>) => {
            this.sizeToFit();
        }));
    }

    /**
     * Show the window.
     */
    public async showWindow(): Promise<void> {
        const {window} = this._webWindow;
        await window.show();
        await this.animateIn();
        await window.setAsForeground();
    }

    /**
     * Hide the window.
     * @param force Force the window to hide without animating out.
     */
    public async hideWindow(force?: boolean): Promise<void> {
        const duration = force ? 0 : 300;
        await this.animateOut(duration);
    }

    /**
     * Sets the window dimensions in shape of a side bar
     */
    public async sizeToFit(): Promise<void> {
        const {window} = this._webWindow;
        const idealWidth = NotificationCenter.WIDTH;
        await this.hideWindow(true);
        const monitorInfo = await fin.System.getMonitorInfo();
        return window.setBounds({
            left: monitorInfo.primaryMonitor.availableRect.right - idealWidth,
            top: 0,
            width: idealWidth,
            height: monitorInfo.primaryMonitor.availableRect.bottom
        });
    }

    private async hideWindowOffscreen() {
        const {window} = this._webWindow;
        const {virtualScreen, primaryMonitor} = await fin.System.getMonitorInfo();
        const height = primaryMonitor.availableRect.bottom;
        await window.showAt(virtualScreen.left - NotificationCenter.WIDTH * 2, virtualScreen.top - height * 2);
        await window.hide();
    }

    /**
     * Toggle window visibility.
     * @param visible Force the window to be shown or hidden. True = show, false = hide.
     */
    private async toggleWindow(visible: boolean): Promise<void> {
        if (visible) {
            return this.showWindow();
        } else {
            return this.hideWindow();
        }
    }

    /**
     * Animate the Notification Center window into view.
     * @param duration Animation duration.
     */
    private async animateIn(duration: number = 300): Promise<void> {
        const {window} = this._webWindow;

        window.animate(
            {
                opacity: {
                    opacity: 1,
                    duration
                }
            },
            {
                interrupt: true,
                tween: 'ease-in-out'
            }
        );
    }

    /**
     * Animate the Notification Center window out of view.
     * @param duration Animation duration.
     */
    private async animateOut(duration: number = 400): Promise<void> {
        const {window} = this._webWindow;

        window.animate(
            {
                opacity: {
                    opacity: 0,
                    duration
                }
            },
            {
                interrupt: true,
                tween: 'ease-in-out'
            }
        );
    }
}
