import * as React from 'react';
import * as moment from 'moment';

export interface NotificationTimeProps {
    date: Date;
}


export function NotificationTime(props: NotificationTimeProps) {
    return (
        <div className="time-div">
            <span className="time">
                {moment(props.date).fromNow()}
            </span>
        </div>
    );
}