import {EventEmitter} from 'events';

import {WindowOption} from 'openfin/_v2/api/window/windowOption';
import {PointTopLeft} from 'openfin/_v2/api/system/point';
import Bounds from 'openfin/_v2/api/window/bounds';
import {Rect} from 'openfin/_v2/api/system/monitor';

import {renderApp} from '../view/containers/ToastApp';
import {Store} from '../store';
import {deferredPromise} from '../common/deferredPromise';

import {WebWindow, createWebWindow} from './WebWindow';
import {StoredNotification} from './StoredNotification';
import {contains} from './Geometry';

export type WindowDimensions = {height: number, width: number};

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
    backgroundColor: '#1F1E24'
};

/** Margin to other toasts and the window edge. */
interface Margin {
    horizontal: number;
    vertical: number;
}

interface Options {
    timeout: number;
    direction: readonly [number, number];
}

/** Animation state of the toast window. */
enum AnimationState {
    WAITING = 'WAITING',
    SHOWING = 'SHOWING',
    CLOSING = 'CLOSING'
}

export enum ToastEvent {
    PAUSE = 'pause',
    UNPAUSE = 'unpause',
    CLOSED = 'closed'
}


export class Toast {
    public static eventEmitter: EventEmitter = new EventEmitter();
    private _webWindow: Readonly<Promise<WebWindow>>;
    private _options: Options;
    private _state: AnimationState;
    private _timeout!: number;
    private _dimensions!: Promise<WindowDimensions>;
    private _id: string;
    private _position: PointTopLeft;

    public static margin: Margin = {
        horizontal: 10,
        vertical: 10
    };

    public get id(): string {
        return this._id;
    }

    public get position(): PointTopLeft {
        return this._position;
    }

    public set position(value: PointTopLeft) {
        this._position = value;
    }

    public get isShowing(): boolean {
        return this._state === AnimationState.SHOWING;
    }

    public get isClosing(): boolean {
        return this._state === AnimationState.CLOSING;
    }

    public isWaiting(): boolean {
        return this._state === AnimationState.WAITING;
    }

    public constructor(store: Store, notification: StoredNotification, toastOptions: Options, position: PointTopLeft) {
        this._id = notification.id;
        this._options = toastOptions;
        this._state = AnimationState.WAITING;
        this._position = position;
        // Wait for the React component to render and then get the dimensions of it to resize the window.
        const [dimensionPromise, dimensionResolve] = deferredPromise<WindowDimensions>();
        this._dimensions = dimensionPromise;

        const name = `${windowOptions.name}:${this.id}`;
        this._webWindow = createWebWindow({...windowOptions, name}).then((webWindow) => {
            const {document} = webWindow;
            this.addListeners();

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
     * Check if this toast can fit inside the primary monitor bounds.
     * @param position Point to check if this toast can fit.
     */
    public async canFitInMonitor(position?: PointTopLeft) {
        const toastRect = await this.calculateBounds(position) as Rect;
        const monitorInfo = await fin.System.getMonitorInfo();
        return contains(monitorInfo.primaryMonitor.availableRect, toastRect);
    }

    public async show(position?: PointTopLeft): Promise<boolean> {
        if (this.isShowing) {
            return true;
        }
        // Await window dimensions from React component
        // before showing the window.
        return this._dimensions.then(async dimensions => {
            if (position) {
                this.position = position;
            }
            if (!await this.canFitInMonitor(this.position)) {
                console.log(this.id, 'Cannot fit in bounds');
                this._state = AnimationState.WAITING;
                return false;
            }
            // Set the position of the window to the edge of the display
            const newBounds = await this.calculateBounds(position, dimensions);
            this._state = AnimationState.SHOWING;
            const {window: toastWindow} = await this._webWindow;
            await toastWindow.setBounds(newBounds);
            await this.fadeIn();

            // Close notification after timeout
            this._timeout = window.setTimeout(this.timeoutHandler, this._options.timeout);
            return true;
        });
    }

    /**
     * Get bounds for the window, or the possible bounds given a position and the window dimensions.
     * @param position Position of the window.
     * @param dimensions Dimension of the window.
     */
    public async calculateBounds(position?: PointTopLeft, dimensions?: WindowDimensions): Promise<Required<Bounds>> {
        const {direction: [vX, vY]} = this._options;
        const {width, height} = dimensions || await this._dimensions;
        let {top, left} = position || this.position;
        // If toast is on the top ignore height
        top = top + (height * ((vY > 0) ? vY - 1 : vY));
        // If toast is coming from the left ignore width
        left = left + (width * ((vX < 0) ? vX : vX - 1));
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
     * Move toast to postion.
     * @param position The point to move the toast window to.
     */
    public async moveTo(position: PointTopLeft): Promise<void> {
        const {window} = await this._webWindow;
        const {top} = position;
        const {width} = await this._dimensions;
        let [vX] = this._options.direction;
        vX = vX > 0 ? 0 : vX;
        const left = position.left + (width * ((vX < 0) ? vX : vX - 1));

        return window.animate(
            {
                opacity: {
                    opacity: 1,
                    duration: 300
                },
                position: {
                    top: Math.floor(top),
                    left: Math.floor(left),
                    duration: 500,
                    relative: false
                }
            },
            {
                interrupt: true,
                tween: 'linear'
            }
        );
    }

    /**
     * Close Toast window and perform cleanup.
     * @param force Force the window to close instantly without animating out.
     */
    public close = async (force: boolean = false): Promise<void> => {
        this._state = AnimationState.CLOSING;
        const {window, document} = await this._webWindow;

        clearTimeout(this._timeout);
        document.removeEventListener('mouseenter', this.mouseEnterHandler);
        document.removeEventListener('mouseleave', this.mouseLeaveHandler);
        Toast.eventEmitter.removeListener(ToastEvent.PAUSE, this.freeze);
        Toast.eventEmitter.removeListener(ToastEvent.UNPAUSE, this.unfreeze);

        if (!force) {
            await this.fadeOut();
        }

        await window.close();
    }

    /**
     * Freeze the toast in place and remove timeouts.
     * @param stopMovement If true the toasts movement will be stopped.
     */
    public freeze = async (stopMovement: boolean = false): Promise<void> => {
        if (this.isWaiting()) {
            return;
        }
        clearTimeout(this._timeout!);
        if (stopMovement) {
            this.fadeIn(200);
        }
    }

    /**
     * Unfreeze the toast. This moves & resets timeout.
     */
    public unfreeze = async (): Promise<void> => {
        let newTimoutLength = this._timeout + 5000;
        if (newTimoutLength > this._options.timeout) {
            newTimoutLength = this._options.timeout;
        }
        this._timeout = window.setTimeout(this.timeoutHandler, newTimoutLength);

        this.moveTo(this.position);
    }

    /**
     * Listeners to handle events on the toast.
     */
    private async addListeners(): Promise<void> {
        const {document} = await this._webWindow;

        // Listen for other toast events
        // Toast.eventEmitter.addListener(ToastEvent.PAUSE, this.freeze);
        Toast.eventEmitter.addListener(ToastEvent.UNPAUSE, this.unfreeze);

        // Pause timeout on mouse over window
        document.addEventListener('mouseenter', this.mouseEnterHandler);
        document.addEventListener('mouseleave', this.mouseLeaveHandler);
    }

    private timeoutHandler = (): void => {
        Toast.eventEmitter.emit(ToastEvent.CLOSED, this.id);
    }

    private mouseEnterHandler = async (): Promise<void> => {
        clearTimeout(this._timeout!);
        Toast.eventEmitter.emit(ToastEvent.PAUSE, this.id);
    };

    private mouseLeaveHandler = async (): Promise<void> => {
        Toast.eventEmitter.emit(ToastEvent.UNPAUSE);
    };

    private async fadeIn(duration: number = 300): Promise<void> {
        const {window} = await this._webWindow;
        window.show();
        await window.animate(
            {
                opacity: {
                    opacity: 1,
                    duration
                }
            },
            {
                interrupt: true,
                tween: 'ease-in'
            }
        );
    }

    private async fadeOut(duration: number = 400): Promise<void> {
        const {window} = await this._webWindow;
        if (!window) {
            return;
        }
        await window.animate(
            {
                opacity: {
                    opacity: 0,
                    duration
                }
            },
            {
                interrupt: false,
                tween: 'ease-in'
            }
        );
    }
}
