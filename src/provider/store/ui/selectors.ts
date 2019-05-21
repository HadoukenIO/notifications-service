import {RootState} from '../typings';
import {ToastType} from '../../model/Toast';

export const getNotificationCenterVisibility = (state: RootState): boolean => state.ui.windowVisible;

export const getToastDirection = (state: RootState, type: ToastType): [number, number] => {
    console.log(state, type);
    return (type === ToastType.BANNER) ? state.ui.bannerDirection : state.ui.actionDirection;
};

export const getActionDirection = (state: RootState): [number, number] => state.ui.actionDirection;

export const getBannerDirection = (state: RootState): [number, number] => state.ui.bannerDirection;
