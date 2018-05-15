import * as React from 'react';
import { Fin } from "../../fin";
declare var fin: Fin;

export class Button extends React.Component<any, {}> {
    public render(): React.ReactNode {
        return (
            <div className='notification-button' 
                onClick={(e) => {
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                fin.notifications.buttonClickHandler(this.props.meta, this.props.buttonIndex);
            }}>
                {this.props.button.title}
            </div>
        );
    }
}
