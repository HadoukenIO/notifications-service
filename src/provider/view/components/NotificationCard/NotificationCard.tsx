import * as React from 'react';

import {NotificationTime} from '../NotificationTime/NotificationTime';
import {Button} from '../Button/Button';
import {StoredNotification} from '../../../model/StoredNotification';
import {CloseButton} from '../CloseButton/CloseButton';
import {UIHandlers} from '../../../model/UIHandlers';

interface NotificationCardProps extends UIHandlers {
    meta: StoredNotification;
}

export function NotificationCard(props: NotificationCardProps) {
    const {meta, onRemoveNotifications, onClickButton, onClickNotification} = props;
    const {notification} = meta;

    const handleNotificationClose = () => {
        onRemoveNotifications(meta);
    };

    const handleButtonClick = (buttonIndex: number) => {
        onClickButton(meta, buttonIndex);
    };

    const handleNotificationClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        onClickNotification(meta);
    };

    return (
        <div className="notification" onClick={handleNotificationClick}>
            <CloseButton onClick={handleNotificationClose} />
            <NotificationTime date={notification.date} />
            <div className="body">
                <div className="source">
                    <img
                        src={notification.icon}
                    />
                    <span className="app-name">
                        {meta.source.name}
                    </span>
                </div>
                <div className="title">
                    {meta.notification.title}
                </div>
                <div className="text">
                    {meta.notification.body}
                </div>

                {notification.buttons.length > 0 &&
                    <div className="buttons">
                        {notification.buttons.map((btn, i) => {
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
