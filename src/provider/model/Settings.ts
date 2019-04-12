
import {Entity} from '../../client/Entity';

/**
 * @description Model for the settings
 */
export interface Settings extends Entity {
    centre: Centre;
    apps: {[key: string]: Application};
}

interface Centre {
    order: string;
    history: number;
}

interface Application {
    name: string;
    uuid: string;
    remote: boolean;
    blocked: boolean;
}