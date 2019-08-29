import {TrayIconClicked} from 'openfin/_v2/api/events/application';
import {Application} from 'openfin/_v2/main';
import {TrayInfo} from 'openfin/_v2/api/application/application';

export class TrayIcon {
    private _icon!: string;
    private _application: Application;
    private _leftClickHandler: (event: TrayIconClicked<'application', 'tray-icon-clicked'>) => void = () => {};
    private _rightClickHandler: (event: TrayIconClicked<'application', 'tray-icon-clicked'>) => void = () => {};

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

    public addLeftClickHandler(handler: (event: TrayIconClicked<'application', 'tray-icon-clicked'>) => void): void {
        this._leftClickHandler = handler;
    }

    public addRightClickHandler(handler: (event: TrayIconClicked<'application', 'tray-icon-clicked'>) => void): void {
        this._rightClickHandler = handler;
    }

    private addListeners(): void {
        this._application
            .addListener(
                'tray-icon-clicked',
                (event: TrayIconClicked<string, string>) => {
                    if (event.button === 0) {
                        this._leftClickHandler(event as TrayIconClicked<'application', 'tray-icon-clicked'>);
                    } else if (event.button === 2) {
                        this._rightClickHandler(event as TrayIconClicked<'application', 'tray-icon-clicked'>);
                    }
                }
            );
    }
}
