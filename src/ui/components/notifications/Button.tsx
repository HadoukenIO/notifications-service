import * as React from 'react';
import { Fin } from '../../../fin';
import { INotificationButton, INotificationButtonProps } from '../../models/INotificationButton';

declare var fin: Fin;

export class Button extends React.Component<INotificationButtonProps, INotificationButton> {

    private handleButtonClick(e: React.MouseEvent<HTMLElement>) {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        fin.notifications.buttonClickHandler(
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
