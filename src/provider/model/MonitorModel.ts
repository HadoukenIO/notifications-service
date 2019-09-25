import {Signal} from 'openfin-service-signal';
import {MonitorInfo} from 'openfin/_v2/api/system/monitor';

export interface MonitorModel {
    readonly onMonitorInfoChanged: Signal<[MonitorInfo]>;
    readonly monitorInfo: MonitorInfo;

    readonly initialized: Promise<this>
}
