import {Middleware, MiddlewareAPI, Dispatch} from 'redux';

import {RootAction, RootState} from '../typings';
import RootTypes from '../root-types';
import {ToastManager} from '../../controller/ToastManager';
import {notificationButtonClicked, notificationClicked, notificationClosed} from '../../controller/IABService';

export const ProviderMiddleware: Middleware<Dispatch<RootAction>, RootState> = (api: MiddlewareAPI) => (next: Dispatch<RootAction>) => (action: RootAction) => {
    if (action.type === RootTypes.notifications.CREATE) {
        ToastManager.instance.create(action.payload);
    }

    if (action.type === RootTypes.notifications.REMOVE) {
        const {notifications} = action.payload;
        notifications.forEach(notification => {
            notificationClosed(notification);
        });
        ToastManager.instance.removeToasts(...notifications);
    }

    if (action.type === RootTypes.notifications.CLICK_BUTTON) {
        notificationButtonClicked({...action.payload.notification, buttonIndex: action.payload.buttonIndex});
    }

    if (action.type === RootTypes.notifications.CLICK_NOTIFICATION) {
        notificationClicked(action.payload);
    }

    if (action.type === RootTypes.ui.TOGGLE_CENTER_WINDOW) {
        ToastManager.instance.closeAll();
    }

    return next(action);
};
