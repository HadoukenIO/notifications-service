import {Signal} from 'openfin-service-signal';
import {Transition, TransitionOptions, Bounds} from 'openfin/_v2/shapes';
import {WindowOption} from 'openfin/_v2/api/window/windowOption';

export interface WebWindowFactory {
    createWebWindow(options: WindowOption): Promise<WebWindow>;
}

export interface WebWindow {
    readonly onMouseEnter: Signal<[]>;
    readonly onMouseLeave: Signal<[]>;
    readonly onBlurred: Signal<[]>;

    readonly document: Document;
    readonly nativeWindow: Window;

    show(): Promise<void>;
    showAt(left: number, top: number): Promise<void>;
    hide(): Promise<void>;
    setAsForeground(): Promise<void>;
    animate(transition: Transition, options: TransitionOptions): Promise<void>;
    setBounds(bounds: Bounds): Promise<void>;
    close(): Promise<void>;
}
