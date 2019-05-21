import {action} from 'typesafe-actions';

import {Constants} from './constants';

/**
 * Toggle the Notificiation Center visibility.
 * @param forceVisibility force the visibility. True = visible, false = hidden.
 */
export const toggleCenterWindowVisibility = (forceVisibility?: boolean) => action(Constants.TOGGLE_CENTER_WINDOW, {visibility: forceVisibility});

export const changeActionDirection = (direction: [number, number]) => action(Constants.CHANGE_ACTION_DIRECTION, {direction});

export const changeBannerDirection = (direction: [number, number]) => action(Constants.CHANGE_BANNER_DIRECTION, {direction});
