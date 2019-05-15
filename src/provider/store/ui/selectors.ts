import {RootState} from '../typings';
import {ToastType} from '../../model/Toast';

export const getNotificationCenterVisibility = (state: RootState) => state.ui.windowVisible;


export const getToastDirection = (state: RootState, type: ToastType) => {
    console.log(state, type);
    return (type === ToastType.BANNER) ? state.ui.bannerDirection : state.ui.actionDirection;
};

export const getActionDirection = (state: RootState) => state.ui.actionDirection;

export const getBannerDirection = (state: RootState) => state.ui.bannerDirection;
