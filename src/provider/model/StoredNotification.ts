import {Identity} from 'openfin/_v2/main';

import {NotificationInternal} from '../../client/internal';

/**
 * Shape of the data that will be used internally by the service.
 *
 * The id property is the encoded notification id (i.e. "{app uuid}/{notification ID}")
 */
export interface StoredNotification {
    id: string;
    source: Identity;
    notification: NotificationInternal;
}
