import {injectable, inject} from 'inversify';
import 'reflect-metadata';
import {WindowOption} from 'openfin/_v2/api/window/windowOption';
import {MonitorEvent} from 'openfin/_v2/api/events/system';

import {WebWindow, createWebWindow} from '../model/WebWindow';
import {renderApp} from '../view/containers/NotificationCenterApp';
import {TrayIcon} from '../common/TrayIcon';
import {watchForChange} from '../store/utils/watch';
import {getNotificationCenterVisibility} from '../store/ui/selectors';
import {toggleCenterWindowVisibility} from '../store/ui/actions';
import {Store, StoreContainer} from '../store';
import {Inject} from '../common/Injectables';

import {AsyncInit} from './AsyncInit';

const windowOptions: WindowOption = {
    name: 'Notification-Center',
    url: 'ui/index.html',
    autoShow: true,
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

interface Options {
    // Blur event causes window to hide
    hideOnBlur: boolean;
}

@injectable()
export class NotificationCenter extends AsyncInit {
    private _webWindow!: WebWindow;
    private _trayIcon!: TrayIcon;
    @inject(Inject.STORE)
    private _store!: StoreContainer;

    public async init() {
        // Create notification center app window
        try {
            this._webWindow = await createWebWindow(windowOptions);
        } catch (error) {
            console.error('Notification Center window could not be created!', error.message);
            throw error;
        }
        this.sizeToFit();
        this.setupTrayIcon();
        this.addListeners();
        // renderApp(webWindow.document, store);
        this.subscribe();
    }

    private setupTrayIcon(): void {
        this._trayIcon = new TrayIcon('https://openfin.co/favicon-32x32.png')
            .addLeftClickHandler(() => {
                this._store.dispatch(toggleCenterWindowVisibility());
            });
    }

    /**
     * Subscribe to the store.
     * Perform all watching for state change in here.
     */
    private async subscribe(): Promise<void> {
        // Window visibility
        watchForChange(
            this._store.store,
            getNotificationCenterVisibility,
            (_, value) => this.toggleWindow(value)
        );
    }

    /**
     * The window visibility state.
     */
    public get visible(): boolean {
        return getNotificationCenterVisibility(this._store.getState());
    }

    /**
     * Add listeners to the window.
     */
    private async addListeners(): Promise<void> {
        const {window} = this._webWindow;
        const hideOnBlur = process.env.NODE_ENV === 'production';

        if (hideOnBlur) {
            window.addListener('blurred', async () => {
                // const contextMenuIsShowing = await ContextMenu.isShowing();
                // if (!contextMenuIsShowing && this.visible) {
                if (this.visible) {
                    this._store.dispatch(toggleCenterWindowVisibility(false));
                }
            });
        }
        fin.System.addListener('monitor-info-changed', ((event: MonitorEvent<string, string>) => {
            this.sizeToFit();
        }));
    }

    /**
     * Toggle window visibility.
     * @param forceVisibility Force the window to be shown or hidden. True = show, false = hide.
     */
    public async toggleWindow(forceVisibility?: boolean): Promise<void> {
        const visible = forceVisibility || this.visible;
        if (visible) {
            return this.showWindow();
        } else {
            return this.hideWindow();
        }
    }

    /**
     * Show the window.
     */
    public async showWindow(): Promise<void> {
        const {window} = await this._webWindow;
        window.bringToFront();
        await window.show();
        await this.animateIn();
        window.setAsForeground();
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
     * @function sizeToFit Sets the window dimensions in shape of a side bar
     */
    public async sizeToFit(): Promise<void> {
        const {window} = this._webWindow;
        await this.hideWindow(true);
        const monitorInfo = await fin.System.getMonitorInfo();
        const idealWidth = 388;
        window.setBounds({
            left: monitorInfo.primaryMonitor.availableRect.right - idealWidth,
            top: 0,
            width: idealWidth,
            height: monitorInfo.primaryMonitor.availableRect.bottom
        });
    }

    private async animateIn(duration: number = 300): Promise<void> {
        const {window} = await this._webWindow;

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

    private async animateOut(duration: number = 400): Promise<void> {
        const {window} = await this._webWindow;

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
