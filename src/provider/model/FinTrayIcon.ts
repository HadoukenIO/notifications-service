import {TrayIconClicked} from 'openfin/_v2/api/events/application';
import {Application} from 'openfin/_v2/main';
import {TrayInfo} from 'openfin/_v2/api/application/application';
import {Signal} from 'openfin-service-signal';
import {injectable} from 'inversify';

import {TrayIcon} from './TrayIcon';

@injectable()
export class FinTrayIcon implements TrayIcon {
    public readonly onLeftClick: Signal<[]>;
    public readonly onRightClick: Signal<[]>;

    private readonly _application: Application;

    constructor() {
        this._application = fin.Application.getCurrentSync();

        this.onLeftClick = new Signal<[]>();
        this.onRightClick = new Signal<[]>();

        this.addListeners();
    }

    public async setIcon(url: string): Promise<void> {
        return this._application.setTrayIcon(url);
    }

    public async removeIcon(): Promise<void> {
        return this._application.removeTrayIcon();
    }

    /**
     * Retrieves information about the provider tray icon.
     */
    public async getInfo(): Promise<TrayInfo> {
        return this._application.getTrayIconInfo();
    }

    private addListeners(): void {
        this._application.addListener('tray-icon-clicked', (event: TrayIconClicked<string, string>) => {
            if (event.button === 0) {
                this.onLeftClick.emit();
            } else if (event.button === 2) {
                this.onRightClick.emit();
            }
        });
    }
}
