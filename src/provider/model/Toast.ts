import {Signal} from 'openfin-service-signal';
import {WindowOption} from 'openfin/_v2/api/window/windowOption';
import {PointTopLeft} from 'openfin/_v2/api/system/point';
import {Transition, TransitionOptions, Bounds} from 'openfin/_v2/shapes';

import {DeferredPromise} from '../common/DeferredPromise';
import {renderApp} from '../view/containers/ToastApp';
import {Store} from '../store/Store';
import {LayoutItem, WindowDimensions} from '../controller/Layouter';

import {StoredNotification} from './StoredNotification';
import {WebWindow, WebWindowFactory} from './WebWindow';
import {MonitorModel} from './MonitorModel';

export enum ToastEvent {
    PAUSE,
    UNPAUSE,
    CLOSED
}

const windowOptions: WindowOption = {
    name: 'Notification-Toast',
    url: 'ui/toast.html',
    autoShow: false,
    defaultHeight: 135,
    defaultWidth: 300,
    resizable: false,
    shadow: false,
    saveWindowState: false,
    contextMenu: !(process.env.NODE_ENV === 'production'),
    frame: false,
    alwaysOnTop: true,
    showTaskbarIcon: false,
    opacity: 0,
    backgroundColor: '#1F1E24',
    cornerRounding: {
        width: 7,
        height: 7
    }
};

export class Toast implements LayoutItem {
    public static readonly onToastEvent: Signal<[ToastEvent, string]> = new Signal();

    /**
     * Time in milliseconds until a toast closes.
     *
     * Timeout will be reset when user mouses-over any toast in the stack.
     */
    private static TIMEOUT: number = 10000;

    private _webWindow: Readonly<Promise<WebWindow>>;
    private _timeout: number;
    private _dimensions: WindowDimensions|null;
    private _ready: DeferredPromise<void>;
    private _id: string;
    private _position: PointTopLeft;

    /** Id of the notification this Toast represents. */
    public get id(): string {
        return this._id;
    }

    public get position(): PointTopLeft {
        return this._position;
    }

    public set position(value: PointTopLeft) {
        this._position = value;
    }

    public get ready(): Promise<void> {
        return this._ready.promise;
    }

    /**
     * Size of the toast window.
     *
     * Note: Must only be used after `ready` resolves, will be `null` before that point.
     */
    public get dimensions(): WindowDimensions|null {
        return this._dimensions;
    }

    public constructor(store: Store, monitorModel: MonitorModel, webWindowFactory: WebWindowFactory, notification: StoredNotification) {
        this._id = notification.id;
        this._position = {top: 0, left: 0};
        this._timeout = 0;
        this._ready = new DeferredPromise<void>();
        this._dimensions = null;
        this._webWindow = this.init(store, monitorModel, webWindowFactory, notification);
    }

    private async init(store: Store, monitorModel: MonitorModel, webWindowFactory: WebWindowFactory, notification: StoredNotification): Promise<WebWindow> {
        // Create and prepare a window for the toast
        const name = `${windowOptions.name}:${this.id}`;
        const webWindow: WebWindow = await webWindowFactory.createWebWindow({...windowOptions, name});
        webWindow.onMouseEnter.add(this.mouseEnterHandler);
        webWindow.onMouseLeave.add(this.mouseLeaveHandler);

        // Show window offscreen so it can render and then hide it
        const {virtualScreen} = monitorModel.monitorInfo;
        await webWindow.showAt(virtualScreen.left - windowOptions.defaultWidth! * 2, virtualScreen.top - windowOptions.defaultHeight! * 2);
        await webWindow.hide();

        // Wait for the React component to render and then get the dimensions of it to resize the window.
        renderApp(
            notification,
            webWindow,
            store,
            (size: WindowDimensions) => {
                this._dimensions = size;
                this._ready.resolve();
            }
        );

        return webWindow;
    }

    /**
     * Display the toast.
     */
    public async show(): Promise<void> {
        await this._dimensions;
        await (await this._webWindow).show();
        this.unfreeze();
    }

    public async animate(transitions: Transition, options: TransitionOptions): Promise<void> {
        return (await this._webWindow).animate(transitions, options);
    }

    public async setTransform(transform: Bounds): Promise<void> {
        await (await this._webWindow).setBounds(transform);
    }

    /**
     * Close Toast window and perform cleanup.
     */
    public async close(): Promise<void> {
        this.freeze();

        const webWindow = await this._webWindow;
        webWindow.onMouseEnter.remove(this.mouseEnterHandler);
        webWindow.onMouseLeave.remove(this.mouseLeaveHandler);

        return webWindow.close();
    }

    /**
     * Freeze the toast in place and remove timeouts.
     */
    public async freeze(): Promise<void> {
        clearTimeout(this._timeout);
        this._timeout = 0;
    }

    /**
     * Unfreeze the toast. This moves & resets timeout.
     */
    public async unfreeze(): Promise<void> {
        this._timeout = window.setTimeout(this.timeoutHandler, Toast.TIMEOUT);
    }

    private timeoutHandler = (): void => {
        this._timeout = 0;
        Toast.onToastEvent.emit(ToastEvent.CLOSED, this.id);
    };

    private mouseEnterHandler = (): void => {
        Toast.onToastEvent.emit(ToastEvent.PAUSE, this.id);
    };

    private mouseLeaveHandler = (): void => {
        Toast.onToastEvent.emit(ToastEvent.UNPAUSE, this.id);
    };
}
