import {Signal} from 'openfin-service-signal';
import {MonitorInfo} from 'openfin/_v2/api/system/monitor';
import {MonitorEvent} from 'openfin/_v2/api/events/system';
import {injectable} from 'inversify';

import {AsyncInit} from '../controller/AsyncInit';

import {MonitorModel} from './MonitorModel';

@injectable()
export class FinMonitorModel extends AsyncInit implements MonitorModel {
    public readonly onMonitorInfoChanged: Signal<[MonitorInfo]> = new Signal<[MonitorInfo]>();

    private _monitorInfo!: MonitorInfo;

    public constructor() {
        super();
    }

    public async init(): Promise<void> {
        await fin.System.addListener('monitor-info-changed', (event: MonitorEvent<'system', 'monitor-info-changed'>) => {
            this._monitorInfo = event;

            this.onMonitorInfoChanged.emit(event);
        });

        this._monitorInfo = await fin.System.getMonitorInfo();
    }

    public get monitorInfo(): MonitorInfo {
        return this._monitorInfo;
    }
}
