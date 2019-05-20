import {TrayIconClicked} from 'openfin/_v2/api/events/application';
import {Application} from 'openfin/_v2/main';
import {TrayInfo} from 'openfin/_v2/api/application/application';
import Bounds from 'openfin/_v2/api/window/bounds';

// TODO: Add Jira ticket - Temp fix until .41 as bounds is not defined on the event.
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
        this.icon = icon;
        this.addListeners();
    }

    public get icon(): string {
        return this._icon;
    }

    public set icon(value: string) {
        this._application.setTrayIcon(value);
        this._icon = value;
    }

    /**
     * Retrieves information about the provider tray icon.
     */
    public async getInfo(): Promise<TrayInfo> {
        return this._application.getTrayIconInfo();
    }

    public addLeftClickHandler(handler: (event: TrayIconClickEvent) => void): this {
        this._leftClickHandler = handler;
        return this;
    }

    public addRightClickHandler(handler: (event: TrayIconClickEvent) => void): this {
        this._rightClickHandler = handler;
        return this;
    }

    private addListeners(): void {
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
}
