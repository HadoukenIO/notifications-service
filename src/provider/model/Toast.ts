import {WindowOption} from 'openfin/_v2/api/window/windowOption';
import {PointTopLeft} from 'openfin/_v2/api/system/point';
import {Transition, TransitionOptions} from 'openfin/_v2/api/window/transition';
import Bounds from 'openfin/_v2/api/window/bounds';
import {Signal} from 'openfin-service-signal';

import {DeferredPromise} from '../common/DeferredPromise';
import {renderApp} from '../view/containers/ToastApp';
import {Store} from '../store/Store';
import {LayoutItem, WindowDimensions} from '../controller/Layouter';

import {StoredNotification} from './StoredNotification';
import {WebWindow, createWebWindow} from './WebWindow';

const windowOptions: WindowOption = {
    name: 'Notification-Toast',
    url: 'ui/toast.html',
    autoShow: true,
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

/** Margin to other toasts and the window edge. */
interface Margin {
    horizontal: number;
    vertical: number;
}

interface Options {
    timeout: number;
}

export enum ToastEvent {
    PAUSE = 'pause',
    UNPAUSE = 'unpause',
    CLOSED = 'closed'
}

export class Toast implements LayoutItem {
    public static readonly onToastEvent: Signal<[ToastEvent, string]> = new Signal();

    private _webWindow: Readonly<Promise<WebWindow>>;
    private _options: Options;
    private _timeout!: number;
    private _dimensions!: Promise<WindowDimensions>;
    private _id: string;
    private _position: PointTopLeft;

    public static margin: Margin = {
        horizontal: 10,
        vertical: 10
    };

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

    public get dimensions(): Promise<WindowDimensions> {
        return this._dimensions;
    }

    public constructor(store: Store, notification: StoredNotification, toastOptions: Options) {
        this._id = notification.id;
        this._options = toastOptions;
        this._position = {top: 0, left: 0};
        // Wait for the React component to render and then get the dimensions of it to resize the window.
        const dimensionsDeferredPromise = new DeferredPromise<WindowDimensions>();
        const dimensionResolve = dimensionsDeferredPromise.resolve;
        this._dimensions = dimensionsDeferredPromise.promise;

        const name = `${windowOptions.name}:${this.id}`;
        this._webWindow = createWebWindow({...windowOptions, name}).then(async (webWindow) => {
            const {window, document} = webWindow;
            this.addListeners();
            await window.hide();
            renderApp(
                notification,
                document,
                store,
                dimensionResolve
            );
            return webWindow;
        });
    }

    /**
     * Display the toast.
    */
    public async show(): Promise<void> {
        const {window: toastWindow} = await this._webWindow;
        await toastWindow.show();
        this._timeout = window.setTimeout(this.timeoutHandler, this._options.timeout);
    }

    public async animate(transitions: Transition, options: TransitionOptions): Promise<void> {
        const {window} = await this._webWindow;
        return window.animate(transitions, options);
    }

    public async setTransform(transform: Bounds): Promise<void> {
        const {window} = await this._webWindow;
        await window.setBounds(transform);
    }

    /**
     * Close Toast window and perform cleanup.
     */
    public close = async (): Promise<void> => {
        const {window, document} = await this._webWindow;

        clearTimeout(this._timeout);
        document.removeEventListener('mouseenter', this.mouseEnterHandler);
        document.removeEventListener('mouseleave', this.mouseLeaveHandler);

        await window.close();
    }

    /**
     * Freeze the toast in place and remove timeouts.
     * @param stopMovement If true the toasts movement will be stopped.
     */
    public freeze = async (stopMovement: boolean = false): Promise<void> => {
        clearTimeout(this._timeout!);
    }

    /**
     * Unfreeze the toast. This moves & resets timeout.
     */
    public unfreeze = async (): Promise<void> => {
        this._timeout = window.setTimeout(this.timeoutHandler, this._options.timeout);
    }

    /**
     * Listeners to handle events on the toast.
     */
    private async addListeners(): Promise<void> {
        const {document} = await this._webWindow;

        // Pause timeout on mouse over window
        document.addEventListener('mouseenter', this.mouseEnterHandler);
        document.addEventListener('mouseleave', this.mouseLeaveHandler);
    }

    private timeoutHandler = (): void => {
        Toast.onToastEvent.emit(ToastEvent.CLOSED, this.id);
    }

    private mouseEnterHandler = async (): Promise<void> => {
        Toast.onToastEvent.emit(ToastEvent.PAUSE, this.id);
    };

    private mouseLeaveHandler = async (): Promise<void> => {
        Toast.onToastEvent.emit(ToastEvent.UNPAUSE, this.id);
    };
}
