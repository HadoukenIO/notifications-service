import {TrayInfo} from 'openfin/_v2/api/application/application';
import {Signal} from 'openfin-service-signal';

export interface TrayIcon {
    onLeftClick: Signal<[]>;
    onRightClick: Signal<[]>;

    setIcon(url: string): Promise<void>;

    getInfo(): Promise<TrayInfo>;
}
