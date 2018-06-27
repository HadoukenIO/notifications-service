import * as React from 'react';
import * as moment from 'moment';
import {INotificationTime, INotificationTimeProps} from '../../models/INotificationTime';

/**
 * @class NotificationTime Handles Time updates in Notifications
 */
export class NotificationTime extends React.Component<INotificationTimeProps, INotificationTime> {
    private interval: number;

    constructor(props: INotificationTimeProps){
        super(props);
    }
    
    /**
     * @method render Renders the time in Notifications
     * @returns ReactNode
     */
    public render(): React.ReactNode {
        return (
            <div className="time-div">
                <span className="time">{moment(this.props.date).fromNow()}</span>
            </div>
        );
    }
}