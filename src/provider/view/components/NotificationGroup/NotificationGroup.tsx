import * as React from 'react';
import {CSSTransition, TransitionGroup} from 'react-transition-group';

import {NotificationCard} from '../NotificationCard/NotificationCard';
import {StoredNotification} from '../../../model/StoredNotification';
import {Actionable} from '../../../store/Actions';
import {RemoveNotifications} from '../../../store/Actions';
import {CircleButton} from '../CircleButton/CircleButton';

import './NotificationGroup.scss';

interface Props extends Actionable {
    // Group name
    name: string;
    // Notifications in this group
    notifications: StoredNotification[];
}

export function NotificationGroup(props: Props) {
    const {notifications, storeDispatch, name} = props;
    const handleClearAll = () => {
        storeDispatch(new RemoveNotifications(notifications));
    };

    const handleCloseNotification = (notification: StoredNotification) => {
        storeDispatch(new RemoveNotifications([notification]));
    };

    return (
        <div className="group">
            <div className="title">
                <span>{name}</span>
                <CircleButton type="close" size="small" onClick={handleClearAll} alt="Clear notifications" />
            </div>
            <TransitionGroup className="notifications" component="ul">
                {
                    notifications.map((notification, i) => {
                        return (
                            <CSSTransition
                                key={notification.id}
                                timeout={{
                                    enter: 300,
                                    exit: 300
                                }}
                                classNames="item"
                            >
                                <li key={notification.id + notification.notification.date}>
                                    <NotificationCard notification={notification} storeDispatch={storeDispatch} onDismiss={handleCloseNotification} />
                                </li>
                            </CSSTransition>
                        );
                    })
                }
            </TransitionGroup>
        </div>
    );
}
