import {WindowOption} from 'openfin/_v2/api/window/windowOption';
import {PointTopLeft} from 'openfin/_v2/api/system/point';

import {WebWindow, createWebWindow} from '../model/WebWindow';
import {renderApp} from '../view/containers/ContextMenu';

const windowOptions: WindowOption = {
    name: 'Context-Menu',
    url: 'ui/context-menu.html',
    autoShow: false,
    defaultHeight: 100,
    defaultWidth: 200,
    resizable: false,
    saveWindowState: false,
    defaultTop: 0,
    contextMenu: !(process.env.NODE_ENV === 'production'),
    frame: false,
    alwaysOnTop: true,
    showTaskbarIcon: false
};

export interface MenuItem {
    text: string;
    children?: MenuItem[];
    onClick?: () => void;
}

export interface Menu {
    items: MenuItem[]
}

export class ContextMenu {
    private readonly _webWindow: Promise<WebWindow>;
    private static _instance: ContextMenu = new ContextMenu();

    private constructor() {
        this._webWindow = createWebWindow(windowOptions).then(webWindow => {
            this.addListeners();
            return webWindow;
        });
    }

    public static async isShowing(): Promise<boolean> {
        const {window} = await this._instance._webWindow;
        return window.isShowing();
    }

    public static async show(position: PointTopLeft, menuItems: MenuItem[]): Promise<void> {
        const {document, window} = await ContextMenu._instance._webWindow;
        const {left, top} = position;
        renderApp(document, menuItems, ContextMenu.close);
        await window.moveTo(left, top);
        await window.show(true);
        await window.setAsForeground();
        await window.focus();
    }

    public static async close(): Promise<void> {
        const {window} = await ContextMenu._instance._webWindow;
        window.hide();
    }

    private async addListeners(): Promise<void> {
        const {window} = await this._webWindow;

        window.addListener('blurred', () => {
            window.hide();
        });
    }
}
