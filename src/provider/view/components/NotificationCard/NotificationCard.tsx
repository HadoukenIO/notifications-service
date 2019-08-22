import * as React from 'react';

import {NotificationTime} from '../NotificationTime/NotificationTime';
import {Button} from '../Controls/Button/Button';
import {StoredNotification} from '../../../model/StoredNotification';
import {CircleButton} from '../CircleButton/CircleButton';
import {Actionable} from '../../../store/Actions';
import {RemoveNotifications, ClickButton, ClickNotification} from '../../../store/Actions';

import {Body} from './Body';
import {Loading} from './Loading';

import './NotificationCard.scss';

interface Props extends Actionable {
    notification: StoredNotification;
    isToast?: boolean;
}

NotificationCard.defaultProps = {
    isToast: false
};

export function NotificationCard(props: Props) {
    const {notification, storeDispatch, isToast} = props;
    const data = notification.notification;
    const [loading, setLoading] = React.useState(false);

    const handleNotificationClose = () => {
        storeDispatch(new RemoveNotifications([notification]));
    };

    const handleButtonClick = (buttonIndex: number) => {
        storeDispatch(new ClickButton(notification, buttonIndex));
    };

    const handleNotificationClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        storeDispatch(new ClickNotification(notification));
    };

    return (
        <div
            className={`notification-card no-select ${isToast ? 'toast' : ''} ${loading ? 'loading' : ''}`}
            onClick={handleNotificationClick}
            data-id={notification.id}
        >
            <div className="header">
                <div className="app-icon" style={{backgroundImage: `url(${data.icon})`}}></div>
                <div className="app-name single-line">{notification.source.name}</div>
                <div className="time-close">
                    <NotificationTime date={data.date} />
                    <div className="actions">
                        <CircleButton type='close' onClick={handleNotificationClose} />
                    </div>
                </div>
            </div>
            <div className="content">
                <div className="title single-line">{data.title}</div>
                <div className="body no-select">
                    <Body text={data.body} />
                </div>
            </div>
            {data.buttons.length > 0 &&
                <div className="buttons">
                    {data.buttons.map((btn, i) => {
                        return (
                            <Button
                                key={i} text={btn.title}
                                onClick={() => {
                                    handleButtonClick(i);
                                }}
                                icon={btn.iconUrl}
                            />
                        );
                    })}
                </div>
            }
            {loading && <Loading />}
        </div>
    );
}
