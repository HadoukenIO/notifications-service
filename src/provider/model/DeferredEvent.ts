import {Identity} from 'openfin/_v2/main';

import {NotificationEvent} from '../../client';

export interface DeferredEvent {
    target: Identity;
    event: NotificationEvent;
}
