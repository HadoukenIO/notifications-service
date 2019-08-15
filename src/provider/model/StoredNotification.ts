import {Identity} from 'openfin/_v2/main';

import {NotificationInternal} from '../../client/internal';
import {Immutable} from '../store/State';

/**
 * Shape of the data that will be used internally by the service.
 *
 * The id property is the encoded notification id (i.e. "{app uuid}/{notification ID}")
 */
export type StoredNotification = Immutable<{
    id: string;
    source: Identity;
    notification: NotificationInternal;
}>;
