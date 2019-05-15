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
    private _webWindow: Promise<WebWindow>;
    private static _instance: ContextMenu;

    private constructor() {
        this._webWindow = createWebWindow(windowOptions).then(webWindow => {
            this.addListeners();
            return webWindow;
        });
    }

    public static get instance() {
        if (!ContextMenu._instance) {
            ContextMenu._instance = new ContextMenu();
        }
        return ContextMenu._instance;
    }

    public initialize() {
        console.log('init');
    }

    public async isShowing() {
        const {window} = await this._webWindow;
        return window.isShowing();
    }

    public static async show(position: PointTopLeft, menuItems: MenuItem[]) {
        const {document, window} = await ContextMenu.instance._webWindow;
        const {left, top} = position;
        renderApp(document, menuItems, ContextMenu.close);
        await window.moveTo(left, top);
        await window.show(true);
        await window.setAsForeground();
        await window.focus();
    }

    public static async close() {
        const {window} = await ContextMenu.instance._webWindow;
        window.hide();
    }

    private async addListeners() {
        const {window} = await this._webWindow;

        window.addListener('blurred', () => {
            window.hide();
        });
    }
}
