import * as React from 'react';
import * as moment from 'moment';
import { INotificationTimeProps } from '../../../models/INotificationTime';


export function NotificationTime(props: INotificationTimeProps) {
    return (
        <div className="time-div">
            <span className="time">
                {moment(props.date).fromNow()}
            </span>
        </div>
    );
}