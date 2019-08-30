import {Signal} from 'openfin-service-signal';
import {MonitorInfo} from 'openfin/_v2/api/system/monitor';

export interface MonitorModel {
    onMonitorInfoChanged: Signal<[MonitorInfo]>;
    monitorInfo: MonitorInfo;

    initialized: Promise<this>
}
