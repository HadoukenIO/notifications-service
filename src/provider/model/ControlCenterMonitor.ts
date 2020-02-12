import {injectable} from 'inversify';
import {Application, Identity} from 'openfin/_v2/main';
import {Signal} from 'openfin-service-signal';

@injectable()
export class ControlCenterMonitor {
    private static readonly controlCenterIdentity: Identity = {uuid: 'control-center'};
    private readonly _onStart: Signal<[]>;
    private readonly _onClosed: Signal<[]>;
    private readonly _application: Application;
    private _isRunning: boolean = false;

    constructor() {
        this._application = fin.Application.wrapSync(ControlCenterMonitor.controlCenterIdentity);
        this._onStart = new Signal<[]>();
        this._onClosed = new Signal<[]>();

        this._application.isRunning()
            .then((res) => {
                this._isRunning = res;
            })
            .then(() => this.addListeners());
    }

    public add(event: 'started'|'closed', listener: () => void) {
        if (event === 'started') {
            this._onStart.add(listener);

            if (this._isRunning) {
                listener();
            }
        } else if (event === 'closed') {
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
