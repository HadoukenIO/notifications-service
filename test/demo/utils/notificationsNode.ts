import {fin} from './fin';

Object.assign(global, {fin, PACKAGE_VERSION: 'Test-Client'});

export * from '../../../src/client';
