import * as React from 'react';

import {NotificationTime} from '../NotificationTime/NotificationTime';
import {Button} from '../Button/Button';
import {StoredNotification} from '../../../model/StoredNotification';
import {CloseButton} from '../CloseButton/CloseButton';
import {RemoveNotifications, ClickButton, ClickNotification, Actionable} from '../../../store/Actions';

interface NotificationCardProps extends Actionable {
    notification: StoredNotification;
}

export function NotificationCard(props: NotificationCardProps) {
    const {notification, storeAPI} = props;
    const data = notification.notification;

    const handleNotificationClose = () => {
        new RemoveNotifications([notification]).dispatch(storeAPI);
    };

    const handleButtonClick = (buttonIndex: number) => {
        new ClickButton(notification, buttonIndex).dispatch(storeAPI);
    };

    const handleNotificationClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        new ClickNotification(notification).dispatch(storeAPI);
    };

    return (
        <div className="notification" data-id={notification.id} onClick={handleNotificationClick}>
            <CloseButton onClick={handleNotificationClose} />
            <NotificationTime date={data.date} />
            <div className="body">
                <div className="source">
                    {data.icon && <img src={data.icon} />}
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
