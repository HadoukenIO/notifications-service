import {TrayIconClicked} from 'openfin/_v2/api/events/application';
import {Application} from 'openfin/_v2/main';
import {TrayInfo} from 'openfin/_v2/api/application/application';
import Bounds from 'openfin/_v2/api/window/bounds';


// Temp fix until .41 as bounds is not defined on the event.
interface TrayIconClickEvent extends TrayIconClicked<'application', 'tray-icon-clicked'> {
    bounds: Bounds;
}

export class TrayIcon {
    private _icon!: string;
    private _application: Application;
    private _leftClickHandler: (event: TrayIconClickEvent) => void = () => {};
    private _rightClickHandler: (event: TrayIconClickEvent) => void = () => {};

    constructor(icon: string) {
        this._application = fin.Application.getCurrentSync();
        this.setIcon(icon);
        this.setupEventListeners();
    }

    public get icon(): string {
        return this._icon;
    }

    private setupEventListeners() {
        this._application
            .addListener(
                'tray-icon-clicked',
                (event: TrayIconClicked<string, string>) => {
                    if (event.button === 0) {
                        this._leftClickHandler(event as TrayIconClickEvent);
                    } else if (event.button === 2) {
                        this._rightClickHandler(event as TrayIconClickEvent);
                    }
                }
            );
    }

    public async getInfo(): Promise<TrayInfo> {
        return this._application.getTrayIconInfo();
    }

    public setIcon(value: string) {
        this._application.setTrayIcon(value);
        this._icon = value;
        return this;
    }

    public addLeftClickHandler(handler: (event: TrayIconClickEvent) => void) {
        this._leftClickHandler = handler;
        return this;
    }

    public addRightClickHandler(handler: (event: TrayIconClickEvent) => void) {
        this._rightClickHandler = handler;
        return this;
    }
}
