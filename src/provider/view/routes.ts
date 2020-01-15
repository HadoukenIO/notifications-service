import {AppRoute} from './components/Router/Router';
import {NotificationsPanel} from './containers/NotificationCenterApp/NotificationsPanel/NotificationsPanel';
import {SettingsPanel} from './containers/NotificationCenterApp/SettingsPanel/SettingsPanel';
import {FeedsPanel} from './containers/NotificationCenterApp/NotificationsFeedsPanel/FeedsPanel';

export const ROUTES = {
    NOTIFICATIONS: '/center/notifications',
    SETTINGS: '/center/settings',
    FEEDS: '/center/feeds'
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
    },
    {
        Component: FeedsPanel,
        exact: true,
        path: ROUTES.FEEDS
    }
];

