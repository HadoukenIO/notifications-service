import {ApplicationOption} from 'openfin/_v2/api/application/applicationOption';

import {Immutable} from '../store/State';

export type StoredApplication = Immutable<ProgrammaticApplication> | Immutable<ManifestApplication>;

type ProgrammaticApplication = {
    type: 'programmatic';
    id: string;
    initialOptions: ApplicationOption;
    parentUuid: string;
}

type ManifestApplication = {
    type: 'manifest';
    id: string;
    manifestUrl: string;
}

export interface Environment {
    isApplicationRunning(uuid: string): Promise<boolean>;
    getApplication(uuid: string): Promise<StoredApplication>;
    startApplication(application: StoredApplication): Promise<void>;
}
