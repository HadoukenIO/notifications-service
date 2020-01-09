import {AppRoute} from './components/Router/Router';
import {NotificationsPanel} from './containers/NotificationCenterApp/NotificationsPanel/NotificationsPanel';
import {SettingsPanel} from './containers/NotificationCenterApp/SettingsPanel/SettingsPanel';

export const ROUTES = {
    NOTIFICATIONS: '/center/notifications',
    SETTINGS: '/center/settings'
};

export const CenterRoutes: AppRoute[] = [
    {
        Component: NotificationsPanel,
        exact: true,
        path: ROUTES.NOTIFICATIONS
    },
    {
        Component: SettingsPanel,
        exact: true,
        path: ROUTES.SETTINGS
    }
];

