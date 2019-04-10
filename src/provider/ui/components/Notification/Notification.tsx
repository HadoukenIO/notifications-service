import * as React from 'react';
import {NotificationTime} from './NotificationTime/NotificationTime';
import {INotificationProps} from '../../models/INotificationProps';
import {NotificationCenterAPI} from '../../NotificationCenterAPI';
import {Button} from '../Button/Button';
import {NotificationTypes} from '../../../../client/models/Notification';
declare var window: Window & {openfin: {notifications: NotificationCenterAPI}};

/**
 * Displays a single notification within the UI
 */
export function Notification(props: INotificationProps) {
    function handleNotificationClose(e: React.MouseEvent<HTMLElement>) {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        window.openfin.notifications.closeHandler(props.meta);
    }

    let buttons = null;
    if (props.meta.type === NotificationTypes.BUTTON) {
        buttons = props.meta.buttons.map((button, idx) => {
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
        >
            <img
                className="notification-close-x"
                src="image/shapes/notifications-x.png"
                alt=""
                onClick={e => handleNotificationClose(e)}
            />

            <NotificationTime date={props.meta.date} />

            <div className="notification-body">
                <div className="notification-source">
                    <img
                        src={props.meta.icon}
                        className="notification-small-img"
                    />
                    <span className="notification-source-text">
                        {props.meta.name}
                    </span>
                </div>
                <div className="notification-body-title">
                    {props.meta.title}
                </div>
                <div className="notification-body-text">
                    {props.meta.body}
                </div>
                {buttons ? (<div id="notification-body-buttons">{buttons}</div>) : null}
            </div>
        </li>
    );
}
