import * as React from 'react';

import {NotificationTime} from '../NotificationTime/NotificationTime';
import {NotificationCenterAPI} from '../../../model/NotificationCenterAPI';
import {Button} from '../Button/Button';
import {StoredNotification} from '../../../model/StoredNotification';
declare const window: Window & {openfin: {notifications: NotificationCenterAPI}};


interface NotificationProps {
    meta: StoredNotification;
}

/**
 * Displays a single notification within the UI
 */
export function Notification(props: NotificationProps) {
    function handleNotificationClose(e: React.MouseEvent<HTMLElement>) {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        window.openfin.notifications.closeHandler(props.meta);
    }

    let buttons = null;
    if (props.meta.notification.buttons.length > 0) {
        buttons = props.meta.notification.buttons.map((button, idx) => {
            return (
                <Button
                    key={idx}
                    buttonIndex={idx}
                    meta={props.meta}
                />
            );
        });
    }

    return (
        <li
            className="notification-item"
            onClick={() => window.openfin.notifications.clickHandler(props.meta)}
            note-id={props.meta.id}
        >
            <img
                className="notification-close-x"
                src="image/shapes/notifications-x.png"
                alt=""
                onClick={e => handleNotificationClose(e)}
            />

            <NotificationTime date={props.meta.notification.date} />

            <div className="notification-body">
                <div className="notification-source">
                    <img
                        src={props.meta.notification.icon}
                        className="notification-small-img"
                    />
                    <span className="notification-source-text">
                        {props.meta.source.name}
                    </span>
                </div>
                <div className="notification-body-title">
                    {props.meta.notification.title}
                </div>
                <div className="notification-body-text">
                    {props.meta.notification.body}
                </div>
                {buttons ? (<div id="notification-body-buttons">{buttons}</div>) : null}
            </div>
        </li>
    );
}
