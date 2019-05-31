import * as React from 'react';

import {NotificationTime} from '../NotificationTime/NotificationTime';
import {Button} from '../Button/Button';
import {StoredNotification} from '../../../model/StoredNotification';
import {CloseButton} from '../CloseButton/CloseButton';
import {Action} from '../../../store/Actions';
import {Actionable} from '../../containers/NotificationCenterApp';

interface NotificationCardProps extends Actionable {
    notification: StoredNotification;
}

export function NotificationCard(props: NotificationCardProps) {
    const {notification, dispatch} = props;
    const data = notification.notification;

    const handleNotificationClose = () => {
        dispatch({type: Action.REMOVE, notifications: [notification]});
    };

    const handleButtonClick = (buttonIndex: number) => {
        dispatch({type: Action.CLICK_BUTTON, notification, buttonIndex});
    };

    const handleNotificationClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        dispatch({type: Action.CLICK_NOTIFICATION, notification});
    };

    return (
        <div className="notification" data-id={notification.id} onClick={handleNotificationClick}>
            <CloseButton onClick={handleNotificationClose} />
            <NotificationTime date={data.date} />
            <div className="body">
                <div className="source">
                    <img
                        src={data.icon}
                    />
                    <span className="app-name">
                        {notification.source.name}
                    </span>
                </div>
                <div className="title">
                    {data.title}
                </div>
                <div className="text">
                    {data.body}
                </div>

                {data.buttons.length > 0 &&
                    <div className="buttons">
                        {data.buttons.map((btn, i) => {
                            return (
                                <Button key={btn.title + i} onClick={handleButtonClick} buttonIndex={i} text={btn.title} icon={btn.iconUrl} />
                            );
                        })}
                    </div>
                }
            </div>
        </div >
    );
}
