import * as React from 'react';

import {getDate} from '../../utils/Time';

interface Props {
    date: number;
}

export function NotificationTime(props: Props) {
    const {date} = props;

    const [formattedDate, setFormattedDate] = React.useState<string>(getDate(date));

    // Update timestamp
    React.useEffect(() => {
        const timer = setInterval(() => {
            setFormattedDate(getDate(date));
        }, 1000 * 60);

        return () => {
            clearTimeout(timer);
        };
    });

    return (
        <div className="time single-line">
            {formattedDate}
        </div>
    );
}
