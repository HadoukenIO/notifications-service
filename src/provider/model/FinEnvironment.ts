import {ApplicationOption} from 'openfin/_v2/api/application/applicationOption';
import {injectable} from 'inversify';

import {mutable} from '../store/State';

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
        const app = fin.Application.wrapSync({uuid});
        const info = await app.getInfo();
        const isProgrammatic: boolean = !!info.parentUuid;

        if (isProgrammatic) {
            const initialOptions: ApplicationOption = info.initialOptions as ApplicationOption;
            return {
                type: 'programmatic',
                id: uuid,
                title: initialOptions.name || app.identity.name || '',
                initialOptions: info.initialOptions as ApplicationOption, // TODO: Use updated type so cast is unecessary [SERVICE-601]
                parentUuid: info.parentUuid!
            };
        } else {
            const manifest: {startup_app?: {name: string}, shortcut?: {name?: string}} = info.manifest;
            return {
                type: 'manifest',
                id: uuid,
                title: (manifest.shortcut && manifest.shortcut.name) || (manifest.startup_app && manifest.startup_app.name) || app.identity.name || '',
                manifestUrl: info.manifestUrl
            };
        }
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
                finApplication = await fin.Application.create(mutable(application.initialOptions));
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
