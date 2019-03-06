import * as React from 'react';

import { INotificationButtonProps} from '../../models/INotificationButton';
import {NotificationCenterAPI} from '../../NotificationCenterAPI';

declare var window: Window&{openfin: {notifications: NotificationCenterAPI}};

export function Button(props: INotificationButtonProps) {
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

