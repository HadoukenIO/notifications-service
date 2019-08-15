import * as React from 'react';

import {NotificationCard} from '../NotificationCard/NotificationCard';
import {StoredNotification} from '../../../model/StoredNotification';
import {CloseButton} from '../CloseButton/CloseButton';
import {Actionable} from '../../containers/NotificationCenterApp';
import {RemoveNotifications} from '../../../store/Actions';

export interface NotificationGroupProps extends Actionable {
    // Group name
    name: string;
    // Notifications in this group
    notifications: StoredNotification[];
}

export function NotificationGroup(props: NotificationGroupProps) {
    const {notifications, storeDispatch} = props;
    const handleClearAll = () => {
        storeDispatch(new RemoveNotifications(notifications));
    };
    return (
        <div className="group">
            <div className="header">
                <div className="title">
                    {props.name.toUpperCase()}
                </div>
                <CloseButton onClick={handleClearAll} />
            </div>
            <ul>
                {
                    notifications.map((notification, i) => {
                        return (
                            <li key={i + notification.id}>
                                <NotificationCard notification={notification} storeDispatch={storeDispatch} />
                            </li>
                        );
                    })
                }
            </ul>
        </div>
    );
}
