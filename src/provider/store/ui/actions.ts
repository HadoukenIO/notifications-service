import {action} from 'typesafe-actions';

import Types from './types';

/**
 * Toggle the Notificiation Center visibility.
 * @param forceVisibility force the visibility. True = visible, false = hidden.
 */
export const toggleCenterWindowVisibility = (forceVisibility?: boolean) => action(Types.TOGGLE_CENTER_WINDOW, {visibility: forceVisibility});

export const changeActionDirection = (direction: [number, number]) => action(Types.CHANGE_ACTION_DIRECTION, {direction});

export const changeBannerDirection = (direction: [number, number]) => action(Types.CHANGE_BANNER_DIRECTION, {direction});
