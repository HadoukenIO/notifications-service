import * as React from 'react';

import {NotificationCenterAPI} from '../../../model/NotificationCenterAPI';
import {StoredNotification} from '../../../model/StoredNotification';

declare const window: Window & {openfin: {notifications: NotificationCenterAPI}};

export interface NotificationButtonProps {
    meta: StoredNotification;
    buttonIndex: number;
}

export function Button(props: NotificationButtonProps) {
    const button = props.meta.notification.buttons[props.buttonIndex];

    function handleButtonClick(e: React.MouseEvent<HTMLElement>) {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();

        window.openfin.notifications.buttonClickHandler(
            props.meta,
            props.buttonIndex
        );
    }

    return (
        <div
            className="notification-button"
            onClick={e => handleButtonClick(e)}
        >
            {button.title}
        </div>
    );
}

