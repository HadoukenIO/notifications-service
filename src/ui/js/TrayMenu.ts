import { WindowManager } from './openfin';
import { WindowInfo } from './WindowInfo';
import { Fin } from '../../fin';
import { deregister } from 'openfin-layouts';

declare var fin: Fin;
declare var window: Window & {createWindow: ()=>fin.OpenFinWindow};

interface IClickInfo {
    button: number;
    x: number;
    y: number;
}

export class TrayMenu {
    private window: fin.OpenFinWindow;
    private icon: string;
    private parent: WindowManager;

    constructor(icon: string, parent: WindowManager) {
        this.icon = icon;
        this.parent = parent;
        this.window = this.createWindow();
        this.createTrayIcon();
    }

    /**
     * @method createWindow Creates the TrayMenu window
     * @returns fin.desktop.Window
     */
    public createWindow(): fin.OpenFinWindow {
        return new fin.desktop.Window (
            {
                name: 'TrayIconOptions',
                url: 'tray.html',
                defaultWidth: 300,
                defaultHeight: 35,
                defaultTop: 0,
                defaultLeft: 0,
                frame: false,
                saveWindowState: false,
                autoShow: false,
                alwaysOnTop: true,
                state: 'normal',
                smallWindow:true,
                showTaskbarIcon: false
                
            },
            () => {
                //deregisters window from layout docking
                deregister({uuid: fin.desktop.Application.getCurrent().uuid, name: 'TrayIconOptions' });
            },
            (error: string) => {
                console.error("Failed to create TrayMenu Window", error);
            }
        );
    }

    /**
     * @method clickHandler Handles click events from the tray menu icon
     * @returns void
     * @param clickInfo
     */
    public clickHandler(clickInfo: IClickInfo): void {
        if (clickInfo.button === 0) {
            //left click
            if (WindowInfo.instance.getShowingStatus()) {
                // Commented out until we resolve the runtime tray icon toast delay bug
                // this.parent.hideWindow();
            } else {
                //closes any open OpenFin notifications on window show
                //notificationManager.closeAll();
                this.parent.showWindow();
            }
        } else if (clickInfo.button === 2) {
            //right click
            this.window.moveTo(clickInfo.x, clickInfo.y - 35);
            this.window.show();
            this.window.setAsForeground();
            this.window.focus();
        }
    }

    /**
     * @method createTrayIcon Creates the Tray Icon itself
     * @returns void
     */
    public createTrayIcon(): void {
        fin.desktop.Application.getCurrent().setTrayIcon(this.icon, this.clickHandler.bind(this));
    }
}
