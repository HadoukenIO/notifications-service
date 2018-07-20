import {Application} from './Application';
import {Centre} from './Centre';
import {Entity} from './Entity';

/**
 * @description Model for the settings
 */
export interface Settings extends Entity {
    centre: Centre;
    apps: {[key: string]: Application};
}