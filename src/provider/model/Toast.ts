import {Signal, Aggregators} from 'openfin-service-signal';
import {WindowOption} from 'openfin/_v2/api/window/windowOption';
import {Opacity} from 'openfin/_v2/shapes';

import {DeferredPromise} from '../common/DeferredPromise';
import {renderApp} from '../view/containers/ToastApp';
import {Store} from '../store/Store';
import {LayoutItem} from '../controller/Layouter';
import {LayouterConfig} from '../controller/LayouterConfig';
import {ServiceStore} from '../store/ServiceStore';

import {StoredNotification} from './StoredNotification';
import {WebWindow, WebWindowFactory} from './WebWindow';
import {MonitorModel} from './MonitorModel';

export enum ToastState {
    /**
     * Short-lived state whilst the toast's window object is being created.
     */
    INITIALIZING,

    /**
     * Toast is waiting to be displayed, due to toast not being able to fit on-screen.
     *
     * When there is space on-screen, toast will still briefly pass-through this state once initialization is complete.
     */
    QUEUED,

    /**
     * Toast is currently visible to the user.
     *
     * Toast will be in this state from the very start of the transition-in animation, to immediately before the
     * transition-out.
     */
    ACTIVE,

    /**
     * Toast is still user-visible, but is now in the process of closing.
     */
    TRANSITION_OUT,

    /**
     * Toast window has now been closed. Toast will be placed into this state at the start of the teardown process - a
     * toast in this state may (very briefly) still have an associated window.
     */
    CLOSED
}

export interface Point<T = number> {
    x: T;
    y: T;
}

export interface Rectangle {
    /**
     * Location of the top-left corner of the rectangle
     */
    origin: Point;

    /**
     * Width/height of the rectangle
     */
    size: Point;
}

export type ReadonlyRectangle = Readonly<{
    origin: Readonly<Point>;
    size: Readonly<Point>;
}>;

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
    /**
     * Time in milliseconds until a toast closes.
     *
     * Timeout will be reset when user mouses-over any toast in the stack.
     */
    private static readonly TIMEOUT: number = 10000;

    /**
     * Signal shared between all toast instances used to communicate when the mouse cursor is over a toast.
     *
     * All toast animations will be paused whilst the cursor is over a toast. Toast timeouts will reset once the cursor
     * is removed.
     */
    private static readonly onFreezeToggle: Signal<[boolean]> = new Signal();

    /**
     * Signal that is dispatched whenever the toast changes state. Toast states always progress linearly and cannot go
     * backwards.
     *
     * Signal will emit at-most once per state - note that some toasts may skip some states if they are force-closed.
     *
     * Uses an aggregator so that side-effects of the state change can be captured by whoever initiated the state
     * change.
     */
    public readonly onStateChange: Signal<[Toast, ToastState], Promise<void>> = new Signal(Aggregators.AWAIT_VOID);

    private _state: ToastState;
    private _webWindow: Readonly<Promise<WebWindow>>;
    private _timeout: number;
    private _id: string;

    private _origin: Point;
    private _size: Point;

    private _currentTransition: DeferredPromise|null;
    private _activeTransitions: Promise<void>[];

    /**
     * The id of the notification this Toast represents.
     */
    public get id(): string {
        return this._id;
    }

    /**
     * Target bounds of the toast window
     *
     * When the window is animating, this will be where the window is animating _to_, rather than the actual pixel
     * bounds of the window at that time.
     */
    public get size(): Readonly<Point> {
        return this._size;
    }

    /**
     * The current state of the toast.
     *
     * State changes are validated to ensure the state can only advance in one direction. The {@link onStateChange}
     * signal will be emitted for each state update.
     */
    public get state(): ToastState {
        return this._state;
    }

    /**
     * Allows tracking of the current animation, if any.
     *
     * If the toast is currently in the process of animating (or applying a static window position) then this will
     * return a promise that will resolve when the window is next stationary.
     *
     * If an animation is interrupted by a second animation, this promise will persist and instead resolve once the
     * second (and any subsequent) animation is complete.
     *
     * A return value of null indicates that the window isn't currently animating or being moved.
     */
    public get currentTransition(): Promise<void>|null {
        return this._currentTransition && this._currentTransition.promise;
    }

    public constructor(store: ServiceStore, monitorModel: MonitorModel, webWindowFactory: WebWindowFactory, notification: StoredNotification) {
        this._id = notification.id;
        this._origin = {x: 0, y: 0};
        this._size = {x: 0, y: 0};
        this._timeout = 0;
        this._state = ToastState.INITIALIZING;
        this._webWindow = this.init(store, monitorModel, webWindowFactory, notification);
        this._currentTransition = null;
        this._activeTransitions = [];

        Toast.onFreezeToggle.add(this.onFreezeToggle, this);
    }

    /**
     * Display the toast.
     */
    public async show(): Promise<void> {
        await (await this._webWindow).show();
        this.unfreeze();
    }

    /**
     * Sets the toast to the given state. State transitions are uni-directional, will have no effect if the state is a
     * "regression" to an earlier state.
     *
     * Returns a promise that will resolve when any transition associated with this state change has completed. Will
     * return a resolved promise if there is no state change, or no animation associated with this state change.
     *
     * @param state New state of this toast
     */
    public async setState(state: ToastState): Promise<void> {
        if (state > this._state) {
            this._state = state;

            const expectingAnimation = (state === ToastState.ACTIVE || state === ToastState.TRANSITION_OUT);
            if (expectingAnimation && this._currentTransition === null) {
                // We want the return value of this promise to capture the animation that will be triggered by this state
                // change, but it hasn't yet started. Pre-create the transition promise in expectation of call to animate
                this._currentTransition = new DeferredPromise();
            }

            await this.onStateChange.emit(this, state);
        } else if (state < this._state) {
            console.warn(`Attempting to move toast backward to a previous state (${ToastState[this._state]} => ${ToastState[state]})`);
        }

        await (this._currentTransition && this._currentTransition.promise);
    }

    /**
     * Animates the toast into a new position. The pixel-position of the toast must be calculated externally, by an
     * entity that has access to the full toast stack. The target opacity will be calculated by the toast itself.
     *
     * @param transform New bounds of the toast
     * @param config Animation timing config
     */
    public async animate(transform: ReadonlyRectangle, config: LayouterConfig): Promise<void> {
        Object.assign(this._origin, transform.origin);

        // Calculate opacity from notification state
        let opacity: Opacity;
        if (this._state < ToastState.TRANSITION_OUT) {
            opacity = {opacity: 1, duration: config.animDurationFade};
        } else {
            // Use the shorter 'move' animation duration when transitioning animation out
            opacity = {opacity: 0, duration: config.animDurationMove};
        }

        return this.trackAnimation((await this._webWindow).animate(
            {
                opacity,
                position: {
                    left: transform.origin.x,
                    top: transform.origin.y,
                    duration: config.animDurationMove
                },
                size: {
                    width: transform.size.x,
                    height: transform.size.y,
                    duration: config.animDurationMove
                }
            },
            {
                interrupt: true,
                tween: 'linear'
            }
        ));
    }

    /**
     * Moves the toast to a new position without animating or affecting opacity.
     *
     * @param transform New bounds of the toast
     */
    public async setTransform(transform: ReadonlyRectangle): Promise<void> {
        Object.assign(this._origin, transform.origin);

        return this.trackAnimation((await this._webWindow).setBounds({
            left: transform.origin.x,
            top: transform.origin.y,
            width: transform.size.x,
            height: transform.size.y
        }));
    }

    /**
     * Close Toast window and perform cleanup.
     */
    public async close(): Promise<void> {
        this.freeze();

        Toast.onFreezeToggle.remove(this.onFreezeToggle, this);

        const webWindow = await this._webWindow.catch(() => null);
        if (webWindow) {
            webWindow.onMouseEnter.remove(this.mouseEnterHandler);
            webWindow.onMouseLeave.remove(this.mouseLeaveHandler);

            return webWindow.close();
        }
    }

    private async init(
        store: ServiceStore,
        monitorModel: MonitorModel,
        webWindowFactory: WebWindowFactory,
        notification: StoredNotification
    ): Promise<WebWindow> {
        // Create and prepare a window for the toast
        const name = `${windowOptions.name}:${this._id}`;
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
            (size: Point) => {
                Object.assign(this._size, size);

                // Note: State change will intentionally fail (to become a no-op) in cases
                // where the toast was destroyed immediately after creation
                this.setState(ToastState.QUEUED);
            }
        );

        return webWindow;
    }

    private async freeze(): Promise<void> {
        clearTimeout(this._timeout);
        this._timeout = 0;
    }

    private async unfreeze(): Promise<void> {
        if (this._state <= ToastState.ACTIVE) {
            this._timeout = window.setTimeout(this.timeoutHandler, Toast.TIMEOUT);
        }
    }

    private timeoutHandler = (): void => {
        this._timeout = 0;
        this.setState(ToastState.TRANSITION_OUT);
    };

    private mouseEnterHandler = (): void => {
        Toast.onFreezeToggle.emit(true);
    };

    private mouseLeaveHandler = (): void => {
        Toast.onFreezeToggle.emit(false);
    };

    private onFreezeToggle(isFrozen: boolean): void {
        if (isFrozen) {
            this.freeze();
        } else {
            this.unfreeze();
        }
    }

    /**
     * Call this with any promise that will affect the positioning of the toast window.
     *
     * This util will manage `_currentTransition`, to ensure it is created and resolved/cleared at the correct times.
     *
     * @param promise Window movement/animation promise
     */
    private trackAnimation(promise: Promise<void>): Promise<void> {
        this._activeTransitions.push(promise);

        promise.then(() => {
            const index = this._activeTransitions.indexOf(promise);
            if (index >= 0) {
                this._activeTransitions.splice(index, 1);

                if (this._activeTransitions.length === 0 && this._currentTransition) {
                    this._currentTransition.resolve();
                    this._currentTransition = null;
                }
            }
        });

        if (!this._currentTransition) {
            this._currentTransition = new DeferredPromise();
        }

        return this._currentTransition.promise;
    }
}
