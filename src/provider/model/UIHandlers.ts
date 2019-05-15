import {toggleCenterWindowVisibility} from '../store/ui/actions';
import {removeNotifications, clickNotification, clickNotificationButton} from '../store/notifications/actions';

export interface UIHandlers {
    onClickNotification: typeof clickNotification;
    onClickButton: typeof clickNotificationButton;
    onRemoveNotifications: typeof removeNotifications;
    onToggleWindow: typeof toggleCenterWindowVisibility;
}
