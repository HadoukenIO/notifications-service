import * as React from 'react';
import moment from 'moment';

export interface NotificationTimeProps {
    date: number;
}

export function NotificationTime(props: NotificationTimeProps) {
    const {date} = props;

    const [formattedDate, setFormattedDate] = React.useState<string>(moment(date).fromNow());

    // Update timestamp
    React.useEffect(() => {
        const timer = setInterval(() => {
            setFormattedDate(moment(date).fromNow());
        }, 1000 * 60);

        return () => {
            clearTimeout(timer);
        };
    });

    return (
        <div className="time">
            <span>
                {formattedDate}
            </span>
        </div>
    );
}
