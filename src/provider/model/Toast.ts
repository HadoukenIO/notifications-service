import {WindowOption} from 'openfin/_v2/api/window/windowOption';
import {PointTopLeft} from 'openfin/_v2/api/system/point';
import Bounds from 'openfin/_v2/api/window/bounds';

import {NotificationOptions} from '../../client';
import {renderApp} from '../view/containers/ToastApp';
import {Store} from '../store';

import {WebWindow, createWebWindow} from './WebWindow';
import {StoredNotification} from './StoredNotification';

export type WindowDimensions = {height: number, width: number};

const windowOptions: WindowOption = {
    name: 'Notification-Toast',
    url: 'ui/toast.html',
    autoShow: false,
    defaultHeight: 135,
    defaultWidth: 300,
    resizable: false,
    saveWindowState: false,
    contextMenu: !(process.env.NODE_ENV === 'production'),
    frame: false,
    alwaysOnTop: true,
    showTaskbarIcon: false,
    opacity: 0,
    backgroundColor: '#1F1E24'
};

/** The toast type. */
export enum ToastType {
    /** Interactable e.g. buttons. Can only be one on the screen at time. Placed seperately to banners. Has rich information on it. */
    ACTION = 'ACTION',
    /** Fixed size, used to display simple information but not buttons. */
    BANNER = 'BANNER'
}

/** Margin to other toasts and the window edge. */
interface Margin {
    horizontal: number;
    vertical: number;
}

interface Options {
    timeout: number;
    /** Handler for when the toast closes (timeout/user) */
    onClose?: (toast: Toast) => void;
}

/** Animation state of the toast window. */
enum State {
    WAITING,
    SHOWING,
    CLOSING,
}

export class Toast {
    private _type: ToastType;
    private _webWindow: Promise<WebWindow>;
    private _options: Options;
    private _margin: Margin = {
        horizontal: 10,
        vertical: 10
    };

    private _state: State;

    private _timeout!: number;
    private _dimensions!: Promise<WindowDimensions>;

    public constructor(store: Store, notification: StoredNotification, toastOptions: Options) {
        this._options = toastOptions;
        this._type = this.getToastType(notification.notification);
        this._state = State.WAITING;

        // Wait for the React component to render and then get the dimensions of it to resize the window.
        let dimensionResolve: (value?: WindowDimensions | PromiseLike<WindowDimensions> | undefined) => void;
        this._dimensions = new Promise<WindowDimensions>((resolve, reject) => {
            dimensionResolve = resolve;
        });

        const name = `${windowOptions.name}:${Math.random()}`;
        this._webWindow = createWebWindow({...windowOptions, name}).then((webWindow) => {
            const {document} = webWindow;
            this.addListeners();

            renderApp(
                notification,
                document,
                store,
                (dimensions: WindowDimensions) => {
                    dimensionResolve(dimensions);
                },
            );

            return webWindow;
        });
    }

    public get type(): ToastType {
        return this._type;
    }

    /** Based on the notification options we resolve the ToastType.
     * Example: If there is buttons on the toast, it is an ACTION
     * In future there should be a flag to determine the type of toast
     * For now we will just check the options for 'interactable' elements.
     * @param notificationOptions Notification options
    */
    private getToastType(notificationOptions: NotificationOptions): ToastType {
        const {buttons} = notificationOptions;
        if (buttons && buttons.length > 0) {
            return ToastType.ACTION;
        }

        return ToastType.BANNER;
    }

    /**
     * Listeners to handle events on the toast.
     */
    private async addListeners() {
        const {document} = await this._webWindow;

        // Pause timeout on mouse over window
        document.onmouseenter = () => {
            this._state = State.SHOWING;
            this.animateIn(200);
            clearTimeout(this._timeout!);
        };
        document.onmouseleave = () => {
            clearTimeout(this._timeout!);
            this._timeout = window.setTimeout(() => {
                this.close();
            }, 3000);
        };
    }

    /**
     * Set toast window bounds.
     * @param newBounds The new bounds of the window.
     */
    private async setBounds(newBounds: Bounds) {
        const {window} = await this._webWindow;
        await window.setBounds(newBounds);
    }

    public async animateIn(duration: number = 400) {
        const {window} = await this._webWindow;
        await window.show();
        await window.animate(
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

    public async animateOut(duration: number = 800) {
        const {window} = await this._webWindow;
        await window.animate(
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

    /**
     * Show the window at the given position and based on the direction vector.
     * @param position top-left position to show the window.
     * @param direction Corner of the monitor to show this toast in.
     */
    public async show(position: PointTopLeft, direction: [number, number]) {
        const dimensions = await this._dimensions;
        // Set the position of the window to the edge of the display
        const newBounds = await this.calculateBounds(direction, position, dimensions);

        this._state = State.SHOWING;
        await this.setBounds(newBounds);
        await this.animateIn();

        // Close notification after timeout
        this._timeout = window.setTimeout(() => {
            this.close();
        }, this._options.timeout);
    }

    /**
     * Get window bounds.
     */
    public async getBounds() {
        const {window} = await this._webWindow;
        return window.getBounds();
    }

    /**
     * Calculate bounds for the window, or the bounds given the position and the window dimensions.
     * @param direction Vector direction of the window.
     * @param position Position of the window.
     * @param dimensions Dimension of the window.
     */
    public async calculateBounds(direction: [number, number], position?: PointTopLeft, dimensions?: WindowDimensions): Promise<Required<Bounds>> {
        const [x, y] = direction;
        const {width, height} = dimensions || await this._dimensions;
        const {vertical, horizontal} = this._margin;
        const {window} = await this._webWindow;
        let {top, left} = position || await window.getBounds();
        // If toast is on the top ignore height
        top = top + (height * ((y > 0) ? y - 1 : y)) + (vertical * y);
        // If toast is coming from the left ignore width
        left = left + (width * ((x < 0) ? x : x - 1)) + (horizontal * x);
        return {
            top,
            left,
            width: width,
            height: height,
            bottom: top + height,
            right: left + width
        };
    }

    /**
     * Close Toast window and perform cleanup.
     * @param force Force the window to close instantly without animating out.
     */
    public async close(force: boolean = false): Promise<void> {
        const {window} = await this._webWindow;
        const {onClose} = this._options;
        this._state = State.CLOSING;
        // Don't animate if force
        if (!force) {
            await this.animateOut();
        }
        // If mouse over window we are no longer closing.
        if (this._state !== State.CLOSING)
            return;
        if (onClose) {
            await this._options.onClose!(this);
        }
        clearTimeout(this._timeout);
        window.close();
    }
}
