import {ApplicationOption} from 'openfin/_v2/api/application/applicationOption';
import {injectable} from 'inversify';

import {Environment, StoredApplication} from './Environment';

@injectable()
export class FinEnvironment implements Environment {
    private _startingUpAppUuids: string[] = [];

    public async isApplicationRunning(uuid: string): Promise<boolean> {
        if (this._startingUpAppUuids.some(startingUuid => startingUuid === uuid)) {
            return true;
        }

        return fin.Application.wrapSync({uuid}).isRunning();
    }

    public async getApplication(uuid: string): Promise<StoredApplication> {
        const info = await fin.Application.wrapSync({uuid}).getInfo();
        const isProgrammatic: boolean = !!info.parentUuid;
        const application: StoredApplication = isProgrammatic ? {
            type: 'programmatic',
            id: uuid,
            initialOptions: info.initialOptions as ApplicationOption,
            parentUuid: info.parentUuid!
        } : {
            type: 'manifest',
            id: uuid,
            manifestUrl: info.manifestUrl
        };

        return application;
    }

    public async startApplication(application: StoredApplication): Promise<void> {
        if (this._startingUpAppUuids.some(startingUuid => startingUuid === application.id)) {
            return;
        }

        this._startingUpAppUuids.push(application.id);

        try {
            let finApplication;
            if (application.type === 'manifest') {
                finApplication = await fin.Application.createFromManifest(application.manifestUrl);
            } else {
                finApplication = await fin.Application.create(application.initialOptions);
            }
            await finApplication.addListener('initialized', (event) => {
                this._startingUpAppUuids = this._startingUpAppUuids.filter(startingUuid => startingUuid !== event.uuid);
            });
            finApplication.run();
        } catch (error) {
            this._startingUpAppUuids = this._startingUpAppUuids.filter(startingUuid => startingUuid !== application.id);
            console.error(`Error starting app ${application.id} [${error.message}]`);
        }
    }
}
