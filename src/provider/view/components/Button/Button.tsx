import * as React from 'react';

import {NotificationCenterAPI} from '../../../model/NotificationCenterAPI';
import {INotification} from '../../../model/INotification';

declare var window: Window & {openfin: {notifications: NotificationCenterAPI}};

export interface NotificationButtonProps {
    meta: INotification;
    buttonIndex: number;
}

export function Button(props: NotificationButtonProps) {
    const button = props.meta.buttons[props.buttonIndex];

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

