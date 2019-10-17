import {ApplicationOption} from 'openfin/_v2/api/application/applicationOption';
import {Signal} from 'openfin-service-signal';
import {Identity} from 'openfin/_v2/main';

import {Immutable} from '../store/State';

export type StoredApplication = Immutable<ProgrammaticApplication> | Immutable<ManifestApplication>;

interface ProgrammaticApplication {
    type: 'programmatic';
    id: string;
    title: string;
    initialOptions: ApplicationOption;
    parentUuid: string;
}

interface ManifestApplication {
    type: 'manifest';
    id: string;
    title: string;
    manifestUrl: string;
}

export interface Environment {
    onWindowClosed: Signal<[Identity]>;

    isApplicationRunning(uuid: string): Promise<boolean>;
    getApplication(uuid: string): Promise<StoredApplication>;
    startApplication(application: StoredApplication): Promise<void>;
}
