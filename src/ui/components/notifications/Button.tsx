import * as React from 'react';
import {INotificationButton, INotificationButtonProps} from '../../models/INotificationButton';
import {NotificationCenterAPI} from '../../NotificationCenterAPI';
declare var window: Window&{openfin: {notifications: NotificationCenterAPI}};

export class Button extends React.Component<INotificationButtonProps, INotificationButton> {

    private handleButtonClick(e: React.MouseEvent<HTMLElement>) {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        window.openfin.notifications.buttonClickHandler(
            this.props.meta,
            this.props.buttonIndex
        );
    }

    public render(): React.ReactNode {
        const button = this.props.meta.buttons[this.props.buttonIndex];

        return (
            <div
                className="notification-button"
                onClick={e => this.handleButtonClick(e)}
            >
                {button.title}
            </div>
        );
    }
}
