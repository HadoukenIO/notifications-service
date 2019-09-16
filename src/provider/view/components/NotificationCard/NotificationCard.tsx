import * as React from 'react';

import {NotificationTime} from '../NotificationTime/NotificationTime';
import {Button} from '../Button/Button';
import {StoredNotification} from '../../../model/StoredNotification';
import {CloseButton} from '../CloseButton/CloseButton';
import {RemoveNotifications, ClickButton, ClickNotification, Actionable} from '../../../store/Actions';
import {BatchError, LaunchApplicationError} from '../../../model/Errors';

interface NotificationCardProps extends Actionable {
    notification: StoredNotification;
}

export function NotificationCard(props: NotificationCardProps) {
    const {notification, storeApi} = props;
    const data = notification.notification;

    const handleNotificationClose = async () => {
        await (new RemoveNotifications([notification])).dispatch(storeApi);
    };

    const handleButtonClick = async (buttonIndex: number) => {
        try {
            await (new ClickButton(notification, buttonIndex)).dispatch(storeApi);
            // Display loading UI
        } catch (e) {
            BatchError.handleError(e, (batchError: BatchError) => {
                const launchErrors = batchError.getErrors(LaunchApplicationError);
                if (launchErrors.length > 0) {
                    console.warn('Unable to launch application.');
                    batchError.log();
                    // Show error in UI
                } else {
                    batchError.log();
                }
            });
        }
    };

    const handleNotificationClick = async (event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        try {
            await (new ClickNotification(notification)).dispatch(storeApi);
            // Display loading UI
        } catch (e) {
            BatchError.handleError(e, (batchError: BatchError) => {
                const launchErrors = batchError.getErrors(LaunchApplicationError);
                if (launchErrors.length > 0) {
                    console.warn('Unable to launch application.');
                    batchError.log();
                    // Show error in UI
                } else {
                    batchError.log();
                }
            });
        }
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
