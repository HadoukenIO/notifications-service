import {RootState} from '..';

export const getNotificationCenterVisibility = (state: RootState): boolean => state.ui.windowVisible;

export const getToastDirection = (state: RootState): readonly [number, number] => state.ui.toastDirection;
