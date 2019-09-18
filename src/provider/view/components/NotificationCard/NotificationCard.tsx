import * as React from 'react';

import {NotificationTime} from '../NotificationTime/NotificationTime';
import {Button} from '../Controls/Button/Button';
import {StoredNotification} from '../../../model/StoredNotification';
import {CircleButton, IconType} from '../CircleButton/CircleButton';
import {RemoveNotifications, ClickButton, ClickNotification, Actionable, MinimizeToast} from '../../../store/Actions';
import {useOnClickOnly} from '../../hooks/Clicks';

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
    const {notification, storeApi, isToast} = props;
    const data = notification.notification;
    const [loading, setLoading] = React.useState(false);
    const cardRef = React.createRef<HTMLDivElement>();
    const [validClick, finishedClick] = useOnClickOnly(cardRef);

    const handleNotificationClose = () => {
        new RemoveNotifications([notification]).dispatch(storeApi);
    };

    const handleNotificationDismiss = () => {
        if (isToast) {
            new MinimizeToast(notification).dispatch(storeApi);
        }
    };

    const handleButtonClick = async (buttonIndex: number) => {
        new ClickButton(notification, buttonIndex).dispatch(storeApi);
    };

    const handleNotificationClick = async (event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        // Check if the click did not originate from a button
        if (!validClick) {
            return;
        }
        new ClickNotification(notification).dispatch(storeApi);
        finishedClick();
    };

    return (
        <div
            className={`notification-card no-select ${isToast ? 'toast' : ''} ${loading ? 'loading' : ''}`}
            onClick={handleNotificationClick}
            data-id={notification.id}
            ref={cardRef}
        >
            <div className="header">
                <div className="app-icon" style={{backgroundImage: `url(${data.icon})`}}></div>
                <div className="app-name single-line">{notification.source.name}</div>
                <div className="time-close">
                    <NotificationTime date={data.date} />
                    <div className="actions">
                        {isToast &&
                            <CircleButton type={IconType.MINIMIZE} onClick={handleNotificationDismiss} alt="Dismiss toast" />
                        }
                        <CircleButton type={IconType.CLOSE} onClick={handleNotificationClose} alt="Clear notification" />
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
                                key={i}
                                text={btn.title}
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
