import * as React from 'react';
import { Fin } from "../../../fin";
declare var fin: Fin;
import { INotificationButton, INotificationButtonProps } from '../../models/INotificationButton';


export class Button extends React.Component<INotificationButtonProps, INotificationButton> {

    private handleButtonClick(e: React.MouseEvent<HTMLElement>) {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        fin.notifications.buttonClickHandler(this.props.meta, this.props.buttonIndex);
    };

    public render(): React.ReactNode {
        let button = this.props.meta.buttons[this.props.buttonIndex];

        return (
            <div className='notification-button' onClick={(e) => this.handleButtonClick(e)} >
                {button.title}
            </div>
        );
    }
}
