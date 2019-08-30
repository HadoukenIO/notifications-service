import {_Window} from 'openfin/_v2/api/window/window';
import {WindowOption} from 'openfin/_v2/api/window/windowOption';
import {Signal} from 'openfin-service-signal';
import {Transition, TransitionOptions, Bounds} from 'openfin/_v2/shapes';
import * as ReactDOM from 'react-dom';
import {injectable} from 'inversify';

import {WebWindowFactory, WebWindow} from './WebWindow';

@injectable()
export class FinWebWindowFactory implements WebWindowFactory {
    public async createWebWindow(options: WindowOption): Promise<WebWindow> {
        // Note we expect this to be simplified when getWebWindow() gets added to the stable release channel.
        const windowV1: fin.OpenFinWindow = await new Promise((resolve, reject) => {
            const win = new fin.desktop.Window(options, () => {
                resolve(win);
            }, (error) => {
                reject(error);
            });
        });

        const nativeWindow = windowV1.getNativeWindow();
        const document = nativeWindow.document;
        const windowV2 = fin.Window.wrapSync({name: windowV1.name, uuid: windowV1.uuid});

        const webWindow = new FinWebWindow(windowV2, document);

        await windowV2.addListener('mouseenter', () => webWindow.onMouseEnter.emit());
        await windowV2.addListener('mouseleave', () => webWindow.onMouseLeave.emit());
        await windowV2.addListener('blurred', () => webWindow.onBlurred.emit());

        return webWindow;
    }
}

export class FinWebWindow implements WebWindow {
    public readonly onMouseEnter: Signal<[]> = new Signal<[]>();
    public readonly onMouseLeave: Signal<[]> = new Signal<[]>();
    public readonly onBlurred: Signal<[]> = new Signal<[]>();

    private readonly _document: Document;
    private readonly _window: _Window;

    constructor(window: _Window, document: Document) {
        this._window = window;
        this._document = document;
    }

    public async show(): Promise<void> {
        return this._window.show();
    }

    public async showAt(left: number, top: number): Promise<void> {
        return this._window.showAt(left, top);
    }

    public async hide(): Promise<void> {
        return this._window.hide();
    }

    public async setAsForeground(): Promise<void> {
        return this._window.setAsForeground();
    }

    public async animate(transition: Transition, options: TransitionOptions): Promise<void> {
        return this._window.animate(transition, options);
    }

    public async setBounds(bounds: Bounds): Promise<void> {
        return this._window.setBounds(bounds);
    }

    public async close(): Promise<void> {
        // Workaround for race conditions within toast manager. Will address with SERVICE-581.
        if (this._window.close) {
            return this._window.close();
        }
    }

    public render(element: React.FunctionComponentElement<any> | React.FunctionComponentElement<any>[]): void {
        ReactDOM.render(element, this._document.getElementById('react-app'));
    }
}
