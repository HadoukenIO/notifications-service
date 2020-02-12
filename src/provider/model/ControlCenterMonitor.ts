import {injectable} from 'inversify';
import {Application, Identity} from 'openfin/_v2/main';
import {Signal} from 'openfin-service-signal';

import {AsyncInit} from '../controller/AsyncInit';

export enum ControlCenterEvent {
    STARTED = 'started',
    CLOSED = 'closed'
}
@injectable()
export class ControlCenterMonitor extends AsyncInit {
    private static readonly controlCenterIdentity: Identity = {uuid: 'control-center'};
    private readonly _onStart: Signal<[]>;
    private readonly _onClosed: Signal<[]>;
    private readonly _application: Application;
    private _isRunning: boolean = false;

    constructor() {
        super();
        this._application = fin.Application.wrapSync(ControlCenterMonitor.controlCenterIdentity);
        this._onStart = new Signal<[]>();
        this._onClosed = new Signal<[]>();

        this.addListeners();
    }

    protected async init() {
        this._isRunning = await this._application.isRunning();
    }

    public add(event: ControlCenterEvent, listener: () => void) {
        if (event === ControlCenterEvent.STARTED) {
            this._onStart.add(listener);

            if (this._isRunning) {
                listener();
            }
        } else if (event === ControlCenterEvent.CLOSED) {
            this._onClosed.add(listener);

            if (!this._isRunning) {
                listener();
            }
        }
    }

    private addListeners(): void {
        this._application.addListener('started', () => {
            this._onStart.emit();
            this._isRunning = true;
        });

        this._application.addListener('closed', () => {
            this._onClosed.emit();
            this._isRunning = false;
        });
    }
}
